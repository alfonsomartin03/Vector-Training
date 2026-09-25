import { useState } from "react";
import { Pressable, Text, TextInput, View, StyleSheet, Switch } from "react-native";
import type { AthleteData } from "../types/athlete";
import { theme } from "../constants/theme";
import { recommendAvailability, validateAvailability, type Availability } from "../lib/training/prescription";

export function TrainingAvailabilityEditor({ athlete, value, week, saving, onSave, onboarding = false, onDirty }: {
  athlete: AthleteData | null; value: Availability | null; week: string; saving: boolean;
  onboarding?: boolean; onDirty?: () => void;
  onSave: (value: Availability) => Promise<void>;
}) {
  const suggested = recommendAvailability(athlete, value?.recent_weekly_minutes ?? 0);
  const [hours, setHours] = useState(value ? String(value.weekly_minutes / 60) : "");
  const [recent, setRecent] = useState(value ? String(value.recent_weekly_minutes / 60) : "");
  const [maximum, setMaximum] = useState(String(value?.max_session_minutes ?? suggested.maxSessionMinutes));
  const [rest, setRest] = useState(value?.rest_days ?? [0, 2, 4].slice(0, suggested.restDays));
  const [recovery, setRecovery] = useState(value?.recovery_week ?? false);
  const [message, setMessage] = useState<string | null>(null);
  const recommendation = recommendAvailability(athlete, Number(recent) * 60);
  function change<T,>(setter: (value: T) => void, next: T) {
    setter(next); setMessage(null); onDirty?.();
  }
  async function submit() {
    setMessage(null);
    if (!hours.trim() || !recent.trim() || !maximum.trim()) { setMessage("Enter available hours, recent hours (0 if unknown), and maximum ride length."); return; }
    const next: Availability = { week_start: week, weekly_minutes: Math.round(Number(hours) * 60), recent_weekly_minutes: Math.round(Number(recent) * 60), max_session_minutes: Number(maximum), rest_days: rest, recovery_week: recovery };
    const error = validateAvailability(next);
    if (error) { setMessage(error); return; }
    try { await onSave(next); setMessage(onboarding ? "Availability added. Continue when you are ready; it will be saved with your profile." : "Saved. These settings carry forward until you change them."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save."); }
  }
  return <View style={styles.card}>
    <Text style={styles.title}>Your weekly availability</Text>
    <Text style={styles.copy}>{onboarding ? "Set your starting schedule. It will be saved with your athlete profile and can be changed weekly on Training." : `${value ? `Using saved settings from week of ${value.week_start}.` : "Set your time budget to get started."} Changes apply to the selected week and carry into later weeks without their own settings.`}</Text>
    <Text style={styles.copy}>Suggested: {recommendation.weeklyMinutes / 60} h/week, {recommendation.restDays} rest days, rides up to {recommendation.maxSessionMinutes} min. {recommendation.explanation}</Text>
    <Field label="Available hours this week (0–30)" value={hours} onChange={value => change(setHours, value)} disabled={saving} />
    <Field label="Average hours ridden per week over the last 4 weeks (0 if unknown)" value={recent} onChange={value => change(setRecent, value)} disabled={saving} />
    <Field label="Maximum minutes per ride (30–360)" value={maximum} onChange={value => change(setMaximum, value)} disabled={saving} />
    <Text style={styles.copy}>Rest days: {rest.length} selected. At least one will be retained.</Text>
    <View style={styles.days}>{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((name, index) => <Pressable key={name} disabled={saving} accessibilityRole="checkbox" accessibilityState={{ checked: rest.includes(index) }} accessibilityLabel={`${name} rest day`} onPress={() => change(setRest, rest.includes(index) ? rest.filter(day => day !== index) : [...rest, index])} style={[styles.button, rest.includes(index) && styles.selected]}><Text>{name}</Text></Pressable>)}</View>
    <Text style={styles.copy}>Recovery week (less volume, no intervals). This also carries forward until switched off.</Text>
    <Switch accessibilityLabel="Recovery week" value={recovery} disabled={saving} onValueChange={value => change(setRecovery, value)} />
    <Pressable accessibilityRole="button" disabled={saving} onPress={() => { change(setHours, String(recommendation.weeklyMinutes / 60)); setMaximum(String(recommendation.maxSessionMinutes)); setRest([0, 2, 4].slice(0, recommendation.restDays)); }} style={styles.button}><Text>Use suggested time and rest days</Text></Pressable>
    <Pressable accessibilityRole="button" disabled={saving} onPress={submit} style={[styles.button, styles.selected]}><Text>{saving ? "Saving…" : onboarding ? "Use these availability settings" : "Save availability & generate week"}</Text></Pressable>
    {message ? <Text accessibilityRole="alert" style={styles.copy}>{message}</Text> : null}
  </View>;
}
function Field({ label, value, onChange, disabled }: { label: string; value: string; onChange: (value: string) => void; disabled: boolean }) {
  return <View><Text style={styles.copy}>{label}</Text><TextInput accessibilityLabel={label} keyboardType="decimal-pad" value={value} onChangeText={onChange} editable={!disabled} style={styles.input} /></View>;
}
const styles = StyleSheet.create({
  card: { marginTop: 24, padding: 22, gap: 14, borderRadius: 22, backgroundColor: theme.colors.glass, borderWidth: 1, borderColor: theme.colors.glassBorder, boxShadow: theme.shadows.soft },
  title: { fontSize: 20, fontWeight: "700", color: theme.colors.text },
  copy: { fontSize: 13, lineHeight: 20, color: theme.colors.textSecondary },
  input: { borderWidth: 1, borderColor: theme.colors.border, padding: 12, borderRadius: 12, color: theme.colors.text, backgroundColor: theme.colors.glassStrong, marginTop: 5 },
  button: { padding: 12, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, alignItems: "center", backgroundColor: theme.colors.glass },
  selected: { backgroundColor: theme.colors.accentSoft, borderColor: theme.colors.accent },
  days: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
