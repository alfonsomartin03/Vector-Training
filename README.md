# Adaptive CP/W′ Cycling Training Platform

<img width="1254" height="1254" alt="Vector Training" src="https://github.com/user-attachments/assets/4d1683f3-aadb-4064-9939-29a580cbab67" />

A cross-platform cycling training app that builds an evolving physiological model of each rider using **Critical Power (CP), W′, power-duration data, and estimated VO₂max**.

Instead of prescribing workouts from a single FTP value, the app identifies **what is currently limiting the rider**, selects an appropriate training stimulus, and generates workouts around the athlete's actual power profile.

---

## Why This Is Different

Most cycling training apps reduce an athlete to one primary number:

> **FTP = 280 W**

But two riders with the same FTP can have dramatically different aerobic ceilings, power-duration relationships, work capacities above threshold, and responses to interval training.

This platform instead models the rider using:

- **Critical Power (CP)**
- **W′**
- **Power-duration curves**
- **5-minute power and estimated VO₂max**
- **Training experience**
- **Recent workload**
- **Recent performance trends**

The goal is to answer three questions:

1. **What should I train today?**
2. **Why should I train it?**
3. **What part of my performance profile are we trying to improve?**

---

## Critical Power + W′

The core performance model uses the two-parameter Critical Power relationship:

$$
P(t) = CP + \frac{W'}{t}
$$

where:

- `CP` = Critical Power
- `W′` = finite work capacity available above CP
- `t` = duration in seconds
- `P(t)` = predicted power for that duration

### Critical Power

Critical Power represents the asymptote of the power-duration relationship and approximates the boundary between the **heavy and severe exercise-intensity domains**.

Below CP, physiological variables can potentially stabilize at a delayed steady state.

Above CP, a sustainable metabolic steady state cannot be maintained, and the rider progressively approaches exhaustion.

### W′

W′ ("W prime") represents a finite amount of work that can be performed above CP and is measured in joules or kilojoules.

For example:

```text
CP = 300 W
W′ = 20 kJ
```

At 400 W, the rider is performing:

```text
400 W - 300 W = 100 W
```

above CP.

Under the simplest CP model:

$$
t = \frac{W'}{P - CP}
$$

Therefore:

```text
20,000 J / 100 W = 200 seconds
```

Two riders can therefore have the same CP while possessing very different abilities above CP depending on their W′.

---

## Dynamic Power Profile

The app maintains a complete power-duration profile rather than storing only one threshold value.

Users can track:

- Current power curve
- 15-day trend
- 30-day trend
- 90-day trend
- Previous seasons
- All-time bests

Historical CP and W′ estimates are retained so riders can see **how their performance profile changes over time**.

Example:

```text
Critical Power
291 W
↑ 2.4% over 30 days

W′
18.7 kJ
↓ 1.1% over 30 days
```

This makes it possible to distinguish improvements in sustained aerobic performance from changes in severe-domain work capacity.

---

## Estimated VO₂max

Five-minute relative cycling power is used to estimate VO₂max:

$$
VO_{2max} = 16.6 + (8.87 \times P_{5min,relative})
$$

where five-minute relative power is expressed in `W/kg`.

For a 70 kg rider producing 370 W for five minutes:

```text
370 W / 70 kg = 5.29 W/kg
```

giving an estimated:

```text
VO₂max ≈ 63.5 mL/kg/min
```

This value is treated explicitly as an **estimate**, not a replacement for laboratory gas-analysis testing.

Its primary purpose is to help characterize the relationship between the rider's **aerobic ceiling** and sustainable aerobic performance.

---

## Limiter Detection

Rather than simply increasing or decreasing FTP-based workout targets, the application attempts to determine **what aspect of the rider's current performance profile represents the greatest training opportunity**.

Potential priorities include:

- Aerobic ceiling / VO₂max
- Critical Power development
- Severe-domain capacity / W′
- Aerobic endurance
- Durability
- Neuromuscular / sprint power

For example, consider two 70 kg riders with identical Critical Power:

```text
Rider A
CP = 300 W
5 min = 350 W

Rider B
CP = 300 W
5 min = 400 W
```

Despite identical CP, the two riders have very different power-duration profiles.

Rider A has relatively little separation between CP and five-minute power, potentially making development of the aerobic ceiling a greater opportunity.

Rider B has substantially more short-duration aerobic power available relative to CP, potentially shifting training emphasis toward sustainable power, durability, or CP development.

The app uses these relationships as part of a broader performance heuristic rather than assuming that any single ratio perfectly represents physiology.

---

## Adaptive Workout Generation

Workouts are not selected from a static library and blindly scaled using `%FTP`.

The system separates two questions:

> **What adaptation does this rider need?**

and:

> **What training dose is appropriate for this rider?**

The recommendation engine can consider:

- CP
- W′
- Power-duration profile
- Estimated VO₂max
- Training experience
- Recent intensity
- Recent training volume
- Available training time
- Performance trends

For the same training objective, different athletes may receive different workout structures.

Example:

```text
Goal: VO₂ Development

Beginner
6 × 2 min

Intermediate
5 × 3 min

Advanced
5 × 4 min

Highly Trained
4 × 5 min or more specialized severe-domain work
```

Power targets can then be individualized using the athlete's CP/W′ profile rather than arbitrary FTP percentages.

---

## W′ Balance

The workout engine is designed to model **W′ balance (W′bal)** throughout interval sessions.

When power exceeds CP:

```text
W′ decreases
```

When power falls below CP:

```text
W′ recovers
```

Recovery is not treated as an instantaneous or simple linear recharge.

Modeling W′ balance allows interval power, duration, and recovery periods to be selected around the rider's actual severe-domain capacity.

Instead of prescribing:

```text
5 × 4 min @ 115% FTP
```

the system can target something conceptually closer to:

> Accumulate a desired amount of severe-domain work while reaching an appropriate level of W′ depletion without exhausting W′ too early in the session.

---

## Explainable Training

The recommendation engine is designed to be transparent.

Instead of simply displaying:

> **Today's workout: 5 × 4 minutes**

the app should explain why that workout was selected.

Example:

> **VO₂ Development**
>
> Your Critical Power has improved faster than your five-minute power over the last 30 days. Your current profile suggests that increasing your aerobic ceiling is the highest-priority adaptation.

Or:

> **Endurance**
>
> VO₂ development remains a current priority, but you completed severe-domain training yesterday. Additional high-intensity work today would exceed the desired intensity frequency.

The athlete should always be able to answer:

> **Why am I doing this workout?**

---

## Integrated Fueling

Fueling guidance is generated alongside the prescribed workout instead of existing as a separate generic calculator.

Recommendations can consider:

- Workout duration
- Intensity
- Expected mechanical work
- Time spent above CP
- Athlete characteristics
- Environmental conditions

Example:

```text
Workout
2 h 30 min
~1,850 kJ
3 × 12 min near CP

Fueling
70–90 g carbohydrate/hour

Total
175–225 g carbohydrate

Hydration
~500–750 mL/hour baseline
```

Future versions can incorporate individual sweat rate and sodium-loss data for more personalized hydration guidance.

---

## Model Confidence

CP and W′ estimates are only as useful as the power data used to calculate them.

The app therefore tracks the quality of the athlete's current model.

Example:

```text
Model Confidence
74%

Strong recent data:
5 min
20 min

Missing:
Representative 8–12 min effort
```

The system may then recommend a testing effort:

> **Suggested assessment: 10-minute maximal effort**

This creates a feedback loop where training can also improve the quality of the underlying athlete model.

---

## Adaptive Athlete Model

The core application loop is:

```text
Power Data
    ↓
CP + W′ + Power Curve + Estimated VO₂max
    ↓
Identify Current Limiter
    ↓
Select Training Objective
    ↓
Generate Individualized Workout
    ↓
Complete Training
    ↓
New Performance Data
    ↓
Update Athlete Model
    ↺
```

The athlete model continuously evolves as new performance and training data becomes available.

---

## Cross-Platform

The application is intended to share a single codebase across:

- Web
- iOS
- Android

### Proposed Stack

```text
Frontend
├── React Native
├── Expo
├── TypeScript
└── Expo Router

Backend
├── Supabase
├── PostgreSQL
├── Authentication
└── Storage

Performance Engine
├── CP / W′ modeling
├── Power-duration modeling
├── W′ balance
├── VO₂max estimation
├── Limiter detection
├── Workout generation
└── Fueling calculations
```

The physiological and training logic is kept independent of the user interface so it can be unit-tested and reused across platforms.

---

## Project Philosophy

### Model the athlete, not FTP

A single threshold value cannot adequately describe an athlete's complete power-duration characteristics.

### Prescribe adaptations, not percentages

Training should be selected around the desired physiological stimulus rather than blindly applying `%FTP`.

### Keep the science explainable

Every recommendation should have a reason the athlete can understand.

### Show uncertainty

Estimated VO₂max is an estimate. CP/W′ models depend on data quality. Hydration requirements vary individually.

The application should communicate uncertainty instead of manufacturing precision.

### Let the model evolve

Every new meaningful performance should improve the application's understanding of the rider.

---

## Long-Term Goal

Build a training platform that combines the simplicity and visual polish of a modern consumer fitness app with the physiological modeling normally found in sports-science tools.

At a glance, the rider should be able to see:

```text
CRITICAL POWER
291 W ↑

W′
18.7 kJ →

ESTIMATED VO₂MAX
66.2 ↑

NEXT WORKOUT
VO₂ Development

WHY?
Your aerobic ceiling is currently the
highest-priority opportunity for improvement.
```

Advanced users can then explore the underlying:

- Power-duration curves
- CP/W′ history
- W′ balance
- Physiological trends
- Training-selection logic
- Fueling recommendations

The complexity should exist **underneath the interface, not in the way of the athlete**.
