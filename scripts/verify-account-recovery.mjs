import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
function compile(file, mocks) {
  const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", code)(
    (id) => {
      if (id in mocks) return mocks[id];
      assert.ok(!id.startsWith("@/"), `Missing mock: ${id}`);
      return require(id);
    },
    module,
    module.exports,
  );
  return module.exports;
}
const user = {
  id: "fixture-account",
  email: "fixture@example.invalid",
  is_anonymous: false,
};
let scenario = {};
let calls;
let enabled = false;
const errors = compile("lib/auth/errors.ts", {});
const service = compile("lib/auth/password-recovery.ts", {
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
        persistSession: false,
        detectSessionInUrl: false,
      });
      return {
        auth: {
          resetPasswordForEmail: async (email, options) => {
            calls.send++;
            assert.equal(email, user.email);
            assert.equal(options, undefined);
            if (scenario.sendThrows) throw new Error("PRIVATE-ERROR");
            return { data: {}, error: scenario.sendError ?? null };
          },
          verifyOtp: async (input) => {
            calls.verify++;
            assert.deepEqual(input, {
              email: user.email,
              token: "123456",
              type: "recovery",
            });
            if (scenario.verifyThrows) throw new Error("PRIVATE-ERROR");
            const verifiedUser = { ...user, ...scenario.user };
            return {
              data: {
                user: verifiedUser,
                session: scenario.noSession
                  ? null
                  : {
                      user: scenario.sessionUser ?? verifiedUser,
                      access_token: "PRIVATE-TOKEN",
                    },
              },
              error: scenario.verifyError ?? null,
            };
          },
          updateUser: async (input) => {
            calls.update++;
            assert.deepEqual(input, {
              password: "Fixture-password-789",
              data: { account_password_configured: true },
            });
            if (scenario.updateThrows) throw new Error("PRIVATE-ERROR");
            return {
              data: { user: scenario.updatedUser ?? user },
              error: scenario.updateError ?? null,
            };
          },
          signOut: async ({ scope }) => {
            calls.scopes.push(scope);
            if (scenario.cleanupThrows) throw new Error("PRIVATE-ERROR");
            return { error: scenario.cleanupError ?? null };
          },
        },
      };
    },
  },
});
function reset(options = {}) {
  enabled = options.enabled ?? true;
  process.env.ACCOUNT_EMAIL_RECOVERY_ENABLED = enabled ? "true" : "false";
  scenario = options;
  calls = { create: 0, send: 0, verify: 0, update: 0, scopes: [] };
}
function form(overrides = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    email: " Fixture@Example.Invalid ",
    token: "123456",
    password: "Fixture-password-789",
    confirmPassword: "Fixture-password-789",
    ...overrides,
  }))
    data.set(key, value);
  return data;
}
function safe(result) {
  const text = JSON.stringify(result);
  for (const secret of [
    user.email,
    "123456",
    "Fixture-password-789",
    "PRIVATE-ERROR",
    "PRIVATE-TOKEN",
  ])
    assert.ok(!text.includes(secret));
  return result;
}
const priorGate = process.env.ACCOUNT_EMAIL_RECOVERY_ENABLED;
try {
  reset({ enabled: false });
  assert.equal(safe(await service.requestRecoveryCode(form())).status, "error");
  assert.equal(
    safe(await service.resetPasswordWithCode(form())).status,
    "error",
  );
  assert.equal(calls.create, 0);
  reset();
  delete process.env.ACCOUNT_EMAIL_RECOVERY_ENABLED;
  assert.equal(service.isEmailRecoveryEnabled(), false);
  reset();
  for (const bad of [
    { email: "bad" },
    { email: `${"x".repeat(255)}@a.cn` },
    { token: "12345a" },
    { password: "short" },
    { password: "字".repeat(25) },
    { confirmPassword: "different" },
  ]) {
    assert.equal(
      safe(await service.resetPasswordWithCode(form(bad))).status,
      "error",
    );
  }
  assert.equal(calls.create, 0);
  reset();
  const generic = safe(await service.requestRecoveryCode(form()));
  assert.equal(generic.status, "success");
  reset({ sendError: { code: "user_not_found" } });
  assert.deepEqual(safe(await service.requestRecoveryCode(form())), generic);
  reset({ sendError: { code: "over_email_send_rate_limit" } });
  assert.deepEqual(safe(await service.requestRecoveryCode(form())), generic);
  reset({ sendThrows: true });
  assert.equal(safe(await service.requestRecoveryCode(form())).status, "error");
  for (const invalid of [
    { noSession: true },
    { user: { is_anonymous: true } },
    { user: { email: "other@example.invalid" } },
    { sessionUser: { ...user, id: "another-user" } },
    { verifyError: { code: "otp_expired" } },
    { verifyThrows: true },
  ]) {
    reset(invalid);
    assert.equal(
      safe(await service.resetPasswordWithCode(form())).status,
      "error",
    );
    assert.equal(calls.update, 0);
    assert.ok(!calls.scopes.includes("global"));
  }
  reset();
  assert.equal(
    safe(await service.resetPasswordWithCode(form())).status,
    "success",
  );
  assert.equal(calls.update, 1);
  assert.deepEqual(calls.scopes, ["global"]);
  for (const error of [
    { updateThrows: true },
    { updatedUser: { ...user, id: "another-user" } },
    { updateError: { code: "weak_password" } },
  ]) {
    reset(error);
    const result = safe(await service.resetPasswordWithCode(form()));
    assert.equal(result.status, "error");
    assert.equal(result.needsNewCode, true);
    assert.deepEqual(calls.scopes, ["local"]);
  }
  for (const error of [
    { cleanupThrows: true },
    { cleanupError: { code: "network_error" } },
  ]) {
    reset(error);
    const result = safe(await service.resetPasswordWithCode(form()));
    assert.equal(result.status, "success");
    assert.match(result.message, /会话/);
  }
  const action = compile("lib/auth/recovery-actions.ts", {
    "@/lib/auth/password-recovery": service,
  });
  reset({ enabled: false });
  assert.equal(
    (await action.recoverAccount({}, form({ operation: "reset" }))).status,
    "error",
  );
  assert.equal(calls.create, 0);
  reset();
  assert.equal(
    (await action.recoverAccount({}, form({ operation: "bad" }))).status,
    "error",
  );
  assert.equal(calls.create, 0);
  console.log(
    "PASS recovery: gate, input, enumeration-safe responses, recovery-only identity, cleanup, uncertain results, Action; no network/real accounts.",
  );
} finally {
  if (priorGate === undefined)
    delete process.env.ACCOUNT_EMAIL_RECOVERY_ENABLED;
  else process.env.ACCOUNT_EMAIL_RECOVERY_ENABLED = priorGate;
}
