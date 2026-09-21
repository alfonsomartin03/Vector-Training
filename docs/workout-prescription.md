# Weekly availability and prescription (policy v1)

## Deployment

Apply `supabase/migrations/20260921210000_training_availability.sql` after the existing migrations, before deploying the frontend. No new Edge Function or scheduler is required. This change does not deploy or modify the live database automatically. Run `npm run test:prescription`, `npm run test:admin`, `npm run test:focus`, `npm run test:workouts`, `npm run typecheck` and `npm run lint`.

## Profile-owned availability

`public.training_availability.user_id` references `profiles.id` with cascading deletion. It is a normalized part of the athlete profile, not another unbounded JSON field. The composite primary key is `(user_id, week_start)`; Monday-starting local calendar dates avoid UTC midnight shifts. RLS permits athletes to read/write only their own rows; anonymous access is revoked. Account deletion removes all availability history through the existing profile cascade.

Saved inputs are available minutes per week (0–1800), preferred rest weekdays (Monday=0), longest permitted ride (30–360 minutes), recent four-week average minutes per week (0 means unknown), and recovery-week preference. Recent volume is a self-report, not inferred from fitness or available time. It is distinct from the existing onboarding `weekly_volume` category.

The Training page edits this week or next week. The latest row on or before the requested week is effective. No row is copied on rollover. Editing this week does not overwrite an explicitly configured future week; future rows never affect earlier weeks. All fields, including the recovery preference, carry forward until changed. A zero-hour or seven-rest-day week is valid. Profile displays the effective current availability; Dashboard and Training use the same engine and saved inputs. Failed loads are displayed as errors, not silently replaced with defaults. Unsaved edits do not change the displayed prescription.

## Prescription rules

Availability is edited in a scrollable popup opened from the compact Training-page summary; closing without saving discards the draft. During onboarding the same editor appears in Step 2 (athlete details), beside training history and recent volume. Confirming settings enables continuation; editing them again requires reconfirmation. The final registration submission saves availability after the profile and before the power tests. A failed availability write blocks completion and can be retried. Initial onboarding suggestions are conservative until power tests establish fitness.

These are conservative, explicit product heuristics, not validated individual optima or a readiness model. Availability is a ceiling, not a dose target.

- The existing four fitness classifications are retained. For dose only, highly trained and elite share one tier; beginners or unrecognized/missing training history use the lowest tier.
- The normal weekly ceiling is the minimum of availability, self-reported recent volume, and a policy cap of 6/10/15 hours for beginner/amateur/highly-trained-or-elite dose tiers. Unknown recent volume uses at most 3 hours of endurance, not intervals. None of these caps is a physiological threshold.
- Recovery preference multiplies that ceiling by 0.6 and removes intervals. No autonomous progression is applied and there is no automatic recovery-week cycle.
- At least one full rest day is retained. Requested rest days are never filled. Tuesday/Friday are the only candidate interval days in v1; this intentionally guarantees recovery spacing even across adjacent weeks with changed preferences. If those days are unavailable, fewer intervals are assigned, not moved onto consecutive days.
- Maximum one focused session for beginners or small weeks; up to two for experienced athletes with at least five budgeted hours and four available days. Intervals require a recent-volume report of at least three hours and current confirmed valid maximal efforts. Focus freshness is re-evaluated at generation, not trusted from a stale saved tag.
- Sustainable-power focus alternates sweet spot and threshold as the primary session, with LT1/upper-endurance as a possible secondary. Aerobic-ceiling focus alternates long VO2 and 30/15, with threshold maintenance. Balanced focus alternates sweet spot and long VO2, with threshold as secondary. Alternation uses calendar-week parity, not attendance or completed sessions.
- Dose tiers prescribe sweet spot 1/2/3 × 15 min; threshold 2/3/4 × 8 min; long VO2 2/3/4 × 5 min; LT1 1/1/2 × 30 min; 30/15 uses 13 repeats in 1/1/2 sets. Library defaults are not blindly prescribed. If a complete selected dose does not fit, it is omitted.
- Long VO2 power is capped at the lower of 120% CP and 95% of tested five-minute power. Microintervals use tested five-minute power. CP-based and P5 targets are shown in watts. Z2 remains symbolic; upper Z2 is not asserted to be measured LT1.
- Focused work minutes (including LT1 as a conservative accounting choice) are capped at 20% of the actual planned duration. If easy volume cannot support this, the secondary then primary session is replaced with endurance or removed. This accounting convention is **not** equivalent to a measured physiological 80/20 intensity distribution.
- Endurance fills remaining suitable days at 60 minutes, then grows in 30-minute increments. Every ride fits the per-session ceiling; all rides together fit the weekly ceiling. Interval durations include the full 20-minute warm-up and cooldown, recoveries, and set breaks. Leftover time is explained and need not be filled.

The calendar is a **regenerated suggested plan**, not a persisted assignment or completion log. Editing inputs may change the entire displayed week, including past dates. There is no claim that a workout was completed. Before introducing adherence-driven progression, add immutable versioned assignment snapshots, completion history and validated recovery/load feedback. Injury, illness, medications, event demands and day-specific time budgets are not modeled. Athletes should reduce/stop training for symptoms and seek appropriate professional guidance.

## Evidence and limitations

The evidence supports combining substantial easy volume with limited focused work; it does not establish our exact thresholds, caps, rest days or an individual's optimal dose.

- [Effects of a 16-Week Training Program with a Pyramidal Intensity Distribution on Recreational Male Cyclists](https://pmc.ncbi.nlm.nih.gov/articles/PMC10820066/) studied a program combining VO2 and threshold sessions with lower-intensity riding. Population-specific results do not validate this algorithm or every athlete's response.
- [Influence of Interval Training Frequency on Time-Trial Performance in Elite Endurance Athletes](https://pubmed.ncbi.nlm.nih.gov/32375328/) compared two longer with four shorter interval sessions, illustrating that distributing the same work differently can affect adaptations. It does not prove two sessions are optimal for beginners.
- [Training Periodization, Intensity Distribution, and Volume in Trained Cyclists: A Systematic Review](https://pubmed.ncbi.nlm.nih.gov/36640771/) provides broader context; trained-cyclist findings should not be generalized into mandatory volume for new riders.

The existing [training-focus research](training-focus-research.md) covers why CP/P5 is only a provisional emphasis, not a measured physiological weakness. Exact v1 dose numbers and the long-VO2 P5 cap are engineering/coaching guardrails requiring prospective validation, not research-derived prescriptions.

## Release checks

Selecting a calendar day displays a duration-proportional power chart above the interval outline and session statistics. The chart uses the actual generated steps (including adjusted VO2 targets), not template default repetition counts. Estimated average watts and mechanical work use explicit representative zone values: Z2 65.5% CP, upper Z2 75%, and Z1–Z2 55%. Work above CP integrates only the excess above CP. Average intensity is average power divided by CP, not normalized intensity, TSS or a measured ride load. Unknown CP leaves watt-based statistics blank. No actual-ride trace or fatigue curve is fabricated.

Tests cover all 128 rest-day patterns across multiple budgets, volume/session limits, focused-work fraction, warm-up/cooldown accounting, focus selection, stale data, zero availability, inheritance/year rollover, input immutability, SQL constraints, isolation across accounts, anonymous denial, and deletion cascades with the admin migration. Test a signed-in athlete on the deployed staging database: save settings, reload, verify next-week inheritance, save a next-week override, confirm this week is unchanged, then delete a disposable account and verify its availability rows disappear. These live checks require the migration and are not replaced by the local tests.
