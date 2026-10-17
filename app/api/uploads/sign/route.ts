import { apiError } from "@/lib/api";
import { listingFolder, signUpload } from "@/lib/cloudinary";
import { HOUR, rateLimit } from "@/lib/rate-limit";
import { getSellerContext } from "@/lib/seller";

/** Signed Cloudinary params for listing photos, scoped to the seller's own shop folder (SPEC §7). */
export async function POST() {
  const ctx = await getSellerContext();
  if (!ctx?.shop) return apiError(403, "no_shop", "Open your treehouse first.");
  if (!(await rateLimit(`upload:${ctx.session.userId}`, 60, HOUR))) {
    return apiError(429, "rate_limited", "Too many uploads for now. Try again in a bit.");
  }
  return Response.json(signUpload(listingFolder(ctx.shop._id.toHexString())));
}
