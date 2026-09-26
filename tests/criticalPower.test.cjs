const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const { mkdtempSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const path = require("node:path");
const { after, test } = require("node:test");

const output = mkdtempSync(path.join(tmpdir(), "vector-critical-power-"));
after(() => rmSync(output, { recursive: true, force: true }));
execFileSync(process.execPath, [
  require.resolve("typescript/bin/tsc"),
  "src/lib/physiology/athleteModel.ts",
  "--ignoreConfig", "--module", "node16", "--target", "es2020", "--strict",
  "--skipLibCheck", "--rootDir", "src", "--outDir", output,
], { cwd: path.resolve(__dirname, ".."), stdio: "inherit" });

const {
  calculateCriticalPowerFromProfile,
  isValidCriticalPowerProfile,
} = require(path.join(output, "lib/physiology/criticalPower.js"));
const { buildAthleteModel } = require(path.join(output, "lib/physiology/athleteModel.js"));

test("profile validation accepts a consistent Morton model", () => {
  const cp = 300;
  const wPrime = 31_500;
  const efforts = [cp + wPrime / 180, cp + wPrime / 420, cp + wPrime / 840];
  assert.equal(isValidCriticalPowerProfile(...efforts), true);
  assert.ok(Math.abs(calculateCriticalPowerFromProfile(...efforts).cpWatts - cp) < 1e-9);
});

test("profile validation rejects decreasing efforts that imply invalid CP", () => {
  assert.equal(isValidCriticalPowerProfile(1000, 500, 490), false);
});

test("legacy invalid profiles return no athlete model without logging an error", () => {
  const originalError = console.error;
  let calls = 0;
  console.error = () => { calls += 1; };
  try {
    const model = buildAthleteModel({
      profile: { id: "athlete-1", weight_kg: 70 },
      powerProfile: {
        user_id: "athlete-1", one_minute_watts: 1000, five_minute_watts: 500,
        twelve_minute_watts: 490, maximal_efforts_confirmed: true, recorded_at: null,
      },
      vo2MaxTest: null,
      lactateTest: null,
    });
    assert.equal(model, null);
    assert.equal(calls, 0);
  } finally {
    console.error = originalError;
  }
});
