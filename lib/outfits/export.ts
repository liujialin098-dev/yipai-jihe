import type { OutfitCanvasItem, OutfitCanvasTheme } from "@/lib/outfits/canvas";
import { outfitCanvasTheme } from "@/lib/outfits/canvas";

export type ExportCanvasItem = OutfitCanvasItem & {
  imageUrl: string;
  name: string;
};

async function loadBitmap(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("image_load_failed");
  return createImageBitmap(await response.blob());
}

export async function exportOutfitCard({
  title,
  theme,
  items,
}: {
  title: string;
  theme: OutfitCanvasTheme;
  items: ExportCanvasItem[];
}) {
  const width = 1080;
  const height = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas_unavailable");

  const palette = outfitCanvasTheme(theme);
  context.fillStyle = palette.color;
  context.fillRect(0, 0, width, height);

  context.fillStyle = palette.text;
  context.textAlign = "left";
  context.font =
    '600 68px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
  context.fillText(title, 72, 112, width - 144);
  context.font =
    '500 28px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
  context.fillText("衣拍即合", 76, 166);

  const ordered = [...items].sort((a, b) => a.zIndex - b.zIndex);
  const bitmaps = await Promise.all(
    ordered.map(async (item) => ({
      item,
      bitmap: await loadBitmap(item.imageUrl),
    })),
  );

  for (const { item, bitmap } of bitmaps) {
    const baseWidth = width * 0.28 * item.scale;
    const ratio = bitmap.height / Math.max(1, bitmap.width);
    const drawHeight = Math.min(baseWidth * ratio, height * 0.38);
    const drawWidth = drawHeight / ratio;
    const centerX = item.x * width;
    const centerY = item.y * height;

    context.save();
    context.translate(centerX, centerY);
    context.rotate((item.rotation * Math.PI) / 180);
    context.shadowColor = "rgba(32,33,36,0.10)";
    context.shadowBlur = 24;
    context.shadowOffsetY = 12;
    context.drawImage(
      bitmap,
      -drawWidth / 2,
      -drawHeight / 2,
      drawWidth,
      drawHeight,
    );
    context.restore();
    bitmap.close();
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("export_failed"))),
      "image/png",
      1,
    );
  });
}

export function outfitCardFilename(title: string) {
  const safeTitle = title
    .trim()
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "-")
    .slice(0, 30);
  return `${safeTitle || "我的穿搭"}-衣拍即合.png`;
}
