import { supabase } from "./supabase";
import type { AthleteProfile } from "../types/athlete";

export type AccountSummary = {
  id: string;
  email: string | null;
  first_name?: string | null;
  last_name?: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  is_admin: boolean;
};
export type AccountDirectory = { users: AccountSummary[]; total: number };
export type TestRecord = { id: string; [key: string]: string | number | boolean | null };
export type AccountDetails = {
  account: AccountSummary;
  profile: AthleteProfile | null;
  power: TestRecord[];
  vo2: TestRecord[];
  lactate: TestRecord[];
  hasMore: boolean;
};

export async function accountRequest<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("accounts", { body });
  if (error) {
    let message = "Account management is unavailable. Please try again later.";
    if (error.context instanceof Response) {
      try {
        const result = await error.context.json();
        if (typeof result.error === "string") message = result.error;
      } catch { /* Keep the readable fallback for transport/gateway failures. */ }
    }
    throw new Error(message);
  }
  return data as T;
}
