-- Progress is derived from immutable athlete data points. Index history reads
-- and publish changes so open clients refresh when any new point is inserted.
create index if not exists power_profiles_user_recorded_idx
  on public.power_profiles (user_id, recorded_at desc, id desc);

do $$
begin
  if exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    begin
      alter publication supabase_realtime add table public.power_profiles;
    exception when duplicate_object then null;
    end;

    begin
      alter publication supabase_realtime add table public.vo2max_tests;
    exception when duplicate_object then null;
    end;

    begin
      alter publication supabase_realtime add table public.lactate_tests;
    exception when duplicate_object then null;
    end;

    begin
      alter publication supabase_realtime add table public.profiles;
    exception when duplicate_object then null;
    end;
  end if;
end $$;
