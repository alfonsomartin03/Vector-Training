import { createClient } from "@supabase/supabase-js";
import { createAccountHandler, type AccountStore } from "./handler.ts";
import { RequestError } from "./validation.ts";

// Runtime supplied by Supabase Edge Functions; scoped declaration also allows tsc checks.
declare const Deno: { env: { get(name: string): string | undefined }; serve(handler: (request: Request) => Promise<Response>): void };
const url = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(url, serviceKey, options);
const profileColumns = "id, first_name, last_name, gender, birth_date, weight_kg, primary_sport, training_history, weekly_volume";

function checked<T>({ data, error }: { data: T; error: unknown }): T {
  if (error) throw new Error("Database operation failed");
  return data;
}

const store: AccountStore = {
  async authenticate(token) {
    const { data, error } = await admin.auth.getUser(token);
    return error ? null : data.user;
  },
  async isAdmin(id) {
    return !!checked(await admin.from("admin_memberships").select("user_id").eq("user_id", id).maybeSingle());
  },
  async directory(search, page) {
    return checked(await admin.rpc("admin_user_directory", { search_text: search, page_number: page }));
  },
  async account(id) {
    const { data, error } = await admin.auth.admin.getUserById(id);
    if (error && error.status !== 404) throw error;
    return data.user;
  },
  async details(id, page) {
    const offset = (page - 1) * 25;
    const [account, profile, membership, power, vo2, lactate] = await Promise.all([
      this.account(id),
      admin.from("profiles").select(profileColumns).eq("id", id).maybeSingle(),
      this.isAdmin(id),
      admin.from("power_profiles").select("id, one_minute_watts, five_minute_watts, twelve_minute_watts, maximal_efforts_confirmed, recorded_at", { count: "exact" }).eq("user_id", id).order("recorded_at", { ascending: false, nullsFirst: false }).order("id").range(offset, offset + 24),
      admin.from("vo2max_tests").select("id, relative_vo2max, absolute_vo2_l_min, body_mass_kg, vt1_power_watts, vt2_power_watts, max_aerobic_power_watts, test_date, source", { count: "exact" }).eq("user_id", id).order("test_date", { ascending: false }).order("id").range(offset, offset + 24),
      admin.from("lactate_tests").select("id, lt1_power_watts, lt1_heart_rate_bpm, lt1_lactate_mmol, lt2_power_watts, lt2_heart_rate_bpm, lt2_lactate_mmol, test_date, source", { count: "exact" }).eq("user_id", id).order("test_date", { ascending: false }).order("id").range(offset, offset + 24),
    ]);
    // Return only approved identity fields, never Auth's metadata or token fields.
    return {
      account: account && { id: account.id, email: account.email, created_at: account.created_at, last_sign_in_at: account.last_sign_in_at, email_confirmed_at: account.email_confirmed_at, is_admin: membership },
      profile: checked(profile), power: checked(power), vo2: checked(vo2), lactate: checked(lactate),
      hasMore: [power.count, vo2.count, lactate.count].some(count => (count ?? 0) > offset + 25),
    };
  },
  async updateProfile(id, patch) {
    checked(await admin.from("profiles").upsert({ id, ...patch }, { onConflict: "id" }).select("id").single());
  },
  async updateEmail(id, email) {
    const { error } = await admin.auth.admin.updateUserById(id, { email });
    if (error) throw new RequestError(400, "Email could not be changed. Check that it is valid and not already in use.");
  },
  async setAdmin(id, enabled) {
    const result = enabled
      ? await admin.from("admin_memberships").upsert({ user_id: id }, { onConflict: "user_id", ignoreDuplicates: true })
      : await admin.from("admin_memberships").delete().eq("user_id", id);
    if (result.error) throw new RequestError(409, "Admin access could not be changed. At least one admin must remain.");
  },
  async verifyPassword(account, password) {
    if (!account.email) return false;
    const verifier = createClient(url, anonKey, options);
    const { data, error } = await verifier.auth.signInWithPassword({ email: account.email, password });
    if (error || data.user?.id !== account.id) return false;
    // Revoke only the short-lived verification session, not the caller's other sessions.
    await verifier.auth.signOut({ scope: "local" });
    return true;
  },
  async canDelete(id) {
    if (!await this.isAdmin(id)) return true;
    const result = await admin.from("admin_memberships").select("user_id", { count: "exact", head: true });
    checked(result);
    return (result.count ?? 0) > 1;
  },
  async deleteAccount(id) {
    // Bounded batches make cleanup retryable. Never remove Storage metadata directly.
    for (let batch = 0; batch < 100; batch++) {
      const objects = checked(await admin.rpc("account_storage_objects", { account_id: id })) as { bucket_id: string; name: string }[];
      if (!objects.length) {
        const { error } = await admin.auth.admin.deleteUser(id, false);
        if (error) throw new RequestError(409, "Deletion could not finish. The account still exists; retry or contact an admin. At least one admin must remain.");
        return;
      }
      const buckets = new Set(objects.map(object => object.bucket_id));
      for (const bucket of buckets) {
        const { error } = await admin.storage.from(bucket).remove(objects.filter(object => object.bucket_id === bucket).map(object => object.name));
        if (error) throw new RequestError(409, "File cleanup could not finish. The account still exists. Retry deletion to remove the remaining data.");
      }
    }
    throw new RequestError(409, "Some files have been removed. Retry deletion to finish removing this large account.");
  },
};

const configuredOrigins = Deno.env.get("ACCOUNT_ALLOWED_ORIGINS")
  ?.split(",")
  .map(origin => origin.trim())
  .filter(Boolean);

Deno.serve(createAccountHandler(store, configuredOrigins?.length ? { allowedOrigins: configuredOrigins } : undefined));
