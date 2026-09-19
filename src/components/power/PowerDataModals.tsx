import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { theme } from "../../constants/theme";
import type {
  LactateTestInput,
  PowerProfileUpdate,
  Vo2MaxTestInput,
} from "../../lib/athlete";
import { calculateCriticalPowerFromProfile } from "../../lib/physiology/criticalPower";
import type { LactateTest, PowerProfile, Vo2MaxTest } from "../../types/athlete";

type SharedModalProps = {
  visible: boolean;
  onClose: () => void;
};

type PowerModalProps = SharedModalProps & {
  current: PowerProfile | null;
  onSave: (values: PowerProfileUpdate) => Promise<void>;
};

export function PowerProfileModal({ visible, current, onClose, onSave }: PowerModalProps) {
  const [oneMinute, setOneMinute] = useState(() => String(current?.one_minute_watts ?? ""));
  const [fiveMinute, setFiveMinute] = useState(() => String(current?.five_minute_watts ?? ""));
  const [twelveMinute, setTwelveMinute] = useState(() => String(current?.twelve_minute_watts ?? ""));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    const values = [oneMinute, fiveMinute, twelveMinute].map(Number);
    if (values.some((value) => !Number.isFinite(value) || value <= 0)) {
      setError("Enter a valid positive watt value for every effort.");
      return;
    }
    if (!(values[0] > values[1] && values[1] > values[2])) {
      setError("Power should decrease from 1 minute to 5 minutes to 12 minutes.");
      return;
    }

    try {
      calculateCriticalPowerFromProfile(values[0], values[1], values[2]);
    } catch {
      setError(
        "These efforts do not produce a valid CP model. Confirm that each effort was maximal and entered correctly."
      );
      return;
    }

    await runSave(
      () =>
        onSave({
          one_minute_watts: values[0],
          five_minute_watts: values[1],
          twelve_minute_watts: values[2],
        }),
      setSaving,
      setError,
      onClose
    );
  }

  return (
    <DataModal
      visible={visible}
      title="Update CP test results"
      subtitle="Use recent maximal efforts completed under consistent conditions."
      saving={saving}
      onClose={onClose}
      onSave={submit}
    >
      <Field label="1 minute power" value={oneMinute} onChange={setOneMinute} unit="W" />
      <Field label="5 minute power" value={fiveMinute} onChange={setFiveMinute} unit="W" />
      <Field label="12 minute power" value={twelveMinute} onChange={setTwelveMinute} unit="W" />
      <FormError message={error} />
    </DataModal>
  );
}

type Vo2ModalProps = SharedModalProps & {
  current: Vo2MaxTest | null;
  defaultBodyMass: number | null;
  onSave: (values: Vo2MaxTestInput) => Promise<void>;
};

export function Vo2MaxModal({
  visible,
  current,
  defaultBodyMass,
  onClose,
  onSave,
}: Vo2ModalProps) {
  const [relative, setRelative] = useState(() => stringValue(current?.relative_vo2max));
  const [absolute, setAbsolute] = useState(() => stringValue(current?.absolute_vo2_l_min));
  const [bodyMass, setBodyMass] = useState(() => stringValue(current?.body_mass_kg ?? defaultBodyMass));
  const [testDate, setTestDate] = useState(() => current?.test_date ?? today());
  const [source, setSource] = useState(() => current?.source ?? "Laboratory CPET");
  const [vt1Power, setVt1Power] = useState(() => stringValue(current?.vt1_power_watts));
  const [vt2Power, setVt2Power] = useState(() => stringValue(current?.vt2_power_watts));
  const [maxAerobicPower, setMaxAerobicPower] = useState(() =>
    stringValue(current?.max_aerobic_power_watts)
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    const relativeValue = optionalNumber(relative);
    const absoluteValue = optionalNumber(absolute);
    const bodyMassValue = optionalNumber(bodyMass);

    if (relativeValue === null && absoluteValue === null) {
      setError("Enter an absolute or relative VO₂max value.");
      return;
    }
    if (absoluteValue !== null && bodyMassValue === null && relativeValue === null) {
      setError("Body mass is required to convert an absolute VO₂max value.");
      return;
    }
    if (!validDate(testDate) || !source.trim()) {
      setError("Enter a valid test date and source.");
      return;
    }

    await runSave(
      () =>
        onSave({
          relative_vo2max: relativeValue,
          absolute_vo2_l_min: absoluteValue,
          body_mass_kg: bodyMassValue,
          vt1_power_watts: optionalNumber(vt1Power),
          vt2_power_watts: optionalNumber(vt2Power),
          max_aerobic_power_watts: optionalNumber(maxAerobicPower),
          test_date: testDate,
          source: source.trim(),
        }),
      setSaving,
      setError,
      onClose
    );
  }

  return (
    <DataModal
      visible={visible}
      title="Record measured VO₂max"
      subtitle="A saved laboratory value replaces Vector’s estimate throughout the power model."
      saving={saving}
      onClose={onClose}
      onSave={submit}
    >
      <View style={styles.twoColumns}>
        <Field
          label="Relative VO₂max"
          value={relative}
          onChange={setRelative}
          unit="mL/kg/min"
        />
        <Field label="Absolute VO₂max" value={absolute} onChange={setAbsolute} unit="L/min" />
      </View>
      <View style={styles.twoColumns}>
        <Field label="Body mass at test" value={bodyMass} onChange={setBodyMass} unit="kg" />
        <Field label="Test date" value={testDate} onChange={setTestDate} keyboard="default" />
      </View>
      <Field label="Test source / laboratory" value={source} onChange={setSource} keyboard="default" />

      <Text style={styles.groupTitle}>OPTIONAL CPET METRICS</Text>
      <View style={styles.threeColumns}>
        <Field label="VT1 power" value={vt1Power} onChange={setVt1Power} unit="W" />
        <Field label="VT2 power" value={vt2Power} onChange={setVt2Power} unit="W" />
        <Field
          label="Maximum aerobic power"
          value={maxAerobicPower}
          onChange={setMaxAerobicPower}
          unit="W"
        />
      </View>
      <FormError message={error} />
    </DataModal>
  );
}

type LactateModalProps = SharedModalProps & {
  current: LactateTest | null;
  onSave: (values: LactateTestInput) => Promise<void>;
};

export function LactateModal({ visible, current, onClose, onSave }: LactateModalProps) {
  const [lt1Power, setLt1Power] = useState(() => stringValue(current?.lt1_power_watts));
  const [lt1HeartRate, setLt1HeartRate] = useState(() => stringValue(current?.lt1_heart_rate_bpm));
  const [lt1Lactate, setLt1Lactate] = useState(() => stringValue(current?.lt1_lactate_mmol));
  const [lt2Power, setLt2Power] = useState(() => stringValue(current?.lt2_power_watts));
  const [lt2HeartRate, setLt2HeartRate] = useState(() => stringValue(current?.lt2_heart_rate_bpm));
  const [lt2Lactate, setLt2Lactate] = useState(() => stringValue(current?.lt2_lactate_mmol));
  const [testDate, setTestDate] = useState(() => current?.test_date ?? today());
  const [source, setSource] = useState(() => current?.source ?? "Laboratory lactate test");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    const lt1PowerValue = optionalNumber(lt1Power);
    const lt2PowerValue = optionalNumber(lt2Power);
    if (lt1PowerValue === null && lt2PowerValue === null) {
      setError("Enter power for LT1, LT2, or both thresholds.");
      return;
    }
    if (!validDate(testDate) || !source.trim()) {
      setError("Enter a valid test date and methodology or source.");
      return;
    }

    await runSave(
      () =>
        onSave({
          lt1_power_watts: lt1PowerValue,
          lt1_heart_rate_bpm: optionalNumber(lt1HeartRate),
          lt1_lactate_mmol: optionalNumber(lt1Lactate),
          lt2_power_watts: lt2PowerValue,
          lt2_heart_rate_bpm: optionalNumber(lt2HeartRate),
          lt2_lactate_mmol: optionalNumber(lt2Lactate),
          test_date: testDate,
          source: source.trim(),
        }),
      setSaving,
      setError,
      onClose
    );
  }

  return (
    <DataModal
      visible={visible}
      title="Record lactate thresholds"
      subtitle="LT1 and LT2 can be saved independently. Heart rate and concentration are optional."
      saving={saving}
      onClose={onClose}
      onSave={submit}
    >
      <Text style={styles.groupTitle}>FIRST LACTATE THRESHOLD · LT1</Text>
      <View style={styles.threeColumns}>
        <Field label="Power" value={lt1Power} onChange={setLt1Power} unit="W" />
        <Field label="Heart rate" value={lt1HeartRate} onChange={setLt1HeartRate} unit="bpm" />
        <Field label="Lactate" value={lt1Lactate} onChange={setLt1Lactate} unit="mmol/L" />
      </View>

      <Text style={styles.groupTitle}>SECOND LACTATE THRESHOLD · LT2</Text>
      <View style={styles.threeColumns}>
        <Field label="Power" value={lt2Power} onChange={setLt2Power} unit="W" />
        <Field label="Heart rate" value={lt2HeartRate} onChange={setLt2HeartRate} unit="bpm" />
        <Field label="Lactate" value={lt2Lactate} onChange={setLt2Lactate} unit="mmol/L" />
      </View>

      <View style={styles.twoColumns}>
        <Field label="Test date" value={testDate} onChange={setTestDate} keyboard="default" />
        <Field label="Methodology / source" value={source} onChange={setSource} keyboard="default" />
      </View>
      <FormError message={error} />
    </DataModal>
  );
}

type DataModalProps = SharedModalProps & {
  title: string;
  subtitle: string;
  saving: boolean;
  onSave: () => void;
  children: React.ReactNode;
};

function DataModal({
  visible,
  title,
  subtitle,
  saving,
  onClose,
  onSave,
  children,
}: DataModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.backdrop}
      >
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeading}>
              <Text style={styles.modalTitle}>{title}</Text>
              <Text style={styles.modalSubtitle}>{subtitle}</Text>
            </View>
            <Pressable onPress={onClose} disabled={saving} style={styles.closeButton}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.formContent}
          >
            {children}
          </ScrollView>

          <View style={styles.actions}>
            <Pressable onPress={onClose} disabled={saving} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={onSave}
              disabled={saving}
              style={[styles.saveButton, saving ? styles.disabledButton : undefined]}
            >
              <Text style={styles.saveText}>{saving ? "Saving…" : "Save measurement"}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  unit?: string;
  keyboard?: "decimal-pad" | "default";
};

function Field({ label, value, onChange, unit, keyboard = "decimal-pad" }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputShell}>
        <TextInput
          value={value}
          onChangeText={onChange}
          keyboardType={keyboard}
          placeholder={keyboard === "default" ? "YYYY-MM-DD" : "—"}
          placeholderTextColor="#A3A8A6"
          style={styles.input}
        />
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
    </View>
  );
}

function FormError({ message }: { message: string | null }) {
  return message ? <Text style={styles.error}>{message}</Text> : null;
}

async function runSave(
  save: () => Promise<void>,
  setSaving: (value: boolean) => void,
  setError: (value: string | null) => void,
  onClose: () => void
) {
  try {
    setSaving(true);
    setError(null);
    await save();
    onClose();
  } catch (saveError) {
    console.error("Unable to save physiological data:", saveError);
    setError(saveError instanceof Error ? saveError.message : "Unable to save this measurement.");
  } finally {
    setSaving(false);
  }
}

function optionalNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function stringValue(value: string | number | null | undefined) {
  return value == null ? "" : String(value);
}

function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00`));
}

function today() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(17, 19, 21, 0.48)",
  },
  modalCard: {
    width: "100%",
    maxWidth: 720,
    maxHeight: "92%",
    borderRadius: 22,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 18,
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalHeading: { flex: 1 },
  modalTitle: { color: theme.colors.text, fontSize: 22, fontWeight: "700" },
  modalSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: { color: theme.colors.textSecondary, fontSize: 24, lineHeight: 26 },
  formContent: { padding: 24, gap: 16 },
  twoColumns: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  threeColumns: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  groupTitle: {
    color: theme.colors.accent,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginTop: 8,
  },
  field: { flex: 1, minWidth: 180 },
  fieldLabel: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 7,
  },
  inputShell: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 13,
  },
  input: { flex: 1, color: theme.colors.text, fontSize: 15, paddingVertical: 11 },
  unit: { color: theme.colors.textSecondary, fontSize: 11, marginLeft: 8 },
  error: {
    color: "#A33A3A",
    backgroundColor: "#FFF0F0",
    borderRadius: 10,
    padding: 12,
    fontSize: 12,
    lineHeight: 18,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    padding: 18,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  cancelButton: { paddingHorizontal: 18, paddingVertical: 12 },
  cancelText: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: "600" },
  saveButton: {
    borderRadius: 12,
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  disabledButton: { opacity: 0.55 },
  saveText: { color: theme.colors.white, fontSize: 13, fontWeight: "700" },
});
