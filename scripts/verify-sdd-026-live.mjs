import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { requestBaiduCutout } from "../lib/outfits/baidu-cutout.ts";

const root = fileURLToPath(new URL("..", import.meta.url));
if (
  !process.env.BAIDU_API_KEY?.trim() ||
  !process.env.BAIDU_SECRET_KEY?.trim()
) {
  throw new Error(
    "Missing BAIDU_API_KEY or BAIDU_SECRET_KEY. Run with server-only credentials configured locally.",
  );
}
const samples = JSON.parse(
  await readFile(
    join(root, "specs/004-ai-item-ingestion/test-samples.json"),
    "utf8",
  ),
);
const outputDirectory = await mkdtemp(join(tmpdir(), "yipai-sdd026-baidu-"));
const tiles = [];
const results = [];

for (const [index, sample] of samples.entries()) {
  const filename = basename(sample.file, ".jpg");
  try {
    const source = await readFile(join(root, sample.file));
    const output = await requestBaiduCutout(
      new Blob([source], { type: "image/jpeg" }),
    );
    const outputBuffer = Buffer.from(await output.arrayBuffer());
    const { data, info } = await sharp(outputBuffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    let foreground = 0;
    let softEdge = 0;
    for (let offset = 3; offset < data.length; offset += 4) {
      const alpha = data[offset];
      if (alpha > 8) foreground += 1;
      if (alpha > 8 && alpha < 247) softEdge += 1;
    }
    const pixels = info.width * info.height;
    const coverage = foreground / pixels;
    const softEdgeRatio = foreground > 0 ? softEdge / foreground : 0;
    const valid =
      info.channels === 4 &&
      Math.min(info.width, info.height) >= 128 &&
      Math.max(info.width, info.height) <= 3000 &&
      coverage >= 0.01 &&
      coverage <= 0.96;
    const outputPath = join(
      outputDirectory,
      `${String(index + 1).padStart(2, "0")}-${filename}.png`,
    );
    await writeFile(outputPath, outputBuffer);
    results.push({
      coverage,
      filename,
      softEdgeRatio,
      status: valid ? "passed" : "failed",
    });
    tiles.push(
      await createTile(outputBuffer, `${index + 1}. ${filename}`, valid),
    );
  } catch {
    results.push({ coverage: 0, filename, softEdgeRatio: 0, status: "failed" });
    tiles.push(await createTile(null, `${index + 1}. ${filename}`, false));
  }
}

const contactSheet = await sharp({
  create: {
    width: 1500,
    height: 600,
    channels: 4,
    background: { r: 241, g: 237, b: 255, alpha: 1 },
  },
})
  .composite(
    tiles.map((input, index) => ({
      input,
      left: (index % 5) * 300,
      top: Math.floor(index / 5) * 300,
    })),
  )
  .png()
  .toBuffer();
const contactSheetPath = join(outputDirectory, "contact-sheet.png");
await writeFile(contactSheetPath, contactSheet);

for (const result of results) {
  console.log(
    `${result.status.toUpperCase()} ${result.filename} coverage=${result.coverage.toFixed(3)} soft-edge=${result.softEdgeRatio.toFixed(3)}`,
  );
}
const passed = results.filter(({ status }) => status === "passed").length;
console.log(
  `SDD-026 live Baidu cutout: ${passed}/${results.length} structural outputs passed.`,
);
console.log(`CONTACT_SHEET=${contactSheetPath}`);
if (passed < 8) process.exitCode = 1;

async function createTile(output, label, valid) {
  const background = await sharp({
    create: {
      width: 300,
      height: 300,
      channels: 4,
      background: valid
        ? { r: 248, g: 246, b: 255, alpha: 1 }
        : { r: 255, g: 236, b: 236, alpha: 1 },
    },
  })
    .png()
    .toBuffer();
  const overlays = [];
  if (output) {
    const preview = await sharp(output)
      .trim({
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        threshold: 3,
      })
      .resize({
        width: 260,
        height: 235,
        fit: "inside",
        withoutEnlargement: true,
      })
      .png()
      .toBuffer();
    const metadata = await sharp(preview).metadata();
    overlays.push({
      input: preview,
      left: Math.round((300 - (metadata.width ?? 0)) / 2),
      top: Math.max(8, Math.round((248 - (metadata.height ?? 0)) / 2)),
    });
  }
  overlays.push({
    input: Buffer.from(
      `<svg width="300" height="52" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="52" fill="#ffffff" fill-opacity="0.92"/><text x="14" y="31" font-family="Arial, sans-serif" font-size="15" fill="#1f1d26">${escapeXml(label)}</text></svg>`,
    ),
    left: 0,
    top: 248,
  });
  return sharp(background).composite(overlays).png().toBuffer();
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
