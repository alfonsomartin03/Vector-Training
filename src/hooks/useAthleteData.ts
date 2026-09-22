import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";

import { getAthleteData } from "../lib/athlete";
import { supabase } from "../lib/supabase";
import type { AthleteData } from "../types/athlete";

export function useAthleteData(
  userId: string | undefined,
  errorMessage: string,
  logLabel: string
) {
  const [athlete, setAthlete] = useState<AthleteData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestSequence = useRef(0);

  const refreshAthlete = useCallback(async () => {
    if (!userId) return;
    const request = ++requestSequence.current;
    try {
      const data = await getAthleteData(userId);
      if (request !== requestSequence.current) return;
      setAthlete(data);
      setError(data.focusSyncError ?? null);
    } catch (loadError) {
      if (request !== requestSequence.current) return;
      console.error(logLabel, loadError);
      setError(errorMessage);
    } finally {
      if (request === requestSequence.current) setIsLoading(false);
    }
  }, [errorMessage, logLabel, userId]);

  useFocusEffect(useCallback(() => {
    const request = ++requestSequence.current;
    if (!userId) {
      setAthlete(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const athleteUserId = userId;
    let isMounted = true;
    setAthlete((previous) => previous?.profile.id === userId ? previous : null);

    async function loadAthlete() {
      try {
        setIsLoading(true);
        setError(null);

        const athleteData = await getAthleteData(athleteUserId);

        if (isMounted && request === requestSequence.current) {
          setAthlete(athleteData);
          setError(athleteData.focusSyncError ?? null);
        }
      } catch (loadError) {
        console.error(logLabel, loadError);

        if (isMounted && request === requestSequence.current) setError(errorMessage);
      } finally {
        if (isMounted && request === requestSequence.current) setIsLoading(false);
      }
    }

    loadAthlete();

    return () => {
      isMounted = false;
      requestSequence.current++;
    };
  }, [errorMessage, logLabel, userId]));

  useEffect(() => {
    if (!userId) return;

    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    const scheduleRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      // A power insert also invalidates the profile focus, producing multiple
      // realtime events. Coalesce that burst into one database refresh.
      refreshTimer = setTimeout(() => void refreshAthlete(), 100);
    };

    // RealtimeClient reuses channels with an identical topic. React Strict Mode can
    // mount a replacement effect before the prior async removal finishes, so each
    // subscription needs its own topic to avoid adding handlers to a joined channel.
    const channelTopic = `athlete-progress:${userId}:${createChannelNonce()}`;
    const channel = supabase
      .channel(channelTopic)
      .on("postgres_changes", { event: "*", schema: "public", table: "power_profiles", filter: `user_id=eq.${userId}` }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "vo2max_tests", filter: `user_id=eq.${userId}` }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "lactate_tests", filter: `user_id=eq.${userId}` }, scheduleRefresh)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${userId}` }, scheduleRefresh)
      .subscribe();

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      void supabase.removeChannel(channel);
    };
  }, [refreshAthlete, userId]);

  // Never display a previous account's cached profile after sign-out/user switching.
  return { athlete: athlete?.profile.id === userId ? athlete : null, setAthlete, refreshAthlete, isLoading, error };
}

function createChannelNonce() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
