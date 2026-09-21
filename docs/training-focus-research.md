# Training focus: research and version 1 policy

Reviewed 21 September 2026. The three tags describe provisional training emphasis,
independent of the existing beginner/amateur/highly-trained/elite fitness levels.
They do not diagnose an athlete's physiological limiter or predict which training
will yield the greatest improvement for an individual.

## Evidence and limits

1. [Collins et al., 2022](https://pubmed.ncbi.nlm.nih.gov/36107986/),
   *Critical power and work-prime account for variability in endurance training
   adaptations not captured by VO2max*. In 22 adults over eight weeks, CP and
   VO2max were related at baseline, but their changes were not significantly
   related. Intensity relative to CP explained much of the variation in CP
   adaptation. This supports retaining CP as an outcome alongside VO2max, not
   treating a rise in VO2max as equivalent to a rise in sustainable power.
2. [Murgatroyd et al., 2011](https://pubmed.ncbi.nlm.nih.gov/21415174/),
   *Pulmonary O2 uptake kinetics as a determinant of high-intensity exercise
   tolerance in humans*. In 14 men, faster oxygen-uptake kinetics correlated with
   higher CP. CP therefore contains information that a maximal oxygen-uptake
   value alone does not express.
3. [Goulding et al., 2018](https://pubmed.ncbi.nlm.nih.gov/30039557/),
   *Elevated baseline work rate slows pulmonary oxygen uptake kinetics and
   decreases critical power during upright cycle exercise*. Experimental changes
   in kinetics accompanied changes in CP, supporting the importance of dynamics
   rather than only maximal capacity.
4. [Sitko et al., 2022; online 2021](https://pubmed.ncbi.nlm.nih.gov/34225254/),
   *Five-Minute Power-Based Test to Predict Maximal Oxygen Consumption in Road
   Cycling*. Five-minute relative cycling power predicted VO2max in the studied
   population. A prediction remains a proxy and is not interchangeable with an
   individual gas-analysis measurement.

VO2max is expressed as oxygen uptake; CP is mechanical power. Dividing watts by
mL/kg/min does not produce a fractional-utilization measurement. Measuring the
oxygen demand at CP and dividing that by measured VO2max would address a
different, physiological quantity that the app does not currently collect.

The app's estimated VO2max is already calculated from five-minute W/kg. Inverting
that estimate to get an aerobic power denominator just returns five-minute power;
it supplies no independent evidence. Version 1 explicitly uses CP / five-minute
maximal power, calls it a power comparison, and leaves measured VO2max as separate
context in the athlete model. A standalone lab VO2max cannot select a bucket.
The existing lab maximal-aerobic-power field is not substituted into this ratio:
its protocol and interpretation are not captured, and its thresholds would need
separate calibration. Five-minute power also contains contributions above CP,
so a large gap may reflect W′ rather than a specific aerobic weakness. CP itself
is fitted using the five-minute effort, so this comparison is not independent.

## Three buckets

| Tag | Initial rule: CP / five-minute power | Proposed emphasis |
| --- | --- | --- |
| `sustainable_power` | < 0.75 | Endurance, LT1, sweet spot, threshold; retain VO2 work |
| `balanced` | 0.75–0.85 inclusive | Mixed endurance, sustained-power and VO2 development |
| `aerobic_ceiling` | > 0.85 | VO2 intervals plus endurance; maintain threshold work |

**The 0.75 and 0.85 boundaries are deliberately simple product heuristics. None of
the cited studies validates these cutoffs or shows that these buckets identify
the optimal training for each rider.** All classified outputs have status
`provisional`, with athlete-facing explanations. The middle band avoids forcing
every athlete into a claimed weakness. No extra physiological bucket is assigned
when data are insufficient: the tag is null and status is `needs_data`.

The policy requires confirmed maximal efforts, a valid Morton CP fit and a power
test dated within 90 days. Unknown, future, stale or invalid inputs produce no tag.
The 90-day window is also a product freshness rule, not a biological cutoff.
Boundary comparisons use the full-precision ratio, not the rounded display value.

Workout IDs express emphasis, not frequency, dosage or a generated weekly plan.
Fitness level, training history, recent workload, available time, recovery and
observed response should constrain a future prescription engine. In particular,
the VO2 tag does not automatically prescribe the library's 5 × 5 at 120% CP.
Evaluate changes in CP, five-minute power, measured VO2max where available,
completion and perceived effort over time before claiming personalized efficacy.

## Persistence and rollout

Apply `supabase/migrations/20260921160000_add_training_focus.sql` before deploying.
It adds `profiles.training_focus` (assessment JSON), `training_focus_tag` (generated
queryable tag) and `training_focus_revision`. Existing profile ownership/RLS applies;
no service-role key is used in the app. The deployment must already permit an
authenticated athlete to update and read their own profile.

The shared athlete loader calculates and saves the assessment on profile reads.
Existing athletes are classified lazily when they next open an athlete page, not
by a migration-time backfill. Power saves refresh it immediately in the app.
Returning to dashboard/training/profile reloads the saved assessment. A power-row
insert/update/delete invalidates the profile assessment and advances its revision.
The loader reads the revision before source data and uses it in a conditional
update, retrying once if sources changed. This prevents an older computation from
overwriting newer power data. Equal assessments do not cause repeated writes.

Missing migration or failed writes leave the focus unavailable with a visible
message; the rest of the profile can still load. A test aging past 90 days is
reassessed on the next read (there is no background expiry job). External consumers
must check `powerRecordedAt` and the policy version before using a cached tag.
Measured VO2/lactate edits do not invalidate this version's tag, because they are
not its classification inputs. Future algorithms should version their policy and
extend invalidation to any newly used inputs.
