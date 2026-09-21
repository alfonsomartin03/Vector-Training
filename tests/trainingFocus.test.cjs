const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const { mkdtempSync, readFileSync, rmSync } = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const { tmpdir } = require("node:os");
const path = require("node:path");
const { after, test } = require("node:test");

const output = mkdtempSync(path.join(tmpdir(), "vector-focus-tests-"));
after(() => rmSync(output, { recursive: true, force: true }));
execFileSync(process.execPath, [
  require.resolve("typescript/bin/tsc"), "src/lib/training/focus.ts",
  "--ignoreConfig", "--module", "node16", "--target", "es2020", "--strict",
  "--skipLibCheck", "--rootDir", "src", "--outDir", output,
], { cwd: path.resolve(__dirname, ".."), stdio: "inherit" });
const { classifyTrainingFocus, getTrainingFocusDisplay, TRAINING_FOCUSES } =
  require(path.join(output, "lib/training/focus.js"));

const now = new Date("2026-09-21T12:00:00Z");
function athlete(cp = 300, fiveMinute = 375) {
  // Known Morton model, k = -120 seconds, used to synthesize consistent efforts.
  const wPrime = (fiveMinute - cp) * 420;
  return { powerProfile: {
    id: "power-1", user_id: "athlete-1", maximal_efforts_confirmed: true,
    recorded_at: "2026-09-20T12:00:00Z",
    one_minute_watts: cp + wPrime / 180,
    five_minute_watts: fiveMinute,
    twelve_minute_watts: cp + wPrime / 840,
  } };
}

test("three provisional buckets reflect relative power, independently of absolute level", () => {
  for (const [ratio, tag] of [[0.7, "sustainable_power"], [0.8, "balanced"], [0.9, "aerobic_ceiling"]]) {
    for (const fiveMinute of [200, 400]) {
      const result = classifyTrainingFocus(athlete(fiveMinute * ratio, fiveMinute), now);
      assert.equal(result.tag, tag);
      assert.equal(result.status, "provisional");
      assert.ok(Math.abs(result.cpToFiveMinuteRatio - ratio) < 1e-12);
      assert.ok(TRAINING_FOCUSES[tag].workoutIds.includes("endurance"));
      assert.match(getTrainingFocusDisplay(result).description, /provisional/);
    }
  }
});

test("75% and 85% belong to balanced; comparisons are not rounded to whole percentages", () => {
  for (const [ratio, tag] of [[0.7499, "sustainable_power"], [0.75, "balanced"], [0.85, "balanced"], [0.8501, "aerobic_ceiling"]]) {
    assert.equal(classifyTrainingFocus(athlete(ratio * 400, 400), now).tag, tag, String(ratio));
  }
});

test("missing, unconfirmed and invalid efforts do not assign a bucket", () => {
  assert.equal(classifyTrainingFocus({ powerProfile: null }, now).tag, null);
  for (const changes of [
    { maximal_efforts_confirmed: false },
    { one_minute_watts: 0 }, { five_minute_watts: NaN },
    { twelve_minute_watts: 900 }, { five_minute_watts: "garbage" },
  ]) {
    const data = athlete();
    Object.assign(data.powerProfile, changes);
    assert.equal(classifyTrainingFocus(data, now).status, "needs_data");
  }
});

test("freshness boundaries, absent dates and future dates", () => {
  for (const [recorded, status] of [
    [null, "needs_data"], ["invalid", "needs_data"],
    ["2026-09-22T00:00:00Z", "needs_data"],
    [new Date(now.getTime() - 90 * 86400000).toISOString(), "provisional"],
    [new Date(now.getTime() - 90 * 86400000 - 1).toISOString(), "needs_data"],
  ]) {
    const data = athlete();
    data.powerProfile.recorded_at = recorded;
    assert.equal(classifyTrainingFocus(data, now).status, status);
  }
});

test("results serialize deterministically and accept database numeric strings", () => {
  const data = athlete();
  for (const key of ["one_minute_watts", "five_minute_watts", "twelve_minute_watts"]) {
    data.powerProfile[key] = String(data.powerProfile[key]);
  }
  const result = classifyTrainingFocus(data, now);
  assert.equal(result.tag, "balanced");
  assert.deepEqual(JSON.parse(JSON.stringify(result)), result);
  assert.deepEqual(classifyTrainingFocus(data, now), result);
});

test("measured VO2 alone cannot identify a physiological limiter", () => {
  assert.equal(classifyTrainingFocus({ powerProfile: null, vo2MaxTest: { relative_vo2max: 80 } }, now).tag, null);
  const data = athlete();
  assert.deepEqual(classifyTrainingFocus({ ...data, vo2MaxTest: { relative_vo2max: 80 } }, now), classifyTrainingFocus(data, now));
});

// Execute the actual data loader with a narrow Supabase transport stub. SQL itself
// is verified separately against PostgreSQL in trainingFocusDatabase.test.cjs.
function loader({ profile = {}, savedFocus = null, conflict = false, writeError = false } = {}) {
  const writes = [];
  let revision = 0;
  const data = athlete();
  data.powerProfile.recorded_at = new Date(Date.now() - 1000).toISOString();
  const source = readFileSync(path.resolve(__dirname, "../src/lib/athlete.ts"), "utf8");
  const javascript = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  const client = {
    from(table) {
      let payload;
      const filters = {};
      const query = {
        select() { return query; }, order() { return query; }, limit() { return query; },
        eq(key, value) { filters[key] = value; return query; },
        update(value) { payload = value; return query; },
        async single() { return query.maybeSingle(); },
        async maybeSingle() {
          if (table === "profiles" && payload) {
            writes.push({ payload, filters });
            if (writeError) return { data: null, error: { message: "Permission denied" } };
            if (conflict && writes.length === 1) {
              revision++;
              return { data: null, error: null };
            }
            return { data: {
              ...payload, training_focus_tag: payload.training_focus.tag, training_focus_revision: revision,
            }, error: null };
          }
          if (table === "profiles") return { data: {
            id: "athlete-1", training_focus_revision: revision, training_focus: savedFocus, ...profile,
          }, error: null };
          return { data: table === "power_profiles" ? data.powerProfile : null, error: null };
        },
      };
      return query;
    },
  };
  vm.runInNewContext(javascript, {
    exports, console: { error() {} },
    require(name) {
      if (name === "./supabase") return { supabase: client };
      if (name === "./training/focus") return { classifyTrainingFocus };
      throw new Error(`Unexpected dependency ${name}`);
    },
  });
  return { read: () => exports.getAthleteData("athlete-1"), writes, data };
}

test("athlete loader saves the assessment to its profile with a revision guard", async () => {
  const transport = loader();
  const result = await transport.read();
  assert.equal(result.profile.training_focus_tag, "balanced");
  assert.equal(transport.writes.length, 1);
  assert.equal(transport.writes[0].filters.id, "athlete-1");
  assert.equal(transport.writes[0].filters.training_focus_revision, 0);
});

test("unchanged JSONB assessments skip writes even if property order differs", async () => {
  const transport = loader();
  const focus = classifyTrainingFocus(transport.data);
  const savedFocus = Object.fromEntries(Object.entries(focus).reverse());
  // Keep the same source date across the independent fake clients.
  const second = loader({ savedFocus });
  second.data.powerProfile.recorded_at = transport.data.powerProfile.recorded_at;
  await second.read();
  assert.equal(second.writes.length, 0);
});

test("source revisions cause a fresh read and bounded retry", async () => {
  const transport = loader({ conflict: true });
  const result = await transport.read();
  assert.equal(transport.writes.length, 2);
  assert.equal(transport.writes[1].filters.training_focus_revision, 1);
  assert.equal(result.profile.training_focus_tag, "balanced");
});

test("save failure and missing migration keep athlete data available without a false saved focus", async () => {
  for (const options of [{ writeError: true }, { profile: { training_focus_revision: undefined } }]) {
    const result = await loader(options).read();
    assert.ok(result.powerProfile);
    assert.equal(result.profile.training_focus, null);
    assert.ok(result.focusSyncError);
  }
});
