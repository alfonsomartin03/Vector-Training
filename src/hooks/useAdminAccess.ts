import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { accountRequest } from "../lib/accounts";

export function useAdminAccess() {
  const { user } = useAuth();
  const userId = user?.id;
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sequence = useRef(0);
  const checkAccess = useCallback(async () => {
    const request = ++sequence.current;
    setIsAdmin(false);
    setError(null);
    setLoading(Boolean(userId));
    if (userId) {
      try {
        const result = await accountRequest<{ isAdmin: boolean }>({ action: "access" });
        if (request === sequence.current) setIsAdmin(result.isAdmin);
      } catch (error) {
        if (request === sequence.current) setError(error instanceof Error ? error.message : "Unable to check admin access.");
      } finally { if (request === sequence.current) setLoading(false); }
    }
  }, [userId]);
  useFocusEffect(useCallback(() => {
    void checkAccess();
    return () => { sequence.current++; };
  }, [checkAccess]));
  return { isAdmin, loading, error, retry: checkAccess };
}
