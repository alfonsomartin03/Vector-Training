-- Roles are separate from editable profiles and user_metadata.
create table public.admin_memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_memberships enable row level security;
revoke all on public.admin_memberships from anon, authenticated;
grant all on public.admin_memberships to service_role;

-- Serialize membership changes and preserve at least one admin once bootstrapped.
create function public.protect_last_admin()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(917240001);
  if tg_op = 'UPDATE' then
    raise exception 'Admin membership IDs cannot be changed.';
  end if;
  if tg_op = 'DELETE' and not exists (
    select 1 from public.admin_memberships where user_id <> old.user_id
  ) then
    raise exception 'Assign another admin before removing the last admin.';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
create trigger protect_last_admin before insert or update or delete
on public.admin_memberships for each row execute function public.protect_last_admin();
revoke all on function public.protect_last_admin() from public, anon, authenticated;

-- Service-only directory, including users who have not completed onboarding.
create function public.admin_user_directory(search_text text default '', page_number integer default 1)
returns jsonb language sql stable security definer set search_path = '' as $$
  with matched as (
    select u.id, u.email, u.created_at, u.last_sign_in_at, u.email_confirmed_at,
      p.first_name, p.last_name,
      exists(select 1 from public.admin_memberships a where a.user_id = u.id) as is_admin
    from auth.users u left join public.profiles p on p.id = u.id
    where strpos(lower(coalesce(u.email, '') || ' ' || coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '') || ' ' || u.id::text), lower(left(trim(coalesce(search_text, '')), 200))) > 0
  ), paged as (
    select * from matched order by created_at desc, id
    limit 25 offset ((greatest(1, least(coalesce(page_number, 1), 100000)) - 1) * 25)
  )
  select jsonb_build_object('users', coalesce((select jsonb_agg(paged) from paged), '[]'::jsonb),
    'total', (select count(*) from matched));
$$;
revoke all on function public.admin_user_directory(text, integer) from public, anon, authenticated;
grant execute on function public.admin_user_directory(text, integer) to service_role;

-- Storage objects must be removed via Storage's API, not by deleting SQL metadata.
create function public.account_storage_objects(account_id uuid)
returns table(bucket_id text, name text)
language sql stable security definer set search_path = '' as $$
  select o.bucket_id, o.name from storage.objects o
  where coalesce(nullif(o.owner_id, ''), to_jsonb(o) ->> 'owner') = account_id::text
  order by o.bucket_id, o.name limit 100;
$$;
revoke all on function public.account_storage_objects(uuid) from public, anon, authenticated;
grant execute on function public.account_storage_objects(uuid) to service_role;

-- A deleted account's already-issued JWT must not recreate owned files.
create function public.account_is_active()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from auth.users where id = auth.uid());
$$;
revoke all on function public.account_is_active() from public, anon;
grant execute on function public.account_is_active() to authenticated;
create policy "Storage requires an existing account" on storage.objects
as restrictive for all to authenticated
using ((select public.account_is_active()))
with check ((select public.account_is_active()));

-- Guarantee deletion cascades for every athlete-data table currently in the app.
-- Replace only single-column ownership FKs; validate existing data during migration.
do $$
declare spec record; fk record;
begin
  for spec in select * from (values
    ('profiles', 'id'), ('power_profiles', 'user_id'),
    ('vo2max_tests', 'user_id'), ('lactate_tests', 'user_id')
  ) as tables(table_name, column_name)
  loop
    for fk in
      select c.conname from pg_catalog.pg_constraint c
      join pg_catalog.pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
      where c.conrelid = format('public.%I', spec.table_name)::regclass
        and c.contype = 'f' and cardinality(c.conkey) = 1 and a.attname = spec.column_name
        and c.confrelid in ('auth.users'::regclass, 'public.profiles'::regclass)
    loop
      execute format('alter table public.%I drop constraint %I', spec.table_name, fk.conname);
    end loop;
    execute format('alter table public.%I add constraint %I foreign key (%I) references auth.users(id) on delete cascade',
      spec.table_name, spec.table_name || '_account_owner_fkey', spec.column_name);
  end loop;
end;
$$;
