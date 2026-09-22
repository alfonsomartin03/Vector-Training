const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const { mkdtempSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const path = require("node:path");
const { after, test } = require("node:test");
const output = mkdtempSync(path.join(tmpdir(), "vector-prescription-"));
after(() => rmSync(output, { recursive: true, force: true }));
execFileSync(process.execPath, [require.resolve("typescript/bin/tsc"), "src/lib/training/prescription.ts", "--ignoreConfig", "--module", "node16", "--target", "es2020", "--strict", "--skipLibCheck", "--rootDir", "src", "--outDir", output], { cwd: path.resolve(__dirname, ".."), stdio: "inherit" });
const { prescribeWeek, availabilityForWeek, validateAvailability, weekKey, recommendAvailability } = require(path.join(output, "lib/training/prescription.js"));
const now = new Date();
const week = weekKey(now);
const base = { week_start: week, weekly_minutes: 480, recent_weekly_minutes: 480, max_session_minutes: 150, rest_days: [0, 2], recovery_week: false };
function athlete(ratio = 0.8, experience = "advanced", weight = 70) {
  const cp = 400 * ratio, wPrime = (400 - cp) * 420;
  return { profile: { id: "one", weight_kg: weight, training_history: experience }, powerProfile: { user_id: "one", maximal_efforts_confirmed: true, recorded_at: new Date(now.getTime() - 86400000).toISOString(), one_minute_watts: cp + wPrime / 180, five_minute_watts: 400, twelve_minute_watts: cp + wPrime / 840 }, vo2MaxTest: null, lactateTest: null };
}
test("availability validates dates, finite bounds, distinct rest days and boolean recovery", () => {
  assert.equal(validateAvailability(base), null);
  for (const change of [{ weekly_minutes: NaN }, { recent_weekly_minutes: -1 }, { max_session_minutes: 361 }, { rest_days: [0, 0] }, { rest_days: [7] }, { recovery_week: "yes" }, { week_start: "2026-09-22" }, { week_start: "bad" }]) assert.ok(validateAvailability({ ...base, ...change }));
});
test("latest prior week carries forward; future edits never flow backwards", () => {
  const old = { ...base, week_start: "2026-09-14" }, next = { ...base, week_start: "2026-09-28", weekly_minutes: 0 };
  assert.deepEqual(availabilityForWeek([next, old], "2026-09-21"), old);
  assert.deepEqual(availabilityForWeek([next, old], "2026-10-05"), next);
  assert.equal(availabilityForWeek([next], "2026-09-21"), null);
  assert.equal(weekKey(new Date("2027-01-03T12:00:00")), "2026-12-28");
});
test("missing data and zero availability are safe, recovery weeks suppress intervals", () => {
  assert.equal(prescribeWeek(null, base, now).totalMinutes, 0);
  assert.equal(prescribeWeek(athlete(), null, now).totalMinutes, 0);
  assert.equal(prescribeWeek(athlete(), { ...base, weekly_minutes: 0 }, now).totalMinutes, 0);
  assert.equal(prescribeWeek(athlete(), { ...base, rest_days: [0,1,2,3,4,5,6] }, now).totalMinutes, 0);
  const recovery = prescribeWeek(athlete(), { ...base, recovery_week: true }, now);
  assert.equal(recovery.qualitySessions, 0);
  assert.ok(recovery.totalMinutes <= 480 * 0.6);
  for (const rider of [{ ...athlete(), powerProfile: null }, { ...athlete(), powerProfile: { ...athlete().powerProfile, maximal_efforts_confirmed: false } }, { ...athlete(), powerProfile: { ...athlete().powerProfile, recorded_at: "2000-01-01" } }]) assert.equal(prescribeWeek(rider, base, now).qualitySessions, 0);
});
test("experience and fitness limit the interval dose; unknown recent volume is endurance-only", () => {
  assert.ok(prescribeWeek(athlete(0.7, "beginner"), base, now).qualitySessions <= 1);
  const unknown = prescribeWeek(athlete(), { ...base, recent_weekly_minutes: 0 }, now);
  assert.equal(unknown.qualitySessions, 0);
  assert.ok(unknown.totalMinutes <= 180);
  assert.equal(recommendAvailability(athlete(), 240).weeklyMinutes, 240);
  assert.equal(recommendAvailability(athlete(), Infinity).weeklyMinutes, 180);
  assert.ok(recommendAvailability(athlete(), 1800).weeklyMinutes <= 900);
});
test("future planning rechecks test freshness at the planned date", () => {
  const future = new Date(now.getTime() + 100 * 86400000);
  assert.equal(prescribeWeek(athlete(), base, future, now).qualitySessions, 0);
});
test("focus changes selection, all intervals retain warmup/cooldown, VO2 is P5-capped", () => {
  for (const ratio of [0.7, 0.8, 0.9]) {
    const plan = prescribeWeek(athlete(ratio), base, now);
    assert.ok(plan.qualitySessions >= 1);
    const sessions = Object.values(plan.assignments).filter(a => a.workout.templateId !== "endurance");
    const primary = sessions[0].workout;
    assert.ok((ratio === 0.7 ? ["sweet-spot", "threshold"] : ratio === 0.9 ? ["vo2-long", "vo2-30-15"] : ["sweet-spot", "vo2-long"]).includes(primary.templateId));
    for (const assignment of sessions) {
      const w = assignment.workout;
      assert.equal(w.steps[0].durationSeconds, 1200);
      assert.equal(w.steps.at(-1).durationSeconds, 1200);
      assert.equal(assignment.durationMinutes, w.steps.reduce((s, step) => s + step.durationSeconds, 0) / 60);
      if (w.templateId === "vo2-long") assert.ok(w.steps.find(s => s.role === "work").target.fraction * ratio * 400 <= 380.00001);
    }
  }
});
test("budget/rest/session/intensity invariants hold across all rest patterns and time budgets", () => {
  for (let mask = 0; mask < 128; mask++) for (const minutes of [0, 50, 180, 360, 900]) {
    const rest_days = Array.from({ length: 7 }, (_, i) => i).filter(i => mask & (1 << i));
    const settings = { ...base, rest_days, weekly_minutes: minutes, max_session_minutes: mask % 2 ? 60 : 150 };
    const plan = prescribeWeek(athlete(), settings, now);
    assert.ok(plan.totalMinutes <= minutes && plan.totalMinutes <= settings.recent_weekly_minutes);
    assert.ok(plan.trainingDays <= 6);
    assert.ok(plan.qualityMinutes <= plan.totalMinutes * 0.2 + 1e-8);
    for (const [date, a] of Object.entries(plan.assignments)) {
      const day = (new Date(`${date}T12:00:00`).getDay() + 6) % 7;
      assert.ok(!rest_days.includes(day));
      assert.ok(a.durationMinutes <= settings.max_session_minutes);
      if (a.workout.templateId !== "endurance") assert.ok([1,4].includes(day));
    }
  }
});
test("deterministic and does not mutate availability or athlete inputs", () => {
  const input = athlete();
  const snapshot = JSON.stringify([input, base]);
  assert.deepEqual(prescribeWeek(input, base, now), prescribeWeek(input, base, now));
  assert.equal(JSON.stringify([input, base]), snapshot);
});
