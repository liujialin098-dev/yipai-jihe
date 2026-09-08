export const STICKER_OUTLINE_COLORS = [
  { value: "white", label: "白色", color: "#ffffff" },
  { value: "lilac", label: "丁香", color: "#c7b2e4" },
  { value: "lime", label: "青柠", color: "#d8ef87" },
  { value: "coral", label: "珊瑚", color: "#f3b3a6" },
  { value: "sky", label: "天蓝", color: "#a9d6ef" },
  { value: "ink", label: "墨色", color: "#322a3d" },
] as const;
export type StickerOutlineColor =
  (typeof STICKER_OUTLINE_COLORS)[number]["value"];
export function outlinePalette(value: unknown) {
  return (
    STICKER_OUTLINE_COLORS.find((entry) => entry.value === value) ??
    STICKER_OUTLINE_COLORS[0]
  );
}

/** 对二值alpha用圆盘做膨胀；差分区间合并，不叠加半透明副本。 */
export function solidOutlineAlpha(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number,
) {
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 1 ||
    height < 1 ||
    width > 512 ||
    height > 512 ||
    rgba.length !== width * height * 4 ||
    !Number.isFinite(radius)
  )
    throw new Error("invalid_mask");
  const r = Math.max(1, Math.min(16, Math.round(radius)));
  const stride = width + 1;
  const spans = new Int32Array(stride * height);
  const disk = Array.from({ length: r * 2 + 1 }, (_, i) => {
    const dy = i - r;
    return { dy, dx: Math.floor(Math.sqrt(r * r - dy * dy)) };
  });
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (rgba[(y * width + x) * 4 + 3] < 128) continue;
      for (const { dy, dx } of disk) {
        const row = y + dy;
        if (row < 0 || row >= height) continue;
        spans[row * stride + Math.max(0, x - dx)]++;
        spans[row * stride + Math.min(width, x + dx + 1)]--;
      }
    }
  }
  const alpha = new Uint8ClampedArray(width * height);
  for (let y = 0; y < height; y++) {
    let count = 0;
    for (let x = 0; x < width; x++) {
      count += spans[y * stride + x];
      alpha[y * width + x] = count > 0 ? 255 : 0;
    }
  }
  return alpha;
}

export function createSolidOutline(bitmap: ImageBitmap, color = "#ffffff") {
  const scale = Math.min(1, 512 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("canvas_unavailable");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const alpha = solidOutlineAlpha(
    pixels.data,
    canvas.width,
    canvas.height,
    Math.max(2, Math.min(canvas.width, canvas.height) * 0.022),
  );
  for (let i = 0; i < alpha.length; i++) {
    pixels.data[i * 4] = 255;
    pixels.data[i * 4 + 1] = 255;
    pixels.data[i * 4 + 2] = 255;
    pixels.data[i * 4 + 3] = alpha[i];
  }
  ctx.putImageData(pixels, 0, 0);
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = "source-over";
  return canvas;
}

const masks = new Map<string, Promise<string>>();
export function loadOutlineMask(url: string) {
  const cached = masks.get(url);
  if (cached) return cached;
  const pending = (async () => {
    const response = await fetch(url, {
      cache: "force-cache",
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error("mask_unavailable");
    const bitmap = await createImageBitmap(await response.blob());
    try {
      return createSolidOutline(bitmap).toDataURL("image/png");
    } finally {
      bitmap.close();
    }
  })();
  masks.set(url, pending);
  if (masks.size > 64) {
    const oldest = masks.keys().next().value;
    if (oldest) masks.delete(oldest);
  }
  void pending.catch(() => {
    if (masks.get(url) === pending) masks.delete(url);
  });
  return pending;
}
