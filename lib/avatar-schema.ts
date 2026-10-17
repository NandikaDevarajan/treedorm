import { z } from "zod";
import { AVATAR_BASE, DEFAULT_AVATAR, HATS, SUNGLASSES, type Avatar } from "@/lib/avatar";

// Server-side validation, kept out of lib/avatar.ts so the avatar editor doesn't ship zod to phones.

/** Validates avatar input; `base` can only ever be "hedgehog". */
export const avatarSchema = z.object({
  base: z.literal(AVATAR_BASE),
  hat: z.enum(HATS).nullable(),
  sunglasses: z.enum(SUNGLASSES).nullable(),
});

/** Normalises whatever is stored on a user (older or partial docs) into a valid avatar. */
export function toAvatar(value: unknown): Avatar {
  const parsed = avatarSchema.safeParse(value);
  return parsed.success ? parsed.data : DEFAULT_AVATAR;
}
