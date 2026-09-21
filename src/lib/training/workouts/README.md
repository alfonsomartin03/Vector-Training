# Workout library

Six versioned, data-only templates define the foundation sessions. Import from
`src/lib/training/workouts` to list templates or build a session. No database,
React, or athlete data is required.

- `types.ts`: targets, templates, scaling parameters, and built sessions.
- `blocks.ts`: shared 20-minute Z2 warm-up/cooldown and interval defaults.
- `templates/`: one file per workout family.
- `library.ts`: exhaustive registry of stable template IDs.
- `buildWorkout.ts`: validates parameters and expands timed steps.
- `index.ts`: public interface.

```ts
import { buildWorkout, WORKOUT_LIBRARY } from "./workouts";

const templates = Object.values(WORKOUT_LIBRARY);
const endurance = buildWorkout("endurance", { durationMinutes: 90 });
const threshold = buildWorkout("threshold", { repetitionsPerSet: 3 });
const microintervals = buildWorkout("vo2-30-15", { sets: 3 });
```

## Default sessions

All interval sessions include 20 minutes of Z2 before and after the main work.
Endurance duration is the entire ride, starting at 60 minutes in 30-minute steps.

| ID | Main work | Recovery | Total |
| --- | --- | --- | --- |
| `endurance` | 60 minutes Z2 | None | 60 minutes |
| `lt1` | 3 × 30 minutes at top of Z2 | 2 minutes Z1–Z2 between reps | 134 minutes |
| `sweet-spot` | 4 × 15 minutes at 90% CP | 5 minutes Z2 between reps | 115 minutes |
| `threshold` | 5 × 8 minutes at 100% CP | 4 minutes Z2 between reps | 96 minutes |
| `vo2-long` | 5 × 5 minutes at 120% CP | 5 minutes Z2 between reps | 85 minutes |
| `vo2-30-15` | 2 × 13 × (30 seconds at five-minute max + 15 seconds Z2) | 5 extra minutes Z2 between sets | 64 minutes 30 seconds |

Long intervals go directly into cooldown after the last repetition. Between sets,
the five-minute set recovery replaces the normal repetition recovery. Microintervals
retain the last 15-second off phase of each set and add the set recovery after it.
All interval templates support both repetitions per set and set count.

## Future rider tailoring

The defaults describe the requested library sessions; they are not automatic
prescriptions for every fitness level. A future prescription layer should select
the template, repetition/set count, power targets, and workload limits using the
rider's data and available time. Structural validation enforces positive integer
counts and endurance increments; the 1,000-repetition cap is a resource guard,
not a training recommendation.

Power remains symbolic: Z2, top of Z2, a CP fraction, or five-minute maximum power.
Resolve targets against athlete data in the prescription layer, explicitly handling
missing inputs. The LT1 template currently implements the requested upper-Z2
target; it does not claim that this is the rider's measured LT1. Five-minute maximum
means five-minute power, not VO2max in mL/kg/min. Define how to select a point or
range within Z2 when implementing watt resolution.

Persist the eventual resolved prescription in Supabase with its parameters,
template version, resolved steps, relevant athlete inputs, and selection reason.
Existing prescriptions should not silently change when a template or athlete model
changes. Increment template versions when changing their meaning or defaults.
The builder currently returns a serializable structural session, not a resolved
watt prescription, and does not assign it to the calendar.

Run `npm run test:workouts`, `npm run typecheck`, and `npm run lint` for validation.
