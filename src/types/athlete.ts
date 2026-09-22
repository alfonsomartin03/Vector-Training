import type { TrainingFocusAssessment, TrainingFocusTag } from "../lib/training/focus";

export type NumericDatabaseValue = number | string;

export type AthleteProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  gender: string | null;
  birth_date: string | null;
  weight_kg: NumericDatabaseValue | null;
  primary_sport: string | null;
  training_history: string | null;
  weekly_volume: string | null;
  training_focus?: TrainingFocusAssessment | null;
  training_focus_tag?: TrainingFocusTag | null;
  training_focus_revision?: number;
};

export type PowerProfile = {
  id?: string;
  user_id: string;
  one_minute_watts: NumericDatabaseValue;
  five_minute_watts: NumericDatabaseValue;
  twelve_minute_watts: NumericDatabaseValue;
  maximal_efforts_confirmed: boolean;
  recorded_at: string | null;
};

export type Vo2MaxTest = {
  id: string;
  user_id: string;
  relative_vo2max: NumericDatabaseValue | null;
  absolute_vo2_l_min: NumericDatabaseValue | null;
  body_mass_kg: NumericDatabaseValue | null;
  vt1_power_watts: NumericDatabaseValue | null;
  vt2_power_watts: NumericDatabaseValue | null;
  max_aerobic_power_watts: NumericDatabaseValue | null;
  test_date: string;
  source: string;
  created_at: string;
};

export type LactateTest = {
  id: string;
  user_id: string;
  lt1_power_watts: NumericDatabaseValue | null;
  lt1_heart_rate_bpm: NumericDatabaseValue | null;
  lt1_lactate_mmol: NumericDatabaseValue | null;
  lt2_power_watts: NumericDatabaseValue | null;
  lt2_heart_rate_bpm: NumericDatabaseValue | null;
  lt2_lactate_mmol: NumericDatabaseValue | null;
  test_date: string;
  source: string;
  created_at: string;
};

export type AthleteData = {
  focusSyncError?: string;
  profile: AthleteProfile;
  powerProfile: PowerProfile | null;
  vo2MaxTest: Vo2MaxTest | null;
  lactateTest: LactateTest | null;
  /** Newest first. Used to derive progress against the previous valid point. */
  powerHistory?: PowerProfile[];
  /** Newest first. */
  vo2MaxHistory?: Vo2MaxTest[];
  /** Newest first. */
  lactateHistory?: LactateTest[];
};
