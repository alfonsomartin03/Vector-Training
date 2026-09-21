import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";

import { getAthleteData } from "../lib/athlete";
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

  return { athlete, setAthlete, refreshAthlete, isLoading, error };
}
