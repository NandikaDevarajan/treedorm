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
import { DOOR, RAILING } from "../lib/treehouse-scene";

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

/**
 * The hedgehog without its beanie, used whenever a hat is worn so no beanie shows around the hat
 * (SPEC §9.9). Beanie pixels above the rim are removed (the ears, drawn in front of the beanie, are
 * protected), and a spiky quill dome in the hedgehog's own browns is painted behind as the head top.
 */
async function hedgehogBare() {
  console.log("hedgehog without beanie");
  const file = src("characters/hedgehog-default.png");
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const ears = [
    { cx: 0.215, cy: 0.345, rx: 0.06, ry: 0.055 },
    { cx: 0.715, cy: 0.44, rx: 0.07, ry: 0.065 },
  ];
  const inEar = (x: number, y: number) =>
    ears.some((e) => ((x / W - e.cx) / e.rx) ** 2 + ((y / H - e.cy) / e.ry) ** 2 <= 1);
  // Salmon knit, pale knit highlights and the dark-orange outline — but not cream face or brown quills.
  const isBeanie = (r: number, g: number, b: number) => r >= 185 && g / r < 0.77 && b < 0.64 * r;
  // The new head top: a dome centred on the face (also used to clean up around it).
  const cx = 0.49 * W,
    cy = 0.41 * H,
    rx = 0.36 * W,
    ry = 0.235 * H;
  const outsideDome = (x: number, y: number) =>
    ((x - cx) / (rx * 1.06)) ** 2 + ((y - cy) / (ry * 1.06)) ** 2 > 1;

  for (let y = 0; y < Math.round(H * 0.47); y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (data[i + 3] === 0 || inEar(x, y)) continue;
      const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
      // Also the beanie's soft anti-aliased edge: pale and partly transparent (quill edges are dark).
      // Plus the near-white halo the original cut-out left around the beanie (face cream is darker).
      const halo = r > 228 && g > 212 && b > 192;
      // Above the rim and outside the new dome, only the body's brown quills belong.
      // (Higher up, nothing belongs outside the dome at all.)
      const strayAboveHead = outsideDome(x, y) && (y < 0.3 * H || (y < 0.42 * H && r > 160));
      if (isBeanie(r, g, b) || halo || strayAboveHead || (a < 255 && r > 170 && g > 120 && b > 80))
        data[i + 3] = 0;
    }
  }

  // Quill dome: an arc of alternating long/short spikes, filled with the body's quill brown.
  const pts: string[] = [];
  for (let k = 0, a = 188; a <= 352; a += 6, k++) {
    const t = (a * Math.PI) / 180,
      f = k % 2 ? 0.9 : 1.02;
    pts.push(`${(cx + rx * f * Math.cos(t)).toFixed(1)},${(cy + ry * f * Math.sin(t)).toFixed(1)}`);
  }
  const streaks = [
    [0.3, 0.3, 0.27, 0.25],
    [0.4, 0.25, 0.39, 0.2],
    [0.52, 0.24, 0.53, 0.19],
    [0.63, 0.27, 0.66, 0.22],
    [0.73, 0.32, 0.77, 0.28],
    [0.22, 0.37, 0.18, 0.33],
    [0.46, 0.3, 0.45, 0.26],
    [0.58, 0.31, 0.6, 0.27],
  ]
    .map(([x1, y1, x2, y2]) => `<path d="M${x1 * W} ${y1 * H} L${x2 * W} ${y2 * H}" />`)
    .join("");
  const dome = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <polygon points="${pts.join(" ")} ${(cx + rx * 0.95).toFixed(1)},${(cy + 0.06 * H).toFixed(1)} ${(cx - rx * 0.95).toFixed(1)},${(cy + 0.06 * H).toFixed(1)}"
      fill="rgb(117,73,48)" stroke="rgb(92,52,30)" stroke-width="3" stroke-linejoin="round" />
    <g stroke="rgb(170,112,78)" stroke-width="5" stroke-linecap="round">${streaks}</g>
  </svg>`;
  const top = await sharp(data, { raw: { width: W, height: H, channels: 4 } })
    .png()
    .toBuffer();
  await sharp(Buffer.from(dome))
    .composite([{ input: top }])
    .png({ compressionLevel: 9 })
    .toFile(src("characters/hedgehog-bare.png"));
  console.log("  ✓ public/assets/characters/hedgehog-bare.png");
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
  await doorLayers(main);
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

/**
 * Two layers for the homepage door entrance (SPEC §9.5), both the size of the DOOR box:
 *  - door-panel.png: the golden door with the railing painted out, so it can swing open on its hinge;
 *  - door-railing.png: just the railing in front of the door, which stays put while the door swings.
 */
async function doorLayers(main: string) {
  const box = { left: DOOR.x, top: DOOR.y, width: DOOR.w, height: DOOR.h };
  const raw = await loadRaw(main, box);
  const { width, height } = raw;
  const panel = Buffer.from(raw.data);
  const railing = Buffer.from(raw.data);
  const inRailing = (x: number, y: number) =>
    RAILING.some(
      (r) => x + DOOR.x >= r.x && x + DOOR.x < r.x + r.w && y + DOOR.y >= r.y && y + DOOR.y < r.y + r.h,
    );

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (!inRailing(x, y)) {
        railing[i + 3] = 0;
        continue;
      }
      // The masks are rectangles, so drop the bits of golden door caught inside them: the door is
      // yellower (green/red ≥ 0.70) and less blue than the railing wood.
      const [r, g, b] = [raw.data[i], raw.data[i + 1], raw.data[i + 2]];
      if (g / r >= 0.7 && b / r < 0.32) railing[i + 3] = 0;
      // Fill from the nearest door pixel: straight up for the rail (the door's grain is vertical),
      // sideways for the posts.
      let sx = x;
      let sy = y;
      while (sy > 0 && inRailing(x, sy)) sy--;
      if (inRailing(x, sy)) {
        sy = y;
        while (sx < width - 1 && inRailing(sx, y)) sx++;
      } else sx = x;
      const j = (sy * width + sx) * 4;
      panel[i] = raw.data[j];
      panel[i + 1] = raw.data[j + 1];
      panel[i + 2] = raw.data[j + 2];
    }
  }
  const write = (buf: Buffer, name: string) =>
    sharp(buf, { raw: { width, height, channels: 4 } })
      .png()
      .toFile(src(`treehouse/${name}`));
  await write(panel, "door-panel.png");
  await write(railing, "door-railing.png");
  console.log(
    `  ✓ public/assets/treehouse/door-panel.png + door-railing.png  (box ${DOOR.x},${DOOR.y} ${DOOR.w}×${DOOR.h})`,
  );
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
  await hedgehogBare();
  await sunglasses();
  await treehouse();
  await creatures();
  await leaves();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
