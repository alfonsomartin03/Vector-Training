const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const { mkdtempSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const path = require("node:path");
const { after, test } = require("node:test");

const output = mkdtempSync(path.join(tmpdir(), "vector-progress-tests-"));
after(() => rmSync(output, { recursive: true, force: true }));
execFileSync(process.execPath, [
  require.resolve("typescript/bin/tsc"), "src/lib/physiology/progress.ts",
  "--ignoreConfig", "--module", "node16", "--target", "es2020", "--strict",
  "--skipLibCheck", "--rootDir", "src", "--outDir", output,
], { cwd: path.resolve(__dirname, ".."), stdio: "inherit" });

const { buildAthleteProgress } = require(path.join(output, "lib/physiology/progress.js"));

function powerPoint(cp, fiveMinute, date) {
  const wPrime = (fiveMinute - cp) * 420;
  return {
    id: date,
    user_id: "athlete-1",
    one_minute_watts: cp + wPrime / 180,
    five_minute_watts: fiveMinute,
    twelve_minute_watts: cp + wPrime / 840,
    maximal_efforts_confirmed: true,
    recorded_at: date,
  };
}

function athlete(changes = {}) {
  const powerHistory = [
    powerPoint(300, 375, "2026-09-21T12:00:00Z"),
    powerPoint(280, 360, "2026-08-21T12:00:00Z"),
  ];
  return {
    profile: { id: "athlete-1", weight_kg: 70 },
    powerProfile: powerHistory[0],
    powerHistory,
    vo2MaxTest: null,
    vo2MaxHistory: [],
    lactateTest: null,
    lactateHistory: [],
    ...changes,
  };
}

test("power data points update CP, W-prime, effort and estimated VO2 trends", () => {
  const progress = buildAthleteProgress(athlete());
  assert.ok(Math.abs(progress.criticalPower.current - 300) < 1e-6);
  assert.ok(Math.abs(progress.criticalPower.previous - 280) < 1e-6);
  assert.equal(progress.criticalPower.direction, "up");
  assert.equal(progress.wPrime.direction, "down");
  assert.equal(progress.fiveMinutePower.delta, 15);
  assert.equal(progress.vo2Max.direction, "up");
  assert.equal(progress.criticalPower.currentDate, "2026-09-21T12:00:00Z");
});

test("measured VO2 compares measured tests instead of estimated power values", () => {
  const vo2MaxHistory = [
    { relative_vo2max: 64, absolute_vo2_l_min: null, body_mass_kg: 70, test_date: "2026-09-20" },
    { relative_vo2max: null, absolute_vo2_l_min: 4.2, body_mass_kg: 70, test_date: "2026-06-20" },
  ];
  const progress = buildAthleteProgress(athlete({
    vo2MaxTest: vo2MaxHistory[0],
    vo2MaxHistory,
  }));
  assert.equal(progress.vo2Max.current, 64);
  assert.equal(progress.vo2Max.previous, 60);
  assert.equal(progress.vo2Max.direction, "up");
});

test("optional lab metrics skip missing points and use the previous valid observation", () => {
  const lactateHistory = [
    { lt1_power_watts: 220, lt2_power_watts: null, test_date: "2026-09-20" },
    { lt1_power_watts: null, lt2_power_watts: 300, test_date: "2026-08-20" },
    { lt1_power_watts: 200, lt2_power_watts: 290, test_date: "2026-07-20" },
  ];
  const progress = buildAthleteProgress(athlete({
    lactateTest: lactateHistory[0],
    lactateHistory,
  }));
  assert.equal(progress.lt1Power.delta, 20);
  assert.equal(progress.lt2Power.delta, 10);
});

test("one data point reports a baseline rather than inventing a zero trend", () => {
  const current = powerPoint(300, 375, "2026-09-21T12:00:00Z");
  const progress = buildAthleteProgress(athlete({ powerProfile: current, powerHistory: [current] }));
  assert.equal(progress.criticalPower, null);
  assert.equal(progress.oneMinutePower, null);
});
