import { useCallback, useState } from "react";
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

  useFocusEffect(useCallback(() => {
    if (!userId) {
      setAthlete(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    const athleteUserId = userId;
    let isMounted = true;

    async function loadAthlete() {
      try {
        setIsLoading(true);
        setError(null);

        const athleteData = await getAthleteData(athleteUserId);

        if (isMounted) setAthlete(athleteData);
      } catch (loadError) {
        console.error(logLabel, loadError);

        if (isMounted) setError(errorMessage);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadAthlete();

    return () => {
      isMounted = false;
    };
  }, [errorMessage, logLabel, userId]));

  // Never display a previous account's cached profile after sign-out/user switching.
  return { athlete: athlete?.profile.id === userId ? athlete : null, setAthlete, isLoading, error };
}
