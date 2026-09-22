import type { WorkoutId, WorkoutParameters } from "./workouts";

export type CompletedWorkout = {
  id?: string;
  scheduled_date: string;
  template_id: WorkoutId;
  focus_id: string;
  progression_level: number;
  prescription_version: number;
  planned_duration_minutes: number;
  planned_work_minutes: number;
  completed_duration_minutes: number;
  completion_ratio: number;
  perceived_exertion: number | null;
  recovery_week: boolean;
  parameters: WorkoutParameters;
  completed_at: string;
};

/** Future activity imports write new best efforts here; the planner stays provider-agnostic. */
export type ActivityPowerMaximum = {
  id?: string;
  duration_seconds: number;
  watts: number;
  observed_at: string;
  source: "activity" | "manual" | "test" | string;
  external_activity_id?: string | null;
};

export type TrainingHistoryContext = {
  completedWorkouts?: readonly CompletedWorkout[];
  powerMaxima?: readonly ActivityPowerMaximum[];
};
