export type WorkoutId =
  | "endurance"
  | "lt1"
  | "sweet-spot"
  | "threshold"
  | "vo2-long"
  | "vo2-30-15";

/** Symbolic targets: resolve against the rider when prescribing, not displaying. */
export type PowerTarget =
  | { readonly kind: "zone"; readonly zone: "z2" | "z1-z2"; readonly position?: "top" }
  | { readonly kind: "cp-fraction"; readonly fraction: number }
  | { readonly kind: "five-minute-max" };

export type WorkoutStep = {
  readonly role: "warmup" | "work" | "recovery" | "cooldown";
  readonly durationSeconds: number;
  readonly target: PowerTarget;
};

export type ScalingParameter = {
  readonly default: number;
  readonly min: number;
  readonly step: number;
};

type TemplateBase = {
  readonly id: WorkoutId;
  readonly version: number;
  readonly name: string;
  readonly description: string;
  readonly notes: readonly string[];
};

export type EnduranceTemplate = TemplateBase & {
  readonly structure: "continuous";
  readonly durationMinutes: ScalingParameter;
  readonly target: PowerTarget;
};

export type IntervalTemplate = TemplateBase & {
  readonly structure: "intervals";
  readonly warmup: WorkoutStep;
  readonly cooldown: WorkoutStep;
  readonly work: WorkoutStep;
  readonly recovery: WorkoutStep;
  readonly repetitionsPerSet: ScalingParameter;
  readonly sets: ScalingParameter;
  readonly betweenSets: WorkoutStep;
  /** Microintervals retain the final 15-second off phase in each set. */
  readonly recoveryAfterLastRepetition: boolean;
};

export type WorkoutTemplate = EnduranceTemplate | IntervalTemplate;

export type WorkoutParameters = {
  readonly durationMinutes?: number;
  readonly repetitionsPerSet?: number;
  readonly sets?: number;
};

export type BuiltWorkout = {
  readonly templateId: WorkoutId;
  readonly templateVersion: number;
  readonly name: string;
  readonly parameters: WorkoutParameters;
  readonly steps: readonly WorkoutStep[];
  readonly durationSeconds: number;
  readonly workSeconds: number;
};
