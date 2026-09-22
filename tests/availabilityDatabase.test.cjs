const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const { PGlite } = require("@electric-sql/pglite");
test("availability migration enforces ownership, validation, rollover ordering and cascade deletion", async () => {
  const db = new PGlite();
  const one = "00000000-0000-0000-0000-000000000001", two = "00000000-0000-0000-0000-000000000002";
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create function auth.uid() returns uuid language sql stable as 'select nullif(current_setting(''request.jwt.claim.sub'', true), '''')::uuid';
      create table auth.users(id uuid primary key);
      create table public.profiles(id uuid primary key references auth.users(id) on delete cascade);
      grant usage on schema public, auth to authenticated;
      insert into auth.users values ('${one}'), ('${two}'); insert into profiles select id from auth.users;`);
    await db.exec(readFileSync(path.resolve(__dirname, "../supabase/migrations/20260921210000_training_availability.sql"), "utf8"));
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${one}';`);
    const insert = "insert into training_availability(user_id, week_start, weekly_minutes, recent_weekly_minutes, max_session_minutes, rest_days) values ($1,$2,$3,240,120,$4)";
    await db.query(insert, [one, "2026-09-21", 240, [0,2]]);
    await db.query(insert, [one, "2026-09-28", 120, [0,2,4]]);
    await assert.rejects(db.query(insert, [two, "2026-09-21", 240, [0]]), /row-level security/);
    for (const [date, minutes, rest] of [["2026-09-22",240,[0]], ["2026-10-05",-1,[0]], ["2026-10-05",240,[0,0]], ["2026-10-05",240,[7]], ["2026-10-05",240,[null]]]) await assert.rejects(db.query(insert, [one,date,minutes,rest]), /check constraint/);
    assert.equal((await db.query("select weekly_minutes from training_availability where week_start <= '2026-09-21' order by week_start desc limit 1")).rows[0].weekly_minutes, 240);
    await db.exec(`set request.jwt.claim.sub = '${two}';`);
    assert.equal((await db.query("select * from training_availability")).rows.length, 0);
    assert.equal((await db.query("update training_availability set weekly_minutes = 0 returning *")).rows.length, 0);
    assert.equal((await db.query("delete from training_availability returning *")).rows.length, 0);
    await db.query(insert, [two, "2026-09-21", 180, [0]]);
    await db.exec("reset role; set role anon;");
    await assert.rejects(db.query("select * from training_availability"), /permission denied/);
    await db.exec(`reset role; delete from auth.users where id = '${one}';`);
    assert.equal((await db.query("select * from training_availability where user_id = $1", [one])).rows.length, 0);
    assert.equal((await db.query("select * from training_availability where user_id = $1", [two])).rows.length, 1);
  } finally { await db.close(); }
});
