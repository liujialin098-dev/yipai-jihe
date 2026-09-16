// Offline contract and actual-component tests. No production accounts or network.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
const read = (file) => readFileSync(resolve(file), "utf8");
function compile(file, mocks = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(read(file), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  new Function("require", "module", "exports", code)(
    (name) => {
      if (name in mocks) return mocks[name];
      assert.ok(!name.startsWith("@/") && !name.startsWith("next/"), name);
      return require(name);
    },
    module,
    module.exports,
  );
  return module.exports;
}
const constants = compile("lib/wardrobe/constants.ts");
const model = compile("lib/onboarding/model.ts", {
  "@/lib/personalization/constants": compile(
    "lib/personalization/constants.ts",
  ),
  "@/lib/ui/skins": compile("lib/ui/skins.ts"),
  "@/lib/wardrobe/constants": constants,
});
const { EMPTY_CHOICES, needsFirstUse, parseOnboardingChoices } = model;
const style = constants.STYLE_OPTIONS[0].value;
const occasion = constants.OCCASION_OPTIONS[0].value;
const selected = {
  clothing: "male",
  skin: "rose",
  styles: [style],
  occasions: [occasion],
};
for (const metadata of [
  undefined,
  {},
  { ensemble_onboarding: "complete" },
  { ensemble_onboarding: true },
])
  assert.equal(needsFirstUse(metadata), false);
assert.equal(needsFirstUse(model.FIRST_USE_METADATA), true);
assert.deepEqual(parseOnboardingChoices(EMPTY_CHOICES), EMPTY_CHOICES);
for (const input of [
  null,
  {},
  { ...selected, clothing: "invalid" },
  { ...selected, skin: "bad" },
  { ...selected, styles: ["bad"] },
  { ...selected, occasions: [occasion, occasion, occasion, occasion] },
])
  assert.equal(parseOnboardingChoices(input), null);
assert.deepEqual(
  parseOnboardingChoices({ ...selected, styles: [style, style] }).styles,
  [style],
);

let calls, failAt, user;
function reset(failure = "") {
  calls = [];
  failAt = failure;
  user = { id: "trusted-user", user_metadata: { ...model.FIRST_USE_METADATA } };
}
const { saveFirstUse } = compile("lib/onboarding/save.ts", {
  "server-only": {},
  "@/lib/onboarding/model": model,
  "@/lib/feedback/preferences": {
    recalculatePreferenceScores: async (_, id) => {
      calls.push({ op: "recalculate", id });
      return { error: failAt === "recalculate" ? {} : null };
    },
  },
});
const client = {
  auth: {
    getUser: async () => {
      calls.push({ op: "auth" });
      return { data: { user }, error: null };
    },
    updateUser: async (payload) => {
      calls.push({ op: "complete", payload });
      return { data: { user }, error: failAt === "complete" ? {} : null };
    },
  },
  from(table) {
    const call = { table, filters: [] };
    const query = {
      delete() {
        call.op = "delete";
        return query;
      },
      upsert(payload, options) {
        Object.assign(call, { op: "upsert", payload, options });
        return query;
      },
      update(payload) {
        Object.assign(call, { op: "update", payload });
        return query;
      },
      eq(...args) {
        call.filters.push(["eq", ...args]);
        return query;
      },
      like(...args) {
        call.filters.push(["like", ...args]);
        return query;
      },
      select() {
        return query;
      },
      maybeSingle() {
        return query;
      },
      // biome-ignore lint/suspicious/noThenProperty: mirrors Supabase's awaited query builder in this offline fake.
      then(done) {
        calls.push(call);
        return Promise.resolve({
          error: failAt === call.op ? {} : null,
          data: failAt === "missing-row" ? null : { user_id: user.id },
        }).then(done);
      },
    };
    return query;
  },
};
reset();
assert.equal((await saveFirstUse(client, {})).ok, false);
assert.deepEqual(calls, []);
reset();
user = null;
assert.equal((await saveFirstUse(client, selected)).ok, false);
assert.equal(calls.length, 1);
for (const metadata of [{}, { ensemble_onboarding: "complete" }]) {
  reset();
  user.user_metadata = metadata;
  assert.equal((await saveFirstUse(client, selected)).ok, true);
  assert.equal(calls.length, 1);
}
reset();
assert.equal((await saveFirstUse(client, EMPTY_CHOICES)).ok, true);
assert.deepEqual(
  calls.map((c) => c.op),
  ["auth", "complete"],
);
reset();
assert.equal(
  (
    await saveFirstUse(client, {
      ...EMPTY_CHOICES,
      clothing: "female",
      userId: "untrusted",
    })
  ).ok,
  true,
);
assert.deepEqual(calls[1].payload, { clothing_preference: "female" });
assert.deepEqual(calls[1].filters, [["eq", "user_id", "trusted-user"]]);
reset();
assert.equal((await saveFirstUse(client, selected)).ok, true);
assert.deepEqual(
  calls.map((c) => c.op),
  ["auth", "delete", "upsert", "recalculate", "update", "complete"],
);
assert.deepEqual(calls[1].filters, [
  ["eq", "user_id", user.id],
  ["eq", "event_type", "questionnaire"],
  ["like", "event_key", "onboarding:style:%"],
]);
assert.equal(calls[2].payload[0].weight, 3);
assert.equal(calls[2].payload[0].user_id, user.id);
assert.equal("skin" in calls[4].payload, false);
for (const failure of [
  "delete",
  "upsert",
  "recalculate",
  "update",
  "missing-row",
  "complete",
]) {
  reset(failure);
  assert.equal((await saveFirstUse(client, selected)).ok, false);
  if (failure !== "complete")
    assert.ok(!calls.some((c) => c.op === "complete"));
}
// Only newly created identities get the presentation marker, not ordinary login.
const authErrors = compile("lib/auth/errors.ts");
const identityCalls = [];
const identity = { id: "new-user", user_metadata: model.FIRST_USE_METADATA };
const authActions = compile("lib/auth/actions.ts", {
  "next/cache": { revalidatePath() {} },
  "next/navigation": {
    redirect: (url) => {
      throw new Error(`REDIRECT:${url}`);
    },
  },
  "@/lib/auth/errors": authErrors,
  "@/lib/auth/password-change": {
    changePassword: () => {
      throw new Error("not requested");
    },
  },
  "@/lib/onboarding/model": model,
  "@/lib/supabase/server": {
    createClient: async () => ({
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        signUp: async (input) => {
          identityCalls.push(input);
          return { data: { user: identity, session: {} }, error: null };
        },
        signInAnonymously: async (input) => {
          identityCalls.push(input);
          return { data: { user: identity }, error: null };
        },
        signOut: async () => ({ error: null }),
      },
      from: (table) => ({
        upsert: async (data) => {
          assert.ok(["profiles", "user_preferences"].includes(table));
          assert.equal(data.user_id, identity.id);
          return { error: null };
        },
      }),
    }),
  },
});
const registrationInput = new FormData();
registrationInput.set("email", "fixture@example.com");
registrationInput.set("password", "fixture-only-strong");
registrationInput.set("confirmPassword", "fixture-only-strong");
assert.equal(
  (
    await authActions.registerCurrentAccount(
      authErrors.initialAuthState,
      registrationInput,
    )
  ).status,
  "success",
);
assert.equal(identityCalls[0].options.data.ensemble_onboarding, "pending");
await assert.rejects(authActions.startAnonymousExperience(), /REDIRECT:\//);
assert.deepEqual(identityCalls[1].options.data, model.FIRST_USE_METADATA);

let routeViewer = null;
const { default: OnboardingPage } = compile("app/onboarding/page.tsx", {
  "next/navigation": {
    redirect: (url) => {
      throw new Error(`REDIRECT:${url}`);
    },
  },
  "@/lib/auth/viewer": { getViewer: async () => routeViewer },
  "@/components/onboarding/onboarding-flow": { OnboardingFlow: () => null },
});
for (const viewer of [null, { userId: "old", needsOnboarding: false }]) {
  routeViewer = viewer;
  await assert.rejects(OnboardingPage(), /REDIRECT:\//);
}
routeViewer = { userId: "new", needsOnboarding: true };
assert.equal((await OnboardingPage()).props.userId, "new");

assert.match(
  read("lib/auth/actions.ts"),
  /signInAnonymously\(\{\s*options: \{ data: FIRST_USE_METADATA \}/,
);
assert.match(
  read("lib/auth/actions.ts"),
  /account_password_configured: true,\s*\.\.\.FIRST_USE_METADATA/,
);
assert.match(
  read("app/api/session/anonymous/route.ts"),
  /data: FIRST_USE_METADATA/,
);
assert.match(
  read("app/page.tsx"),
  /viewer.needsOnboarding\) redirect\("\/onboarding"\)/,
);

const Null = () => null;
const { DailyEdit } = compile("components/home/daily-edit.tsx", {
  "next/link": {
    default: ({ prefetch: _, children, ...props }) =>
      React.createElement("a", props, children),
  },
  "@/components/home/home-collage": { HomeCollage: Null },
  "@/components/recommendations/weather-panel": { WeatherPanel: Null },
  "@/components/ui/rounded-icon": { RoundedIcon: Null },
  "@/components/wardrobe/garment-sticker": { GarmentSticker: Null },
  "@/lib/home/presentation": {
    homePreviewItems: () => [],
    homeDiaryItem: () => null,
  },
});
for (const entries of [
  [],
  [{ worn_on: "2026-09-16", title: "自己的搭配", items: [] }],
]) {
  const html = renderToStaticMarkup(
    React.createElement(DailyEdit, {
      data: {
        items: [],
        recommendation: null,
        targetDate: "2026-09-16",
        viewerId: "trusted-user",
        error: null,
      },
      entries,
      days: ["2026-09-16"],
      diaryError: false,
      anonymous: false,
      displayName: "朋友",
    }),
  );
  assert.match(
    html,
    /href="\/diary\/new\?date=2026-09-16" class="home-manual-outfit"/,
  );
  assert.match(html, entries.length ? /编辑今日穿搭/ : /添加今日穿搭/);
}
console.log(
  "053 PASS: parsing; legacy/completed bypass; skip zero preference writes; trusted-user scoping; partial failures; new-identity routing; manual daily-entry rendering. Offline only.",
);
