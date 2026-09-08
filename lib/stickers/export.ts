import {
  stickerCanvasTheme,
  type StickerCanvasItem,
  type StickerCanvasTheme,
} from "@/lib/stickers/canvas";
import {
  createSolidOutline,
  outlinePalette,
  type StickerOutlineColor,
} from "@/lib/stickers/outline";

export type StickerExportItem = StickerCanvasItem & {
  imageUrl: string;
  name: string;
};

async function loadBitmap(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("image_load_failed");
  return createImageBitmap(await response.blob());
}

function drawSticker(
  context: CanvasRenderingContext2D,
  bitmap: ImageBitmap,
  item: StickerExportItem,
  width: number,
  height: number,
  outlineColor: StickerOutlineColor,
) {
  const baseWidth = width * 0.29 * item.scale;
  const ratio = bitmap.height / Math.max(1, bitmap.width);
  const drawHeight = Math.min(baseWidth * ratio, height * 0.42);
  const drawWidth = drawHeight / ratio;
  const centerX = item.x * width;
  const centerY = item.y * height;

  context.save();
  context.translate(centerX, centerY);
  context.rotate((item.rotation * Math.PI) / 180);
  const cropLeft = -drawWidth / 2 + drawWidth * item.crop.left;
  const cropTop = -drawHeight / 2 + drawHeight * item.crop.top;
  const cropWidth = drawWidth * (1 - item.crop.left - item.crop.right);
  const cropHeight = drawHeight * (1 - item.crop.top - item.crop.bottom);
  context.beginPath();
  context.rect(cropLeft, cropTop, cropWidth, cropHeight);
  context.clip();

  const outline = createSolidOutline(
    bitmap,
    outlinePalette(outlineColor).color,
  );
  context.drawImage(
    outline,
    -drawWidth / 2,
    -drawHeight / 2,
    drawWidth,
    drawHeight,
  );
  context.drawImage(
    bitmap,
    -drawWidth / 2,
    -drawHeight / 2,
    drawWidth,
    drawHeight,
  );
  context.restore();
}

export async function exportStickerBoard({
  items,
  theme,
  outlineColor = "white",
}: {
  items: StickerExportItem[];
  theme: StickerCanvasTheme;
  outlineColor?: StickerOutlineColor;
}) {
  if (items.length < 1 || items.length > 8) {
    throw new Error("invalid_item_count");
  }
  const width = 1080;
  const height = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas_unavailable");

  const palette = stickerCanvasTheme(theme);
  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, palette.color);
  gradient.addColorStop(0.74, palette.endColor);
  gradient.addColorStop(1, palette.accentColor);
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  context.fillStyle = palette.text;
  context.textAlign = "left";
  context.font =
    '700 52px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
  context.fillText("今日贴纸", 72, 92);
  context.font =
    '600 24px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
  context.globalAlpha = 0.58;
  context.fillText("ENSEMBLE · 衣拍即合", 74, 132);
  context.globalAlpha = 1;

  const ordered = [...items].sort((left, right) => left.zIndex - right.zIndex);
  const bitmaps = await Promise.all(
    ordered.map(async (item) => ({
      item,
      bitmap: await loadBitmap(item.imageUrl),
    })),
  );
  try {
    for (const { item, bitmap } of bitmaps) {
      drawSticker(context, bitmap, item, width, height, outlineColor);
    }
  } finally {
    for (const { bitmap } of bitmaps) bitmap.close();
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("export_failed"))),
      "image/png",
      1,
    );
  });
}

export function stickerBoardFilename(day: string) {
  return `${day}-今日贴纸-衣拍即合.png`;
}
