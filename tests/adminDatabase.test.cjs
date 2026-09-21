const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const { PGlite } = require("@electric-sql/pglite");

test("admin migration enforces role isolation, last-admin protection and complete data cascades", async () => {
  const db = new PGlite();
  const admin = "00000000-0000-0000-0000-000000000001";
  const athlete = "00000000-0000-0000-0000-000000000002";
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create schema storage;
      create function auth.uid() returns uuid language sql stable as
        'select nullif(current_setting(''request.jwt.claim.sub'', true), '''')::uuid';
      create table auth.users (id uuid primary key, email text, created_at timestamptz default now(), last_sign_in_at timestamptz, email_confirmed_at timestamptz);
      create table public.profiles (id uuid primary key references auth.users(id), first_name text, last_name text);
      create table public.power_profiles (id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id));
      create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner_id text, owner uuid);
      alter table storage.objects enable row level security;
      create policy owns_objects on storage.objects to authenticated using (owner_id = auth.uid()::text) with check (owner_id = auth.uid()::text);
      grant usage on schema public, auth, storage to authenticated, service_role;
      grant all on all tables in schema auth, public, storage to service_role;
      grant select, insert on storage.objects to authenticated;
      insert into auth.users(id, email) values ('${admin}', 'admin@example.com'), ('${athlete}', 'athlete@example.com');
      insert into public.profiles values ('${admin}', 'Alex', 'Admin'), ('${athlete}', 'Sam', 'Rider');
      insert into public.power_profiles(user_id) values ('${admin}'), ('${athlete}');
    `);
    await db.exec(readFileSync(path.resolve(__dirname, "../supabase/migrations/20260918213000_add_physiological_tests.sql"), "utf8"));
    await db.exec(readFileSync(path.resolve(__dirname, "../supabase/migrations/20260921160000_add_training_focus.sql"), "utf8"));
    await db.exec(readFileSync(path.resolve(__dirname, "../supabase/migrations/20260921190000_admin_accounts.sql"), "utf8"));
    await db.exec(readFileSync(path.resolve(__dirname, "../supabase/migrations/20260921210000_training_availability.sql"), "utf8"));
    await db.exec(`
      grant all on all tables in schema public to service_role;
      insert into public.training_availability(user_id, week_start, weekly_minutes, recent_weekly_minutes, max_session_minutes)
        values ('${admin}', '2026-09-21', 240, 240, 120), ('${athlete}', '2026-09-21', 180, 180, 90);
      insert into public.vo2max_tests(user_id, relative_vo2max, test_date, source) values ('${admin}', 60, '2026-09-21', 'Test'), ('${athlete}', 50, '2026-09-21', 'Test');
      insert into public.lactate_tests(user_id, lt1_power_watts, test_date, source) values ('${admin}', 250, '2026-09-21', 'Test'), ('${athlete}', 200, '2026-09-21', 'Test');
      insert into public.admin_memberships(user_id) values ('${admin}');
      set role authenticated;
      set request.jwt.claim.sub = '${athlete}';
    `);
    await assert.rejects(db.exec("select * from public.admin_memberships"), /permission denied/);
    await assert.rejects(db.query("insert into public.admin_memberships(user_id) values ($1)", [athlete]), /permission denied/);
    await assert.rejects(db.exec("select public.admin_user_directory('', 1)"), /permission denied/);
    await assert.rejects(db.query("select * from public.account_storage_objects($1)", [admin]), /permission denied/);
    await db.exec("reset role; set role service_role;");
    const directory = (await db.query("select public.admin_user_directory($1, 1) as result", ["SAM"])).rows[0].result;
    assert.equal(directory.total, 1);
    assert.equal(directory.users[0].id, athlete);
    assert.equal(directory.users[0].is_admin, false);
    const injection = (await db.query("select public.admin_user_directory($1, 1) as result", ["'; drop table auth.users; --"])).rows[0].result;
    assert.equal(injection.total, 0);
    // Last admin cannot be demoted or deleted, even through Auth cascading deletion.
    await assert.rejects(db.query("delete from public.admin_memberships where user_id = $1", [admin]), /last admin/);
    await assert.rejects(db.query("delete from auth.users where id = $1", [admin]), /last admin/);
    assert.equal((await db.query("select count(*) from public.power_profiles where user_id = $1", [admin])).rows[0].count, 1);
    await db.query("insert into public.admin_memberships(user_id) values ($1)", [athlete]);
    await db.query("delete from auth.users where id = $1", [admin]);
    for (const [table, column] of [["profiles", "id"], ["power_profiles", "user_id"], ["vo2max_tests", "user_id"], ["lactate_tests", "user_id"], ["admin_memberships", "user_id"], ["training_availability", "user_id"]]) {
      assert.equal(Number((await db.query(`select count(*) from public.${table} where ${column} = $1`, [admin])).rows[0].count), 0, table);
      assert.equal(Number((await db.query(`select count(*) from public.${table} where ${column} = $1`, [athlete])).rows[0].count), 1, `other athlete's ${table} retained`);
    }
    // Old JWT identity cannot create new files after Auth deletion.
    await db.exec(`reset role; set role authenticated; set request.jwt.claim.sub = '${admin}';`);
    await assert.rejects(db.query("insert into storage.objects(bucket_id, name, owner_id) values ('uploads', 'after-deletion', $1)", [admin]), /row-level security/);
    await db.exec(`set request.jwt.claim.sub = '${athlete}';`);
    await db.query("insert into storage.objects(bucket_id, name, owner_id) values ('uploads', 'current-user', $1)", [athlete]);
    await db.exec("reset role; set role service_role;");
    await db.query("insert into storage.objects(bucket_id, name, owner) values ('uploads', 'legacy-owned', $1)", [athlete]);
    await db.query("insert into storage.objects(bucket_id, name, owner_id, owner) values ('uploads', 'reassigned', $1, $2)", [athlete, admin]);
    const objects = (await db.query("select * from public.account_storage_objects($1)", [athlete])).rows;
    assert.equal(objects.length, 3);
    assert.equal((await db.query("select * from public.account_storage_objects($1)", [admin])).rows.length, 0);
    // Include accounts without profiles, and paginate deterministically.
    await db.exec("insert into auth.users(id, email) select gen_random_uuid(), 'user' || i || '@example.com' from generate_series(1, 30) i");
    const firstPage = (await db.query("select public.admin_user_directory('', 1) as result")).rows[0].result;
    const nextPage = (await db.query("select public.admin_user_directory('', 2) as result")).rows[0].result;
    assert.equal(firstPage.total, 31);
    assert.equal(firstPage.users.length, 25);
    assert.equal(nextPage.users.length, 6);
    assert.equal(new Set([...firstPage.users, ...nextPage.users].map(user => user.id)).size, 31);
  } finally { await db.close(); }
});
