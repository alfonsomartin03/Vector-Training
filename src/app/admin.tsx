import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { AccountDeletePanel } from "../components/AccountDeletePanel";
import { theme } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import { useAdminAccess } from "../hooks/useAdminAccess";
import { accountRequest, type AccountDetails, type AccountDirectory, type TestRecord } from "../lib/accounts";

export default function AdminPage() {
  const access = useAdminAccess();
  const { width } = useWindowDimensions();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [directory, setDirectory] = useState<AccountDirectory>({ users: [], total: 0 });
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const refresh = useCallback(() => setRevision(value => value + 1), []);

  useEffect(() => {
    if (!access.isAdmin) return;
    let active = true;
    async function loadDirectory() {
      setLoading(true);
      setError(null);
      try {
        const result = await accountRequest<AccountDirectory>({ action: "list", search: query, page });
        if (active) setDirectory(result);
      } catch (error) {
        if (active) { setDirectory({ users: [], total: 0 }); setError(error instanceof Error ? error.message : "Unable to load accounts."); }
      } finally { if (active) setLoading(false); }
    }
    void loadDirectory();
    return () => { active = false; };
  }, [access.isAdmin, query, page, revision]);

  return <ScrollView style={styles.page} contentContainerStyle={styles.container}>
    <View style={styles.heading}>
      <View><Text style={styles.eyebrow}>VECTOR / ADMIN</Text><Text style={styles.title}>User management</Text><Text style={styles.copy}>Review athletes and manage their accounts.</Text></View>
      <Action label="Back to profile" onPress={() => router.push("/profile")} disabled={busy} />
    </View>
    {access.loading ? <ActivityIndicator accessibilityLabel="Checking admin access" /> : access.error ? <View style={styles.card}><Message text={access.error} error /><Action label="Retry access check" onPress={access.retry} /></View> : !access.isAdmin ? <View style={styles.card}><Text style={styles.subtitle}>Admin access required</Text><Text style={styles.copy}>An existing admin can give your account access to this page.</Text></View> : <>
      {notice ? <Message text={notice} /> : null}
      <View style={[styles.columns, width < 1000 && styles.stacked]}>
        <View style={[styles.directory, width < 1000 && styles.fullWidth]}>
          <View style={styles.card}>
            <Text style={styles.subtitle}>Accounts</Text>
            <TextInput accessibilityLabel="Search accounts" value={search} onChangeText={setSearch} editable={!busy} onSubmitEditing={() => { setQuery(search.trim()); setPage(1); }} placeholder="Search name, email or ID" style={styles.input} autoCapitalize="none" maxLength={200} />
            <Action label="Search" disabled={busy} onPress={() => { setQuery(search.trim()); setPage(1); }} />
            {loading ? <ActivityIndicator accessibilityLabel="Loading accounts" /> : <Text style={styles.copy}>{directory.total} accounts · Page {page}</Text>}
            {error ? <><Message text={error} error /><Action label="Retry" onPress={refresh} /></> : null}
            {!loading && !error && directory.users.length === 0 ? <Text style={styles.copy}>No accounts match this search.</Text> : null}
            {directory.users.map(account => <Pressable key={account.id} accessibilityRole="button" accessibilityState={{ selected: selected === account.id }} disabled={busy || loading} onPress={() => { setSelected(account.id); setNotice(null); }} style={[styles.userRow, selected === account.id && styles.selected]}>
              <Text style={styles.userName}>{[account.first_name, account.last_name].filter(Boolean).join(" ") || "Profile not completed"}</Text>
              <Text style={styles.copy}>{account.email || "No email"}</Text>
              <Text style={styles.eyebrow}>{account.is_admin ? "ADMIN" : "ATHLETE"}</Text>
            </Pressable>)}
            <View style={styles.actions}>
              <Action label="Previous" disabled={busy || loading || page === 1} onPress={() => setPage(value => value - 1)} />
              <Action label="Next" disabled={busy || loading || page * 25 >= directory.total} onPress={() => setPage(value => value + 1)} />
            </View>
          </View>
        </View>
        <View style={styles.detail}>
          {selected ? <UserEditor key={selected} userId={selected} onBusyChange={setBusy} onChanged={refresh} onDeleted={() => { setSelected(null); setPage(1); refresh(); setNotice("Account and its active data deleted."); }} /> : <View style={styles.card}><Text style={styles.subtitle}>Select an account</Text><Text style={styles.copy}>Profile details, account controls and test history will appear here.</Text></View>}
        </View>
      </View>
    </>}
  </ScrollView>;
}

const textFields = [
  ["first_name", "First name"], ["last_name", "Last name"],
  ["birth_date", "Birth date (YYYY-MM-DD)"], ["weight_kg", "Body mass (kg)"],
] as const;
const choices = [
  ["gender", "Gender", [["male", "Male"], ["female", "Female"], ["prefer_not_to_say", "Prefer not to say"]]],
  ["primary_sport", "Sport", [["cycling", "Cycling"]]],
  ["training_history", "Training experience", [["beginner", "Beginner"], ["intermediate", "Intermediate"], ["advanced", "Advanced"], ["pro", "Pro"]]],
  ["weekly_volume", "Weekly training hours", [["1-5", "1–5"], ["6-12", "6–12"], ["12+", "12+"]]],
] as const;

function UserEditor({ userId, onBusyChange, onChanged, onDeleted }: {
  userId: string; onBusyChange: (busy: boolean) => void; onChanged: () => void; onDeleted: () => void;
}) {
  const { user } = useAuth();
  const [details, setDetails] = useState<AccountDetails | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    let active = true;
    accountRequest<AccountDetails>({ action: "details", userId })
      .then(result => {
        if (!active) return;
        setDetails(result);
        const fields = [...textFields.map(([key]) => key), ...choices.map(([key]) => key)];
        setForm(Object.fromEntries(fields.map(key => [key, String(result.profile?.[key] ?? "")])));
        setEmail(result.account.email ?? "");
        setError(null);
      }).catch(error => { if (active) setError(error.message); });
    return () => { active = false; mounted.current = false; };
  }, [userId, attempt]);

  function markBusy(value: boolean) { setBusy(value); onBusyChange(value); }
  async function run(operation: () => Promise<void>, success: string) {
    if (busy) return;
    markBusy(true); setError(null); setNotice(null);
    try {
      await operation();
      if (mounted.current) { setNotice(success); onChanged(); }
    } catch (error) { if (mounted.current) setError(error instanceof Error ? error.message : "This change could not be saved."); }
    finally { if (mounted.current) { markBusy(false); setPassword(""); } }
  }
  if (!details) return <View style={styles.card}>{error ? <><Message text={error} error /><Action label="Retry" onPress={() => setAttempt(value => value + 1)} /></> : <ActivityIndicator accessibilityLabel="Loading account details" />}</View>;
  const ownAccount = user?.id === userId;

  return <View style={styles.editor}>
    <View style={styles.card}>
      <Text style={styles.eyebrow}>{details.account.is_admin ? "ADMIN ACCOUNT" : "ATHLETE ACCOUNT"}{ownAccount ? " · YOU" : ""}</Text>
      <Text style={styles.subtitle}>{details.account.email ?? "Account without email"}</Text>
      <Text selectable style={styles.copy}>ID: {userId}</Text>
      <Text style={styles.copy}>Joined {date(details.account.created_at)} · Last sign-in {date(details.account.last_sign_in_at)}</Text>
      <Text style={styles.copy}>Email {details.account.email_confirmed_at ? "verified" : "not verified"}</Text>
      {error ? <Message text={error} error /> : null}
      {notice ? <Message text={notice} /> : null}
      <Text style={styles.subtitle}>Athlete profile</Text>
      {!details.profile ? <Text style={styles.copy}>Onboarding is incomplete. Saving these fields creates the athlete profile.</Text> : null}
      {textFields.map(([key, label]) => <View key={key} style={styles.field}>
        <Text style={styles.label}>{label}</Text>
        <TextInput accessibilityLabel={label} value={form[key] ?? ""} onChangeText={value => setForm(current => ({ ...current, [key]: value }))} editable={!busy} style={styles.input} maxLength={100} keyboardType={key === "weight_kg" ? "decimal-pad" : "default"} />
      </View>)}
      {choices.map(([key, label, options]) => <View key={key} style={styles.field}>
        <Text style={styles.label}>{label}</Text><View style={styles.actions}>
          {[["", "Not set"], ...options].map(([value, title]) => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: form[key] === value }} disabled={busy} onPress={() => setForm(current => ({ ...current, [key]: value }))} style={[styles.chip, form[key] === value && styles.selected]}><Text>{title}</Text></Pressable>)}
        </View>
      </View>)}
      <Action label={busy ? "Working…" : "Save profile"} disabled={busy} primary onPress={() => run(async () => {
        const weight = form.weight_kg?.trim() ? Number(form.weight_kg) : null;
        if (weight !== null && (!Number.isFinite(weight) || weight <= 0)) throw new Error("Enter a valid body mass.");
        await accountRequest({ action: "update-profile", userId, profile: { ...form, weight_kg: weight } });
      }, "Profile saved.")} />
    </View>
    <View style={styles.card}>
      <Text style={styles.subtitle}>Account access</Text>
      <Text style={styles.copy}>Email and admin-access changes require your current admin password. Admins can view and manage every account.</Text>
      <Text style={styles.label}>Sign-in email</Text>
      <TextInput accessibilityLabel="Account sign-in email" autoCapitalize="none" keyboardType="email-address" autoCorrect={false} value={email} onChangeText={setEmail} editable={!busy} style={styles.input} maxLength={254} />
      <Text style={styles.label}>Your admin password</Text>
      <TextInput accessibilityLabel="Admin password for account changes" secureTextEntry autoCapitalize="none" value={password} onChangeText={setPassword} editable={!busy} style={styles.input} />
      <Action label="Change sign-in email" disabled={busy || !password || email === details.account.email} onPress={() => run(async () => {
        await accountRequest({ action: "update-email", userId, email, password });
        setDetails(current => current && ({ ...current, account: { ...current.account, email: email.trim().toLowerCase() } }));
      }, "Sign-in email changed.")} />
      {ownAccount ? <Text style={styles.copy}>Another admin must change your admin access. Use your profile to delete your own account.</Text> : <Action label={details.account.is_admin ? "Remove admin access" : "Grant admin access"} disabled={busy || !password} onPress={() => run(async () => {
        const enabled = !details.account.is_admin;
        await accountRequest({ action: "set-admin", userId, enabled, password });
        setDetails(current => current && ({ ...current, account: { ...current.account, is_admin: enabled } }));
      }, "Admin access updated.")} />}
    </View>
    <View style={styles.card}>
      <Text style={styles.subtitle}>Test history</Text>
      <Text style={styles.copy}>Recorded results are shown as entered. Profile edits do not rewrite historical tests.</Text>
      <History title="Power tests" records={details.power} />
      <History title="VO₂ tests" records={details.vo2} />
      <History title="Lactate tests" records={details.lactate} />
      {details.hasMore ? <Action label="Load older results" disabled={busy} onPress={() => run(async () => {
        const next = await accountRequest<AccountDetails>({ action: "details", userId, page: historyPage + 1 });
        setDetails(current => current && ({ ...current, power: [...current.power, ...next.power], vo2: [...current.vo2, ...next.vo2], lactate: [...current.lactate, ...next.lactate], hasMore: next.hasMore }));
        setHistoryPage(value => value + 1);
      }, "Older results loaded.")} /> : null}
    </View>
    {!ownAccount ? <AccountDeletePanel userId={userId} email={details.account.email} disabled={busy} onBusyChange={markBusy} onDeleted={onDeleted} /> : null}
  </View>;
}

const historyLabels: Record<string, string> = {
  one_minute_watts: "1-minute power (W)", five_minute_watts: "5-minute power (W)", twelve_minute_watts: "12-minute power (W)",
  maximal_efforts_confirmed: "Maximal efforts confirmed", recorded_at: "Recorded", test_date: "Test date", source: "Source",
  relative_vo2max: "VO₂max (mL/kg/min)", absolute_vo2_l_min: "VO₂ (L/min)", body_mass_kg: "Body mass (kg)",
  vt1_power_watts: "VT1 (W)", vt2_power_watts: "VT2 (W)", max_aerobic_power_watts: "Maximal aerobic power (W)",
  lt1_power_watts: "LT1 (W)", lt1_heart_rate_bpm: "LT1 heart rate (bpm)", lt1_lactate_mmol: "LT1 lactate (mmol/L)",
  lt2_power_watts: "LT2 (W)", lt2_heart_rate_bpm: "LT2 heart rate (bpm)", lt2_lactate_mmol: "LT2 lactate (mmol/L)",
};
function History({ title, records }: { title: string; records: TestRecord[] }) {
  return <View style={styles.field}><Text style={styles.label}>{title}</Text>{!records.length ? <Text style={styles.copy}>No results recorded.</Text> : records.map(record => <View key={record.id} style={styles.historyRow}>
    {Object.entries(record).filter(([key, value]) => key !== "id" && value !== null).map(([key, value]) => <Text key={key} style={styles.copy}>{historyLabels[key] ?? key}: {typeof value === "boolean" ? value ? "Yes" : "No" : key === "recorded_at" || key === "test_date" ? date(String(value)) : String(value)}</Text>)}
  </View>)}</View>;
}
function date(value: string | null) {
  if (!value) return "Never";
  // Lab test dates are calendar dates, not UTC-midnight instants.
  return new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value).toLocaleDateString();
}
function Message({ text, error = false }: { text: string; error?: boolean }) { return <Text accessibilityRole="alert" style={[styles.message, error && styles.error]}>{text}</Text>; }
function Action({ label, onPress, disabled = false, primary = false }: { label: string; onPress: () => void; disabled?: boolean; primary?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.button, primary && styles.primary, disabled && styles.disabled]}><Text style={[styles.buttonText, primary && styles.white]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.colors.background },
  container: { width: "100%", maxWidth: 1350, alignSelf: "center", padding: 24, paddingBottom: 80, gap: 24 },
  heading: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 18, paddingVertical: 24 },
  title: { fontSize: 36, fontWeight: "700", color: theme.colors.text, marginVertical: 12 },
  eyebrow: { fontSize: 11, letterSpacing: 1.4, fontWeight: "700", color: theme.colors.textSecondary },
  subtitle: { fontSize: 20, fontWeight: "700", color: theme.colors.text },
  copy: { fontSize: 14, lineHeight: 22, color: theme.colors.textSecondary },
  columns: { flexDirection: "row", alignItems: "flex-start", gap: 24 }, stacked: { flexDirection: "column" },
  directory: { width: 340 }, fullWidth: { width: "100%" }, detail: { flex: 1, width: "100%", minWidth: 0 },
  card: { padding: 22, borderRadius: 18, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: "white", gap: 16 },
  editor: { gap: 20 }, field: { gap: 8 }, label: { fontSize: 14, fontWeight: "600", color: theme.colors.text },
  input: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, padding: 12, minHeight: 44, backgroundColor: theme.colors.background, color: theme.colors.text },
  userRow: { padding: 14, gap: 6, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.border }, userName: { fontWeight: "600", fontSize: 15, color: theme.colors.text },
  selected: { backgroundColor: theme.colors.accentSoft, borderColor: theme.colors.accent },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { padding: 10, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.border },
  button: { padding: 13, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, alignItems: "center" },
  buttonText: { fontWeight: "600", color: theme.colors.text }, primary: { backgroundColor: theme.colors.text }, white: { color: "white" }, disabled: { opacity: 0.4 },
  message: { padding: 12, backgroundColor: theme.colors.accentSoft, color: "#176B59", borderRadius: 8, lineHeight: 21 }, error: { backgroundColor: "#FFF0F0", color: "#A52B2B" },
  historyRow: { borderTopWidth: 1, borderColor: theme.colors.border, paddingVertical: 12, gap: 4 },
});
