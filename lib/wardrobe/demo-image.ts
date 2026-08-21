import { deflateSync } from "node:zlib";
import type { DemoWardrobeItem } from "@/lib/wardrobe/catalog";
import { colorSwatch } from "@/lib/wardrobe/constants";

const WIDTH = 240;
const HEIGHT = 300;

type Rgb = [number, number, number];
type Point = [number, number];

function hexToRgb(hex: string): Rgb {
  const value = hex.replace("#", "");
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
}

function mix([ar, ag, ab]: Rgb, [br, bg, bb]: Rgb, amount: number): Rgb {
  return [
    Math.round(ar + (br - ar) * amount),
    Math.round(ag + (bg - ag) * amount),
    Math.round(ab + (bb - ab) * amount),
  ];
}

function createCanvas() {
  const pixels = Buffer.alloc(WIDTH * HEIGHT * 4);

  function setPixel(x: number, y: number, color: Rgb) {
    if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return;
    const offset = (y * WIDTH + x) * 4;
    pixels[offset] = color[0];
    pixels[offset + 1] = color[1];
    pixels[offset + 2] = color[2];
    pixels[offset + 3] = 255;
  }

  function fillRect(
    x: number,
    y: number,
    width: number,
    height: number,
    color: Rgb,
  ) {
    for (let py = y; py < y + height; py += 1) {
      for (let px = x; px < x + width; px += 1) setPixel(px, py, color);
    }
  }

  function fillCircle(cx: number, cy: number, radius: number, color: Rgb) {
    const radiusSquared = radius * radius;
    for (let y = cy - radius; y <= cy + radius; y += 1) {
      for (let x = cx - radius; x <= cx + radius; x += 1) {
        if ((x - cx) ** 2 + (y - cy) ** 2 <= radiusSquared) {
          setPixel(x, y, color);
        }
      }
    }
  }

  function fillPolygon(points: Point[], color: Rgb) {
    const minX = Math.floor(Math.min(...points.map(([x]) => x)));
    const maxX = Math.ceil(Math.max(...points.map(([x]) => x)));
    const minY = Math.floor(Math.min(...points.map(([, y]) => y)));
    const maxY = Math.ceil(Math.max(...points.map(([, y]) => y)));

    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        let inside = false;
        for (
          let index = 0, previous = points.length - 1;
          index < points.length;
          previous = index, index += 1
        ) {
          const [xi, yi] = points[index];
          const [xj, yj] = points[previous];
          const intersects =
            yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
          if (intersects) inside = !inside;
        }
        if (inside) setPixel(x, y, color);
      }
    }
  }

  return { pixels, setPixel, fillRect, fillCircle, fillPolygon };
}

function drawGarment(item: DemoWardrobeItem, foreground: Rgb, accent: Rgb) {
  const canvas = createCanvas();
  const backgroundTop: Rgb = [247, 247, 244];
  const backgroundBottom: Rgb = [230, 231, 235];
  const shadow: Rgb = [210, 211, 216];

  for (let y = 0; y < HEIGHT; y += 1) {
    const color = mix(backgroundTop, backgroundBottom, y / HEIGHT);
    canvas.fillRect(0, y, WIDTH, 1, color);
  }

  canvas.fillCircle(120, 250, 72, shadow);
  canvas.fillRect(30, 34, 180, 2, [220, 220, 224]);

  if (item.category === "tops") {
    canvas.fillPolygon(
      [
        [72, 91],
        [93, 72],
        [147, 72],
        [168, 91],
        [160, 229],
        [80, 229],
      ],
      shadow,
    );
    canvas.fillPolygon(
      [
        [76, 88],
        [94, 70],
        [146, 70],
        [164, 88],
        [157, 224],
        [83, 224],
      ],
      foreground,
    );
    canvas.fillPolygon(
      [
        [76, 88],
        [45, 117],
        [65, 151],
        [87, 128],
      ],
      foreground,
    );
    canvas.fillPolygon(
      [
        [164, 88],
        [195, 117],
        [175, 151],
        [153, 128],
      ],
      foreground,
    );
    canvas.fillCircle(120, 72, 18, backgroundTop);
    canvas.fillRect(116, 96, 8, 118, accent);
  } else if (item.category === "bottoms") {
    canvas.fillRect(74, 67, 92, 29, shadow);
    canvas.fillPolygon(
      [
        [77, 90],
        [118, 90],
        [111, 232],
        [70, 232],
      ],
      shadow,
    );
    canvas.fillPolygon(
      [
        [122, 90],
        [163, 90],
        [170, 232],
        [129, 232],
      ],
      shadow,
    );
    canvas.fillRect(76, 64, 88, 28, foreground);
    canvas.fillPolygon(
      [
        [78, 88],
        [118, 88],
        [110, 228],
        [72, 228],
      ],
      foreground,
    );
    canvas.fillPolygon(
      [
        [122, 88],
        [162, 88],
        [168, 228],
        [130, 228],
      ],
      foreground,
    );
    canvas.fillRect(82, 74, 76, 5, accent);
  } else if (item.category === "dresses") {
    canvas.fillPolygon(
      [
        [96, 67],
        [144, 67],
        [154, 126],
        [193, 232],
        [47, 232],
        [86, 126],
      ],
      shadow,
    );
    canvas.fillPolygon(
      [
        [98, 64],
        [142, 64],
        [151, 123],
        [188, 226],
        [52, 226],
        [89, 123],
      ],
      foreground,
    );
    canvas.fillCircle(120, 66, 15, backgroundTop);
    canvas.fillRect(89, 119, 62, 7, accent);
  } else if (item.category === "outerwear") {
    canvas.fillPolygon(
      [
        [78, 70],
        [103, 57],
        [137, 57],
        [162, 70],
        [177, 226],
        [63, 226],
      ],
      shadow,
    );
    canvas.fillPolygon(
      [
        [80, 67],
        [104, 55],
        [136, 55],
        [160, 67],
        [173, 221],
        [67, 221],
      ],
      foreground,
    );
    canvas.fillPolygon(
      [
        [80, 67],
        [45, 100],
        [61, 190],
        [81, 177],
      ],
      foreground,
    );
    canvas.fillPolygon(
      [
        [160, 67],
        [195, 100],
        [179, 190],
        [159, 177],
      ],
      foreground,
    );
    canvas.fillPolygon(
      [
        [106, 61],
        [120, 105],
        [96, 91],
      ],
      accent,
    );
    canvas.fillPolygon(
      [
        [134, 61],
        [120, 105],
        [144, 91],
      ],
      accent,
    );
    canvas.fillRect(117, 105, 6, 112, accent);
  } else if (item.category === "shoes") {
    canvas.fillRect(38, 136, 85, 48, shadow);
    canvas.fillCircle(42, 160, 24, shadow);
    canvas.fillRect(117, 172, 85, 48, shadow);
    canvas.fillCircle(198, 196, 24, shadow);
    canvas.fillRect(40, 132, 82, 46, foreground);
    canvas.fillCircle(42, 154, 22, foreground);
    canvas.fillRect(118, 168, 82, 46, foreground);
    canvas.fillCircle(198, 190, 22, foreground);
    canvas.fillRect(31, 170, 92, 8, accent);
    canvas.fillRect(118, 206, 91, 8, accent);
  } else if (item.demoKey.includes("cap")) {
    canvas.fillCircle(112, 137, 66, foreground);
    canvas.fillRect(44, 135, 136, 62, backgroundBottom);
    canvas.fillPolygon(
      [
        [110, 143],
        [204, 143],
        [181, 170],
        [108, 166],
      ],
      accent,
    );
  } else if (item.demoKey.includes("scarf")) {
    canvas.fillPolygon(
      [
        [70, 64],
        [170, 64],
        [149, 191],
        [91, 191],
      ],
      foreground,
    );
    canvas.fillPolygon(
      [
        [91, 191],
        [119, 191],
        [100, 244],
        [73, 244],
      ],
      accent,
    );
    canvas.fillPolygon(
      [
        [121, 191],
        [149, 191],
        [167, 244],
        [140, 244],
      ],
      foreground,
    );
  } else {
    canvas.fillRect(57, 99, 126, 121, shadow);
    canvas.fillRect(60, 95, 120, 120, foreground);
    canvas.fillCircle(120, 96, 48, accent);
    canvas.fillCircle(120, 101, 35, backgroundTop);
    canvas.fillRect(60, 111, 120, 104, foreground);
    canvas.fillRect(72, 120, 96, 7, accent);
  }

  return canvas.pixels;
}

const CRC_TABLE = Array.from({ length: 256 }, (_, value) => {
  let result = value;
  for (let bit = 0; bit < 8; bit += 1) {
    result = (result & 1) === 1 ? 0xedb88320 ^ (result >>> 1) : result >>> 1;
  }
  return result >>> 0;
});

function crc32(buffer: Buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, checksum]);
}

export function createDemoPng(item: DemoWardrobeItem) {
  const foreground = hexToRgb(colorSwatch(item.primaryColor));
  const accent =
    item.primaryColor === "white"
      ? ([164, 158, 178] as Rgb)
      : mix(foreground, [255, 255, 255], 0.38);
  const pixels = drawGarment(item, foreground, accent);
  const scanlines = Buffer.alloc((WIDTH * 4 + 1) * HEIGHT);

  for (let y = 0; y < HEIGHT; y += 1) {
    const rowOffset = y * (WIDTH * 4 + 1);
    scanlines[rowOffset] = 0;
    pixels.copy(scanlines, rowOffset + 1, y * WIDTH * 4, (y + 1) * WIDTH * 4);
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(WIDTH, 0);
  header.writeUInt32BE(HEIGHT, 4);
  header[8] = 8;
  header[9] = 6;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(scanlines, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}
