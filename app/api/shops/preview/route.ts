import { apiError, parseBody } from "@/lib/api";
import { buildShopDraft } from "@/lib/ai/shop-builder";
import { formatAvailability } from "@/lib/availability";
import { CATEGORIES } from "@/lib/categories";
import type { Availability } from "@/lib/collections";
import { HOUR, rateLimit } from "@/lib/rate-limit";
import { getUniversityTheme, SEED_SCHOOLS } from "@/lib/schools";
import { getOpenerContext } from "@/lib/seller";
import { shopPreviewBody } from "@/lib/validators";

/** Gemini Shop Builder draft for the review step (SPEC §7). Doesn't save anything. */
export async function POST(req: Request) {
  const ctx = await getOpenerContext();
  if (!ctx) return apiError(403, "not_business", "Sign in to open a treehouse.");

  const parsed = await parseBody(req, shopPreviewBody);
  if ("response" in parsed) return parsed.response;
  if (!(await rateLimit(`ai:shop:${ctx.session.userId}`, 20, HOUR))) {
    return apiError(429, "rate_limited", "Too many tries for now — take a breather and try again soon.");
  }

  const { survey } = parsed.data;
  const result = await buildShopDraft({
    name: survey.name,
    category: CATEGORIES.find((c) => c.id === survey.category)!.label,
    offer: survey.offer,
    priceMin: survey.priceMin,
    priceMax: survey.priceMax,
    area: survey.area,
    availability: formatAvailability(survey.availability as Availability[]),
    school: getUniversityTheme(ctx.session.schoolDomain, SEED_SCHOOLS).name ?? "a university",
  });
  if (result.blocked) {
    return apiError(
      422,
      "blocked",
      "This shop can't be listed on Tree Dorm. Check that what you offer fits the guidelines.",
    );
  }
  return Response.json(result);
}
