import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";

import { supabase } from "../lib/supabase";
import type { ActivityPowerMaximum, CompletedWorkout, TrainingHistoryContext } from "../lib/training/history";
import type { WorkoutAssignment } from "../lib/training/weeklyPlan";

type State = TrainingHistoryContext & { userId: string; error: string | null };

export function useTrainingHistory(userId: string | undefined) {
  const [state, setState] = useState<State>({ userId: "", completedWorkouts: [], powerMaxima: [], error: null });
  const [savingDate, setSavingDate] = useState<string | null>(null);
  const sequence = useRef(0);

  const load = useCallback(async () => {
    const request = ++sequence.current;
    if (!userId) {
      setState({ userId: "", completedWorkouts: [], powerMaxima: [], error: null });
      return;
    }
    const [historyResult, maximaResult] = await Promise.all([
      supabase.from("training_workout_history")
        .select("id,scheduled_date,template_id,focus_id,progression_level,prescription_version,planned_duration_minutes,planned_work_minutes,completed_duration_minutes,completion_ratio,perceived_exertion,recovery_week,parameters,completed_at")
        .eq("user_id", userId).order("scheduled_date", { ascending: false }).limit(100),
      supabase.from("activity_power_maxima")
        .select("id,duration_seconds,watts,observed_at,source,external_activity_id")
        .eq("user_id", userId).order("observed_at", { ascending: false }).limit(100),
    ]);
    if (request !== sequence.current) return;
    const error = historyResult.error ?? maximaResult.error;
    if (error) {
      setState({
        userId,
        completedWorkouts: [],
        powerMaxima: [],
        error: "Training history is unavailable. Deploy the training-progression migration to enable adaptive plans.",
      });
      return;
    }
    setState({
      userId,
      completedWorkouts: (historyResult.data ?? []) as CompletedWorkout[],
      powerMaxima: (maximaResult.data ?? []) as ActivityPowerMaximum[],
      error: null,
    });
  }, [userId]);

  useFocusEffect(useCallback(() => {
    void load();
    return () => { sequence.current++; };
  }, [load]));

  const markCompleted = useCallback(async (scheduledDate: string, assignment: WorkoutAssignment) => {
    if (!userId) throw new Error("Sign in to record a completed workout.");
    if (!assignment.workout || assignment.durationMinutes == null) throw new Error("This day has no workout to complete.");
    setSavingDate(scheduledDate);
    try {
      const plannedWorkMinutes = assignment.workout.workSeconds / 60;
      const { error } = await supabase.from("training_workout_history").upsert({
        user_id: userId,
        scheduled_date: scheduledDate,
        template_id: assignment.workout.templateId,
        focus_id: assignment.focusId,
        progression_level: assignment.progressionLevel ?? 0,
        prescription_version: assignment.prescriptionVersion ?? 1,
        planned_duration_minutes: assignment.durationMinutes,
        planned_work_minutes: plannedWorkMinutes,
        completed_duration_minutes: assignment.durationMinutes,
        completion_ratio: 1,
        perceived_exertion: null,
        recovery_week: assignment.recoveryWeek ?? false,
        parameters: assignment.workout.parameters,
        completed_at: new Date().toISOString(),
      }, { onConflict: "user_id,scheduled_date" });
      if (error) throw new Error(`Unable to record workout: ${error.message}`);
      await load();
    } finally {
      setSavingDate(null);
    }
  }, [load, userId]);

  const current = state.userId === userId ? state : { completedWorkouts: [], powerMaxima: [], error: null };
  return {
    completedWorkouts: current.completedWorkouts ?? [],
    powerMaxima: current.powerMaxima ?? [],
    error: current.error,
    loading: Boolean(userId) && state.userId !== userId,
    savingDate,
    markCompleted,
    reload: load,
  };
}
