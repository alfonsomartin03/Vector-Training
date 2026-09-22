import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import "react-native-url-polyfill/auto";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    "Missing Supabase environment variables. Check your .env file."
  );
}

assertPublicSupabaseConfig(supabaseUrl, supabasePublishableKey);

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey,
  {
    auth: {
      storage: Platform.OS === "web" ? undefined : AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === "web",
      flowType: "pkce",
    },
  }
);

function assertPublicSupabaseConfig(urlValue: string, key: string) {
  let url: URL;
  try {
    url = new URL(urlValue);
  } catch {
    throw new Error("EXPO_PUBLIC_SUPABASE_URL must be a valid URL.");
  }

  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol !== "https:" && !local) {
    throw new Error("Supabase must use HTTPS outside local development.");
  }

  // A service-role/secret key in an EXPO_PUBLIC variable would be embedded in
  // every client bundle and bypass row-level security. Fail closed if one is
  // accidentally supplied, while accepting modern publishable and legacy anon keys.
  if (key.startsWith("sb_secret_") || jwtRole(key) === "service_role") {
    throw new Error("A privileged Supabase key cannot be used in the client application.");
  }
}

function jwtRole(key: string): string | undefined {
  const payload = key.split(".")[1];
  if (!payload || typeof globalThis.atob !== "function") return undefined;
  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(payload.length / 4) * 4, "=");
    return JSON.parse(globalThis.atob(base64)).role;
  } catch {
    return undefined;
  }
}
