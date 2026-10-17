import { z } from "zod";
import { avatarSchema } from "@/lib/avatar-schema";
import { CATEGORY_IDS } from "@/lib/categories";
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
