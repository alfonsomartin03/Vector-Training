-- Align persisted availability with the simplified slider ranges. Existing
-- out-of-range values are clamped so they remain loadable after deployment.
update public.training_availability
set weekly_minutes = least(2100, greatest(180, weekly_minutes)),
    recent_weekly_minutes = least(2100, greatest(180, weekly_minutes)),
    max_session_minutes = least(350, greatest(60, max_session_minutes)),
    rest_days = case
      when cardinality(rest_days) > 6 then rest_days[1:6]
      else rest_days
    end;

alter table public.training_availability
  drop constraint if exists training_availability_weekly_minutes_check,
  drop constraint if exists training_availability_recent_weekly_minutes_check,
  drop constraint if exists training_availability_max_session_minutes_check,
  drop constraint if exists valid_rest_days;

alter table public.training_availability
  add constraint training_availability_weekly_minutes_check
    check (weekly_minutes between 180 and 2100),
  add constraint training_availability_recent_weekly_minutes_check
    check (recent_weekly_minutes between 180 and 2100),
  add constraint training_availability_max_session_minutes_check
    check (max_session_minutes between 60 and 350),
  add constraint valid_rest_days check (
    cardinality(rest_days) <= 6 and array_position(rest_days, null) is null
    and rest_days <@ array[0,1,2,3,4,5,6]
    and cardinality(rest_days) =
      (case when 0 = any(rest_days) then 1 else 0 end +
       case when 1 = any(rest_days) then 1 else 0 end +
       case when 2 = any(rest_days) then 1 else 0 end +
       case when 3 = any(rest_days) then 1 else 0 end +
       case when 4 = any(rest_days) then 1 else 0 end +
       case when 5 = any(rest_days) then 1 else 0 end +
       case when 6 = any(rest_days) then 1 else 0 end)
  );
