import { z } from "zod";
import { avatarSchema } from "@/lib/avatar-schema";
import { CATEGORY_IDS } from "@/lib/categories";
import { looksLikeRoomNumber, ROOM_NUMBER_MESSAGE } from "@/lib/privacy";
import { isEduEmail } from "@/lib/schools";

export const eduEmail = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .refine(isEduEmail, "Use your school's .edu email address.");

export const otpCode = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Enter the 6-digit code.");

export const authStartBody = z.object({
  email: eduEmail,
  /** The school picked on signup; the email must belong to it. */
  schoolDomain: z.string().trim().toLowerCase().optional(),
});

export const authVerifyBody = z.object({ email: eduEmail, code: otpCode });

export const accountTypeBody = z.object({ accountType: z.enum(["personal", "business"]) });

export const demoLoginBody = z.object({ as: z.enum(["buyer", "seller"]) });

/** Personal onboarding survey (SPEC §3.2): name and what they usually look for. */
export const personalSurveyBody = z.object({
  name: z.string().trim().min(1, "Tell us what to call you.").max(40, "Keep it under 40 characters."),
  lookingFor: z.array(z.enum(CATEGORY_IDS)).max(CATEGORY_IDS.length).default([]),
});

/** Avatar update: always the hedgehog, plus an optional hat and sunglasses (SPEC §9.9). */
export const avatarBody = z.object({ avatar: avatarSchema });

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a time like 16:00.");

/** Business survey (SPEC §3.1 step 4). Area is a building or area only — never a room number. */
export const shopSurveySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Give your treehouse a name.")
      .max(40, "Keep the name under 40 characters."),
    category: z.enum(CATEGORY_IDS),
    offer: z.string().trim().min(10, "Tell buyers a little more (a sentence or two).").max(300),
    priceMin: z.number().int().min(0).max(1000),
    priceMax: z.number().int().min(1).max(1000),
    area: z
      .string()
      .trim()
      .min(2, "Where do you work? A building or area is enough.")
      .max(60)
      .refine((a) => !looksLikeRoomNumber(a), ROOM_NUMBER_MESSAGE),
    availability: z
      .array(z.object({ day: z.number().int().min(0).max(6), start: hhmm, end: hhmm }))
      .max(14)
      .refine((slots) => slots.every((s) => s.start < s.end), "End time must be after start time."),
  })
  .refine((s) => s.priceMin <= s.priceMax, {
    message: "The lowest price can't be above the highest.",
    path: ["priceMax"],
  });

export type ShopSurvey = z.infer<typeof shopSurveySchema>;

export const shopPreviewBody = z.object({ survey: shopSurveySchema });

/** Saving a shop: the survey plus the seller-edited AI draft (SPEC §8.1: everything editable). */
export const shopCreateBody = z.object({
  survey: shopSurveySchema,
  tagline: z.string().trim().min(1, "Add a tagline.").max(80),
  bio: z.string().trim().min(1, "Add a short bio.").max(300, "Keep the bio under 300 characters."),
  tags: z.array(z.string().trim().toLowerCase().min(1).max(30)).max(8),
});

export const photoSchema = z.object({ url: z.string().url(), publicId: z.string().min(1).max(200) });

export const listingCreateBody = z.object({
  photos: z.array(photoSchema).min(1, "Add at least one photo.").max(5, "Up to 5 photos."),
  sellerNotes: z.string().trim().max(300).optional(),
});

export const listingUpdateBody = z.object({
  title: z.string().trim().min(1, "Add a title.").max(80),
  description: z.string().trim().min(1, "Add a description.").max(500, "Keep it under 500 characters."),
  priceCents: z.number().int().min(100, "Price must be at least $1.").max(100_000),
  tags: z.array(z.string().trim().toLowerCase().min(1).max(30)).max(8),
  checkpoints: z.array(z.string().trim().min(1).max(90)).min(1, "Add at least one photo checkpoint.").max(6),
  customTextAllowed: z.boolean(),
  publish: z.boolean().default(false),
});
