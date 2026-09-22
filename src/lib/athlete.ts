import type {
  AthleteData,
  AthleteProfile,
  LactateTest,
  PowerProfile,
  Vo2MaxTest,
} from "../types/athlete";

import { supabase } from "./supabase";
import { classifyTrainingFocus } from "./training/focus";

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
  /*
   * Load the athlete's profile.
   *
   * profiles.id is the Supabase Auth user ID.
   */
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  const powerProfileRequest = supabase
    .from("power_profiles")
    .select(
      "id, user_id, one_minute_watts, five_minute_watts, twelve_minute_watts, maximal_efforts_confirmed, recorded_at"
    )
    .eq("user_id", userId)
    .order("recorded_at", { ascending: false, nullsFirst: false })
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  const vo2MaxRequest = supabase
    .from("vo2max_tests")
    .select(
      "id, user_id, relative_vo2max, absolute_vo2_l_min, body_mass_kg, vt1_power_watts, vt2_power_watts, max_aerobic_power_watts, test_date, source, created_at"
    )
    .eq("user_id", userId)
    .order("test_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const lactateRequest = supabase
    .from("lactate_tests")
    .select(
      "id, user_id, lt1_power_watts, lt1_heart_rate_bpm, lt1_lactate_mmol, lt2_power_watts, lt2_heart_rate_bpm, lt2_lactate_mmol, test_date, source, created_at"
    )
    .eq("user_id", userId)
    .order("test_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const powerHistoryRequest = supabase
    .from("power_profiles")
    .select("id, user_id, one_minute_watts, five_minute_watts, twelve_minute_watts, maximal_efforts_confirmed, recorded_at")
    .eq("user_id", userId)
    .order("recorded_at", { ascending: false, nullsFirst: false })
    .order("id", { ascending: false })
    .limit(25);

  const vo2HistoryRequest = supabase
    .from("vo2max_tests")
    .select("id, user_id, relative_vo2max, absolute_vo2_l_min, body_mass_kg, vt1_power_watts, vt2_power_watts, max_aerobic_power_watts, test_date, source, created_at")
    .eq("user_id", userId)
    .order("test_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(25);

  const lactateHistoryRequest = supabase
    .from("lactate_tests")
    .select("id, user_id, lt1_power_watts, lt1_heart_rate_bpm, lt1_lactate_mmol, lt2_power_watts, lt2_heart_rate_bpm, lt2_lactate_mmol, test_date, source, created_at")
    .eq("user_id", userId)
    .order("test_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(25);

  const [
    { data: powerProfile, error: powerProfileError },
    { data: vo2MaxTest, error: vo2MaxError },
    { data: lactateTest, error: lactateError },
    { data: powerHistory, error: powerHistoryError },
    { data: vo2MaxHistory, error: vo2HistoryError },
    { data: lactateHistory, error: lactateHistoryError },
  ] = await Promise.all([
    powerProfileRequest,
    vo2MaxRequest,
    lactateRequest,
    powerHistoryRequest,
    vo2HistoryRequest,
    lactateHistoryRequest,
  ]);

  if (profileError) {
    throw new Error(
      `Unable to load athlete profile: ${profileError.message}`
    );
  }

  if (powerProfileError) {
    throw new Error(
      `Unable to load power profile: ${powerProfileError.message}`
    );
  }

  if (vo2MaxError && !isMissingRelationError(vo2MaxError.code)) {
    throw new Error(`Unable to load VO₂max data: ${vo2MaxError.message}`);
  }

  if (lactateError && !isMissingRelationError(lactateError.code)) {
    throw new Error(`Unable to load lactate data: ${lactateError.message}`);
  }

  if (powerHistoryError) {
    throw new Error(`Unable to load power progress: ${powerHistoryError.message}`);
  }
  if (vo2HistoryError && !isMissingRelationError(vo2HistoryError.code)) {
    throw new Error(`Unable to load VO₂max progress: ${vo2HistoryError.message}`);
  }
  if (lactateHistoryError && !isMissingRelationError(lactateHistoryError.code)) {
    throw new Error(`Unable to load lactate progress: ${lactateHistoryError.message}`);
  }

  const athlete: AthleteData = {
    profile: profile as AthleteProfile,
    powerProfile: powerProfile as PowerProfile | null,
    vo2MaxTest: (vo2MaxTest as Vo2MaxTest | null) ?? null,
    lactateTest: (lactateTest as LactateTest | null) ?? null,
    powerHistory: Array.isArray(powerHistory)
      ? powerHistory as PowerProfile[]
      : powerProfile
        ? [powerProfile as PowerProfile]
        : [],
    vo2MaxHistory: Array.isArray(vo2MaxHistory)
      ? vo2MaxHistory as Vo2MaxTest[]
      : vo2MaxTest
        ? [vo2MaxTest as Vo2MaxTest]
        : [],
    lactateHistory: Array.isArray(lactateHistory)
      ? lactateHistory as LactateTest[]
      : lactateTest
        ? [lactateTest as LactateTest]
        : [],
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
    console.error("Unable to save training focus:", saveError?.message ?? "Power data changed during classification");
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
    throw new Error(
      `Unable to update power profile: ${error.message}`
    );
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
    throw new Error(`Unable to save VO₂max test: ${error.message}`);
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
    throw new Error(`Unable to save lactate test: ${error.message}`);
  }

  return data as LactateTest;
}
