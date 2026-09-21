const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const { mkdtempSync, readFileSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const { after, test } = require("node:test");
const output = mkdtempSync(path.join(tmpdir(), "vector-admin-tests-"));
after(() => rmSync(output, { recursive: true, force: true }));
execFileSync(process.execPath, [require.resolve("typescript/bin/tsc"),
  "supabase/functions/accounts/handler.ts", "--ignoreConfig", "--module", "node16", "--target", "es2022",
  "--strict", "--skipLibCheck", "--rewriteRelativeImportExtensions", "--outDir", output,
], { cwd: path.resolve(__dirname, ".."), stdio: "inherit" });
const { createAccountHandler } = require(path.join(output, "handler.js"));
const validation = require(path.join(output, "validation.js"));
const adminId = "00000000-0000-0000-0000-000000000001";
const athleteId = "00000000-0000-0000-0000-000000000002";
function setup(overrides = {}) {
  const changes = [];
  const store = {
    async authenticate(token) { return token === "admin" ? { id: adminId, email: "admin@example.com" } : token === "athlete" ? { id: athleteId, email: "athlete@example.com" } : null; },
    async isAdmin(id) { return id === adminId; },
    async directory(search, page) { return { users: [], total: 0, search, page }; },
    async account(id) { return { id, email: id === adminId ? "admin@example.com" : "athlete@example.com" }; },
    async details(id, page) { return { id, page }; },
    async updateProfile(id, patch) { changes.push({ action: "profile", id, patch }); },
    async updateEmail(id, email) { changes.push({ action: "email", id, email }); },
    async setAdmin(id, enabled) { changes.push({ action: "role", id, enabled }); },
    async verifyPassword(actor, password) { return password === "correct-password"; },
    async canDelete() { return true; },
    async deleteAccount(id) { changes.push({ action: "delete", id }); },
    ...overrides,
  };
  const handler = createAccountHandler(store);
  return {
    changes, handler,
    async request(body, token = "admin") {
      const response = await handler(new Request("https://example.com/accounts", {
        method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: JSON.stringify(body),
      }));
      return { status: response.status, body: await response.json() };
    },
  };
}

test("missing, invalid and deleted sessions cannot access account APIs", async () => {
  const api = setup();
  for (const token of [null, "invalid", "deleted-user"]) assert.equal((await api.request({ action: "list" }, token)).status, 401);
  assert.equal(api.changes.length, 0);
});

test("regular athletes cannot read users, edit profiles, grant roles or delete someone else", async () => {
  const api = setup();
  for (const action of ["list", "details", "update-profile", "update-email", "set-admin", "delete-user"]) {
    const result = await api.request({ action, userId: adminId, isAdmin: true, role: "admin", password: "correct-password" }, "athlete");
    assert.equal(result.status, 403, action);
  }
  assert.equal(api.changes.length, 0);
  assert.deepEqual((await api.request({ action: "access" }, "athlete")).body, { isAdmin: false });
});

test("directory search and paging are bounded", async () => {
  const api = setup();
  assert.equal((await api.request({ action: "list", search: " test ", page: 2 })).body.search, "test");
  for (const page of [0, -1, 1.5, 100001, "1"]) assert.equal((await api.request({ action: "list", page })).status, 400);
  assert.equal((await api.request({ action: "list", search: "a".repeat(201) })).status, 400);
});

test("profile updates permit only explicitly approved fields", async () => {
  const api = setup();
  for (const profile of [{ is_admin: true }, { id: adminId }, { training_focus: {} }, { weight_kg: -1 }, { birth_date: "2026-02-30" }, { weekly_volume: "unlimited" }, {}]) {
    assert.equal((await api.request({ action: "update-profile", userId: athleteId, profile })).status, 400);
  }
  assert.equal(api.changes.length, 0);
  assert.equal((await api.request({ action: "update-profile", userId: athleteId, profile: { first_name: " Alex ", weight_kg: 70, birth_date: "1990-02-28" } })).status, 200);
  assert.equal(api.changes[0].patch.first_name, "Alex");
});

test("email and role changes require the admin's current password", async () => {
  const api = setup();
  for (const action of ["update-email", "set-admin"]) {
    assert.equal((await api.request({ action, userId: athleteId, email: "new@example.com", enabled: true, password: "wrong" })).status, 403);
  }
  assert.equal(api.changes.length, 0);
  assert.equal((await api.request({ action: "update-email", userId: athleteId, email: "NEW@example.com", password: "correct-password" })).status, 200);
  assert.equal(api.changes[0].email, "new@example.com");
  assert.equal((await api.request({ action: "set-admin", userId: adminId, enabled: false, password: "correct-password" })).status, 409);
  assert.equal((await api.request({ action: "set-admin", userId: athleteId, enabled: true, password: "correct-password" })).status, 200);
});

test("self-deletion derives its target from the token, never a submitted ID", async () => {
  const api = setup();
  const body = { action: "delete-self", confirmation: "athlete@example.com", password: "correct-password" };
  assert.equal((await api.request({ ...body, userId: adminId }, "athlete")).status, 400);
  assert.equal((await api.request({ ...body, password: "wrong" }, "athlete")).status, 403);
  assert.equal((await api.request({ ...body, confirmation: "admin@example.com" }, "athlete")).status, 400);
  assert.equal(api.changes.length, 0);
  assert.equal((await api.request(body, "athlete")).status, 200);
  assert.deepEqual(api.changes, [{ action: "delete", id: athleteId }]);
});

test("admin deletion requires exact confirmation and cannot bypass last-admin protection", async () => {
  const api = setup();
  assert.equal((await api.request({ action: "delete-user", userId: athleteId, confirmation: "wrong", password: "correct-password" })).status, 400);
  assert.equal((await api.request({ action: "delete-user", userId: athleteId, confirmation: "athlete@example.com", password: "correct-password" })).status, 200);
  const last = setup({ async canDelete() { return false; } });
  assert.equal((await last.request({ action: "delete-self", confirmation: "admin@example.com", password: "correct-password" })).status, 409);
  assert.equal(last.changes.length, 0);
});

test("malformed and oversized bodies fail without mutations; preflight needs no credentials", async () => {
  const api = setup();
  const preflight = await api.handler(new Request("https://example.com", { method: "OPTIONS" }));
  assert.equal(preflight.status, 204);
  assert.equal((await api.handler(new Request("https://example.com"))).status, 405);
  assert.equal((await api.handler(new Request("https://example.com", { method: "POST", headers: { Authorization: "Bearer admin" }, body: "bad json" }))).status, 400);
  assert.equal((await api.request({ action: "list", extra: "x".repeat(17000) })).status, 413);
  assert.equal(api.changes.length, 0);
});

function deletionAdapter({ objects = [], failFiles = false, failAuth = false } = {}) {
  let store;
  const calls = [];
  const client = {
    async rpc() { return { data: objects, error: null }; },
    storage: { from(bucket) { return { async remove(paths) {
      calls.push({ action: "files", bucket, paths });
      if (failFiles) return { error: new Error("storage") };
      objects = objects.filter(object => object.bucket_id !== bucket || !paths.includes(object.name));
      return { error: null };
    } }; } },
    auth: { admin: { async deleteUser(id, soft) { calls.push({ action: "auth", id, soft }); return { error: failAuth ? new Error("delete") : null }; } } },
  };
  const source = readFileSync(path.resolve(__dirname, "../supabase/functions/accounts/index.ts"), "utf8");
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
    exports: {}, Deno: { env: { get() { return "test"; } }, serve() {} },
    require(name) {
      if (name === "@supabase/supabase-js") return { createClient() { return client; } };
      if (name === "./handler.ts") return { createAccountHandler(value) { store = value; } };
      if (name === "./validation.ts") return validation;
      throw new Error(name);
    },
  });
  return { store, calls };
}

test("deletion removes owned files by bucket before hard-deleting Auth", async () => {
  const adapter = deletionAdapter({ objects: [{ bucket_id: "a", name: "one" }, { bucket_id: "b", name: "two" }] });
  await adapter.store.deleteAccount(athleteId);
  assert.deepEqual(adapter.calls.map(call => call.action), ["files", "files", "auth"]);
  assert.equal(adapter.calls[2].soft, false);
  assert.equal(adapter.calls[2].id, athleteId);
});

test("file cleanup failure never proceeds to Auth deletion or reports success", async () => {
  const adapter = deletionAdapter({ objects: [{ bucket_id: "a", name: "one" }], failFiles: true });
  await assert.rejects(adapter.store.deleteAccount(athleteId), /cleanup could not finish/);
  assert.equal(adapter.calls.some(call => call.action === "auth"), false);
  await assert.rejects(deletionAdapter({ failAuth: true }).store.deleteAccount(athleteId), /Deletion could not finish/);
});
