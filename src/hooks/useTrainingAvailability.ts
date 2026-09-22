import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { supabase } from "../lib/supabase";
import { validateAvailability, type Availability } from "../lib/training/prescription";

export function useTrainingAvailability(userId: string | undefined, week: string) {
  const [state, setState] = useState<{ key: string; value: Availability | null; error: string | null }>({ key: "", value: null, error: null });
  const [saving, setSaving] = useState(false);
  const sequence = useRef(0);
  const key = `${userId}:${week}`;
  const activeKey = useRef(key);
  const load = useCallback(async () => {
    // A save from an old account/week must not cancel the current load.
    if (activeKey.current !== key) return;
    const request = ++sequence.current;
    if (!userId) { setState({ key, value: null, error: null }); return; }
    try {
      const { data, error } = await supabase.from("training_availability").select("week_start,weekly_minutes,recent_weekly_minutes,max_session_minutes,rest_days,recovery_week")
        .eq("user_id", userId).lte("week_start", week).order("week_start", { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      if (data && validateAvailability(data)) throw new Error("Invalid saved availability");
      if (request === sequence.current && activeKey.current === key) setState({ key, value: data, error: null });
    } catch {
      if (request === sequence.current && activeKey.current === key) setState({ key, value: null, error: "Availability could not be loaded. Retry; if this persists, check that the training-availability migration is deployed." });
    }
  }, [key, userId, week]);
  useFocusEffect(useCallback(() => {
    activeKey.current = key;
    void load();
    return () => { sequence.current++; activeKey.current = ""; };
  }, [key, load]));
  const save = async (value: Availability) => {
    if (!userId) throw new Error("Sign in to save availability.");
    const invalid = validateAvailability(value);
    if (invalid) throw new Error(invalid);
    if (value.week_start !== week) throw new Error("Week changed; reload before saving.");
    setSaving(true);
    try {
      const { data, error } = await supabase.from("training_availability").upsert({ ...value, user_id: userId }, { onConflict: "user_id,week_start" }).select("user_id").single();
      if (error || !data) throw new Error("Availability was not saved. Please retry.");
      await load();
    } finally { setSaving(false); }
  };
  return { availability: state.key === key ? state.value : null, error: state.key === key ? state.error : null, loading: state.key !== key, saving, save, reload: load };
}
