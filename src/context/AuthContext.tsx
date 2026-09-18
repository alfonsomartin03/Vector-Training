import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "../lib/supabase";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

type AuthProviderProps = {
  children: ReactNode;
};

/* -------------------------------------------------------------------------- */
/*                                Auth Context                                */
/* -------------------------------------------------------------------------- */

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

/* -------------------------------------------------------------------------- */
/*                                Auth Provider                               */
/* -------------------------------------------------------------------------- */

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /*
     * Restore an existing Supabase session when the app starts.
     */
    async function restoreSession() {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error(
            "Error restoring authentication session:",
            error
          );
        }

        setSession(session);
      } catch (error) {
        console.error(
          "Unexpected error restoring session:",
          error
        );

        setSession(null);
      } finally {
        setLoading(false);
      }
    }

    restoreSession();

    /*
     * Listen for authentication changes.
     *
     * Examples:
     * - User logs in
     * - User logs out
     * - Supabase refreshes the session
     */
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    /*
     * Remove the listener when the provider unmounts.
     */
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /* ------------------------------------------------------------------------ */
  /*                                  Logout                                  */
  /* ------------------------------------------------------------------------ */

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }
  }, []);

  /* ------------------------------------------------------------------------ */
  /*                               Context Value                              */
  /* ------------------------------------------------------------------------ */

  const value = useMemo<AuthContextType>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      signOut,
    }),
    [loading, session, signOut]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/*                                useAuth Hook                                */
/* -------------------------------------------------------------------------- */

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error(
      "useAuth must be used inside an AuthProvider"
    );
  }

  return context;
}
