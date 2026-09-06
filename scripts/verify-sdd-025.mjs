import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import {
  avatarExtensionForMime,
  displayNameInitial,
  isOwnedProfileAvatarPath,
  normalizeDisplayName,
  profileAvatarPath,
} from "../lib/profile/validation.ts";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (path) => readFile(`${root}/${path}`, "utf8");

await Promise.all(
  [
    "specs/025-profile-fashion-color/spec.md",
    "specs/025-profile-fashion-color/plan.md",
    "specs/025-profile-fashion-color/tasks.md",
    "app/profile/page.tsx",
    "app/profile/actions.ts",
    "components/profile/profile-editor.tsx",
    "lib/profile/data.ts",
    "supabase/migrations/20260901023555_profile_fashion_color.sql",
  ].map(read),
);

assert.equal(normalizeDisplayName("  衣   拍  "), "衣 拍");
assert.equal(normalizeDisplayName(""), null);
assert.equal(normalizeDisplayName("a".repeat(21)), null);
assert.equal(displayNameInitial(" 林先生"), "林");
assert.equal(avatarExtensionForMime("image/jpeg"), "jpg");
assert.equal(avatarExtensionForMime("image/svg+xml"), null);
const fixedUserId = "00000000-0000-4000-8000-000000000001";
const fixedUploadId = "00000000-0000-4000-8000-000000000002";
const fixedAvatarPath = profileAvatarPath(fixedUserId, fixedUploadId, "webp");
assert.equal(
  fixedAvatarPath,
  `${fixedUserId}/profile/avatar-${fixedUploadId}.webp`,
);
assert.equal(isOwnedProfileAvatarPath(fixedAvatarPath, fixedUserId), true);
assert.equal(isOwnedProfileAvatarPath(fixedAvatarPath, fixedUploadId), false);

const [
  profilePage,
  profileEditor,
  profileValidation,
  profileData,
  header,
  styles,
  migration,
] = await Promise.all([
  read("app/profile/page.tsx"),
  read("components/profile/profile-editor.tsx"),
  read("lib/profile/validation.ts"),
  read("lib/profile/data.ts"),
  read("components/status-header.tsx"),
  read("app/globals.css"),
  read("supabase/migrations/20260901023555_profile_fashion_color.sql"),
]);
for (const boundary of ["衣橱单品", "日记记录", "30 天利用率"]) {
  assert.match(profilePage, new RegExp(boundary));
}
assert.doesNotMatch(profilePage, /OutfitCanvasPreview/);
assert.match(profileEditor, /image\/jpeg,image\/png,image\/webp/);
assert.match(profileEditor, /crypto\.randomUUID/);
assert.match(profileValidation, /5MB/);
assert.doesNotMatch(profileData, /\.from\("outfit_canvases"\)/);
assert.match(profileData, /\.from\("outfit_diary_entries"\)/);
assert.match(profileData, /buildDiaryUtilizationReport/);
assert.match(header, /href="\/profile"/);
assert.match(header, /avatarUrl/);
for (const token of [
  "--fashion-lime",
  "--fashion-lilac",
  "--fashion-coral",
  "--fashion-sky",
]) {
  assert.match(styles, new RegExp(token));
}
assert.match(styles, /prefers-reduced-motion/);
assert.match(styles, /prefers-reduced-transparency/);
assert.match(migration, /profiles_avatar_path_check/);
assert.match(migration, /user_id::text/);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!supabaseUrl || !publishableKey) {
  throw new Error("缺少 Supabase 公开测试配置。请通过 .env.local 运行。");
}

const clients = [
  createClient(supabaseUrl, publishableKey, {
    auth: { persistSession: false },
  }),
  createClient(supabaseUrl, publishableKey, {
    auth: { persistSession: false },
  }),
];
const sessions = await Promise.all(
  clients.map((client) => client.auth.signInAnonymously()),
);
for (const session of sessions) assert.ifError(session.error);
const userIds = sessions.map((session) => session.data.user.id);
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEAQH/69uArwAAAABJRU5ErkJggg==",
  "base64",
);
const paths = userIds.map((userId, index) =>
  profileAvatarPath(
    userId,
    `00000000-0000-4000-8000-${String(index + 20).padStart(12, "0")}`,
    "png",
  ),
);

try {
  for (let index = 0; index < clients.length; index += 1) {
    const upload = await clients[index].storage
      .from("wardrobe-images")
      .upload(paths[index], png, { contentType: "image/png" });
    assert.ifError(upload.error);
    const profile = await clients[index]
      .from("profiles")
      .upsert({
        user_id: userIds[index],
        display_name: `主页测试 ${index + 1}`,
        avatar_path: paths[index],
      })
      .select("display_name, avatar_path")
      .single();
    assert.ifError(profile.error);
    assert.equal(profile.data.avatar_path, paths[index]);
  }

  const crossRead = await clients[0]
    .from("profiles")
    .select("user_id, avatar_path")
    .eq("user_id", userIds[1]);
  assert.ifError(crossRead.error);
  assert.equal(crossRead.data.length, 0);

  const crossUpdate = await clients[0]
    .from("profiles")
    .update({ display_name: "越权昵称" })
    .eq("user_id", userIds[1])
    .select("user_id");
  assert.ifError(crossUpdate.error);
  assert.equal(crossUpdate.data.length, 0);

  const crossSigned = await clients[0].storage
    .from("wardrobe-images")
    .createSignedUrl(paths[1], 60);
  assert.ok(crossSigned.error);

  const invalidPath = await clients[0]
    .from("profiles")
    .update({
      avatar_path: `${userIds[1]}/profile/avatar-${fixedUploadId}.png`,
    })
    .eq("user_id", userIds[0]);
  assert.ok(invalidPath.error);
} finally {
  for (let index = 0; index < clients.length; index += 1) {
    await clients[index].storage.from("wardrobe-images").remove([paths[index]]);
    await clients[index]
      .from("profiles")
      .update({ avatar_path: null })
      .eq("user_id", userIds[index]);
    await clients[index].auth.signOut();
  }
}

console.log(
  "SDD-025 verification passed: profile inputs, fashion tokens, current-user RLS and private avatar isolation.",
);
