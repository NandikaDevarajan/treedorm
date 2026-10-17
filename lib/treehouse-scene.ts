/**
 * Geometry of the homepage scene, in pixels of public/assets/treehouse/treehouse-main.jpg (740×636).
 * Shared by scripts/prepare-assets.ts (which cuts the door layers) and TreehouseScene (which
 * positions them), so the layers always line up with the art.
 */
export const SCENE = { width: 740, height: 636 } as const;

/** The golden door panel, hinged on its left edge. */
export const DOOR = { x: 368, y: 318, w: 36, h: 68 } as const;

/** Parts of the balcony railing that pass in front of the door (inside the DOOR box). */
export const RAILING = [
  { x: 368, y: 343, w: 10, h: 9 }, // finial on the hinge-side post
  { x: 368, y: 351, w: 29, h: 10 }, // top rail
  { x: 368, y: 360, w: 3, h: 26 }, // left post (hinge side)
  { x: 383, y: 360, w: 8, h: 26 }, // middle post
] as const;

/**
 * How the scene is framed: tight on the treehouse, little sky (SPEC §9.5).
 * Portrait for phones, landscape from the md breakpoint up.
 */
export const CROPS = {
  portrait: { x: 190, y: 95, w: 400, h: 520 },
  landscape: { x: 110, y: 105, w: 560, h: 440 },
} as const;

export type Crop = (typeof CROPS)[keyof typeof CROPS];

const pct = (n: number) => `${+(n * 100).toFixed(3)}%`;

/** Door centre within a crop, as CSS percentages — the point the camera zooms into. */
export function doorOrigin(crop: Crop) {
  return {
    x: pct((DOOR.x + DOOR.w / 2 - crop.x) / crop.w),
    y: pct((DOOR.y + DOOR.h / 2 - crop.y) / crop.h),
  };
}

/** Size and offset of the full image inside a crop box, as CSS percentages of the box. */
export function imageFrame(crop: Crop) {
  return {
    width: pct(SCENE.width / crop.w),
    left: pct(-crop.x / crop.w),
    top: pct(-crop.y / crop.h),
  };
}

/** A box in scene pixels as CSS percentages of the full image. */
export function sceneBox(box: { x: number; y: number; w: number; h: number }) {
  return {
    left: pct(box.x / SCENE.width),
    top: pct(box.y / SCENE.height),
    width: pct(box.w / SCENE.width),
    height: pct(box.h / SCENE.height),
  };
}
