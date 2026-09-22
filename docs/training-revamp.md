# Adaptive training prescription v2

The planner is deterministic and pure. It receives athlete physiology, weekly
availability, completed-workout history, and provider-neutral activity power
maxima. It never calls an activity provider directly.

## Decision order

1. Start with the athlete's confirmed 1-, 5-, and 12-minute efforts.
2. Apply newer supported maxima (60, 300, and 720 seconds) when they exceed the
   current value. This is the extension point for future ride/activity sync.
3. Require a retest and suspend focused intervals when no supported maximum or
   test has refreshed the model for 84 days.
4. Classify the current emphasis from the CP-to-five-minute-power relationship:
   sustainable power, aerobic ceiling, or balanced development.
5. Review completed prescriptions. A completed, tolerable session advances one
   bounded progression step; a hard or substantially incomplete session reduces
   the next dose; otherwise the dose is held.
6. Progress weekly volume by at most 5% when the prior recorded week is
   representative and at least 85% complete. Availability and athlete-level caps
   remain hard ceilings.
7. Retain at least one rest day, separate focused sessions by at least one easy or
   rest day, and keep focused work at or below 20% of planned minutes.
8. Remove focused work and reduce volume by 40% when the athlete selects recovery,
   after three consecutive completed loading weeks, or after repeated high-RPE or
   low-completion sessions.

## Persistence and future activity imports

`training_workout_history` stores the prescription version, workout template
version/parameters, progression level, planned dose, completion, and recovery
state. A completed prescription therefore remains interpretable after the workout
library changes.

`activity_power_maxima` accepts best-effort observations independently of provider.
A future Strava, Garmin, or file-import worker should normalize a detected maximum
to `duration_seconds`, `watts`, `observed_at`, `source`, and an optional external
activity identifier. The current planner consumes exact 60-, 300-, and 720-second
maxima; other durations can be stored for later model versions.

This engine provides training suggestions, not medical diagnosis or a real-time
readiness assessment. Pain, illness, unusual fatigue, and clinician advice always
override the generated plan.
