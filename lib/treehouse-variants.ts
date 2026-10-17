import type { CategoryId } from "@/lib/categories";

/** A decoration placed on treehouse-main, in scene pixels (the 740×636 image). */
export interface Overlay {
  src: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Degrees clockwise. */
  rotate?: number;
}

export interface TreehouseVariant {
  id: CategoryId;
  label: string;
  overlays: Overlay[];
  /** Optional subtle colour wash over the scene (CSS colour with alpha). */
  tint?: string;
  /** Optional words on a small sign (not used by the current placeholders). */
  signText?: string;
}

const d = (name: string) => `/assets/decorations/${name}.svg`;

// Anchors on treehouse-main: the left balcony rail top is at y≈357 (x 205–390); the right railing
// front (for hanging signs) is x 445–515, y 362–395; the front roof edge is at y≈300.
// Decorations "sit" on the rail by ending at y≈359.

/**
 * Category treehouses (SPEC §9.8): the same base treehouse with one or two small, relevant
 * decorations, so all eight look like one family. "Other" is the plain treehouse and the fallback.
 */
export const TREEHOUSE_VARIANTS: Record<CategoryId, TreehouseVariant> = {
  beauty: {
    id: "beauty",
    label: "Beauty",
    overlays: [{ src: d("flower-box"), x: 228, y: 319, w: 78, h: 41 }],
  },
  food: {
    id: "food",
    label: "Food",
    overlays: [{ src: d("food-basket"), x: 294, y: 318, w: 62, h: 41 }],
  },
  fitness: {
    id: "fitness",
    label: "Fitness",
    overlays: [{ src: d("sign-fitness"), x: 450, y: 357, w: 60, h: 44 }],
  },
  photography: {
    id: "photography",
    label: "Photography",
    overlays: [
      { src: d("camera"), x: 300, y: 324, w: 48, h: 35 },
      { src: d("sign-photo"), x: 450, y: 357, w: 60, h: 44 },
    ],
  },
  tutoring: {
    id: "tutoring",
    label: "Tutoring",
    overlays: [{ src: d("books"), x: 244, y: 315, w: 60, h: 44 }],
  },
  crafts: {
    id: "crafts",
    label: "Crafts",
    overlays: [
      { src: d("bunting"), x: 300, y: 296, w: 160, h: 27 },
      { src: d("yarn"), x: 314, y: 329, w: 36, h: 30 },
    ],
  },
  reselling: {
    id: "reselling",
    label: "Reselling",
    overlays: [
      { src: d("sign-market"), x: 450, y: 357, w: 60, h: 44 },
      { src: d("parcel"), x: 300, y: 323, w: 42, h: 36 },
    ],
  },
  other: { id: "other", label: "Other", overlays: [] },
};

export const getVariant = (id: string | null | undefined): TreehouseVariant =>
  (id && TREEHOUSE_VARIANTS[id as CategoryId]) || TREEHOUSE_VARIANTS.other;
