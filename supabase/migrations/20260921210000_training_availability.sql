-- Effective-dated availability belongs to the athlete profile. Latest prior week
-- carries forward without a scheduler or duplicated records.
create table public.training_availability (
  user_id uuid not null references public.profiles(id) on delete cascade,
  week_start date not null check (extract(isodow from week_start) = 1),
  weekly_minutes integer not null check (weekly_minutes between 0 and 1800),
  recent_weekly_minutes integer not null check (recent_weekly_minutes between 0 and 1800),
  max_session_minutes integer not null check (max_session_minutes between 30 and 360),
  rest_days integer[] not null default '{}',
  recovery_week boolean not null default false,
  primary key (user_id, week_start),
  constraint valid_rest_days check (
    cardinality(rest_days) <= 7 and array_position(rest_days, null) is null
    and rest_days <@ array[0,1,2,3,4,5,6]
    and cardinality(rest_days) =
      (case when 0 = any(rest_days) then 1 else 0 end +
       case when 1 = any(rest_days) then 1 else 0 end +
       case when 2 = any(rest_days) then 1 else 0 end +
       case when 3 = any(rest_days) then 1 else 0 end +
       case when 4 = any(rest_days) then 1 else 0 end +
       case when 5 = any(rest_days) then 1 else 0 end +
       case when 6 = any(rest_days) then 1 else 0 end)
  )
);
alter table public.training_availability enable row level security;
revoke all on public.training_availability from anon, authenticated;
grant select, insert, update, delete on public.training_availability to authenticated;
grant all on public.training_availability to service_role;
create policy own_availability on public.training_availability
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
comment on table public.training_availability is
  'Profile-owned Monday-starting availability changes. Latest row on/before a week carries forward, including recovery preference. Minutes are time budgets, not a required dose.';
