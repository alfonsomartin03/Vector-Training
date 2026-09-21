const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const { mkdtempSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const path = require("node:path");
const { after, test } = require("node:test");

const output = mkdtempSync(path.join(tmpdir(), "vector-workout-tests-"));
after(() => rmSync(output, { recursive: true, force: true }));
execFileSync(process.execPath, [
  require.resolve("typescript/bin/tsc"),
  "src/lib/training/workouts/index.ts",
  "--ignoreConfig", "--module", "node16", "--target", "es2020", "--strict",
  "--skipLibCheck", "--outDir", output,
], { cwd: path.resolve(__dirname, ".."), stdio: "inherit" });
const { buildWorkout, WORKOUT_LIBRARY } = require(path.join(output, "index.js"));

test("all six defaults expand to the expected work dose and total duration", () => {
  const expected = {
    endurance: [3600, 3600, 1],
    lt1: [8040, 5400, 3],
    "sweet-spot": [6900, 3600, 4],
    threshold: [5760, 2400, 5],
    "vo2-long": [5100, 1500, 5],
    "vo2-30-15": [3870, 780, 26],
  };
  assert.deepEqual(Object.keys(WORKOUT_LIBRARY).sort(), Object.keys(expected).sort());
  for (const [id, [duration, work, repetitions]] of Object.entries(expected)) {
    const workout = buildWorkout(id);
    assert.equal(workout.durationSeconds, duration, id);
    assert.equal(workout.workSeconds, work, id);
    assert.equal(workout.steps.filter(step => step.role === "work").length, repetitions, id);
    assert.deepEqual(JSON.parse(JSON.stringify(workout)), workout);
  }
});

test("endurance scales by 30 minutes without extra segments", () => {
  const workout = buildWorkout("endurance", { durationMinutes: 150 });
  assert.equal(workout.durationSeconds, 9000);
  assert.equal(workout.steps.length, 1);
});

test("long intervals have recovery only between reps and sets", () => {
  const workout = buildWorkout("threshold", { repetitionsPerSet: 2, sets: 2 });
  assert.deepEqual(workout.steps.map(step => step.durationSeconds), [
    1200, 480, 240, 480, 300, 480, 240, 480, 1200,
  ]);
  const single = buildWorkout("threshold", { repetitionsPerSet: 1 });
  assert.deepEqual(single.steps.map(step => step.role), ["warmup", "work", "cooldown"]);
});

test("microinterval sets preserve each 15-second recovery and insert one set break", () => {
  const workout = buildWorkout("vo2-30-15");
  const recovery = workout.steps.filter(step => step.role === "recovery");
  assert.equal(recovery.filter(step => step.durationSeconds === 15).length, 26);
  assert.equal(recovery.filter(step => step.durationSeconds === 300).length, 1);
  assert.equal(buildWorkout("vo2-30-15", { sets: 3 }).workSeconds, 1170);
});

test("symbolic power targets preserve the requested references", () => {
  const target = id => buildWorkout(id).steps.find(step => step.role === "work").target;
  assert.deepEqual(target("lt1"), { kind: "zone", zone: "z2", position: "top" });
  assert.deepEqual(target("sweet-spot"), { kind: "cp-fraction", fraction: 0.9 });
  assert.deepEqual(target("threshold"), { kind: "cp-fraction", fraction: 1 });
  assert.deepEqual(target("vo2-long"), { kind: "cp-fraction", fraction: 1.2 });
  assert.deepEqual(target("vo2-30-15"), { kind: "five-minute-max" });
});

test("invalid scales and unsupported parameters are rejected", () => {
  for (const durationMinutes of [0, 59, 75, NaN, Infinity, 60.5]) {
    assert.throws(() => buildWorkout("endurance", { durationMinutes }));
  }
  for (const repetitionsPerSet of [0, -1, 1.5, NaN, Infinity, 1001]) {
    assert.throws(() => buildWorkout("threshold", { repetitionsPerSet }));
  }
  assert.throws(() => buildWorkout("threshold", { sets: 0 }));
  assert.throws(() => buildWorkout("threshold", { durationMinutes: 60 }));
  assert.throws(() => buildWorkout("endurance", { sets: 2 }));
  assert.throws(() => buildWorkout("missing"));
  assert.throws(() => buildWorkout("toString"));
});

test("editing generated steps does not mutate another step or the template", () => {
  const workout = buildWorkout("threshold");
  workout.steps[1].target.fraction = 2;
  workout.steps[0].durationSeconds = 1;
  assert.equal(workout.steps[3].target.fraction, 1);
  assert.equal(buildWorkout("threshold").steps[1].target.fraction, 1);
  assert.equal(buildWorkout("threshold").steps[0].durationSeconds, 1200);
});
