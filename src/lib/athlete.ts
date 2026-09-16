import {
    AthleteData,
    AthleteProfile,
    PowerProfile,
} from "../types/athlete";

import { supabase } from "./supabase";

export async function getAthleteData(
  userId: string
): Promise<AthleteData> {
  /*
   * Load the athlete's profile.
   *
   * profiles.id is the Supabase Auth user ID.
   */
  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (profileError) {
    throw new Error(
      `Unable to load athlete profile: ${profileError.message}`
    );
  }

  /*
   * Load the most recent power profile.
   *
   * This is deliberately ordered by recorded_at because the
   * schema allows multiple power profiles for the same athlete.
   */
  const {
    data: powerProfile,
    error: powerProfileError,
  } = await supabase
    .from("power_profiles")
    .select("*")
    .eq("user_id", userId)
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (powerProfileError) {
    throw new Error(
      `Unable to load power profile: ${powerProfileError.message}`
    );
  }

  return {
    profile: profile as AthleteProfile,
    powerProfile: powerProfile as PowerProfile | null,
  };
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
    .select("*")
    .single();

  if (error) {
    throw new Error(
      `Unable to update power profile: ${error.message}`
    );
  }

  return data as PowerProfile;
}