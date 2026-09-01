export type PixelImage = {
  data: Uint8ClampedArray;
  height: number;
  width: number;
};

export type LocalCutoutResult =
  | {
      status: "success" | "already-transparent";
      confidence: number;
      image: PixelImage;
      removedRatio: number;
    }
  | {
      status: "unsupported-background";
      confidence: number;
      image: PixelImage;
      removedRatio: 0;
    };

type Rgb = [number, number, number];

function colorDistance(data: Uint8ClampedArray, offset: number, color: Rgb) {
  const dr = data[offset] - color[0];
  const dg = data[offset + 1] - color[1];
  const db = data[offset + 2] - color[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

function borderOffsets(width: number, height: number) {
  const offsets: number[] = [];
  const step = Math.max(1, Math.floor(Math.min(width, height) / 96));
  for (let x = 0; x < width; x += step) {
    offsets.push(x * 4, ((height - 1) * width + x) * 4);
  }
  for (let y = step; y < height - step; y += step) {
    offsets.push(y * width * 4, (y * width + width - 1) * 4);
  }
  return offsets;
}

function hasUsefulTransparency(image: PixelImage) {
  const pixels = image.width * image.height;
  const step = Math.max(1, Math.floor(pixels / 5000));
  let transparent = 0;
  let sampled = 0;
  for (let index = 0; index < pixels; index += step) {
    sampled += 1;
    if (image.data[index * 4 + 3] < 245) transparent += 1;
  }
  return sampled > 0 && transparent / sampled > 0.03;
}

export function removeConnectedPlainBackground(
  image: PixelImage,
): LocalCutoutResult {
  if (hasUsefulTransparency(image)) {
    return {
      status: "already-transparent",
      confidence: 1,
      image,
      removedRatio: 0,
    };
  }

  const { width, height } = image;
  const source = image.data;
  const sampleOffsets = borderOffsets(width, height);
  const background: Rgb = [
    median(sampleOffsets.map((offset) => source[offset])),
    median(sampleOffsets.map((offset) => source[offset + 1])),
    median(sampleOffsets.map((offset) => source[offset + 2])),
  ];
  const distances = sampleOffsets.map((offset) =>
    colorDistance(source, offset, background),
  );
  const threshold = Math.min(72, Math.max(38, median(distances) * 2.4 + 24));
  const confidence =
    distances.filter((distance) => distance <= threshold).length /
    Math.max(1, distances.length);

  if (confidence < 0.68) {
    return {
      status: "unsupported-background",
      confidence,
      image,
      removedRatio: 0,
    };
  }

  const result = new Uint8ClampedArray(source);
  const pixelCount = width * height;
  const visited = new Uint8Array(pixelCount);
  const queue = new Int32Array(pixelCount);
  let head = 0;
  let tail = 0;
  const feather = 24;
  const maxDistance = threshold + feather;

  const enqueue = (pixelIndex: number) => {
    if (visited[pixelIndex] === 1) return;
    const distance = colorDistance(source, pixelIndex * 4, background);
    if (distance > maxDistance) return;
    visited[pixelIndex] = 1;
    queue[tail] = pixelIndex;
    tail += 1;
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x);
    enqueue((height - 1) * width + x);
  }
  for (let y = 1; y < height - 1; y += 1) {
    enqueue(y * width);
    enqueue(y * width + width - 1);
  }

  let removed = 0;
  while (head < tail) {
    const pixelIndex = queue[head];
    head += 1;
    const x = pixelIndex % width;
    const y = Math.floor(pixelIndex / width);
    const offset = pixelIndex * 4;
    const distance = colorDistance(source, offset, background);
    const alphaFactor = Math.max(
      0,
      Math.min(1, (distance - threshold) / feather),
    );
    result[offset + 3] = Math.round(source[offset + 3] * alphaFactor);
    if (result[offset + 3] < 16) removed += 1;

    if (x > 0) enqueue(pixelIndex - 1);
    if (x < width - 1) enqueue(pixelIndex + 1);
    if (y > 0) enqueue(pixelIndex - width);
    if (y < height - 1) enqueue(pixelIndex + width);
  }

  const removedRatio = removed / pixelCount;
  if (removedRatio < 0.03 || removedRatio > 0.92) {
    return {
      status: "unsupported-background",
      confidence,
      image,
      removedRatio: 0,
    };
  }

  return {
    status: "success",
    confidence,
    image: { data: result, width, height },
    removedRatio,
  };
}
