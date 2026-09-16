import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import ts from "typescript";

const root = path.resolve(import.meta.dirname, "..");
const read = (file) => readFileSync(path.join(root, file), "utf8");
const require = createRequire(import.meta.url);
function compile(file, mocks = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(read(file), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  new Function("require", "module", "exports", code)(
    (name) => {
      if (name in mocks) return mocks[name];
      assert.ok(!name.startsWith("@/"), `测试缺少假体：${name}`);
      return require(name);
    },
    module,
    module.exports,
  );
  return module.exports;
}

const errors = compile("lib/auth/errors.ts");
const user = {
  id: "test-current-account",
  email: "fixture@example.invalid",
  is_anonymous: false,
};
const oldPassword = "Old-Fixture-Only-123";
const newPassword = "New-Fixture-Only-456";
let calls;
let scenario;
function reset(overrides = {}) {
  calls = { getUser: 0, create: 0, verify: 0, update: 0, cleanup: 0 };
  scenario = overrides;
}
const sessionClient = {
  auth: {
    getUser: async () => {
      calls.getUser++;
      if (scenario.getUserThrows) throw new Error("PRIVATE-FAILURE");
      return {
        data: { user: scenario.noUser ? null : { ...user, ...scenario.user } },
        error: scenario.userError ?? null,
      };
    },
  },
};
const { changePassword } = compile("lib/auth/password-change.ts", {
  "server-only": {},
  "@/lib/auth/errors": errors,
  "@/lib/supabase/config": {
    getSupabaseConfig: () => ({
      supabaseUrl: "https://example.invalid",
      supabasePublishableKey: "public-fixture",
    }),
  },
  "@supabase/supabase-js": {
    createClient: (_url, _key, options) => {
      calls.create++;
      assert.deepEqual(options.auth, {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      });
      return {
        auth: {
          signInWithPassword: async (input) => {
            calls.verify++;
            assert.equal(input.email, user.email);
            if (scenario.verifyThrows) throw new Error("PRIVATE-FAILURE");
            return {
              data: {
                user: { ...user, ...scenario.verifiedUser },
                session: scenario.noSession
                  ? null
                  : { access_token: "private-fixture-token" },
              },
              error: scenario.verifyError ?? null,
            };
          },
          updateUser: async (input) => {
            calls.update++;
            assert.deepEqual(input, {
              password: newPassword,
              current_password: oldPassword,
              data: { account_password_configured: true },
            });
            if (scenario.updateThrows) throw new Error("PRIVATE-FAILURE");
            return {
              data: {
                user: scenario.noUpdatedUser
                  ? null
                  : { ...user, ...scenario.updatedUser },
              },
              error: scenario.updateError ?? null,
            };
          },
          signOut: async (options) => {
            calls.cleanup++;
            assert.deepEqual(options, { scope: "local" });
            if (scenario.cleanupThrows) throw new Error("PRIVATE-FAILURE");
            return { error: scenario.cleanupError ?? null };
          },
        },
      };
    },
  },
});
function form(overrides = {}) {
  const value = new FormData();
  for (const [key, input] of Object.entries({
    currentPassword: oldPassword,
    password: newPassword,
    confirmPassword: newPassword,
    ...overrides,
  }))
    value.set(key, input);
  return value;
}
async function run(overrides = {}, fields = {}) {
  reset(overrides);
  const result = await changePassword(sessionClient, form(fields));
  assert.doesNotMatch(
    JSON.stringify(result),
    /Old-Fixture|New-Fixture|fixture@example|private-fixture-token|PRIVATE-FAILURE/,
  );
  return result;
}

for (const fields of [
  { currentPassword: "" },
  { currentPassword: "x".repeat(1025) },
  { password: "short", confirmPassword: "short" },
  { password: "😀".repeat(19), confirmPassword: "😀".repeat(19) },
  { password: oldPassword, confirmPassword: oldPassword },
  { confirmPassword: "different" },
  { currentPassword: new Blob(["file"]) },
]) {
  assert.equal((await run({}, fields)).status, "error");
  assert.equal(calls.create, 0);
  assert.equal(calls.update, 0);
}
for (const overrides of [
  { noUser: true },
  { userError: { code: "session_not_found" } },
  { getUserThrows: true },
  { user: { is_anonymous: true } },
  { user: { email: null } },
]) {
  assert.equal((await run(overrides)).status, "error");
  assert.equal(calls.create, 0);
}
for (const overrides of [
  { verifyError: { code: "invalid_credentials" } },
  { verifyError: { code: "over_request_rate_limit" } },
  { verifyThrows: true },
  { noSession: true },
  { verifiedUser: { id: "another-account" } },
  { verifiedUser: { is_anonymous: true } },
]) {
  assert.equal((await run(overrides)).status, "error");
  assert.equal(calls.update, 0);
  assert.equal(calls.cleanup, 1);
}
for (const code of [
  "weak_password",
  "same_password",
  "reauthentication_needed",
  "unexpected_error",
]) {
  const result = await run({ updateError: { code } });
  assert.equal(result.status, "error");
  assert.equal(calls.update, 1);
  assert.equal(calls.cleanup, 1);
}
assert.match((await run({ updateThrows: true })).message, /确认|新密码/);
assert.equal((await run({ noUpdatedUser: true })).status, "error");
for (const overrides of [
  {},
  { cleanupThrows: true },
  { cleanupError: { code: "network" } },
  { user: { user_metadata: { account_password_configured: false } } },
]) {
  assert.equal((await run(overrides)).status, "success");
  assert.equal(calls.verify, 1);
  assert.equal(calls.update, 1);
  assert.equal(calls.cleanup, 1);
}

let activeUser = user;
const registrationWrites = [];
let delegated = 0;
const { setAccountPassword, registerCurrentAccount } = compile(
  "lib/auth/actions.ts",
  {
    "next/cache": { revalidatePath: () => {} },
    "next/navigation": {
      redirect: (url) => {
        throw new Error(`REDIRECT:${url}`);
      },
    },
    "@/lib/auth/errors": errors,
    "@/lib/onboarding/model": {
      FIRST_USE_METADATA: { ensemble_onboarding: "pending" },
    },
    "@/lib/auth/password-change": {
      changePassword: async (client, data) => {
        delegated++;
        assert.ok(client.auth);
        assert.ok(data instanceof FormData);
        return { status: "error", message: "需要原密码" };
      },
    },
    "@/lib/supabase/server": {
      createClient: async () => ({
        auth: {
          getUser: async () => ({ data: { user: activeUser }, error: null }),
          updateUser: async (input) => {
            registrationWrites.push(input);
            return {
              data: { user: { ...user, id: activeUser.id } },
              error: null,
            };
          },
        },
      }),
    },
  },
);
assert.equal(
  (await setAccountPassword(errors.initialAuthState, form())).status,
  "error",
);
assert.equal(delegated, 1);
assert.equal(registrationWrites.length, 0);
activeUser = { ...user, is_anonymous: true };
const registration = await registerCurrentAccount(
  errors.initialAuthState,
  form({ email: user.email }),
);
assert.equal(registration.status, "success");
assert.equal(registrationWrites.length, 1);
assert.equal(registrationWrites[0].email, user.email);
assert.equal(registrationWrites[0].password, newPassword);
assert.equal(registrationWrites[0].data.account_password_configured, true);
const source = read("lib/auth/password-change.ts");
assert.doesNotMatch(
  source,
  /console\.|\.admin\.|SECRET_KEY|SERVICE_ROLE|localStorage|user_metadata|resetPasswordForEmail|reauthenticate\(/,
);
assert.match(source, /import "server-only"/);
assert.doesNotMatch(
  read("components/auth/account-forms.tsx"),
  /onPaste=|preventDefault\(\)/,
);
console.log(
  "SDD-050：参数、身份、原密码、同账号、旧入口、单次注册、错误脱敏及临时会话清理固定测试通过。无真实账号/网络调用。",
);
