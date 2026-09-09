import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
    Animated,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
    useWindowDimensions,
} from "react-native";

import { theme } from "../constants/theme";

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

type Step = 0 | 1 | 2;

type RegistrationData = {
  account: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
  };

  physiological: {
    gender: "male" | "female" | "prefer_not_to_say" | "";
    birthDate: string;
    weightKg: string;
    primarySport: "cycling";
    trainingHistory: "beginner" | "intermediate" | "advanced" | "pro" | "";
    weeklyVolume: "1-5" | "6-12" | "12+" | "";
  };

  powerProfile: {
    oneMinuteWatts: string;
    fiveMinuteWatts: string;
    twelveMinuteWatts: string;
    maximalEffortsConfirmed: boolean;
  };
};

type StepProps = {
  data: RegistrationData;
  setData: React.Dispatch<React.SetStateAction<RegistrationData>>;
};

/* -------------------------------------------------------------------------- */
/*                              Initial Form Data                             */
/* -------------------------------------------------------------------------- */

const initialRegistrationData: RegistrationData = {
  account: {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  },

  physiological: {
    gender: "",
    birthDate: "",
    weightKg: "",
    primarySport: "cycling",
    trainingHistory: "",
    weeklyVolume: "",
  },

  powerProfile: {
    oneMinuteWatts: "",
    fiveMinuteWatts: "",
    twelveMinuteWatts: "",
    maximalEffortsConfirmed: false,
  },
};

/* -------------------------------------------------------------------------- */
/*                              Register Screen                               */
/* -------------------------------------------------------------------------- */

export default function RegisterScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 700;

  const [step, setStep] = useState<Step>(0);
  const [data, setData] = useState<RegistrationData>(
    initialRegistrationData
  );

  const opacity = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;

  /* ------------------------------- Validation ------------------------------ */

  const emailValid = useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      data.account.email.trim()
    );
  }, [data.account.email]);

  const passwordChecks = useMemo(() => {
    const password = data.account.password;

    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    };
  }, [data.account.password]);

  const passwordStrong =
    Object.values(passwordChecks).every(Boolean);

  const passwordsMatch =
    data.account.password.length > 0 &&
    data.account.password === data.account.confirmPassword;

  const accountValid =
    data.account.firstName.trim().length > 0 &&
    data.account.lastName.trim().length > 0 &&
    emailValid &&
    passwordStrong &&
    passwordsMatch;

  const physiologicalValid =
    data.physiological.gender !== "" &&
    data.physiological.birthDate !== "" &&
    Number(data.physiological.weightKg) > 0 &&
    data.physiological.trainingHistory !== "" &&
    data.physiological.weeklyVolume !== "";

  const powerValid =
    Number(data.powerProfile.oneMinuteWatts) > 0 &&
    Number(data.powerProfile.fiveMinuteWatts) > 0 &&
    Number(data.powerProfile.twelveMinuteWatts) > 0 &&
    data.powerProfile.maximalEffortsConfirmed;

  /* ------------------------------- Animation ------------------------------- */

  const animateToStep = (
    nextStep: Step,
    direction: 1 | -1 = 1
  ) => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: Platform.OS !== "web",
      }),

      Animated.timing(translateX, {
        toValue: -24 * direction,
        duration: 150,
        useNativeDriver: Platform.OS !== "web",
      }),
    ]).start(() => {
      setStep(nextStep);

      translateX.setValue(24 * direction);

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 210,
          useNativeDriver: Platform.OS !== "web",
        }),

        Animated.timing(translateX, {
          toValue: 0,
          duration: 210,
          useNativeDriver: Platform.OS !== "web",
        }),
      ]).start();
    });
  };

  /* -------------------------------- Submit -------------------------------- */

  const handleSubmit = () => {
    const payload = {
      account: {
        firstName: data.account.firstName.trim(),
        lastName: data.account.lastName.trim(),
        email: data.account.email.trim().toLowerCase(),
        password: data.account.password,
      },

      physiological: {
        gender: data.physiological.gender,
        birthDate: data.physiological.birthDate,
        weightKg: Number(data.physiological.weightKg),
        primarySport: data.physiological.primarySport,
        trainingHistory: data.physiological.trainingHistory,
        weeklyVolume: data.physiological.weeklyVolume,
      },

      powerProfile: {
        oneMinuteWatts: Number(
          data.powerProfile.oneMinuteWatts
        ),
        fiveMinuteWatts: Number(
          data.powerProfile.fiveMinuteWatts
        ),
        twelveMinuteWatts: Number(
          data.powerProfile.twelveMinuteWatts
        ),
        maximalEffortsConfirmed:
          data.powerProfile.maximalEffortsConfirmed,
      },
    };

    console.log("Registration payload:", payload);

    /*
      BACKEND LATER:

      await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    */

    router.replace("/dashboard");
  };

  /* -------------------------------- Render -------------------------------- */

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.contentContainer,
              isMobile && styles.contentContainerMobile,
            ]}
          >
            {/* HEADER */}

            <View style={styles.header}>
              <Pressable onPress={() => router.push("/")}>
                <Text style={styles.logo}>VECTOR</Text>
              </Pressable>
            </View>

            {/* PROGRESS */}

            <ProgressIndicator step={step} />

            {/* FORM */}

            <Animated.View
              style={[
                styles.card,
                isMobile && styles.cardMobile,
                {
                  opacity,
                  transform: [{ translateX }],
                },
              ]}
            >
              {step === 0 && (
                <AccountStep
                  data={data}
                  setData={setData}
                  emailValid={emailValid}
                  passwordChecks={passwordChecks}
                  passwordsMatch={passwordsMatch}
                  valid={accountValid}
                  isMobile={isMobile}
                  onNext={() => animateToStep(1)}
                />
              )}

              {step === 1 && (
                <AthleteStep
                  data={data}
                  setData={setData}
                  valid={physiologicalValid}
                  onBack={() => animateToStep(0, -1)}
                  onNext={() => animateToStep(2)}
                />
              )}

              {step === 2 && (
                <PowerStep
                  data={data}
                  setData={setData}
                  valid={powerValid}
                  onBack={() => animateToStep(1, -1)}
                  onSubmit={handleSubmit}
                />
              )}
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* -------------------------------------------------------------------------- */
/*                            Progress Indicator                              */
/* -------------------------------------------------------------------------- */

function ProgressIndicator({ step }: { step: Step }) {
  const labels = ["Account", "Athlete", "Power"];

  return (
    <View style={styles.progressWrapper}>
      <View style={styles.progressRow}>
        {labels.map((label, index) => {
          const completed = index < step;
          const active = index === step;

          return (
            <React.Fragment key={label}>
              <View style={styles.progressItem}>
                <View
                  style={[
                    styles.progressCircle,
                    active && styles.progressCircleActive,
                    completed &&
                      styles.progressCircleCompleted,
                  ]}
                >
                  <Text
                    style={[
                      styles.progressNumber,
                      active && styles.progressNumberActive,
                      completed &&
                        styles.progressNumberCompleted,
                    ]}
                  >
                    {completed ? "✓" : index + 1}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.progressLabel,
                    active && styles.progressLabelActive,
                    completed &&
                      styles.progressLabelCompleted,
                  ]}
                >
                  {label}
                </Text>
              </View>

              {index < labels.length - 1 && (
                <View
                  style={[
                    styles.progressLine,
                    completed &&
                      styles.progressLineCompleted,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Step One                                    */
/* -------------------------------------------------------------------------- */

function AccountStep({
  data,
  setData,
  emailValid,
  passwordChecks,
  passwordsMatch,
  valid,
  isMobile,
  onNext,
}: StepProps & {
  emailValid: boolean;
  passwordChecks: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
  passwordsMatch: boolean;
  valid: boolean;
  isMobile: boolean;
  onNext: () => void;
}) {
  const updateAccount = (
    field: keyof RegistrationData["account"],
    value: string
  ) => {
    setData((prev) => ({
      ...prev,
      account: {
        ...prev.account,
        [field]: value,
      },
    }));
  };

  return (
    <>
      <Text style={styles.eyebrow}>STEP 1 OF 3</Text>

      <Text style={styles.title}>Create your profile</Text>

      <Text style={styles.subtitle}>
        Your training starts with understanding you.
      </Text>

      <View
        style={[
          styles.nameRow,
          isMobile && styles.nameRowMobile,
        ]}
      >
        <View style={styles.nameField}>
          <FormInput
            label="First name"
            value={data.account.firstName}
            onChangeText={(value) =>
              updateAccount("firstName", value)
            }
            placeholder="First"
            autoCapitalize="words"
          />
        </View>

        <View style={styles.nameField}>
          <FormInput
            label="Last name"
            value={data.account.lastName}
            onChangeText={(value) =>
              updateAccount("lastName", value)
            }
            placeholder="Last"
            autoCapitalize="words"
          />
        </View>
      </View>

      <FormInput
        label="Email"
        value={data.account.email}
        onChangeText={(value) =>
          updateAccount("email", value)
        }
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      {data.account.email.length > 0 && !emailValid && (
        <Text style={styles.errorText}>
          Enter a valid email address.
        </Text>
      )}

      <FormInput
        label="Password"
        value={data.account.password}
        onChangeText={(value) =>
          updateAccount("password", value)
        }
        placeholder="Create a password"
        secureTextEntry
        allowPasswordToggle
        autoCapitalize="none"
        autoCorrect={false}
      />

      {data.account.password.length > 0 && (
        <View style={styles.requirements}>
          <Requirement
            met={passwordChecks.length}
            text="At least 8 characters"
          />

          <Requirement
            met={passwordChecks.uppercase}
            text="One uppercase letter"
          />

          <Requirement
            met={passwordChecks.lowercase}
            text="One lowercase letter"
          />

          <Requirement
            met={passwordChecks.number}
            text="One number"
          />

          <Requirement
            met={passwordChecks.special}
            text="One special character"
          />
        </View>
      )}

      <FormInput
        label="Confirm password"
        value={data.account.confirmPassword}
        onChangeText={(value) =>
          updateAccount("confirmPassword", value)
        }
        placeholder="Repeat your password"
        secureTextEntry
        allowPasswordToggle
        autoCapitalize="none"
        autoCorrect={false}
      />

      {data.account.confirmPassword.length > 0 &&
        !passwordsMatch && (
          <Text style={styles.errorText}>
            Passwords do not match.
          </Text>
        )}

      <PrimaryButton
        label="Continue"
        disabled={!valid}
        onPress={onNext}
      />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Step Two                                    */
/* -------------------------------------------------------------------------- */

function AthleteStep({
  data,
  setData,
  valid,
  onBack,
  onNext,
}: StepProps & {
  valid: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  const updatePhys = (
    field: keyof RegistrationData["physiological"],
    value: any
  ) => {
    setData((prev) => ({
      ...prev,
      physiological: {
        ...prev.physiological,
        [field]: value,
      },
    }));
  };

  return (
    <>
      <Text style={styles.eyebrow}>STEP 2 OF 3</Text>

      <Text style={styles.title}>
        Tell us about yourself
      </Text>

      <Text style={styles.subtitle}>
        We use this information to understand your current
        training background and scale your training appropriately.
      </Text>

      <Text style={styles.label}>Gender</Text>

      <OptionRow
        options={[
          {
            label: "Male",
            value: "male",
          },
          {
            label: "Female",
            value: "female",
          },
          {
            label: "Prefer not to say",
            value: "prefer_not_to_say",
          },
        ]}
        selected={data.physiological.gender}
        onSelect={(value) =>
          updatePhys("gender", value)
        }
      />

      <BirthdayPicker
        value={data.physiological.birthDate}
        onChange={(value) =>
          updatePhys("birthDate", value)
        }
      />

      <FormInput
        label="Weight"
        value={data.physiological.weightKg}
        onChangeText={(value) =>
          updatePhys(
            "weightKg",
            sanitizeDecimal(value)
          )
        }
        placeholder="70.0"
        keyboardType="decimal-pad"
        rightLabel="kg"
      />

      <Text style={styles.label}>
        Primary sport
      </Text>

      <View style={styles.lockedOption}>
        <View>
          <Text style={styles.lockedOptionText}>
            Cycling
          </Text>

          <Text style={styles.lockedOptionSubtext}>
            More sports coming later
          </Text>
        </View>

        <View style={styles.sportIndicator}>
          <Text style={styles.sportIndicatorText}>
            ✓
          </Text>
        </View>
      </View>

      <Text style={styles.label}>
        Training history
      </Text>

      <OptionColumn
        options={[
          {
            value: "beginner",
            title: "Beginner",
            subtitle: "New to structured training",
          },
          {
            value: "intermediate",
            title: "Intermediate",
            subtitle:
              "Some experience with structured training",
          },
          {
            value: "advanced",
            title: "Advanced",
            subtitle:
              "Experienced competitive athlete",
          },
          {
            value: "pro",
            title: "Pro",
            subtitle:
              "Professional or elite-level training",
          },
        ]}
        selected={
          data.physiological.trainingHistory
        }
        onSelect={(value) =>
          updatePhys("trainingHistory", value)
        }
      />

      <Text style={styles.label}>
        Average weekly training — past month
      </Text>

      <OptionRow
        options={[
          {
            label: "1–5 h",
            value: "1-5",
          },
          {
            label: "6–12 h",
            value: "6-12",
          },
          {
            label: "12+ h",
            value: "12+",
          },
        ]}
        selected={data.physiological.weeklyVolume}
        onSelect={(value) =>
          updatePhys("weeklyVolume", value)
        }
      />

      <NavigationButtons
        onBack={onBack}
        onNext={onNext}
        nextDisabled={!valid}
      />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Birthday Picker                               */
/* -------------------------------------------------------------------------- */

function BirthdayPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [showPicker, setShowPicker] =
    useState(false);

  const selectedDate = value
    ? new Date(`${value}T12:00:00`)
    : new Date(2000, 0, 1);

  const today = new Date();

  const maxDate = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(
    today.getDate()
  ).padStart(2, "0")}`;

  const handleNativeChange = (
    _event: any,
    date?: Date
  ) => {
    if (Platform.OS !== "ios") {
      setShowPicker(false);
    }

    if (!date) return;

    const year = date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      date.getDate()
    ).padStart(2, "0");

    onChange(`${year}-${month}-${day}`);
  };

  /* ---------------------------------- Web --------------------------------- */

  if (Platform.OS === "web") {
    return (
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Birthday
        </Text>

        <input
          type="date"
          value={value}
          max={maxDate}
          onChange={(event) =>
            onChange(event.target.value)
          }
          style={{
            minHeight: 56,
            width: "100%",
            boxSizing: "border-box",
            backgroundColor: "#FAFBF9",
            border: "1.5px solid #D6DAD5",
            borderRadius: theme.radius.md,
            padding: "0 16px",
            color: theme.colors.text,
            fontSize: 16,
            fontFamily: "inherit",
            outline: "none",
            colorScheme: "light",
          }}
        />
      </View>
    );
  }

  /* ------------------------------ iOS/Android ----------------------------- */

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>
        Birthday
      </Text>

      <Pressable
        style={styles.dateButton}
        onPress={() => setShowPicker(true)}
      >
        <Text
          style={[
            styles.dateButtonText,
            !value && styles.datePlaceholder,
          ]}
        >
          {value
            ? selectedDate.toLocaleDateString(
                "en-US",
                {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                }
              )
            : "Select your birthday"}
        </Text>

        <Text style={styles.dateIcon}>▾</Text>
      </Pressable>

      {showPicker && (
        <View style={styles.datePickerContainer}>
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={
              Platform.OS === "ios"
                ? "spinner"
                : "default"
            }
            onChange={handleNativeChange}
            maximumDate={today}
          />

          {Platform.OS === "ios" && (
            <Pressable
              style={styles.dateDoneButton}
              onPress={() =>
                setShowPicker(false)
              }
            >
              <Text style={styles.dateDoneText}>
                Done
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Step Three                                   */
/* -------------------------------------------------------------------------- */

function PowerStep({
  data,
  setData,
  valid,
  onBack,
  onSubmit,
}: StepProps & {
  valid: boolean;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const weight = Number(
    data.physiological.weightKg
  );

  const updatePower = (
    field: keyof RegistrationData["powerProfile"],
    value: any
  ) => {
    setData((prev) => ({
      ...prev,
      powerProfile: {
        ...prev.powerProfile,
        [field]: value,
      },
    }));
  };

  const wattsPerKg = (watts: string) => {
    const power = Number(watts);

    if (!weight || !power) {
      return null;
    }

    return (power / weight).toFixed(2);
  };

  return (
    <>
      <Text style={styles.eyebrow}>
        STEP 3 OF 3
      </Text>

      <Text style={styles.title}>
        Build your power profile
      </Text>

      <Text style={styles.subtitle}>
        Your recent maximal efforts help Vector
        understand your current power-duration profile.
      </Text>

      <View style={styles.infoBox}>
        <View style={styles.infoMarker} />

        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>
            For accurate results
          </Text>

          <Text style={styles.infoText}>
            Enter your best absolute all-out efforts
            from the past 42 days. Do not enter a
            normal interval or estimated training
            value.
          </Text>
        </View>
      </View>

      <PowerInput
        label="1 MINUTE POWER"
        description="Short-duration / anaerobic capacity"
        value={
          data.powerProfile.oneMinuteWatts
        }
        onChange={(value) =>
          updatePower(
            "oneMinuteWatts",
            sanitizeInteger(value)
          )
        }
        wattsPerKg={wattsPerKg(
          data.powerProfile.oneMinuteWatts
        )}
      />

      <PowerInput
        label="5 MINUTE POWER"
        description="VO₂-range aerobic power"
        value={
          data.powerProfile.fiveMinuteWatts
        }
        onChange={(value) =>
          updatePower(
            "fiveMinuteWatts",
            sanitizeInteger(value)
          )
        }
        wattsPerKg={wattsPerKg(
          data.powerProfile.fiveMinuteWatts
        )}
      />

      <PowerInput
        label="12 MINUTE POWER"
        description="Sustained aerobic power"
        value={
          data.powerProfile.twelveMinuteWatts
        }
        onChange={(value) =>
          updatePower(
            "twelveMinuteWatts",
            sanitizeInteger(value)
          )
        }
        wattsPerKg={wattsPerKg(
          data.powerProfile.twelveMinuteWatts
        )}
      />

      <Pressable
        style={styles.checkboxRow}
        onPress={() =>
          updatePower(
            "maximalEffortsConfirmed",
            !data.powerProfile
              .maximalEffortsConfirmed
          )
        }
      >
        <View
          style={[
            styles.checkbox,
            data.powerProfile
              .maximalEffortsConfirmed &&
              styles.checkboxChecked,
          ]}
        >
          {data.powerProfile
            .maximalEffortsConfirmed && (
            <Text style={styles.checkmark}>
              ✓
            </Text>
          )}
        </View>

        <Text style={styles.checkboxText}>
          I confirm these efforts were completed
          within the past 42 days and represent
          maximal efforts.
        </Text>
      </Pressable>

      <NavigationButtons
        onBack={onBack}
        onNext={onSubmit}
        nextLabel="Create profile"
        nextDisabled={!valid}
      />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Form Input                                  */
/* -------------------------------------------------------------------------- */

function FormInput({
  label,
  rightLabel,
  allowPasswordToggle = false,
  ...props
}: React.ComponentProps<typeof TextInput> & {
  label: string;
  rightLabel?: string;
  allowPasswordToggle?: boolean;
}) {
  const [passwordVisible, setPasswordVisible] =
    useState(false);

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>
        {label}
      </Text>

      <View style={styles.inputWrapper}>
        <TextInput
          {...props}
          secureTextEntry={
            allowPasswordToggle
              ? !passwordVisible
              : props.secureTextEntry
          }
          style={styles.input}
          placeholderTextColor="#A7ADA9"
        />

        {allowPasswordToggle && (
          <Pressable
            onPress={() =>
              setPasswordVisible(
                (previous) => !previous
              )
            }
            style={styles.passwordToggle}
          >
            <Text
              style={styles.passwordToggleText}
            >
              {passwordVisible
                ? "Hide"
                : "Show"}
            </Text>
          </Pressable>
        )}

        {rightLabel && (
          <Text
            style={styles.inputRightLabel}
          >
            {rightLabel}
          </Text>
        )}
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                         Password Requirement                               */
/* -------------------------------------------------------------------------- */

function Requirement({
  met,
  text,
}: {
  met: boolean;
  text: string;
}) {
  return (
    <Text
      style={[
        styles.requirementText,
        met && styles.requirementMet,
      ]}
    >
      {met ? "✓" : "○"} {text}
    </Text>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Option Row                                  */
/* -------------------------------------------------------------------------- */

function OptionRow({
  options,
  selected,
  onSelect,
}: {
  options: {
    label: string;
    value: string;
  }[];
  selected: string;
  onSelect: (value: any) => void;
}) {
  return (
    <View style={styles.optionRow}>
      {options.map((option) => {
        const active =
          selected === option.value;

        return (
          <Pressable
            key={option.value}
            style={[
              styles.optionButton,
              active &&
                styles.optionButtonActive,
            ]}
            onPress={() =>
              onSelect(option.value)
            }
          >
            <Text
              style={[
                styles.optionText,
                active &&
                  styles.optionTextActive,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Option Column                                */
/* -------------------------------------------------------------------------- */

function OptionColumn({
  options,
  selected,
  onSelect,
}: {
  options: {
    value: string;
    title: string;
    subtitle: string;
  }[];
  selected: string;
  onSelect: (value: any) => void;
}) {
  return (
    <View style={styles.optionColumn}>
      {options.map((option) => {
        const active =
          selected === option.value;

        return (
          <Pressable
            key={option.value}
            style={[
              styles.historyOption,
              active &&
                styles.historyOptionActive,
            ]}
            onPress={() =>
              onSelect(option.value)
            }
          >
            <Text
              style={[
                styles.historyTitle,
                active &&
                  styles.historyTitleActive,
              ]}
            >
              {option.title}
            </Text>

            <Text
              style={
                styles.historySubtitle
              }
            >
              {option.subtitle}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Power Input                                 */
/* -------------------------------------------------------------------------- */

function PowerInput({
  label,
  description,
  value,
  onChange,
  wattsPerKg,
}: {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
  wattsPerKg: string | null;
}) {
  return (
    <View style={styles.powerCard}>
      <View style={styles.powerCardTop}>
        <View style={styles.powerCardHeading}>
          <Text style={styles.powerLabel}>
            {label}
          </Text>

          <Text
            style={styles.powerDescription}
          >
            {description}
          </Text>
        </View>

        {wattsPerKg && (
          <View style={styles.wkgPill}>
            <Text style={styles.wkg}>
              {wattsPerKg} W/kg
            </Text>
          </View>
        )}
      </View>

      <View
        style={styles.powerInputWrapper}
      >
        <TextInput
          value={value}
          onChangeText={onChange}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor="#A7ADA9"
          style={styles.powerInput}
        />

        <Text style={styles.powerUnit}>
          W
        </Text>
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Buttons                                     */
/* -------------------------------------------------------------------------- */

function PrimaryButton({
  label,
  disabled,
  onPress,
}: {
  label: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        disabled &&
          styles.primaryButtonDisabled,
        pressed &&
          !disabled &&
          styles.primaryButtonPressed,
      ]}
    >
      <Text
        style={[
          styles.primaryButtonText,
          disabled &&
            styles.primaryButtonTextDisabled,
        ]}
      >
        {label} →
      </Text>
    </Pressable>
  );
}

function NavigationButtons({
  onBack,
  onNext,
  nextDisabled,
  nextLabel = "Continue",
}: {
  onBack: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
}) {
  return (
    <View style={styles.navigationRow}>
      <Pressable
        style={styles.secondaryButton}
        onPress={onBack}
      >
        <Text
          style={styles.secondaryButtonText}
        >
          ← Back
        </Text>
      </Pressable>

      <View
        style={styles.navigationPrimary}
      >
        <PrimaryButton
          label={nextLabel}
          disabled={nextDisabled}
          onPress={onNext}
        />
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Sanitization                                  */
/* -------------------------------------------------------------------------- */

function sanitizeInteger(value: string) {
  return value.replace(/[^0-9]/g, "");
}

function sanitizeDecimal(value: string) {
  const cleaned =
    value.replace(/[^0-9.]/g, "");

  const parts = cleaned.split(".");

  if (parts.length <= 1) {
    return cleaned;
  }

  return `${parts[0]}.${parts
    .slice(1)
    .join("")}`;
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  container: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: theme.spacing.xxl,
  },

  contentContainer: {
    width: "100%",
    maxWidth: 1100,
    alignSelf: "center",
    paddingHorizontal: 32,
  },

  contentContainerMobile: {
    paddingHorizontal: 18,
  },

  /* -------------------------------- Header -------------------------------- */

  header: {
    height: 92,
    flexDirection: "row",
    alignItems: "center",
  },

  logo: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 4,
  },

  /* ------------------------------- Progress ------------------------------- */

  progressWrapper: {
    marginBottom: theme.spacing.lg,
  },

  progressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  progressItem: {
    alignItems: "center",
  },

  progressCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#F1F2F0",

    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  progressCircleActive: {
    backgroundColor: theme.colors.accentSoft,
    borderColor: theme.colors.accent,
  },

  progressCircleCompleted: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },

  progressNumber: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },

  progressNumberActive: {
    color: theme.colors.accent,
  },

  progressNumberCompleted: {
    color: theme.colors.white,
  },

  progressLabel: {
    marginTop: 7,

    color: theme.colors.textSecondary,

    fontSize: 11,
    fontWeight: "600",
  },

  progressLabelActive: {
    color: theme.colors.accent,
    fontWeight: "700",
  },

  progressLabelCompleted: {
    color: theme.colors.text,
  },

  progressLine: {
    flex: 1,
    height: 2,

    marginHorizontal: 12,
    marginTop: 16,

    backgroundColor: theme.colors.border,
  },

  progressLineCompleted: {
    backgroundColor: theme.colors.accent,
  },

  /* -------------------------------- Card ---------------------------------- */

  card: {
    width: "100%",

    backgroundColor: theme.colors.surface,

    borderWidth: 1,
    borderColor: theme.colors.border,

    borderRadius: theme.radius.lg,

    padding: 38,
  },

  cardMobile: {
    padding: 22,
  },

  /* ------------------------------- Headings ------------------------------- */

  eyebrow: {
    color: theme.colors.accent,

    fontSize: 11,
    fontWeight: "700",

    letterSpacing: 1.5,

    marginBottom: 12,
  },

  title: {
    color: theme.colors.text,

    fontSize: theme.typography.h1,
    lineHeight: 50,

    fontWeight: "700",

    letterSpacing: -1.6,
  },

  subtitle: {
    maxWidth: 700,

    color: theme.colors.textSecondary,

    fontSize: 17,
    lineHeight: 24,

    marginTop: 10,
    marginBottom: 32,
  },

  /* -------------------------------- Forms --------------------------------- */

  nameRow: {
    flexDirection: "row",
    gap: 14,
  },

  nameRowMobile: {
    flexDirection: "column",
    gap: 0,
  },

  nameField: {
    flex: 1,
  },

  inputGroup: {
    marginBottom: 20,
  },

  label: {
    color: theme.colors.textSecondary,

    fontSize: 13,
    fontWeight: "600",

    marginBottom: 8,
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#FAFBF9",

    borderWidth: 1.5,
    borderColor: "#D6DAD5",

    borderRadius: theme.radius.md,
  },

  input: {
    flex: 1,

    minHeight: 56,

    paddingHorizontal: theme.spacing.md,

    color: theme.colors.text,

    fontSize: 16,
  },

  inputRightLabel: {
    color: theme.colors.textSecondary,

    paddingHorizontal: theme.spacing.md,

    fontSize: 13,
    fontWeight: "600",
  },

  passwordToggle: {
    minHeight: 56,

    paddingHorizontal: theme.spacing.md,

    justifyContent: "center",
  },

  passwordToggleText: {
    color: theme.colors.accent,

    fontSize: 12,
    fontWeight: "700",
  },

  errorText: {
    color: "#D95C5C",

    fontSize: 12,

    marginTop: -10,
    marginBottom: 16,
  },

  /* -------------------------- Password Requirements ----------------------- */

  requirements: {
    marginTop: -8,
    marginBottom: 20,
  },

  requirementText: {
    color: "#A7ADA9",

    fontSize: 12,
    lineHeight: 21,
  },

  requirementMet: {
    color: theme.colors.accent,
  },

  /* ------------------------------ Option Row ------------------------------ */

  optionRow: {
    flexDirection: "row",
    gap: 8,

    marginBottom: 24,
  },

  optionButton: {
    flex: 1,

    minHeight: 50,

    paddingHorizontal: 8,

    justifyContent: "center",
    alignItems: "center",

    backgroundColor: "#FAFBF9",

    borderWidth: 1,
    borderColor: "#D6DAD5",

    borderRadius: theme.radius.md,
  },

  optionButtonActive: {
    backgroundColor: theme.colors.accentSoft,
    borderColor: theme.colors.accent,
  },

  optionText: {
    color: theme.colors.textSecondary,

    fontSize: 12,
    fontWeight: "600",

    textAlign: "center",
  },

  optionTextActive: {
    color: theme.colors.accent,
    fontWeight: "700",
  },

  /* ------------------------------- Cycling -------------------------------- */

  lockedOption: {
    flexDirection: "row",

    justifyContent: "space-between",
    alignItems: "center",

    padding: 16,

    marginBottom: 24,

    backgroundColor: "#FAFBF9",

    borderWidth: 1,
    borderColor: "#D6DAD5",

    borderRadius: theme.radius.md,
  },

  lockedOptionText: {
    color: theme.colors.text,

    fontSize: 15,
    fontWeight: "700",
  },

  lockedOptionSubtext: {
    color: theme.colors.textSecondary,

    fontSize: 12,

    marginTop: 3,
  },

  sportIndicator: {
    width: 28,
    height: 28,

    borderRadius: 14,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: theme.colors.accentSoft,
  },

  sportIndicatorText: {
    color: theme.colors.accent,

    fontSize: 13,
    fontWeight: "800",
  },

  /* --------------------------- Training History --------------------------- */

  optionColumn: {
    gap: 8,

    marginBottom: 24,
  },

  historyOption: {
    padding: 15,

    backgroundColor: "#FAFBF9",

    borderWidth: 1,
    borderColor: "#D6DAD5",

    borderRadius: theme.radius.md,
  },

  historyOptionActive: {
    backgroundColor: theme.colors.accentSoft,
    borderColor: theme.colors.accent,
  },

  historyTitle: {
    color: theme.colors.text,

    fontSize: 14,
    fontWeight: "700",
  },

  historyTitleActive: {
    color: theme.colors.accent,
  },

  historySubtitle: {
    marginTop: 3,

    color: theme.colors.textSecondary,

    fontSize: 12,
  },

  /* ---------------------------- Birthday Picker --------------------------- */

  dateButton: {
    minHeight: 56,

    flexDirection: "row",

    alignItems: "center",
    justifyContent: "space-between",

    paddingHorizontal: theme.spacing.md,

    backgroundColor: "#FAFBF9",

    borderWidth: 1.5,
    borderColor: "#D6DAD5",

    borderRadius: theme.radius.md,
  },

  dateButtonText: {
    color: theme.colors.text,
    fontSize: 16,
  },

  datePlaceholder: {
    color: "#A7ADA9",
  },

  dateIcon: {
    color: theme.colors.accent,

    fontSize: 16,
  },

  datePickerContainer: {
    marginTop: 8,

    padding: 10,

    backgroundColor: theme.colors.surface,

    borderWidth: 1,
    borderColor: theme.colors.border,

    borderRadius: theme.radius.md,
  },

  dateDoneButton: {
    alignSelf: "flex-end",

    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  dateDoneText: {
    color: theme.colors.accent,

    fontSize: 14,
    fontWeight: "700",
  },

  /* ------------------------------- Info Box ------------------------------- */

  infoBox: {
    flexDirection: "row",

    padding: 18,

    marginBottom: 20,

    backgroundColor: theme.colors.accentSoft,

    borderRadius: theme.radius.md,
  },

  infoMarker: {
    width: 3,

    marginRight: 14,

    borderRadius: theme.radius.pill,

    backgroundColor: theme.colors.accent,
  },

  infoContent: {
    flex: 1,
  },

  infoTitle: {
    color: theme.colors.accent,

    fontSize: 12,
    fontWeight: "700",

    letterSpacing: 0.3,

    marginBottom: 5,
  },

  infoText: {
    color: theme.colors.textSecondary,

    fontSize: 13,
    lineHeight: 20,
  },

  /* ------------------------------- Power ---------------------------------- */

  powerCard: {
    padding: 18,

    marginBottom: 12,

    backgroundColor: "#FAFBF9",

    borderWidth: 1,
    borderColor: "#D6DAD5",

    borderRadius: theme.radius.md,
  },

  powerCardTop: {
    flexDirection: "row",

    justifyContent: "space-between",
    alignItems: "flex-start",

    gap: 12,
  },

  powerCardHeading: {
    flex: 1,
  },

  powerLabel: {
    color: theme.colors.text,

    fontSize: 12,
    fontWeight: "700",

    letterSpacing: 0.8,
  },

  powerDescription: {
    color: theme.colors.textSecondary,

    fontSize: 12,

    marginTop: 4,
  },

  wkgPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,

    backgroundColor: theme.colors.accentSoft,

    borderRadius: theme.radius.pill,
  },

  wkg: {
    color: theme.colors.accent,

    fontSize: 12,
    fontWeight: "700",
  },

  powerInputWrapper: {
    marginTop: 16,

    flexDirection: "row",
    alignItems: "baseline",
  },

  powerInput: {
    flex: 1,

    color: theme.colors.text,

    fontSize: 30,
    fontWeight: "700",

    paddingVertical: 0,
  },

  powerUnit: {
    color: theme.colors.textSecondary,

    fontSize: 15,
    fontWeight: "600",
  },

  /* ------------------------------- Checkbox ------------------------------- */

  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",

    marginTop: 12,
    marginBottom: 4,
  },

  checkbox: {
    width: 22,
    height: 22,

    marginRight: 11,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: theme.colors.surface,

    borderWidth: 1,
    borderColor: "#D6DAD5",

    borderRadius: 6,
  },

  checkboxChecked: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },

  checkmark: {
    color: theme.colors.white,

    fontWeight: "900",
  },

  checkboxText: {
    flex: 1,

    color: theme.colors.textSecondary,

    fontSize: 12,
    lineHeight: 18,
  },

  /* -------------------------------- Buttons ------------------------------- */

  primaryButton: {
    minHeight: 56,

    justifyContent: "center",
    alignItems: "center",

    paddingHorizontal: 20,

    marginTop: 12,

    backgroundColor: theme.colors.accent,

    borderRadius: theme.radius.md,
  },

  primaryButtonPressed: {
    opacity: 0.85,
  },

  primaryButtonDisabled: {
    backgroundColor: "#D7DAD7",
  },

  primaryButtonText: {
    color: theme.colors.text,

    fontSize: 15,
    fontWeight: "700",
  },

  primaryButtonTextDisabled: {
    color: "#929792",
  },

  navigationRow: {
    flexDirection: "row",
    alignItems: "center",

    gap: 12,

    marginTop: 14,
  },

  navigationPrimary: {
    flex: 1,
  },

  secondaryButton: {
    minHeight: 56,

    justifyContent: "center",

    paddingHorizontal: 12,

    marginTop: 12,
  },

  secondaryButtonText: {
    color: theme.colors.textSecondary,

    fontSize: 14,
    fontWeight: "600",
  },
});