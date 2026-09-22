const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const { PGlite } = require("@electric-sql/pglite");

test("training progression tables enforce ownership, bounds, uniqueness and cascade deletion", async () => {
  const db = new PGlite();
  const one = "00000000-0000-0000-0000-000000000001";
  const two = "00000000-0000-0000-0000-000000000002";
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create function auth.uid() returns uuid language sql stable as 'select nullif(current_setting(''request.jwt.claim.sub'', true), '''')::uuid';
      create table auth.users(id uuid primary key);
      create table public.profiles(id uuid primary key references auth.users(id) on delete cascade);
      grant usage on schema public, auth to authenticated;
      insert into auth.users values ('${one}'), ('${two}'); insert into profiles select id from auth.users;`);
    await db.exec(readFileSync(path.resolve(__dirname, "../supabase/migrations/20260922220000_training_progression.sql"), "utf8"));
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${one}';`);
    const workout = `insert into training_workout_history
      (user_id,scheduled_date,template_id,focus_id,progression_level,prescription_version,planned_duration_minutes,planned_work_minutes,completed_duration_minutes,completion_ratio,parameters)
      values ($1,$2,$3,'balanced',0,2,90,20,90,1,'{}')`;
    await db.query(workout, [one, "2026-09-21", "threshold"]);
    await assert.rejects(db.query(workout, [two, "2026-09-21", "threshold"]), /row-level security/);
    await assert.rejects(db.query(workout, [one, "2026-09-22", "unknown"]), /check constraint/);
    await assert.rejects(db.query(workout, [one, "2026-09-21", "threshold"]), /unique constraint/);
    await db.query("insert into activity_power_maxima(user_id,duration_seconds,watts,observed_at,source) values ($1,300,410,'2026-09-21T12:00:00Z','activity')", [one]);
    await assert.rejects(db.query("insert into activity_power_maxima(user_id,duration_seconds,watts,observed_at,source) values ($1,300,410,'2026-09-21T12:00:00Z','activity')", [one]), /unique constraint/);
    await assert.rejects(db.query("insert into activity_power_maxima(user_id,duration_seconds,watts,observed_at,source) values ($1,0,410,now(),'activity')", [one]), /check constraint/);
    await db.exec(`set request.jwt.claim.sub = '${two}';`);
    assert.equal((await db.query("select * from training_workout_history")).rows.length, 0);
    assert.equal((await db.query("select * from activity_power_maxima")).rows.length, 0);
    await db.exec("reset role; set role anon;");
    await assert.rejects(db.query("select * from training_workout_history"), /permission denied/);
    await db.exec(`reset role; delete from auth.users where id = '${one}';`);
    assert.equal((await db.query("select * from training_workout_history")).rows.length, 0);
    assert.equal((await db.query("select * from activity_power_maxima")).rows.length, 0);
  } finally {
    await db.close();
  }
});
