import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import ts from "typescript";
import sharp from "sharp";

const require = createRequire(import.meta.url);
const read = (p) => readFile(new URL(`../${p}`, import.meta.url), "utf8");
function compile(code, mocks = {}) {
  const output = ts.transpileModule(code, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const exports = {};
  new Function("require", "exports", output)(
    (id) => (id in mocks ? mocks[id] : require(id)),
    exports,
  );
  return exports;
}
const canvas = compile(await read("lib/stickers/canvas.ts"));
const { cropFromPointerDelta } = compile(
  await read("lib/stickers/crop-gesture.ts"),
  { "./canvas": canvas },
);
const initial = { top: 0, right: 0, bottom: 0, left: 0 };
for (const [width, height] of [
  [100, 100],
  [100, 400],
  [400, 100],
]) {
  const geometry = canvas.stickerRenderGeometry(100, width, height, {
    ...initial,
    bottom: 0.2,
  });
  assert.equal(Math.max(geometry.drawWidth, geometry.drawHeight), 92);
  assert.equal(geometry.cropTop, -50);
  assert.equal(geometry.cropHeight, 80);
}
for (const [edge, dx, dy] of [
  ["top", 0, 20],
  ["right", -20, 0],
  ["bottom", 0, -20],
  ["left", 20, 0],
]) {
  for (const degrees of [0, 45, 90, -90, 180]) {
    const a = (degrees * Math.PI) / 180;
    const result = cropFromPointerDelta(
      initial,
      edge,
      dx * Math.cos(a) - dy * Math.sin(a),
      dx * Math.sin(a) + dy * Math.cos(a),
      degrees,
      100,
    );
    assert.ok(Math.abs(result[edge] - 0.2) < 1e-10);
  }
}
assert.deepEqual(initial, { top: 0, right: 0, bottom: 0, left: 0 });
assert.equal(cropFromPointerDelta(initial, "left", 999, 0, 0, 100).left, 0.4);
assert.equal(cropFromPointerDelta(initial, "left", -999, 0, 0, 100).left, 0);
assert.deepEqual(cropFromPointerDelta(initial, "left", 1, 2, 0, 0), initial);

const service = compile(await read("lib/stickers/refinement.ts"), {
  "@/lib/wardrobe/ingestion": { WARDROBE_BUCKET: "wardrobe-images" },
});
const user = "11111111-1111-4111-8111-111111111111";
const id = "22222222-2222-4222-8222-222222222222";
const path = `${user}/cutouts/${id}-old.png`;
const input = await sharp({
  create: {
    width: 100,
    height: 100,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite([
    {
      input: await sharp({
        create: { width: 40, height: 60, channels: 4, background: "purple" },
      })
        .png()
        .toBuffer(),
      left: 30,
      top: 20,
    },
  ])
  .png()
  .toBuffer();
const result = await service.validateRefinement(input);
assert.equal(
  (await sharp(result).metadata()).width,
  100,
  "must preserve image frame",
);
await assert.rejects(service.validateRefinement(Buffer.from("notpng")), {
  status: 422,
});
await assert.rejects(
  service.validateRefinement(Buffer.alloc(3 * 1024 * 1024 + 1)),
  { status: 413 },
);
for (const alpha of [0, 1]) {
  const invalid = await sharp({
    create: {
      width: 20,
      height: 20,
      channels: 4,
      background: { r: 1, g: 1, b: 1, alpha },
    },
  })
    .png()
    .toBuffer();
  await assert.rejects(service.validateRefinement(invalid), { status: 422 });
}
function mock(options = {}) {
  const uploads = [],
    removals = [],
    updates = [];
  let current = { id, user_id: user, status: "active", cutout_path: path };
  return {
    uploads,
    removals,
    updates,
    get current() {
      return current;
    },
    storage: {
      from() {
        return {
          async upload(p) {
            uploads.push(p);
            return {
              error: options.uploadFailure && uploads.length === 2 ? {} : null,
            };
          },
          async createSignedUrl() {
            return {
              data: { signedUrl: "https://test.invalid/signed" },
              error: options.signFailure ? {} : null,
            };
          },
          async remove(paths) {
            removals.push(...paths);
            return { error: null };
          },
        };
      },
    },
    from() {
      let changes = null;
      const filters = [];
      return {
        select() {
          return this;
        },
        eq(k, v) {
          filters.push([k, v]);
          return this;
        },
        update(value) {
          changes = value;
          return this;
        },
        async maybeSingle() {
          if (changes && options.race)
            current = { ...current, cutout_path: `${user}/cutouts/newer.png` };
          if (filters.some(([k, v]) => current[k] !== v))
            return { data: null, error: null };
          if (changes) {
            updates.push({ changes, filters });
            current = { ...current, ...changes };
            if (options.lostResponse) return { data: null, error: {} };
          }
          return { data: current, error: null };
        },
      };
    },
  };
}
for (const options of [{}, { lostResponse: true }]) {
  const client = mock(options);
  assert.equal(
    await service.saveStickerRefinement(
      client,
      user,
      id,
      service.refinementVersion(path),
      input,
    ),
    "https://test.invalid/signed",
  );
  assert.equal(client.uploads.length, 2);
  assert.equal(client.removals.length, 0);
  assert.ok(
    client.updates[0].filters.some(
      ([k, v]) => k === "cutout_path" && v === path,
    ),
  );
}
for (const options of [
  { uploadFailure: true },
  { signFailure: true },
  { race: true },
]) {
  const client = mock(options);
  await assert.rejects(
    service.saveStickerRefinement(
      client,
      user,
      id,
      service.refinementVersion(path),
      input,
    ),
  );
  assert.equal(client.removals.length, 2);
  assert.ok(
    client.removals.every((p) => p !== path && p.startsWith(`${user}/`)),
  );
}
for (const [uid, item, version, status] of [
  ["other", id, service.refinementVersion(path), 404],
  [user, "other", service.refinementVersion(path), 404],
  [user, id, '"old"', 409],
]) {
  const client = mock();
  await assert.rejects(
    service.saveStickerRefinement(client, uid, item, version, input),
    { status },
  );
  assert.equal(client.uploads.length, 0);
}
const routeText = await read("app/api/stickers/items/[id]/refine/route.ts");
const route = compile(routeText, {
  "next/cache": { revalidatePath() {} },
  "@/lib/supabase/server": {
    createClient: async () => ({
      auth: { getUser: async () => ({ data: { user: null }, error: null }) },
    }),
  },
  "@/lib/wardrobe/validation": { isUuid: (v) => v === id },
  "@/lib/wardrobe/ingestion": { WARDROBE_BUCKET: "wardrobe-images" },
  "@/lib/stickers/refinement": service,
});
const context = { params: Promise.resolve({ id }) };
assert.equal(
  (await route.GET(new Request("http://localhost/refine"), context)).status,
  401,
);
assert.equal(
  (
    await route.POST(
      new Request("http://localhost/refine", {
        method: "POST",
        headers: {
          origin: "https://evil.invalid",
          "content-type": "image/png",
        },
        body: input,
      }),
      context,
    )
  ).status,
  403,
);
assert.equal(
  (
    await route.POST(
      new Request("http://localhost/refine", {
        method: "POST",
        headers: { origin: "http://localhost", "content-type": "image/png" },
        body: input,
      }),
      context,
    )
  ).status,
  401,
);
const ui = await read("components/stickers/sticker-canvas.tsx");
const positiveClient = mock();
positiveClient.auth = {
  getUser: async () => ({ data: { user: { id: user } }, error: null }),
};
const originalBucket = positiveClient.storage.from;
positiveClient.storage.from = () => ({
  ...originalBucket(),
  download: async () => ({
    data: new Blob([input], { type: "image/png" }),
    error: null,
  }),
});
const authenticatedRoute = compile(routeText, {
  "next/cache": { revalidatePath() {} },
  "@/lib/supabase/server": { createClient: async () => positiveClient },
  "@/lib/wardrobe/validation": { isUuid: (v) => v === id },
  "@/lib/wardrobe/ingestion": { WARDROBE_BUCKET: "wardrobe-images" },
  "@/lib/stickers/refinement": service,
});
const sourceResponse = await authenticatedRoute.GET(
  new Request("http://localhost/refine"),
  context,
);
assert.equal(sourceResponse.status, 200);
assert.equal(
  sourceResponse.headers.get("etag"),
  service.refinementVersion(path),
);
assert.equal(sourceResponse.headers.get("cache-control"), "private, no-store");
const post = (body) =>
  new Request("http://localhost/refine", {
    method: "POST",
    headers: {
      origin: "http://localhost",
      "content-type": "image/png",
      "if-match": service.refinementVersion(path),
    },
    body,
  });
assert.equal(
  (
    await authenticatedRoute.POST(
      post(Buffer.alloc(3 * 1024 * 1024 + 1)),
      context,
    )
  ).status,
  413,
);
assert.equal(positiveClient.uploads.length, 0);
const savedResponse = await authenticatedRoute.POST(post(input), context);
assert.equal(savedResponse.status, 200);
assert.deepEqual(await savedResponse.json(), {
  cutoutUrl: "https://test.invalid/signed",
});
for (const token of [
  "data-crop-edge",
  "cropFromPointerDelta",
  "onLostPointerCapture",
  "精确调整",
  "StickerEraser",
])
  assert.ok(ui.includes(token));
const editor = await read("components/stickers/sticker-eraser.tsx");
for (const token of [
  "showModal()",
  "If-Match",
  "slice(-5)",
  "onPointerCancel",
  "放弃修改",
  "恢复",
  "paintStickerBrush",
])
  assert.ok(editor.includes(token));
console.log(
  "SDD-040 PASS: four-edge rotated crop, PNG bounds/frame, owner isolation, CAS/race/lost-response, cleanup, route guards and editor contracts. Browser brush gestures are verified separately.",
);

if (process.argv.includes("--live")) {
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  assert.ok(url && key, "Missing public Supabase configuration");
  const clients = [];
  const cleanup = [];
  try {
    for (let i = 0; i < 2; i++) {
      const client = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
        global: {
          fetch: (url, init) =>
            fetch(url, { ...init, signal: AbortSignal.timeout(20000) }),
        },
      });
      const session = await client.auth.signInAnonymously();
      assert.ok(
        !session.error && session.data.user,
        `Synthetic session unavailable (${session.error?.status ?? "network"}/${session.error?.code ?? session.error?.name ?? "unknown"})`,
      );
      clients.push({ client, userId: session.data.user.id });
    }
    const owner = clients[0],
      other = clients[1];
    const testId = crypto.randomUUID();
    const original = `${owner.userId}/sdd-040/${testId}.png`;
    const oldPath = `${owner.userId}/cutouts/${testId}-${crypto.randomUUID()}.png`;
    const paths = [original, oldPath];
    cleanup.push({
      client: owner.client,
      userId: owner.userId,
      id: testId,
      paths,
    });
    for (const path of paths)
      assert.equal(
        (
          await owner.client.storage
            .from("wardrobe-images")
            .upload(path, input, { contentType: "image/png" })
        ).error,
        null,
      );
    const inserted = await owner.client.from("wardrobe_items").insert({
      id: testId,
      user_id: owner.userId,
      name: "SDD040 disposable synthetic sticker",
      category: "tops",
      primary_color: "purple",
      material: "cotton",
      style: "minimal",
      seasons: ["spring"],
      occasions: ["casual"],
      image_path: original,
      cutout_path: oldPath,
    });
    assert.equal(inserted.error, null);
    await assert.rejects(
      service.ownedSticker(other.client, other.userId, testId),
      { status: 404 },
    );
    await assert.rejects(
      service.ownedSticker(other.client, owner.userId, testId),
      { status: 404 },
    );
    await assert.rejects(
      service.saveStickerRefinement(
        other.client,
        owner.userId,
        testId,
        service.refinementVersion(oldPath),
        input,
      ),
      { status: 404 },
    );
    const signed = await service.saveStickerRefinement(
      owner.client,
      owner.userId,
      testId,
      service.refinementVersion(oldPath),
      input,
    );
    assert.ok(signed.startsWith("https://"));
    const latest = await service.ownedSticker(
      owner.client,
      owner.userId,
      testId,
    );
    paths.push(
      latest.path,
      latest.path.replace("/cutouts/", "/cutout-sources/"),
    );
    assert.notEqual(latest.path, oldPath);
    assert.equal(
      (await owner.client.storage.from("wardrobe-images").download(oldPath))
        .error,
      null,
    );
    assert.equal(
      (await owner.client.storage.from("wardrobe-images").download(original))
        .error,
      null,
    );
    assert.equal(
      (await owner.client.storage.from("wardrobe-images").download(latest.path))
        .error,
      null,
    );
    assert.ok(
      (await other.client.storage.from("wardrobe-images").download(latest.path))
        .error,
    );
    await assert.rejects(
      service.saveStickerRefinement(
        owner.client,
        owner.userId,
        testId,
        service.refinementVersion(oldPath),
        input,
      ),
      { status: 409 },
    );
    console.log(
      "SDD-040 LIVE PASS: two isolated anonymous clients, owner save/read, cross-account denial, stale version denial, old PNG and original retained.",
    );
  } finally {
    for (const item of cleanup) {
      const current = await item.client
        .from("wardrobe_items")
        .select("cutout_path")
        .eq("id", item.id)
        .eq("user_id", item.userId)
        .maybeSingle();
      if (
        current.data?.cutout_path?.startsWith(
          `${item.userId}/cutouts/${item.id}-`,
        )
      )
        item.paths.push(
          current.data.cutout_path,
          current.data.cutout_path.replace("/cutouts/", "/cutout-sources/"),
        );
      const deleted = await item.client
        .from("wardrobe_items")
        .delete()
        .eq("id", item.id)
        .eq("user_id", item.userId);
      assert.equal(deleted.error, null, "Synthetic row cleanup failed");
      const removed = await item.client.storage
        .from("wardrobe-images")
        .remove([...new Set(item.paths)]);
      assert.equal(removed.error, null, "Synthetic PNG cleanup failed");
    }
    for (const item of clients) await item.client.auth.signOut();
    console.log(
      "Disposed only this run's synthetic wardrobe row/PNGs; anonymous auth users retained. No real user records changed.",
    );
  }
}
