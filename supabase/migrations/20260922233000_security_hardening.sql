-- Security invariants must live in the database because browser/native clients
-- are untrusted. NOT VALID keeps deployment compatible with legacy rows while
-- enforcing every new or modified row immediately.

alter table public.profiles force row level security;
alter table public.power_profiles force row level security;
alter table public.vo2max_tests force row level security;
alter table public.lactate_tests force row level security;
alter table public.training_availability force row level security;
alter table public.training_workout_history force row level security;
alter table public.activity_power_maxima force row level security;

revoke all on public.profiles, public.power_profiles, public.vo2max_tests,
  public.lactate_tests, public.training_availability,
  public.training_workout_history, public.activity_power_maxima
from anon, authenticated;

grant select, insert, update, delete on public.profiles, public.power_profiles,
  public.vo2max_tests, public.lactate_tests, public.training_availability,
  public.training_workout_history, public.activity_power_maxima
to authenticated;

-- Restrictive policies remain an ownership backstop even if a future migration
-- accidentally adds an overly broad permissive policy.
create policy security_profiles_owner on public.profiles
  as restrictive for all to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy security_power_owner on public.power_profiles
  as restrictive for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy security_vo2_owner on public.vo2max_tests
  as restrictive for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy security_lactate_owner on public.lactate_tests
  as restrictive for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy security_availability_owner on public.training_availability
  as restrictive for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy security_history_owner on public.training_workout_history
  as restrictive for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy security_maxima_owner on public.activity_power_maxima
  as restrictive for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

alter table public.profiles
  add constraint profiles_names_bounded check (
    (first_name is null or char_length(first_name) <= 100)
    and (last_name is null or char_length(last_name) <= 100)
  ) not valid,
  add constraint profiles_weight_bounded check (weight_kg is null or weight_kg between 1 and 1000) not valid;

alter table public.power_profiles
  add constraint power_profile_values_bounded check (
    one_minute_watts between 1 and 5000
    and five_minute_watts between 1 and 5000
    and twelve_minute_watts between 1 and 5000
    and one_minute_watts > five_minute_watts
    and five_minute_watts > twelve_minute_watts
  ) not valid;

alter table public.vo2max_tests
  add constraint vo2_values_bounded check (
    (relative_vo2max is null or relative_vo2max <= 200)
    and (absolute_vo2_l_min is null or absolute_vo2_l_min <= 20)
    and (body_mass_kg is null or body_mass_kg <= 1000)
    and (vt1_power_watts is null or vt1_power_watts <= 5000)
    and (vt2_power_watts is null or vt2_power_watts <= 5000)
    and (max_aerobic_power_watts is null or max_aerobic_power_watts <= 5000)
    and char_length(source) <= 200
    and test_date <= current_date
  ) not valid;

alter table public.lactate_tests
  add constraint lactate_values_bounded check (
    (lt1_power_watts is null or lt1_power_watts <= 5000)
    and (lt2_power_watts is null or lt2_power_watts <= 5000)
    and (lt1_lactate_mmol is null or lt1_lactate_mmol <= 100)
    and (lt2_lactate_mmol is null or lt2_lactate_mmol <= 100)
    and char_length(source) <= 200
    and test_date <= current_date
  ) not valid;

alter table public.training_workout_history
  add constraint workout_history_text_bounded check (
    char_length(focus_id) between 1 and 100
    and octet_length(parameters::text) <= 16384
  ) not valid;

alter table public.activity_power_maxima
  add constraint activity_external_id_bounded check (
    external_activity_id is null or char_length(external_activity_id) <= 512
  ) not valid;

comment on policy security_profiles_owner on public.profiles is
  'Restrictive defense-in-depth: authenticated clients can only access their own profile.';
