import { useEffect, useState } from "react";

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

  useEffect(() => {
    if (!userId) return;

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
  }, [errorMessage, logLabel, userId]);

  return { athlete, setAthlete, isLoading, error };
}
