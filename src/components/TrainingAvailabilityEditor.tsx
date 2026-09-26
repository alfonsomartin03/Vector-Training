import Slider from "@react-native-community/slider";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { theme } from "../constants/theme";
import { recommendAvailability, validateAvailability, type Availability } from "../lib/training/prescription";
import type { AthleteData } from "../types/athlete";

const MIN_WEEKLY_HOURS = 3;
const MAX_WEEKLY_HOURS = 35;
const MIN_RIDE_MINUTES = 60;
const MAX_RIDE_MINUTES = 350;
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

type Props = {
  athlete: AthleteData | null;
  value: Availability | null;
  week: string;
  saving: boolean;
  onboarding?: boolean;
  onChange?: (value: Availability) => void;
  onSave: (value: Availability) => Promise<void>;
};

export function TrainingAvailabilityEditor({
  athlete,
  value,
  week,
  saving,
  onboarding = false,
  onChange,
  onSave,
}: Props) {
  const suggested = recommendAvailability(athlete, value?.weekly_minutes ?? 0);
  const [hours, setHours] = useState(() => clamp(
    Math.round((value?.weekly_minutes ?? suggested.weeklyMinutes) / 60),
    MIN_WEEKLY_HOURS,
    MAX_WEEKLY_HOURS,
  ));
  const [maximum, setMaximum] = useState(() => clamp(
    roundToTen(value?.max_session_minutes ?? suggested.maxSessionMinutes),
    MIN_RIDE_MINUTES,
    MAX_RIDE_MINUTES,
  ));
  const [rest, setRest] = useState(value?.rest_days ?? [0, 2, 4].slice(0, suggested.restDays));
  const [recovery, setRecovery] = useState(value?.recovery_week ?? false);
  const [message, setMessage] = useState<string | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const current = availabilityValue(week, hours, maximum, rest, recovery);

  useEffect(() => {
    if (onboarding) onChangeRef.current?.(
      availabilityValue(week, hours, maximum, rest, recovery)
    );
  }, [hours, maximum, onboarding, recovery, rest, week]);

  function toggleRestDay(index: number) {
    setMessage(null);
    setRest((currentRest) => {
      if (currentRest.includes(index)) return currentRest.filter((day) => day !== index);
      if (currentRest.length >= 6) {
        setMessage("Keep at least one day available for training.");
        return currentRest;
      }
      return [...currentRest, index].sort((a, b) => a - b);
    });
  }

  async function submit() {
    setMessage(null);
    const error = validateAvailability(current);
    if (error) {
      setMessage(error);
      return;
    }
    try {
      await onSave(current);
      setMessage("Saved. These settings carry forward until you change them.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save.");
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{onboarding ? "Plan your first week" : "Your weekly availability"}</Text>
      <Text style={styles.copy}>
        {onboarding
          ? "Choose the time you can train, the longest ride that fits your schedule, and the days you want completely free."
          : `${value ? `Using saved settings from week of ${value.week_start}.` : "Set your time budget to get started."} Changes apply to this week and carry forward.`}
      </Text>

      <SliderField
        label="Weekly training time"
        valueLabel={`${hours} hours`}
        minimumValue={MIN_WEEKLY_HOURS}
        maximumValue={MAX_WEEKLY_HOURS}
        step={1}
        value={hours}
        disabled={saving}
        rangeLabel={`${MIN_WEEKLY_HOURS}–${MAX_WEEKLY_HOURS} hours per week`}
        onChange={(next) => { setMessage(null); setHours(next); }}
      />

      <SliderField
        label="Longest ride"
        valueLabel={formatDuration(maximum)}
        minimumValue={MIN_RIDE_MINUTES}
        maximumValue={MAX_RIDE_MINUTES}
        step={10}
        value={maximum}
        disabled={saving}
        rangeLabel={`${formatDuration(MIN_RIDE_MINUTES)}–${formatDuration(MAX_RIDE_MINUTES)}`}
        onChange={(next) => { setMessage(null); setMaximum(next); }}
      />

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionLabel}>Rest days</Text>
        <Text style={styles.valueLabel}>{rest.length} selected</Text>
      </View>
      <Text style={styles.copy}>Tap the days you want completely free. At least one training day remains available.</Text>
      <View style={styles.days}>
        {DAYS.map((name, index) => (
          <Pressable
            key={name}
            disabled={saving}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: rest.includes(index), disabled: saving }}
            accessibilityLabel={`${name} rest day`}
            onPress={() => toggleRestDay(index)}
            style={({ pressed }) => [styles.dayButton, rest.includes(index) && styles.selected, pressed && styles.pressed]}
          >
            <Text style={[styles.dayText, rest.includes(index) && styles.selectedText]}>{name}</Text>
          </Pressable>
        ))}
      </View>

      {!onboarding ? (
        <View style={styles.recoveryRow}>
          <View style={styles.recoveryCopy}>
            <Text style={styles.sectionLabel}>Recovery week</Text>
            <Text style={styles.copy}>Reduce volume and remove focused intervals.</Text>
          </View>
          <Switch accessibilityLabel="Recovery week" value={recovery} disabled={saving} onValueChange={(next) => { setMessage(null); setRecovery(next); }} />
        </View>
      ) : null}

      {!onboarding ? (
        <Pressable accessibilityRole="button" disabled={saving} onPress={submit} style={[styles.saveButton, saving && styles.disabled]}>
          <Text style={styles.saveButtonText}>{saving ? "Saving…" : "Save availability & generate week"}</Text>
        </Pressable>
      ) : null}
      {message ? <Text accessibilityRole="alert" style={styles.message}>{message}</Text> : null}
    </View>
  );
}

function SliderField({ label, valueLabel, minimumValue, maximumValue, step, value, disabled, rangeLabel, onChange }: {
  label: string;
  valueLabel: string;
  minimumValue: number;
  maximumValue: number;
  step: number;
  value: number;
  disabled: boolean;
  rangeLabel: string;
  onChange: (value: number) => void;
}) {
  return (
    <View style={styles.sliderSection}>
      <View style={styles.sectionHeading}>
        <Text style={styles.sectionLabel}>{label}</Text>
        <Text style={styles.valueLabel}>{valueLabel}</Text>
      </View>
      <Slider
        accessibilityLabel={label}
        accessibilityValue={{ min: minimumValue, max: maximumValue, now: value, text: valueLabel }}
        disabled={disabled}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        step={step}
        value={value}
        minimumTrackTintColor={theme.colors.accent}
        maximumTrackTintColor={theme.colors.border}
        thumbTintColor={theme.colors.accent}
        onValueChange={onChange}
        style={styles.slider}
      />
      <Text style={styles.rangeLabel}>{rangeLabel}</Text>
    </View>
  );
}

function availabilityValue(week: string, hours: number, maximum: number, rest: number[], recovery: boolean): Availability {
  const weeklyMinutes = hours * 60;
  return {
    week_start: week,
    weekly_minutes: weeklyMinutes,
    // Retained for database compatibility; onboarding no longer asks a
    // duplicate recent-volume question.
    recent_weekly_minutes: weeklyMinutes,
    max_session_minutes: maximum,
    rest_days: rest,
    recovery_week: recovery,
  };
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!remainder) return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  return `${hours} h ${remainder} min`;
}

function roundToTen(value: number) {
  return Math.round(value / 10) * 10;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

const styles = StyleSheet.create({
  card: { marginTop: 24, padding: 22, gap: 18, borderRadius: 22, backgroundColor: theme.colors.glass, borderWidth: 1, borderColor: theme.colors.glassBorder, boxShadow: theme.shadows.soft },
  title: { fontSize: 20, fontWeight: "700", color: theme.colors.text },
  sectionLabel: { fontSize: 14, fontWeight: "700", color: theme.colors.text },
  valueLabel: { fontSize: 14, fontWeight: "700", color: theme.colors.accent },
  copy: { fontSize: 13, lineHeight: 20, color: theme.colors.textSecondary },
  sliderSection: { gap: 8 },
  sectionHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 },
  slider: { width: "100%", height: 34 },
  rangeLabel: { marginTop: -6, fontSize: 11, color: theme.colors.textSecondary, textAlign: "right" },
  days: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  dayButton: { minWidth: 48, paddingVertical: 11, paddingHorizontal: 12, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, alignItems: "center", backgroundColor: theme.colors.glass },
  dayText: { color: theme.colors.textSecondary, fontWeight: "600" },
  selected: { backgroundColor: theme.colors.accentSoft, borderColor: theme.colors.accent },
  selectedText: { color: theme.colors.text },
  pressed: { opacity: 0.72 },
  recoveryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 },
  recoveryCopy: { flex: 1, gap: 2 },
  saveButton: { padding: 14, borderRadius: 12, alignItems: "center", backgroundColor: theme.colors.accent },
  saveButtonText: { color: theme.colors.background, fontWeight: "800" },
  disabled: { opacity: 0.55 },
  message: { fontSize: 13, lineHeight: 20, color: theme.colors.textSecondary },
});
