const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const { PGlite } = require("@electric-sql/pglite");

test("focus migration: persistence, invalidation, revision guards and profile ownership", async () => {
  const db = new PGlite();
  const first = "00000000-0000-0000-0000-000000000001";
  const second = "00000000-0000-0000-0000-000000000002";
  try {
    await db.exec(`
      create table public.profiles (id uuid primary key);
      create table public.power_profiles (id int primary key, user_id uuid references public.profiles(id), watts numeric);
      insert into public.profiles values ('${first}'), ('${second}');
      create role athlete;
      grant usage on schema public to athlete;
      grant select, update on public.profiles to athlete;
      grant select, insert, update, delete on public.power_profiles to athlete;
      alter table public.profiles enable row level security;
      create policy own_profile on public.profiles to athlete
        using (id = current_setting('app.user_id')::uuid)
        with check (id = current_setting('app.user_id')::uuid);
      alter table public.power_profiles enable row level security;
      create policy own_power on public.power_profiles to athlete
        using (user_id = current_setting('app.user_id')::uuid)
        with check (user_id = current_setting('app.user_id')::uuid);
    `);
    await db.exec(readFileSync(path.resolve(__dirname, "../supabase/migrations/20260921160000_add_training_focus.sql"), "utf8"));
    await db.exec(`set role athlete; set app.user_id = '${first}';`);
    const focus = { version: 1, tag: "balanced", status: "provisional", reason: "Test assessment" };
    const save = (revision) => db.query(
      "update public.profiles set training_focus = $1 where id = $2 and training_focus_revision = $3 returning training_focus_tag",
      [JSON.stringify(focus), first, revision],
    );
    assert.equal((await save(0)).rows[0].training_focus_tag, "balanced");
    assert.equal((await db.query("select * from public.profiles where id = $1", [second])).rows.length, 0);
    assert.equal((await db.query("update public.profiles set training_focus = $1 where id = $2 returning id", [JSON.stringify(focus), second])).rows.length, 0);
    await assert.rejects(db.query("insert into public.power_profiles values (99, $1, 300)", [second]));
    await db.query("insert into public.power_profiles values (1, $1, 300)", [first]);
    let row = (await db.query("select * from public.profiles")).rows[0];
    assert.equal(row.training_focus, null);
    assert.equal(Number(row.training_focus_revision), 1);
    assert.equal((await save(0)).rows.length, 0, "outdated classifier cannot overwrite newer inputs");
    await save(1);
    await db.exec("update public.power_profiles set watts = 320 where id = 1");
    row = (await db.query("select * from public.profiles")).rows[0];
    assert.equal(row.training_focus_tag, null);
    assert.equal(Number(row.training_focus_revision), 2);
    await save(2);
    await db.exec("delete from public.power_profiles where id = 1");
    row = (await db.query("select * from public.profiles")).rows[0];
    assert.equal(row.training_focus, null);
    assert.equal(Number(row.training_focus_revision), 3);
    for (const invalid of [
      { ...focus, tag: "unknown" }, { ...focus, status: "unknown" },
      { ...focus, tag: null }, { ...focus, version: 2 }, {}, [],
      { ...focus, status: null },
    ]) {
      await assert.rejects(db.query("update public.profiles set training_focus = $1 where id = $2", [JSON.stringify(invalid), first]));
    }
    await db.query("update public.profiles set training_focus = $1 where id = $2", [JSON.stringify({ ...focus, tag: null, status: "needs_data" }), first]);
    assert.equal((await db.query("select training_focus_tag from public.profiles")).rows[0].training_focus_tag, null);
  } finally {
    await db.close();
  }
});
