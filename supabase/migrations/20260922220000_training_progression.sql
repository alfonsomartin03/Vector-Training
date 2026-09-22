-- Versioned completion history feeds progressive overload and recovery decisions.
-- Activity providers can write detected best efforts without coupling the planner
-- to Strava, Garmin, or any other integration.
create table public.training_workout_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  scheduled_date date not null,
  template_id text not null check (template_id in ('endurance','lt1','sweet-spot','threshold','vo2-long','vo2-30-15')),
  focus_id text not null,
  progression_level integer not null default 0 check (progression_level between 0 and 20),
  prescription_version integer not null check (prescription_version > 0),
  planned_duration_minutes numeric not null check (planned_duration_minutes > 0 and planned_duration_minutes <= 360),
  planned_work_minutes numeric not null check (planned_work_minutes > 0 and planned_work_minutes <= planned_duration_minutes),
  completed_duration_minutes numeric not null check (completed_duration_minutes >= 0 and completed_duration_minutes <= 540),
  completion_ratio numeric not null check (completion_ratio >= 0 and completion_ratio <= 1.5),
  perceived_exertion integer check (perceived_exertion between 1 and 10),
  recovery_week boolean not null default false,
  parameters jsonb not null default '{}'::jsonb check (jsonb_typeof(parameters) = 'object'),
  completed_at timestamptz not null default now(),
  unique (user_id, scheduled_date)
);

create index training_workout_history_user_date_idx
  on public.training_workout_history (user_id, scheduled_date desc, completed_at desc);

create table public.activity_power_maxima (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  duration_seconds integer not null check (duration_seconds between 1 and 86400),
  watts numeric not null check (watts > 0 and watts <= 5000),
  observed_at timestamptz not null,
  source text not null check (source in ('activity','manual','test')),
  external_activity_id text,
  created_at timestamptz not null default now(),
  unique (user_id, duration_seconds, observed_at, watts)
);

create index activity_power_maxima_user_observed_idx
  on public.activity_power_maxima (user_id, observed_at desc, duration_seconds);

alter table public.training_workout_history enable row level security;
alter table public.activity_power_maxima enable row level security;

revoke all on public.training_workout_history, public.activity_power_maxima from anon, authenticated;
grant select, insert, update, delete on public.training_workout_history to authenticated;
grant select, insert, update, delete on public.activity_power_maxima to authenticated;
grant all on public.training_workout_history, public.activity_power_maxima to service_role;

create policy own_training_workout_history on public.training_workout_history
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy own_activity_power_maxima on public.activity_power_maxima
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

comment on table public.training_workout_history is
  'Immutable-enough snapshots of completed prescribed workouts used for progression, volume, and recovery decisions.';
comment on table public.activity_power_maxima is
  'Provider-agnostic best-effort feed. The current planner consumes supported 60, 300, and 720 second maxima.';
