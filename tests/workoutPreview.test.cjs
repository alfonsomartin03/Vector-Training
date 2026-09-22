const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const { mkdtempSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const path = require("node:path");
const { after, test } = require("node:test");
const output = mkdtempSync(path.join(tmpdir(), "vector-preview-"));
after(() => rmSync(output, { recursive: true, force: true }));
execFileSync(process.execPath, [require.resolve("typescript/bin/tsc"), "src/lib/training/workoutPreview.ts", "--ignoreConfig", "--module", "node16", "--target", "es2020", "--strict", "--skipLibCheck", "--rootDir", "src", "--outDir", output], { cwd: path.resolve(__dirname, ".."), stdio: "inherit" });
const { workoutPreview, previewDuration } = require(path.join(output, "lib/training/workoutPreview.js"));
const { buildWorkout } = require(path.join(output, "lib/training/workouts/index.js"));
test("endurance estimates use duration-weighted power and mechanical work", () => {
  const result = workoutPreview(buildWorkout("endurance"), 200, 300);
  assert.equal(result.averageWatts, 131);
  assert.equal(result.workKj, 471.6);
  assert.equal(result.aboveCpKj, 0);
});
test("every interval and recovery occupies its exact timeline duration", () => {
  for (const id of ["endurance", "lt1", "sweet-spot", "threshold", "vo2-long", "vo2-30-15"]) {
    const workout = buildWorkout(id);
    const preview = workoutPreview(workout, 250, 340);
    let elapsed = 0;
    for (const block of preview.blocks) { assert.equal(block.startSeconds, elapsed); elapsed += block.durationSeconds; }
    assert.equal(elapsed, workout.durationSeconds);
    assert.equal(preview.workMinutes, workout.workSeconds / 60);
  }
});
test("missing CP never fabricates watt-based statistics", () => {
  const preview = workoutPreview(buildWorkout("vo2-30-15"), null, null);
  assert.equal(preview.averageWatts, null);
  assert.equal(preview.workKj, null);
  assert.equal(preview.aboveCpKj, null);
  assert.equal(previewDuration(75), "1m 15s");
  assert.equal(previewDuration(5400), "1h 30m");
});
