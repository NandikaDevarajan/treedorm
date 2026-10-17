import { z } from "zod";

/**
 * Avatars (SPEC §9.9): every user is the default hedgehog. The only choices are an optional hat
 * and optional sunglasses — no other creature or character can ever be an avatar.
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

/** Validates avatar input; `base` can only ever be "hedgehog". */
export const avatarSchema = z.object({
  base: z.literal(AVATAR_BASE),
  hat: z.enum(HATS).nullable(),
  sunglasses: z.enum(SUNGLASSES).nullable(),
});
