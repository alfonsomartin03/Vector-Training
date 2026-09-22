const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const { PGlite } = require("@electric-sql/pglite");

const migration = (name) => readFileSync(path.resolve(__dirname, `../supabase/migrations/${name}`), "utf8");

test("security hardening enforces ownership and bounded athlete inputs", async () => {
  const db = new PGlite();
  const one = "00000000-0000-0000-0000-000000000001";
  const two = "00000000-0000-0000-0000-000000000002";
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth;
      create function auth.uid() returns uuid language sql stable as
        'select nullif(current_setting(''request.jwt.claim.sub'', true), '''')::uuid';
      create table auth.users(id uuid primary key);
      create table public.profiles(
        id uuid primary key references auth.users(id) on delete cascade,
        first_name text, last_name text, weight_kg numeric
      );
      create table public.power_profiles(
        id uuid primary key default gen_random_uuid(),
        user_id uuid not null references auth.users(id) on delete cascade,
        one_minute_watts numeric not null, five_minute_watts numeric not null,
        twelve_minute_watts numeric not null, maximal_efforts_confirmed boolean not null default false,
        recorded_at timestamptz default now()
      );
      alter table profiles enable row level security;
      alter table power_profiles enable row level security;
      create policy own_profile on profiles for all to authenticated using (id = auth.uid()) with check (id = auth.uid());
      create policy own_power on power_profiles for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
      grant usage on schema public, auth to authenticated, service_role;
      grant all on profiles, power_profiles to authenticated, service_role;
      insert into auth.users values ('${one}'), ('${two}');
      insert into profiles(id, first_name) values ('${one}', 'One'), ('${two}', 'Two');
    `);
    await db.exec(migration("20260918213000_add_physiological_tests.sql"));
    await db.exec(migration("20260921210000_training_availability.sql"));
    await db.exec(migration("20260922220000_training_progression.sql"));
    await db.exec(migration("20260922233000_security_hardening.sql"));

    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${one}';`);
    await db.query("insert into power_profiles(user_id,one_minute_watts,five_minute_watts,twelve_minute_watts) values ($1,700,400,300)", [one]);
    await assert.rejects(db.query("insert into power_profiles(user_id,one_minute_watts,five_minute_watts,twelve_minute_watts) values ($1,700,800,300)", [one]), /check constraint/);
    await assert.rejects(db.query("insert into power_profiles(user_id,one_minute_watts,five_minute_watts,twelve_minute_watts) values ($1,700,400,300)", [two]), /row-level security/);
    await assert.rejects(db.query("update profiles set first_name = $1 where id = $2", ["x".repeat(101), one]), /check constraint/);
    await assert.rejects(db.query("insert into vo2max_tests(user_id,relative_vo2max,test_date,source) values ($1,50,current_date,$2)", [one, "x".repeat(201)]), /check constraint/);
    await assert.rejects(db.query("insert into lactate_tests(user_id,lt1_power_watts,test_date,source) values ($1,250,current_date + 1,'lab')", [one]), /check constraint/);
    await assert.rejects(db.query("insert into activity_power_maxima(user_id,duration_seconds,watts,observed_at,source,external_activity_id) values ($1,60,600,now(),'activity',$2)", [one, "x".repeat(513)]), /check constraint/);

    await db.exec(`set request.jwt.claim.sub = '${two}';`);
    assert.equal((await db.query("select * from profiles where id = $1", [one])).rows.length, 0);
    assert.equal((await db.query("select * from power_profiles where user_id = $1", [one])).rows.length, 0);
  } finally {
    await db.close();
  }
});
