import type {
  AthleteData,
  AthleteProfile,
  LactateTest,
  PowerProfile,
  Vo2MaxTest,
} from "../types/athlete";

import { supabase } from "./supabase";
import { classifyTrainingFocus } from "./training/focus";

const PROFILE_COLUMNS = [
  "id",
  "first_name",
  "last_name",
  "gender",
  "birth_date",
  "weight_kg",
  "primary_sport",
  "training_history",
  "weekly_volume",
  "training_focus",
  "training_focus_tag",
  "training_focus_revision",
].join(",");

const POWER_COLUMNS = "id,user_id,one_minute_watts,five_minute_watts,twelve_minute_watts,maximal_efforts_confirmed,recorded_at";
const VO2_COLUMNS = "id,user_id,relative_vo2max,absolute_vo2_l_min,body_mass_kg,vt1_power_watts,vt2_power_watts,max_aerobic_power_watts,test_date,source,created_at";
const LACTATE_COLUMNS = "id,user_id,lt1_power_watts,lt1_heart_rate_bpm,lt1_lactate_mmol,lt2_power_watts,lt2_heart_rate_bpm,lt2_lactate_mmol,test_date,source,created_at";

export async function getAthleteData(
  userId: string
): Promise<AthleteData> {
  try {
    return await getAthleteDataOnce(userId);
  } catch (error) {
    if (!isJwtIssuedAtFutureError(error)) {
      throw error;
    }

    const {
      data: { session: refreshedSession },
      error: refreshError,
    } = await supabase.auth.refreshSession();

    if (refreshError || !refreshedSession) {
      throw new Error(
        "Your authentication session is out of sync and could not be refreshed. Please sign out and sign in again."
      );
    }

    try {
      return await getAthleteDataOnce(userId);
    } catch (retryError) {
      if (isJwtIssuedAtFutureError(retryError)) {
        throw new Error(
          "Your authentication session is out of sync. Please sign out and sign in again."
        );
      }

      throw retryError;
    }
  }
}

async function getAthleteDataOnce(
  userId: string,
  retries = 1,
): Promise<AthleteData> {
  // Fetch each relation once. The first history row is also the current value,
  // which avoids three duplicate round trips on every dashboard/page refresh.
  const [
    { data: profile, error: profileError },
    { data: powerHistory, error: powerHistoryError },
    { data: vo2MaxHistory, error: vo2HistoryError },
    { data: lactateHistory, error: lactateHistoryError },
  ] = await Promise.all([
    supabase.from("profiles").select(PROFILE_COLUMNS).eq("id", userId).single(),
    supabase.from("power_profiles").select(POWER_COLUMNS).eq("user_id", userId)
      .order("recorded_at", { ascending: false, nullsFirst: false }).order("id", { ascending: false }).limit(25),
    supabase.from("vo2max_tests").select(VO2_COLUMNS).eq("user_id", userId)
      .order("test_date", { ascending: false }).order("created_at", { ascending: false }).limit(25),
    supabase.from("lactate_tests").select(LACTATE_COLUMNS).eq("user_id", userId)
      .order("test_date", { ascending: false }).order("created_at", { ascending: false }).limit(25),
  ]);

  if (profileError) {
    throw new Error("Unable to load athlete profile.");
  }

  if (powerHistoryError) {
    throw new Error("Unable to load power progress.");
  }
  if (vo2HistoryError && !isMissingRelationError(vo2HistoryError.code)) {
    throw new Error("Unable to load VO₂max progress.");
  }
  if (lactateHistoryError && !isMissingRelationError(lactateHistoryError.code)) {
    throw new Error("Unable to load lactate progress.");
  }

  const typedPowerHistory = (powerHistory ?? []) as PowerProfile[];
  const typedVo2History = (vo2MaxHistory ?? []) as Vo2MaxTest[];
  const typedLactateHistory = (lactateHistory ?? []) as LactateTest[];

  const athlete: AthleteData = {
    profile: profile as unknown as AthleteProfile,
    powerProfile: typedPowerHistory[0] ?? null,
    vo2MaxTest: typedVo2History[0] ?? null,
    lactateTest: typedLactateHistory[0] ?? null,
    powerHistory: typedPowerHistory,
    vo2MaxHistory: typedVo2History,
    lactateHistory: typedLactateHistory,
  };
  const focus = classifyTrainingFocus(athlete);
  if (athlete.profile.training_focus_revision == null) {
    console.error("Training focus migration has not been applied to profiles.");
    return { ...athlete, focusSyncError: "Your training focus is not available yet. Your athlete data is still available." };
  }
  const previous = athlete.profile.training_focus;
  if (previous && (Object.keys(focus) as (keyof typeof focus)[])
    .every((key) => previous[key] === focus[key])) return athlete;
  const { data: saved, error: saveError } = await supabase.from("profiles")
    .update({ training_focus: focus })
    .eq("id", userId)
    .eq("training_focus_revision", athlete.profile.training_focus_revision)
    .select("training_focus, training_focus_tag, training_focus_revision")
    .maybeSingle();
  if (!saveError && !saved && retries > 0) return getAthleteDataOnce(userId, retries - 1);
  if (saveError || !saved) {
    console.error("Unable to save training focus.");
    return {
      ...athlete,
      profile: { ...athlete.profile, training_focus: null, training_focus_tag: null },
      focusSyncError: "Your data loaded, but your current training focus could not be saved. Reopen this page to retry.",
    };
  }
  return { ...athlete, profile: { ...athlete.profile, ...saved } };
}

function isMissingRelationError(code: string | undefined) {
  return code === "42P01" || code === "PGRST205";
}

function isJwtIssuedAtFutureError(error: unknown) {
  return (
    error instanceof Error &&
    error.message.toLowerCase().includes("jwt issued at future")
  );
}

export type PowerProfileUpdate = {
  one_minute_watts: number;
  five_minute_watts: number;
  twelve_minute_watts: number;
};

export async function updatePowerProfile(
  userId: string,
  values: PowerProfileUpdate
): Promise<PowerProfile> {
  const { data, error } = await supabase
    .from("power_profiles")
    .insert({
      user_id: userId,
      one_minute_watts: values.one_minute_watts,
      five_minute_watts: values.five_minute_watts,
      twelve_minute_watts: values.twelve_minute_watts,
      maximal_efforts_confirmed: true,
      recorded_at: new Date().toISOString(),
    })
    .select(
      "id, user_id, one_minute_watts, five_minute_watts, twelve_minute_watts, maximal_efforts_confirmed, recorded_at"
    )
    .single();

  if (error) {
    throw new Error("Unable to update power profile. Check the values and retry.");
  }

  return data as PowerProfile;
}

export type Vo2MaxTestInput = {
  relative_vo2max: number | null;
  absolute_vo2_l_min: number | null;
  body_mass_kg: number | null;
  vt1_power_watts: number | null;
  vt2_power_watts: number | null;
  max_aerobic_power_watts: number | null;
  test_date: string;
  source: string;
};

export async function saveVo2MaxTest(
  userId: string,
  values: Vo2MaxTestInput
): Promise<Vo2MaxTest> {
  const { data, error } = await supabase
    .from("vo2max_tests")
    .insert({ user_id: userId, ...values })
    .select(
      "id, user_id, relative_vo2max, absolute_vo2_l_min, body_mass_kg, vt1_power_watts, vt2_power_watts, max_aerobic_power_watts, test_date, source, created_at"
    )
    .single();

  if (error) {
    throw new Error("Unable to save the VO₂max test. Check the values and retry.");
  }

  return data as Vo2MaxTest;
}

export type LactateTestInput = {
  lt1_power_watts: number | null;
  lt1_heart_rate_bpm: number | null;
  lt1_lactate_mmol: number | null;
  lt2_power_watts: number | null;
  lt2_heart_rate_bpm: number | null;
  lt2_lactate_mmol: number | null;
  test_date: string;
  source: string;
};

export async function saveLactateTest(
  userId: string,
  values: LactateTestInput
): Promise<LactateTest> {
  const { data, error } = await supabase
    .from("lactate_tests")
    .insert({ user_id: userId, ...values })
    .select(
      "id, user_id, lt1_power_watts, lt1_heart_rate_bpm, lt1_lactate_mmol, lt2_power_watts, lt2_heart_rate_bpm, lt2_lactate_mmol, test_date, source, created_at"
    )
    .single();

  if (error) {
    throw new Error("Unable to save the lactate test. Check the values and retry.");
  }

  return data as LactateTest;
}
