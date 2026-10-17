import manifest from "@/public/assets/accessories/manifest.json";

/**
 * Avatars (SPEC §9.9): every user is the default hedgehog. The only choices are an optional hat
 * and optional sunglasses — no other creature or character can ever be an avatar.
 * Client-safe (no validation library); the zod schema lives in lib/avatar-schema.ts.
 */
export const AVATAR_BASE = "hedgehog" as const;
export const AVATAR_BASE_SRC = "/assets/characters/hedgehog-default.png";

export const HATS = ["acorn-cap", "flower-crown", "straw-sunhat", "wizard"] as const;
export const SUNGLASSES = [
  "sunglasses-01",
  "sunglasses-02",
  "sunglasses-03",
  "sunglasses-04",
  "sunglasses-05",
  "sunglasses-06",
  "sunglasses-07",
  "sunglasses-08",
] as const;

export type HatId = (typeof HATS)[number];
export type SunglassesId = (typeof SUNGLASSES)[number];

export interface Avatar {
  base: typeof AVATAR_BASE;
  hat: HatId | null;
  sunglasses: SunglassesId | null;
}

export const DEFAULT_AVATAR: Avatar = { base: AVATAR_BASE, hat: null, sunglasses: null };

// --- Accessory manifest (SPEC §9.9) -------------------------------------------------------------

export interface AccessoryFit {
  id: HatId | SunglassesId;
  type: "hat" | "sunglasses";
  label: string;
  src: string;
  /** Width ÷ height of the accessory art. */
  aspect: number;
  /** Centre of the accessory, % of the hedgehog image's width / height. */
  x: number;
  y: number;
  /** % of the hedgehog image's width. */
  width: number;
  /** Degrees clockwise about the centre. */
  rotate: number;
}

export const AVATAR_BASE_SIZE = manifest.base as { src: string; width: number; height: number };
/** The hedgehog with its beanie removed; used whenever a hat is worn so no beanie shows around it. */
export const AVATAR_BARE_BASE = manifest.bareBase as { src: string; width: number; height: number };
export const ACCESSORIES = manifest.accessories as AccessoryFit[];
export const HAT_FITS = ACCESSORIES.filter((a) => a.type === "hat");
export const SUNGLASSES_FITS = ACCESSORIES.filter((a) => a.type === "sunglasses");

export const accessoryFit = (id: string | null | undefined) =>
  id ? ACCESSORIES.find((a) => a.id === id) : undefined;
