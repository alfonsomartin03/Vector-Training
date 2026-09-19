create table if not exists public.vo2max_tests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  relative_vo2max numeric check (relative_vo2max > 0),
  absolute_vo2_l_min numeric check (absolute_vo2_l_min > 0),
  body_mass_kg numeric check (body_mass_kg > 0),
  vt1_power_watts numeric check (vt1_power_watts > 0),
  vt2_power_watts numeric check (vt2_power_watts > 0),
  max_aerobic_power_watts numeric check (max_aerobic_power_watts > 0),
  test_date date not null,
  source text not null check (char_length(trim(source)) > 0),
  created_at timestamptz not null default now(),
  check (relative_vo2max is not null or absolute_vo2_l_min is not null)
);

create index if not exists vo2max_tests_user_date_idx
  on public.vo2max_tests (user_id, test_date desc, created_at desc);

alter table public.vo2max_tests enable row level security;

create policy "Athletes can read their VO2max tests"
  on public.vo2max_tests for select
  using (auth.uid() = user_id);

create policy "Athletes can insert their VO2max tests"
  on public.vo2max_tests for insert
  with check (auth.uid() = user_id);

create policy "Athletes can update their VO2max tests"
  on public.vo2max_tests for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Athletes can delete their VO2max tests"
  on public.vo2max_tests for delete
  using (auth.uid() = user_id);

create table if not exists public.lactate_tests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lt1_power_watts numeric check (lt1_power_watts > 0),
  lt1_heart_rate_bpm integer check (lt1_heart_rate_bpm between 20 and 260),
  lt1_lactate_mmol numeric check (lt1_lactate_mmol > 0),
  lt2_power_watts numeric check (lt2_power_watts > 0),
  lt2_heart_rate_bpm integer check (lt2_heart_rate_bpm between 20 and 260),
  lt2_lactate_mmol numeric check (lt2_lactate_mmol > 0),
  test_date date not null,
  source text not null check (char_length(trim(source)) > 0),
  created_at timestamptz not null default now(),
  check (lt1_power_watts is not null or lt2_power_watts is not null)
);

create index if not exists lactate_tests_user_date_idx
  on public.lactate_tests (user_id, test_date desc, created_at desc);

alter table public.lactate_tests enable row level security;

create policy "Athletes can read their lactate tests"
  on public.lactate_tests for select
  using (auth.uid() = user_id);

create policy "Athletes can insert their lactate tests"
  on public.lactate_tests for insert
  with check (auth.uid() = user_id);

create policy "Athletes can update their lactate tests"
  on public.lactate_tests for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Athletes can delete their lactate tests"
  on public.lactate_tests for delete
  using (auth.uid() = user_id);
