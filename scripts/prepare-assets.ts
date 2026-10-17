/**
 * Prepares design art for the app (SPEC §9.13).
 * Source files in public/assets are never modified; every output is derived and can be regenerated:
 *
 *   npm run prepare-assets
 *
 * Crop boxes below are hand-measured against the source images. If a source image is replaced,
 * re-measure them and re-run.
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const ASSETS = path.join(process.cwd(), "public/assets");
const src = (p: string) => path.join(ASSETS, p);

type Box = { left: number; top: number; width: number; height: number };
type Rgb = [number, number, number];

interface Raw {
  data: Buffer; // RGBA
  width: number;
  height: number;
}

async function loadRaw(file: string, box?: Box): Promise<Raw> {
  let img = sharp(file);
  if (box) img = img.extract(box);
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

const dist = (data: Buffer, i: number, bg: Rgb) =>
  Math.hypot(data[i] - bg[0], data[i + 1] - bg[1], data[i + 2] - bg[2]);

/**
 * Background removal by flood fill from the image border: only background-coloured pixels
 * connected to the edge become transparent, so light details inside the subject (eye
 * highlights, lens glare) survive. Edge pixels get partial alpha for a soft cut-out.
 */
function removeBackground(raw: Raw, bg: Rgb, tolerance: number): void {
  const { data, width, height } = raw;
  const isBg = new Uint8Array(width * height);
  const stack: number[] = [];
  const push = (x: number, y: number) => {
    const p = y * width + x;
    if (isBg[p] || dist(data, p * 4, bg) > tolerance) return;
    isBg[p] = 1;
    stack.push(p);
  };
  for (let x = 0; x < width; x++) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    push(0, y);
    push(width - 1, y);
  }
  while (stack.length) {
    const p = stack.pop()!;
    const x = p % width;
    const y = (p - x) / width;
    if (x > 0) push(x - 1, y);
    if (x < width - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < height - 1) push(x, y + 1);
  }

  for (let p = 0; p < width * height; p++) {
    if (isBg[p]) {
      data[p * 4 + 3] = 0;
      continue;
    }
    const x = p % width;
    const y = (p - x) / width;
    const touchesBg =
      (x > 0 && isBg[p - 1]) ||
      (x < width - 1 && isBg[p + 1]) ||
      (y > 0 && isBg[p - width]) ||
      (y < height - 1 && isBg[p + width]);
    if (touchesBg) {
      const d = dist(data, p * 4, bg);
      data[p * 4 + 3] = Math.round(255 * Math.min(1, d / (tolerance * 3)));
    }
  }
}

/** Labels 4-connected opaque blobs. Returns per-pixel labels plus each blob's size and side-edge contact. */
function components(raw: Raw) {
  const { data, width, height } = raw;
  const label = new Int32Array(width * height);
  const blobs: { size: number; touchesSide: boolean }[] = [{ size: 0, touchesSide: false }];
  for (let start = 0; start < width * height; start++) {
    if (label[start] || data[start * 4 + 3] === 0) continue;
    const id = blobs.length;
    const blob = { size: 0, touchesSide: false };
    blobs.push(blob);
    const stack = [start];
    label[start] = id;
    while (stack.length) {
      const p = stack.pop()!;
      blob.size++;
      const x = p % width;
      const y = (p - x) / width;
      if (x === 0 || x === width - 1) blob.touchesSide = true;
      for (const q of [
        x > 0 ? p - 1 : -1,
        x < width - 1 ? p + 1 : -1,
        y > 0 ? p - width : -1,
        y < height - 1 ? p + width : -1,
      ]) {
        if (q >= 0 && !label[q] && data[q * 4 + 3] !== 0) {
          label[q] = id;
          stack.push(q);
        }
      }
    }
  }
  return { label, blobs };
}

/** Clears every blob except those `keep` returns true for. */
function filterComponents(
  raw: Raw,
  keep: (blob: { size: number; touchesSide: boolean }, isLargest: boolean) => boolean,
) {
  const { label, blobs } = components(raw);
  const largest = blobs.reduce((best, b, i) => (b.size > blobs[best].size ? i : best), 0);
  const kept = blobs.map((b, i) => i > 0 && keep(b, i === largest));
  for (let p = 0; p < label.length; p++) if (!kept[label[p]]) raw.data[p * 4 + 3] = 0;
}

/** Keeps only the largest opaque blob — drops stray confetti/leaves around a character. */
function keepLargestComponent(raw: Raw): void {
  filterComponents(raw, (_, isLargest) => isLargest);
}

async function writePng(raw: Raw, out: string, padding = 4): Promise<void> {
  await mkdir(path.dirname(out), { recursive: true });
  const img = sharp(raw.data, { raw: { width: raw.width, height: raw.height, channels: 4 } });
  // Trim transparent margins, then add a little breathing room so edges never touch the box.
  const trimmed = await img.png().toBuffer();
  await sharp(trimmed)
    .trim({ threshold: 0 })
    .extend({
      top: padding,
      bottom: padding,
      left: padding,
      right: padding,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log("  ✓", path.relative(process.cwd(), out));
}

// ---------------------------------------------------------------------------

async function hedgehog() {
  console.log("hedgehog cut-out");
  // Box excludes most of the scattered autumn leaves; keepLargestComponent drops the rest.
  const raw = await loadRaw(src("characters/hedgehog-default.avif"), {
    left: 150,
    top: 55,
    width: 450,
    height: 580,
  });
  removeBackground(raw, [254, 249, 243], 14);
  keepLargestComponent(raw);
  await writePng(raw, src("characters/hedgehog-default.png"));
  // Small copy embedded inline in the sign-in email (lib/email.ts), kept light for inboxes.
  await sharp(src("characters/hedgehog-default.png"))
    .resize({ width: 240 })
    .png({ compressionLevel: 9, palette: true })
    .toFile(src("characters/hedgehog-email.png"));
  console.log("  ✓ public/assets/characters/hedgehog-email.png");
}

async function sunglasses() {
  console.log("sunglasses");
  // 2 columns × 4 rows; numbered row by row (01 = top-left palm sunset, 02 = top-right black, …).
  const cols = [0, 306];
  const rows = [30, 170, 310, 450];
  let n = 1;
  for (const top of rows) {
    for (const left of cols) {
      const raw = await loadRaw(src("accessories/sunglasses-sheet.jpg"), {
        left,
        top,
        width: 306,
        height: 140,
      });
      removeBackground(raw, [255, 255, 255], 18);
      await writePng(raw, src(`accessories/sunglasses-${String(n++).padStart(2, "0")}.png`), 2);
    }
  }
}

async function treehouse() {
  console.log("treehouse");
  const main = src("treehouse/treehouse-main.jpg");
  await sharp(main).webp({ quality: 85 }).toFile(src("treehouse/treehouse-main.webp"));
  console.log("  ✓ public/assets/treehouse/treehouse-main.webp");
  // Door layer for DoorTransition (Phase 1) — aligned to this box in the 740×636 scene.
  await sharp(main)
    .extract({ left: 360, top: 310, width: 54, height: 78 })
    .png()
    .toFile(src("treehouse/door.png"));
  console.log("  ✓ public/assets/treehouse/door.png  (box 360,310 54×78 in treehouse-main)");
}

// Boxes found by labelling the sheets' blobs. Hedgehogs are deliberately skipped: the hedgehog is
// reserved for user avatars (SPEC §9.9). The flat sheet's bear touches a tree, so the soft bear is used.
const CREATURE_SHEETS: { file: string; style: string; animals: Record<string, Box> }[] = [
  {
    file: "creatures/woodland creature animations.jpg",
    style: "flat",
    animals: {
      rabbit: { left: 165, top: 7, width: 75, height: 149 },
      owl: { left: 90, top: 21, width: 75, height: 87 },
      deer: { left: 209, top: 91, width: 125, height: 177 },
      bird: { left: 121, top: 194, width: 82, height: 54 },
      fox: { left: 304, top: 215, width: 123, height: 133 },
      raccoon: { left: 31, top: 235, width: 96, height: 113 },
      squirrel: { left: 130, top: 247, width: 97, height: 101 },
    },
  },
  {
    file: "creatures/more woodland creature animations.jpg",
    style: "soft",
    animals: {
      wolf: { left: 15, top: 11, width: 95, height: 150 },
      rabbit: { left: 127, top: 18, width: 73, height: 143 },
      owl: { left: 233, top: 39, width: 79, height: 123 },
      woodpecker: { left: 330, top: 24, width: 67, height: 138 },
      raccoon: { left: 399, top: 26, width: 101, height: 107 },
      fox: { left: 15, top: 169, width: 130, height: 158 },
      deer: { left: 153, top: 156, width: 99, height: 171 },
      bear: { left: 248, top: 167, width: 123, height: 160 },
      squirrel: { left: 377, top: 201, width: 103, height: 127 },
      moose: { left: 438, top: 140, width: 166, height: 187 },
    },
  },
];

async function creatures() {
  console.log("woodland creatures");
  for (const sheet of CREATURE_SHEETS) {
    const meta = await sharp(src(sheet.file)).metadata();
    for (const [name, box] of Object.entries(sheet.animals)) {
      // Clamp padded boxes to the sheet edges.
      const left = Math.max(0, box.left);
      const top = Math.max(0, box.top);
      const clamped = {
        left,
        top,
        width: Math.min(box.width, meta.width! - left),
        height: Math.min(box.height, meta.height! - top),
      };
      const raw = await loadRaw(src(sheet.file), clamped);
      removeBackground(raw, [255, 255, 255], 18);
      keepLargestComponent(raw);
      await writePng(raw, src(`creatures/cutouts/${name}-${sheet.style}.png`));
    }
  }
}

// Loose autumn leaves from the flat creature sheet, scattered over the calm page backgrounds.
const LEAVES: Record<string, Box> = {
  "leaf-maple-orange": { left: 121, top: 111, width: 46, height: 52 },
  "leaf-maple-red": { left: 155, top: 157, width: 50, height: 44 },
  "leaf-yellow": { left: 13, top: 227, width: 38, height: 51 },
  "leaf-oak": { left: 429, top: 277, width: 42, height: 63 },
};

async function leaves() {
  console.log("scattered leaves");
  for (const [name, box] of Object.entries(LEAVES)) {
    const raw = await loadRaw(src("creatures/woodland creature animations.jpg"), box);
    removeBackground(raw, [255, 255, 255], 18);
    keepLargestComponent(raw);
    await writePng(raw, src(`foliage/${name}.png`), 2);
  }
}

/** PWA + favicon icons, cropped square around the cabin in treehouse-main. */
async function icons() {
  console.log("app icons");
  const crop = { left: 170, top: 150, width: 400, height: 400 };
  const outputs: [string, number][] = [
    ["public/icons/icon-192.png", 192],
    ["public/icons/icon-512.png", 512],
    ["app/icon.png", 64],
    ["app/apple-icon.png", 180],
  ];
  await mkdir(path.join(process.cwd(), "public/icons"), { recursive: true });
  for (const [out, size] of outputs) {
    await sharp(src("treehouse/treehouse-main.jpg")).extract(crop).resize(size, size).png().toFile(out);
    console.log("  ✓", out);
  }
  // Maskable: art inset to the 80% safe zone on almond so Android's mask never clips the cabin.
  const inner = await sharp(src("treehouse/treehouse-main.jpg"))
    .extract(crop)
    .resize(410, 410)
    .png()
    .toBuffer();
  await sharp({ create: { width: 512, height: 512, channels: 4, background: "#EADDCA" } })
    .composite([{ input: inner, left: 51, top: 51 }])
    .png()
    .toFile("public/icons/icon-maskable-512.png");
  console.log("  ✓ public/icons/icon-maskable-512.png");
}

async function main() {
  await icons();
  await hedgehog();
  await sunglasses();
  await treehouse();
  await creatures();
  await leaves();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
