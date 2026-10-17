import { z } from "zod";
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
