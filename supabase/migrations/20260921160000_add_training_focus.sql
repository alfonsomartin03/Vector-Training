-- Profile-owned, versioned coaching assessment. Existing profile RLS applies.
alter table public.profiles
  add column training_focus jsonb,
  add column training_focus_revision bigint not null default 0,
  add column training_focus_tag text generated always as (training_focus ->> 'tag') stored,
  add constraint profiles_training_focus_tag_check check (
    training_focus_tag is null or training_focus_tag in ('sustainable_power', 'aerobic_ceiling', 'balanced')
  ),
  add constraint profiles_training_focus_object_check check (
    training_focus is null or ((
      jsonb_typeof(training_focus) = 'object'
      and training_focus ?& array['version', 'tag', 'status', 'reason']
      and training_focus ->> 'status' in ('provisional', 'needs_data')
      and training_focus ->> 'version' = '1'
      and ((training_focus ->> 'status' = 'needs_data' and training_focus_tag is null)
        or (training_focus ->> 'status' = 'provisional' and training_focus_tag is not null))
    ) is true)
  );

comment on column public.profiles.training_focus is
  'Provisional CP/five-minute power assessment; thresholds are product heuristics, not validated physiological cutoffs.';

-- Invalidate saved assessments on source changes, including edits outside the app.
-- Revision guards prevent an older client computation overwriting newer inputs.
create function public.invalidate_power_training_focus()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op <> 'INSERT' then
    update public.profiles set training_focus = null,
      training_focus_revision = training_focus_revision + 1 where id = old.user_id;
  end if;
  if tg_op = 'INSERT' or (tg_op = 'UPDATE' and new.user_id is distinct from old.user_id) then
    update public.profiles set training_focus = null,
      training_focus_revision = training_focus_revision + 1 where id = new.user_id;
  end if;
  return null;
end;
$$;

create trigger power_profiles_invalidate_training_focus
after insert or update or delete on public.power_profiles
for each row execute function public.invalidate_power_training_focus();
