import { WORKOUT_LIBRARY } from "./library";
import type {
  BuiltWorkout,
  ScalingParameter,
  WorkoutId,
  WorkoutParameters,
  WorkoutStep,
  WorkoutTemplate,
} from "./types";

function parameter(value: number | undefined, rule: ScalingParameter, name: string): number {
  const resolved = value ?? rule.default;
  if (!Number.isSafeInteger(resolved) || resolved < rule.min || (resolved - rule.min) % rule.step !== 0) {
    throw new Error(`${name} must be an integer >= ${rule.min} in increments of ${rule.step}.`);
  }
  return resolved;
}

/** Pure structural expansion. Rider selection and watt resolution are separate concerns. */
export function buildWorkout(id: WorkoutId, overrides: WorkoutParameters = {}): BuiltWorkout {
  if (!Object.prototype.hasOwnProperty.call(WORKOUT_LIBRARY, id)) {
    throw new Error(`Unknown workout: ${id}`);
  }
  const template: WorkoutTemplate = WORKOUT_LIBRARY[id];
  const allowed = template.structure === "continuous"
    ? ["durationMinutes"]
    : ["repetitionsPerSet", "sets"];
  for (const key of Object.keys(overrides)) {
    if (!allowed.includes(key)) throw new Error(`${key} is not adjustable for ${id}.`);
  }
  const steps: WorkoutStep[] = [];
  // Clone targets too so editing a generated session cannot change the library.
  const append = (value: WorkoutStep) => steps.push({ ...value, target: { ...value.target } });
  let parameters: WorkoutParameters;
  if (template.structure === "continuous") {
    const durationMinutes = parameter(overrides.durationMinutes, template.durationMinutes, "durationMinutes");
    if (!Number.isSafeInteger(durationMinutes * 60)) throw new Error("Duration is too large.");
    parameters = { durationMinutes };
    append({ role: "work", durationSeconds: durationMinutes * 60, target: template.target });
  } else {
    const repetitionsPerSet = parameter(overrides.repetitionsPerSet, template.repetitionsPerSet, "repetitionsPerSet");
    const sets = parameter(overrides.sets, template.sets, "sets");
    // Resource guard only; athlete-specific training limits belong in prescription policies.
    if (repetitionsPerSet * sets > 1000) throw new Error("A workout cannot exceed 1,000 work repetitions.");
    parameters = { repetitionsPerSet, sets };
    append(template.warmup);
    for (let set = 0; set < sets; set++) {
      for (let rep = 0; rep < repetitionsPerSet; rep++) {
        append(template.work);
        if (rep < repetitionsPerSet - 1 || template.recoveryAfterLastRepetition) append(template.recovery);
      }
      if (set < sets - 1) append(template.betweenSets);
    }
    append(template.cooldown);
  }
  return {
    templateId: template.id,
    templateVersion: template.version,
    name: template.name,
    parameters,
    steps,
    durationSeconds: steps.reduce((total, step) => total + step.durationSeconds, 0),
    workSeconds: steps.reduce((total, step) => total + (step.role === "work" ? step.durationSeconds : 0), 0),
  };
}
