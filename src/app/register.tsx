import DateTimePicker from "@react-native-community/datetimepicker";
import type { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
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

import { supabase } from "@/lib/supabase";
import { theme } from "../constants/theme";
import { TrainingAvailabilityEditor } from "../components/TrainingAvailabilityEditor";
import { validateAvailability, weekKey, type Availability } from "../lib/training/prescription";

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

type Step = 0 | 1 | 2;

type RegistrationData = {
  availability: Availability | null;
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
  availability: null,
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

  /*
   * Once Step 1 succeeds, this contains the Supabase Auth user ID.
   *
   * We keep it so Steps 2 and 3 don't need to call signUp again.
   */
  const [createdUserId, setCreatedUserId] =
    useState<string | null>(null);

  /*
   * Separate state for Step 1 account creation.
   */
  const [isCreatingAccount, setIsCreatingAccount] =
    useState(false);

  const [accountError, setAccountError] =
    useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [website, setWebsite] = useState("");
  const [registrationStartedAt] = useState(() => Date.now());

  /*
   * State for final onboarding submission.
   */
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [submitError, setSubmitError] =
    useState<string | null>(null);

  const [opacity] = useState(() => new Animated.Value(1));
  const [translateX] = useState(() => new Animated.Value(0));

  /* ------------------------------------------------------------------------ */
  /*                                Validation                                */
  /* ------------------------------------------------------------------------ */

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
    passwordsMatch &&
    acceptedTerms;

  const physiologicalValid =
    data.physiological.gender !== "" &&
    data.physiological.birthDate !== "" &&
    Number(data.physiological.weightKg) > 0 &&
    data.physiological.trainingHistory !== "" &&
    data.physiological.weeklyVolume !== "" &&
    data.availability !== null && !validateAvailability(data.availability);

  const powerValid =
    Number(data.powerProfile.oneMinuteWatts) > 0 &&
    Number(data.powerProfile.fiveMinuteWatts) > 0 &&
    Number(data.powerProfile.twelveMinuteWatts) > 0 &&
    data.powerProfile.maximalEffortsConfirmed;

  /* ------------------------------------------------------------------------ */
  /*                                Animation                                 */
  /* ------------------------------------------------------------------------ */

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

  /* ------------------------------------------------------------------------ */
  /*                         Step 1 — Create Account                          */
  /* ------------------------------------------------------------------------ */

  const handleAccountStep = async () => {
    if (!accountValid || isCreatingAccount) {
      return;
    }

    /*
     * If Supabase already created the Auth user and the person simply went
     * backwards in onboarding, don't create another account.
     */
    if (createdUserId) {
      animateToStep(1);
      return;
    }

    // A hidden honeypot and minimum interaction time reject common automated
    // submissions without collecting an additional identifier from people.
    if (website || Date.now() - registrationStartedAt < 1200) {
      setAccountError("We couldn't verify this submission. Please wait a moment and try again.");
      return;
    }

    setIsCreatingAccount(true);
    setAccountError(null);

    try {
      const email =
        data.account.email.trim().toLowerCase();

      const {
        data: authData,
        error: authError,
      } = await supabase.auth.signUp({
        email,
        password: data.account.password,
      });

      if (authError) {
        console.error(
          "Supabase sign-up error:",
          authError
        );

        const message =
          authError.message.toLowerCase();

        if (
          message.includes("already") ||
          message.includes("registered") ||
          message.includes("exists")
        ) {
          setAccountError(
            "An account already exists with this email. Try logging in instead."
          );
        } else {
          setAccountError(authError.message);
        }

        return;
      }

      if (!authData.user) {
        setAccountError(
          "We couldn't create your account. Please try again."
        );

        return;
      }

      /*
       * Store the Auth UUID so the remaining onboarding data can be attached
       * to this exact user.
       */
      setCreatedUserId(authData.user.id);

      animateToStep(1);
    } catch (error) {
      console.error(
        "Account creation error:",
        error
      );

      setAccountError(
        "Something went wrong while creating your account. Please try again."
      );
    } finally {
      setIsCreatingAccount(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /*                    Step 3 — Save Athlete Profile                        */
  /* ------------------------------------------------------------------------ */

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    if (!createdUserId) {
      setSubmitError(
        "Your account session could not be found. Please restart registration."
      );

      return;
    }

    if (!physiologicalValid || !powerValid) {
      setSubmitError(
        "Please complete all required fields before creating your profile."
      );

      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const userId = createdUserId;

      /* -------------------------------------------------------------------- */
      /*                         Save Athlete Profile                          */
      /* -------------------------------------------------------------------- */

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: userId,

          first_name:
            data.account.firstName.trim(),

          last_name:
            data.account.lastName.trim(),

          gender:
            data.physiological.gender,

          birth_date:
            data.physiological.birthDate,

          weight_kg: Number(
            data.physiological.weightKg
          ),

          primary_sport:
            data.physiological.primarySport,

          training_history:
            data.physiological.trainingHistory,

          weekly_volume:
            data.physiological.weeklyVolume,
        });

      if (profileError) {
        console.error(
          "Profile creation error:",
          profileError
        );

        setSubmitError(
          "Your account exists, but we couldn't save your athlete profile. Please try again."
        );

        return;
      }

      /* -------------------------------------------------------------------- */
      /*                          Save Power Profile                           */
      /* -------------------------------------------------------------------- */

      // Profile must exist first (FK). Upserts let a failed save be retried
      // without colliding with the profile already created by this submission.
      const { error: availabilityError } = await supabase.from("training_availability")
        .upsert({ ...data.availability!, user_id: userId, week_start: weekKey() }, { onConflict: "user_id,week_start" });
      if (availabilityError) {
        setSubmitError("Your profile exists, but availability could not be saved. Please retry before continuing.");
        return;
      }

      const { error: powerProfileError } =
        await supabase
          .from("power_profiles")
          .insert({
            user_id: userId,

            one_minute_watts: Number(
              data.powerProfile.oneMinuteWatts
            ),

            five_minute_watts: Number(
              data.powerProfile.fiveMinuteWatts
            ),

            twelve_minute_watts: Number(
              data.powerProfile.twelveMinuteWatts
            ),

            maximal_efforts_confirmed:
              data.powerProfile
                .maximalEffortsConfirmed,
          });

      if (powerProfileError) {
        console.error(
          "Power profile creation error:",
          powerProfileError
        );

        setSubmitError(
          "Your athlete profile was saved, but we couldn't save your power profile. Please try again."
        );

        return;
      }

      router.replace("/dashboard");
    } catch (error) {
      console.error(
        "Registration error:",
        error
      );

      setSubmitError(
        "Something went wrong while finishing your profile. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /*                                  Render                                  */
  /* ------------------------------------------------------------------------ */

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={
            styles.scrollContent
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.contentContainer,
              isMobile &&
                styles.contentContainerMobile,
            ]}
          >
            {/* HEADER */}

            <View style={styles.header}>
              <Pressable
                onPress={() =>
                  router.push("/")
                }
              >
                <Text style={styles.logo}>
                  VECTOR
                </Text>
              </Pressable>
            </View>

            {/* PROGRESS */}

            <ProgressIndicator
              step={step}
            />

            {/* FORM */}

            <Animated.View
              style={[
                styles.card,
                isMobile &&
                  styles.cardMobile,
                {
                  opacity,
                  transform: [
                    { translateX },
                  ],
                },
              ]}
            >
              {step === 0 && (
                <AccountStep
                  data={data}
                  setData={setData}
                  emailValid={
                    emailValid
                  }
                  passwordChecks={
                    passwordChecks
                  }
                  passwordsMatch={
                    passwordsMatch
                  }
                  valid={
                    accountValid
                  }
                  isMobile={
                    isMobile
                  }
                  onNext={
                    handleAccountStep
                  }
                  accountError={
                    accountError
                  }
                  isCreatingAccount={
                    isCreatingAccount
                  }
                  accountCreated={
                    Boolean(
                      createdUserId
                    )
                  }
                  acceptedTerms={acceptedTerms}
                  onAcceptedTermsChange={setAcceptedTerms}
                  website={website}
                  onWebsiteChange={setWebsite}
                />
              )}

              {step === 1 && (
                <AthleteStep
                  data={data}
                  setData={setData}
                  valid={
                    physiologicalValid
                  }
                  onBack={() =>
                    animateToStep(
                      0,
                      -1
                    )
                  }
                  onNext={() =>
                    animateToStep(2)
                  }
                />
              )}

              {step === 2 && (
                <PowerStep
                  data={data}
                  setData={setData}
                  valid={powerValid}
                  onBack={() =>
                    animateToStep(
                      1,
                      -1
                    )
                  }
                  onSubmit={
                    handleSubmit
                  }
                  isSubmitting={
                    isSubmitting
                  }
                  submitError={
                    submitError
                  }
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

function ProgressIndicator({
  step,
}: {
  step: Step;
}) {
  const labels = [
    "Account",
    "Athlete",
    "Power",
  ];

  return (
    <View
      style={
        styles.progressWrapper
      }
    >
      <View
        style={styles.progressRow}
      >
        {labels.map(
          (label, index) => {
            const completed =
              index < step;

            const active =
              index === step;

            return (
              <React.Fragment
                key={label}
              >
                <View
                  style={
                    styles.progressItem
                  }
                >
                  <View
                    style={[
                      styles.progressCircle,

                      active &&
                        styles.progressCircleActive,

                      completed &&
                        styles.progressCircleCompleted,
                    ]}
                  >
                    <Text
                      style={[
                        styles.progressNumber,

                        active &&
                          styles.progressNumberActive,

                        completed &&
                          styles.progressNumberCompleted,
                      ]}
                    >
                      {completed
                        ? "✓"
                        : index + 1}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.progressLabel,

                      active &&
                        styles.progressLabelActive,

                      completed &&
                        styles.progressLabelCompleted,
                    ]}
                  >
                    {label}
                  </Text>
                </View>

                {index <
                  labels.length -
                    1 && (
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
          }
        )}
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
  accountError,
  isCreatingAccount,
  accountCreated,
  acceptedTerms,
  onAcceptedTermsChange,
  website,
  onWebsiteChange,
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

  accountError: string | null;

  isCreatingAccount: boolean;

  accountCreated: boolean;
  acceptedTerms: boolean;
  onAcceptedTermsChange: (value: boolean) => void;
  website: string;
  onWebsiteChange: (value: string) => void;
}) {
  const updateAccount = (
    field: keyof RegistrationData["account"],
    value: string
  ) => {
    /*
     * Once the actual Supabase account exists, don't let account credentials
     * diverge from what was sent to Supabase.
     */
    if (accountCreated) {
      return;
    }

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
      <TextInput
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        accessibilityLabel="Website"
        autoComplete="off"
        autoCapitalize="none"
        value={website}
        onChangeText={onWebsiteChange}
        style={styles.honeypot}
      />
      <Text style={styles.eyebrow}>
        STEP 1 OF 3
      </Text>

      <Text style={styles.title}>
        Create your profile
      </Text>

      <Text style={styles.subtitle}>
        Your training starts with understanding you.
      </Text>

      {accountCreated && (
        <View
          style={
            styles.accountCreatedBox
          }
        >
          <Text
            style={
              styles.accountCreatedTitle
            }
          >
            Account created
          </Text>

          <Text
            style={
              styles.accountCreatedText
            }
          >
            Your login has already been secured. Continue to finish setting up your athlete profile.
          </Text>
        </View>
      )}

      <View
        style={[
          styles.nameRow,
          isMobile &&
            styles.nameRowMobile,
        ]}
      >
        <View
          style={styles.nameField}
        >
          <FormInput
            label="First name"
            value={
              data.account.firstName
            }
            onChangeText={(
              value
            ) =>
              updateAccount(
                "firstName",
                value
              )
            }
            placeholder="First"
            autoCapitalize="words"
            maxLength={100}
            editable={
              !accountCreated
            }
          />
        </View>

        <View
          style={styles.nameField}
        >
          <FormInput
            label="Last name"
            value={
              data.account.lastName
            }
            onChangeText={(
              value
            ) =>
              updateAccount(
                "lastName",
                value
              )
            }
            placeholder="Last"
            autoCapitalize="words"
            maxLength={100}
            editable={
              !accountCreated
            }
          />
        </View>
      </View>

      <FormInput
        label="Email"
        value={data.account.email}
        onChangeText={(value) =>
          updateAccount(
            "email",
            value
          )
        }
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={254}
        editable={!accountCreated}
      />

      {data.account.email.length >
        0 &&
        !emailValid && (
          <Text
            style={
              styles.errorText
            }
          >
            Enter a valid email address.
          </Text>
        )}

      <FormInput
        label="Password"
        value={
          data.account.password
        }
        onChangeText={(value) =>
          updateAccount(
            "password",
            value
          )
        }
        placeholder="Create a password"
        secureTextEntry
        allowPasswordToggle
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={128}
        editable={!accountCreated}
      />

      {data.account.password
        .length > 0 &&
        !accountCreated && (
          <View
            style={
              styles.requirements
            }
          >
            <Requirement
              met={
                passwordChecks.length
              }
              text="At least 8 characters"
            />

            <Requirement
              met={
                passwordChecks.uppercase
              }
              text="One uppercase letter"
            />

            <Requirement
              met={
                passwordChecks.lowercase
              }
              text="One lowercase letter"
            />

            <Requirement
              met={
                passwordChecks.number
              }
              text="One number"
            />

            <Requirement
              met={
                passwordChecks.special
              }
              text="One special character"
            />
          </View>
        )}

      <FormInput
        label="Confirm password"
        value={
          data.account.confirmPassword
        }
        onChangeText={(value) =>
          updateAccount(
            "confirmPassword",
            value
          )
        }
        placeholder="Repeat your password"
        secureTextEntry
        allowPasswordToggle
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={128}
        editable={!accountCreated}
      />

      {data.account
        .confirmPassword.length >
        0 &&
        !passwordsMatch &&
        !accountCreated && (
          <Text
            style={
              styles.errorText
            }
          >
            Passwords do not match.
          </Text>
        )}

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: acceptedTerms }}
        disabled={accountCreated}
        onPress={() => onAcceptedTermsChange(!acceptedTerms)}
        style={styles.consentRow}
      >
        <View style={[styles.termsCheckbox, acceptedTerms && styles.termsCheckboxChecked]}>
          {acceptedTerms ? <Text style={styles.checkboxMark}>✓</Text> : null}
        </View>
        <Text style={styles.consentText}>
          I agree to the Terms and Conditions and acknowledge the Privacy Policy.
        </Text>
      </Pressable>

      <View style={styles.policyLinks}>
        <Pressable accessibilityRole="link" onPress={() => router.push("/terms")}><Text style={styles.loginLink}>Read terms</Text></Pressable>
        <Pressable accessibilityRole="link" onPress={() => router.push("/privacy")}><Text style={styles.loginLink}>Read privacy policy</Text></Pressable>
      </View>

      {accountError && (
        <View
          style={
            styles.accountErrorBox
          }
        >
          <Text
            style={
              styles.accountErrorText
            }
          >
            {accountError}
          </Text>

          {accountError
            .toLowerCase()
            .includes(
              "already exists"
            ) && (
            <Pressable
              onPress={() =>
                router.push(
                  "/login"
                )
              }
            >
              <Text
                style={
                  styles.loginLink
                }
              >
                Log in instead →
              </Text>
            </Pressable>
          )}
        </View>
      )}

      <PrimaryButton
        label={
          isCreatingAccount
            ? "Checking account..."
            : accountCreated
              ? "Continue"
              : "Create account & continue"
        }
        disabled={
          (!valid &&
            !accountCreated) ||
          isCreatingAccount
        }
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
    value: string
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
      <Text style={styles.eyebrow}>
        STEP 2 OF 3
      </Text>

      <Text style={styles.title}>
        Tell us about yourself
      </Text>

      <Text style={styles.subtitle}>
        We use this information to understand your current training background and scale your training appropriately.
      </Text>

      <Text style={styles.label}>
        Gender
      </Text>

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
            label:
              "Prefer not to say",
            value:
              "prefer_not_to_say",
          },
        ]}
        selected={
          data.physiological
            .gender
        }
        onSelect={(value) =>
          updatePhys(
            "gender",
            value
          )
        }
      />

      <BirthdayPicker
        value={
          data.physiological
            .birthDate
        }
        onChange={(value) =>
          updatePhys(
            "birthDate",
            value
          )
        }
      />

      <FormInput
        label="Weight"
        value={
          data.physiological
            .weightKg
        }
        onChangeText={(value) =>
          updatePhys(
            "weightKg",
            sanitizeDecimal(
              value
            )
          )
        }
        placeholder="70.0"
        keyboardType="decimal-pad"
        rightLabel="kg"
      />

      <Text style={styles.label}>
        Primary sport
      </Text>

      <View
        style={
          styles.lockedOption
        }
      >
        <View>
          <Text
            style={
              styles.lockedOptionText
            }
          >
            Cycling
          </Text>

          <Text
            style={
              styles.lockedOptionSubtext
            }
          >
            More sports coming later
          </Text>
        </View>

        <View
          style={
            styles.sportIndicator
          }
        >
          <Text
            style={
              styles.sportIndicatorText
            }
          >
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
            subtitle:
              "New to structured training",
          },

          {
            value:
              "intermediate",
            title:
              "Intermediate",
            subtitle:
              "Some experience with structured training",
          },

          {
            value:
              "advanced",
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
          data.physiological
            .trainingHistory
        }
        onSelect={(value) =>
          updatePhys(
            "trainingHistory",
            value
          )
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
        selected={
          data.physiological
            .weeklyVolume
        }
        onSelect={(value) =>
          updatePhys(
            "weeklyVolume",
            value
          )
        }
      />

      <TrainingAvailabilityEditor
        athlete={null}
        value={data.availability}
        week={weekKey()}
        saving={false}
        onboarding
        onDirty={() => setData(previous => ({ ...previous, availability: null }))}
        onSave={async availability => {
          setData(previous => ({ ...previous, availability }));
        }}
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
  onChange: (
    value: string
  ) => void;
}) {
  const [
    showPicker,
    setShowPicker,
  ] = useState(false);

  const selectedDate = value
    ? new Date(
        `${value}T12:00:00`
      )
    : new Date(2000, 0, 1);

  const today = new Date();

  const maxDate = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(
    today.getDate()
  ).padStart(2, "0")}`;

  const handleNativeChange = (
    _event: DateTimePickerEvent,
    date?: Date
  ) => {
    if (
      Platform.OS !== "ios"
    ) {
      setShowPicker(false);
    }

    if (!date) {
      return;
    }

    const year =
      date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      date.getDate()
    ).padStart(2, "0");

    onChange(
      `${year}-${month}-${day}`
    );
  };

  if (
    Platform.OS === "web"
  ) {
    return (
      <View
        style={
          styles.inputGroup
        }
      >
        <Text
          style={styles.label}
        >
          Birthday
        </Text>

        <input
          type="date"
          value={value}
          max={maxDate}
          onChange={(
            event
          ) =>
            onChange(
              event.target
                .value
            )
          }
          style={{
            minHeight: 56,
            width: "100%",
            boxSizing:
              "border-box",
            backgroundColor:
              "#FAFBF9",
            border:
              "1.5px solid #D6DAD5",
            borderRadius:
              theme.radius.md,
            padding:
              "0 16px",
            color:
              theme.colors
                .text,
            fontSize: 16,
            fontFamily:
              "inherit",
            outline: "none",
            colorScheme:
              "light",
          }}
        />
      </View>
    );
  }

  return (
    <View
      style={styles.inputGroup}
    >
      <Text style={styles.label}>
        Birthday
      </Text>

      <Pressable
        style={
          styles.dateButton
        }
        onPress={() =>
          setShowPicker(true)
        }
      >
        <Text
          style={[
            styles.dateButtonText,

            !value &&
              styles.datePlaceholder,
          ]}
        >
          {value
            ? selectedDate.toLocaleDateString(
                "en-US",
                {
                  month:
                    "long",
                  day:
                    "numeric",
                  year:
                    "numeric",
                }
              )
            : "Select your birthday"}
        </Text>

        <Text
          style={styles.dateIcon}
        >
          ▾
        </Text>
      </Pressable>

      {showPicker && (
        <View
          style={
            styles.datePickerContainer
          }
        >
          <DateTimePicker
            value={
              selectedDate
            }
            mode="date"
            display={
              Platform.OS ===
              "ios"
                ? "spinner"
                : "default"
            }
            onChange={
              handleNativeChange
            }
            maximumDate={
              today
            }
          />

          {Platform.OS ===
            "ios" && (
            <Pressable
              style={
                styles.dateDoneButton
              }
              onPress={() =>
                setShowPicker(
                  false
                )
              }
            >
              <Text
                style={
                  styles.dateDoneText
                }
              >
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
  isSubmitting,
  submitError,
}: StepProps & {
  valid: boolean;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitError: string | null;
}) {
  const weight = Number(
    data.physiological.weightKg
  );

  const updatePower = (
    field: keyof RegistrationData["powerProfile"],
    value: string | boolean
  ) => {
    setData((prev) => ({
      ...prev,

      powerProfile: {
        ...prev.powerProfile,
        [field]: value,
      },
    }));
  };

  const wattsPerKg = (
    watts: string
  ) => {
    const power =
      Number(watts);

    if (!weight || !power) {
      return null;
    }

    return (
      power / weight
    ).toFixed(2);
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
        Your recent maximal efforts help Vector understand your current power-duration profile.
      </Text>

      <View
        style={styles.infoBox}
      >
        <View
          style={styles.infoMarker}
        />

        <View
          style={
            styles.infoContent
          }
        >
          <Text
            style={
              styles.infoTitle
            }
          >
            For accurate results
          </Text>

          <Text
            style={styles.infoText}
          >
            Enter your best absolute all-out efforts from the past 42 days. Do not enter a normal interval or estimated training value.
          </Text>
        </View>
      </View>

      <PowerInput
        label="1 MINUTE POWER"
        description="Short-duration / anaerobic capacity"
        value={
          data.powerProfile
            .oneMinuteWatts
        }
        onChange={(value) =>
          updatePower(
            "oneMinuteWatts",
            sanitizeInteger(
              value
            )
          )
        }
        wattsPerKg={wattsPerKg(
          data.powerProfile
            .oneMinuteWatts
        )}
      />

      <PowerInput
        label="5 MINUTE POWER"
        description="VO₂-range aerobic power"
        value={
          data.powerProfile
            .fiveMinuteWatts
        }
        onChange={(value) =>
          updatePower(
            "fiveMinuteWatts",
            sanitizeInteger(
              value
            )
          )
        }
        wattsPerKg={wattsPerKg(
          data.powerProfile
            .fiveMinuteWatts
        )}
      />

      <PowerInput
        label="12 MINUTE POWER"
        description="Sustained aerobic power"
        value={
          data.powerProfile
            .twelveMinuteWatts
        }
        onChange={(value) =>
          updatePower(
            "twelveMinuteWatts",
            sanitizeInteger(
              value
            )
          )
        }
        wattsPerKg={wattsPerKg(
          data.powerProfile
            .twelveMinuteWatts
        )}
      />

      <Pressable
        style={
          styles.checkboxRow
        }
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
            <Text
              style={
                styles.checkmark
              }
            >
              ✓
            </Text>
          )}
        </View>

        <Text
          style={
            styles.checkboxText
          }
        >
          I confirm these efforts were completed within the past 42 days and represent maximal efforts.
        </Text>
      </Pressable>

      {submitError && (
        <View
          style={
            styles.accountErrorBox
          }
        >
          <Text
            style={
              styles.accountErrorText
            }
          >
            {submitError}
          </Text>
        </View>
      )}

      <NavigationButtons
        onBack={onBack}
        onNext={onSubmit}
        nextLabel={
          isSubmitting
            ? "Saving profile..."
            : "Create profile"
        }
        nextDisabled={
          !valid ||
          isSubmitting
        }
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
  editable = true,
  ...props
}: React.ComponentProps<
  typeof TextInput
> & {
  label: string;
  rightLabel?: string;
  allowPasswordToggle?: boolean;
}) {
  const [
    passwordVisible,
    setPasswordVisible,
  ] = useState(false);

  return (
    <View
      style={styles.inputGroup}
    >
      <Text style={styles.label}>
        {label}
      </Text>

      <View
        style={[
          styles.inputWrapper,

          !editable &&
            styles.inputWrapperDisabled,
        ]}
      >
        <TextInput
          {...props}
          editable={editable}
          secureTextEntry={
            allowPasswordToggle
              ? !passwordVisible
              : props.secureTextEntry
          }
          style={[
            styles.input,

            !editable &&
              styles.inputDisabled,
          ]}
          placeholderTextColor="#62686B"
        />

        {allowPasswordToggle && (
          <Pressable
            disabled={!editable}
            onPress={() =>
              setPasswordVisible(
                (previous) =>
                  !previous
              )
            }
            style={
              styles.passwordToggle
            }
          >
            <Text
              style={
                styles.passwordToggleText
              }
            >
              {passwordVisible
                ? "Hide"
                : "Show"}
            </Text>
          </Pressable>
        )}

        {rightLabel && (
          <Text
            style={
              styles.inputRightLabel
            }
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

        met &&
          styles.requirementMet,
      ]}
    >
      {met ? "✓" : "○"}{" "}
      {text}
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

  onSelect: (value: string) => void;
}) {
  return (
    <View
      style={styles.optionRow}
    >
      {options.map(
        (option) => {
          const active =
            selected ===
            option.value;

          return (
            <Pressable
              key={
                option.value
              }
              style={[
                styles.optionButton,

                active &&
                  styles.optionButtonActive,
              ]}
              onPress={() =>
                onSelect(
                  option.value
                )
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
        }
      )}
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

  onSelect: (value: string) => void;
}) {
  return (
    <View
      style={
        styles.optionColumn
      }
    >
      {options.map(
        (option) => {
          const active =
            selected ===
            option.value;

          return (
            <Pressable
              key={
                option.value
              }
              style={[
                styles.historyOption,

                active &&
                  styles.historyOptionActive,
              ]}
              onPress={() =>
                onSelect(
                  option.value
                )
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
        }
      )}
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

  onChange: (
    value: string
  ) => void;

  wattsPerKg:
    | string
    | null;
}) {
  return (
    <View
      style={styles.powerCard}
    >
      <View
        style={
          styles.powerCardTop
        }
      >
        <View
          style={
            styles.powerCardHeading
          }
        >
          <Text
            style={
              styles.powerLabel
            }
          >
            {label}
          </Text>

          <Text
            style={
              styles.powerDescription
            }
          >
            {description}
          </Text>
        </View>

        {wattsPerKg && (
          <View
            style={
              styles.wkgPill
            }
          >
            <Text
              style={styles.wkg}
            >
              {wattsPerKg} W/kg
            </Text>
          </View>
        )}
      </View>

      <View
        style={
          styles.powerInputWrapper
        }
      >
        <TextInput
          value={value}
          onChangeText={
            onChange
          }
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor="#62686B"
          style={
            styles.powerInput
          }
        />

        <Text
          style={
            styles.powerUnit
          }
        >
          W
        </Text>
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Buttons                                   */
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
      style={({
        pressed,
      }) => [
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
    <View
      style={
        styles.navigationRow
      }
    >
      <Pressable
        style={
          styles.secondaryButton
        }
        onPress={onBack}
      >
        <Text
          style={
            styles.secondaryButtonText
          }
        >
          ← Back
        </Text>
      </Pressable>

      <View
        style={
          styles.navigationPrimary
        }
      >
        <PrimaryButton
          label={nextLabel}
          disabled={
            nextDisabled
          }
          onPress={onNext}
        />
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Sanitization                                  */
/* -------------------------------------------------------------------------- */

function sanitizeInteger(
  value: string
) {
  return value.replace(
    /[^0-9]/g,
    ""
  );
}

function sanitizeDecimal(
  value: string
) {
  const cleaned =
    value.replace(
      /[^0-9.]/g,
      ""
    );

  const parts =
    cleaned.split(".");

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
    backgroundColor:
      theme.colors.background,
  },

  container: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom:
      theme.spacing.xxl,
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

  header: {
    height: 92,
    flexDirection: "row",
    alignItems: "center",
  },

  logo: {
    color:
      theme.colors.text,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 4,
  },

  progressWrapper: {
    marginBottom:
      theme.spacing.lg,
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
    backgroundColor:
      "#F1F2F0",
    borderWidth: 1,
    borderColor:
      theme.colors.border,
  },

  progressCircleActive: {
    backgroundColor:
      theme.colors.accentSoft,
    borderColor:
      theme.colors.accent,
  },

  progressCircleCompleted: {
    backgroundColor:
      theme.colors.accent,
    borderColor:
      theme.colors.accent,
  },

  progressNumber: {
    color:
      theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },

  progressNumberActive: {
    color:
      theme.colors.accent,
  },

  progressNumberCompleted: {
    color:
      theme.colors.white,
  },

  progressLabel: {
    marginTop: 7,
    color:
      theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: "600",
  },

  progressLabelActive: {
    color:
      theme.colors.accent,
    fontWeight: "700",
  },

  progressLabelCompleted: {
    color:
      theme.colors.text,
  },

  progressLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 12,
    marginTop: 16,
    backgroundColor:
      theme.colors.border,
  },

  progressLineCompleted: {
    backgroundColor:
      theme.colors.accent,
  },

  card: {
    width: "100%",
    backgroundColor:
      theme.colors.surface,
    borderWidth: 1,
    borderColor:
      theme.colors.border,
    borderRadius:
      theme.radius.lg,
    padding: 38,
  },

  cardMobile: {
    padding: 22,
  },

  eyebrow: {
    color:
      theme.colors.accent,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 12,
  },

  title: {
    color:
      theme.colors.text,
    fontSize:
      theme.typography.h1,
    lineHeight: 50,
    fontWeight: "700",
    letterSpacing: -1.6,
  },

  subtitle: {
    maxWidth: 700,
    color:
      theme.colors.textSecondary,
    fontSize: 17,
    lineHeight: 24,
    marginTop: 10,
    marginBottom: 32,
  },

  accountCreatedBox: {
    backgroundColor:
      theme.colors.accentSoft,
    borderWidth: 1,
    borderColor:
      theme.colors.accent,
    borderRadius:
      theme.radius.md,
    padding: 16,
    marginBottom: 24,
  },

  accountCreatedTitle: {
    color:
      theme.colors.accent,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
  },

  accountCreatedText: {
    color:
      theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },

  accountErrorBox: {
    backgroundColor:
      "#FFF4F4",
    borderWidth: 1,
    borderColor:
      "#F2CACA",
    borderRadius:
      theme.radius.md,
    padding: 14,
    marginTop: 8,
    marginBottom: 4,
  },

  accountErrorText: {
    color: "#B74848",
    fontSize: 13,
    lineHeight: 19,
  },

  loginLink: {
    color:
      theme.colors.accent,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 8,
  },

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

  honeypot: {
    position: "absolute",
    left: -10000,
    width: 1,
    height: 1,
    opacity: 0,
  },

  consentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 4,
    marginBottom: 4,
  },

  termsCheckbox: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#929792",
    borderRadius: 5,
  },

  termsCheckboxChecked: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },

  checkboxMark: { color: theme.colors.white, fontSize: 14, fontWeight: "800" },
  consentText: { flex: 1, color: theme.colors.textSecondary, fontSize: 13, lineHeight: 20 },
  policyLinks: { flexDirection: "row", flexWrap: "wrap", gap: 18, marginBottom: 18 },

  label: {
    color:
      theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor:
      "#FAFBF9",
    borderWidth: 1.5,
    borderColor:
      "#D6DAD5",
    borderRadius:
      theme.radius.md,
  },

  inputWrapperDisabled: {
    backgroundColor:
      "#F1F2F0",
  },

  input: {
    flex: 1,
    minHeight: 56,
    paddingHorizontal:
      theme.spacing.md,
    color:
      theme.colors.text,
    fontSize: 16,
  },

  inputDisabled: {
    color:
      theme.colors.textSecondary,
  },

  inputRightLabel: {
    color:
      theme.colors.textSecondary,
    paddingHorizontal:
      theme.spacing.md,
    fontSize: 13,
    fontWeight: "600",
  },

  passwordToggle: {
    minHeight: 56,
    paddingHorizontal:
      theme.spacing.md,
    justifyContent: "center",
  },

  passwordToggleText: {
    color:
      theme.colors.accent,
    fontSize: 12,
    fontWeight: "700",
  },

  errorText: {
    color: "#D95C5C",
    fontSize: 12,
    marginTop: -10,
    marginBottom: 16,
  },

  requirements: {
    marginTop: -8,
    marginBottom: 20,
  },

  requirementText: {
    color: "#62686B",
    fontSize: 12,
    lineHeight: 21,
  },

  requirementMet: {
    color:
      theme.colors.accent,
  },

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
    backgroundColor:
      "#FAFBF9",
    borderWidth: 1,
    borderColor:
      "#D6DAD5",
    borderRadius:
      theme.radius.md,
  },

  optionButtonActive: {
    backgroundColor:
      theme.colors.accentSoft,
    borderColor:
      theme.colors.accent,
  },

  optionText: {
    color:
      theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },

  optionTextActive: {
    color:
      theme.colors.accent,
    fontWeight: "700",
  },

  lockedOption: {
    flexDirection: "row",
    justifyContent:
      "space-between",
    alignItems: "center",
    padding: 16,
    marginBottom: 24,
    backgroundColor:
      "#FAFBF9",
    borderWidth: 1,
    borderColor:
      "#D6DAD5",
    borderRadius:
      theme.radius.md,
  },

  lockedOptionText: {
    color:
      theme.colors.text,
    fontSize: 15,
    fontWeight: "700",
  },

  lockedOptionSubtext: {
    color:
      theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 3,
  },

  sportIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      theme.colors.accentSoft,
  },

  sportIndicatorText: {
    color:
      theme.colors.accent,
    fontSize: 13,
    fontWeight: "800",
  },

  optionColumn: {
    gap: 8,
    marginBottom: 24,
  },

  historyOption: {
    padding: 15,
    backgroundColor:
      "#FAFBF9",
    borderWidth: 1,
    borderColor:
      "#D6DAD5",
    borderRadius:
      theme.radius.md,
  },

  historyOptionActive: {
    backgroundColor:
      theme.colors.accentSoft,
    borderColor:
      theme.colors.accent,
  },

  historyTitle: {
    color:
      theme.colors.text,
    fontSize: 14,
    fontWeight: "700",
  },

  historyTitleActive: {
    color:
      theme.colors.accent,
  },

  historySubtitle: {
    marginTop: 3,
    color:
      theme.colors.textSecondary,
    fontSize: 12,
  },

  dateButton: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
    paddingHorizontal:
      theme.spacing.md,
    backgroundColor:
      "#FAFBF9",
    borderWidth: 1.5,
    borderColor:
      "#D6DAD5",
    borderRadius:
      theme.radius.md,
  },

  dateButtonText: {
    color:
      theme.colors.text,
    fontSize: 16,
  },

  datePlaceholder: {
    color: "#62686B",
  },

  dateIcon: {
    color:
      theme.colors.accent,
    fontSize: 16,
  },

  datePickerContainer: {
    marginTop: 8,
    padding: 10,
    backgroundColor:
      theme.colors.surface,
    borderWidth: 1,
    borderColor:
      theme.colors.border,
    borderRadius:
      theme.radius.md,
  },

  dateDoneButton: {
    alignSelf: "flex-end",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  dateDoneText: {
    color:
      theme.colors.accent,
    fontSize: 14,
    fontWeight: "700",
  },

  infoBox: {
    flexDirection: "row",
    padding: 18,
    marginBottom: 20,
    backgroundColor:
      theme.colors.accentSoft,
    borderRadius:
      theme.radius.md,
  },

  infoMarker: {
    width: 3,
    marginRight: 14,
    borderRadius:
      theme.radius.pill,
    backgroundColor:
      theme.colors.accent,
  },

  infoContent: {
    flex: 1,
  },

  infoTitle: {
    color:
      theme.colors.accent,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginBottom: 5,
  },

  infoText: {
    color:
      theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },

  powerCard: {
    padding: 18,
    marginBottom: 12,
    backgroundColor:
      "#FAFBF9",
    borderWidth: 1,
    borderColor:
      "#D6DAD5",
    borderRadius:
      theme.radius.md,
  },

  powerCardTop: {
    flexDirection: "row",
    justifyContent:
      "space-between",
    alignItems: "flex-start",
    gap: 12,
  },

  powerCardHeading: {
    flex: 1,
  },

  powerLabel: {
    color:
      theme.colors.text,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
  },

  powerDescription: {
    color:
      theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },

  wkgPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor:
      theme.colors.accentSoft,
    borderRadius:
      theme.radius.pill,
  },

  wkg: {
    color:
      theme.colors.accent,
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
    color:
      theme.colors.text,
    fontSize: 30,
    fontWeight: "700",
    paddingVertical: 0,
  },

  powerUnit: {
    color:
      theme.colors.textSecondary,
    fontSize: 15,
    fontWeight: "600",
  },

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
    backgroundColor:
      theme.colors.surface,
    borderWidth: 1,
    borderColor:
      "#D6DAD5",
    borderRadius: 6,
  },

  checkboxChecked: {
    backgroundColor:
      theme.colors.accent,
    borderColor:
      theme.colors.accent,
  },

  checkmark: {
    color:
      theme.colors.white,
    fontWeight: "900",
  },

  checkboxText: {
    flex: 1,
    color:
      theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },

  primaryButton: {
    minHeight: 56,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 12,
    backgroundColor:
      theme.colors.accent,
    borderRadius:
      theme.radius.md,
  },

  primaryButtonPressed: {
    opacity: 0.85,
  },

  primaryButtonDisabled: {
    backgroundColor:
      "#D7DAD7",
  },

  primaryButtonText: {
    color:
      theme.colors.text,
    fontSize: 15,
    fontWeight: "700",
  },

  primaryButtonTextDisabled: {
    color: "#62686B",
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
    color:
      theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
});
