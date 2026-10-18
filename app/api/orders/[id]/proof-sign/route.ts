import { apiError } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { proofFolder, signUpload } from "@/lib/cloudinary";
import { orderForUser } from "@/lib/order-access";
import { HOUR, rateLimit } from "@/lib/rate-limit";

/** Signed Cloudinary params for the buyer's proof photo, scoped to this order's folder. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return apiError(401, "unauthenticated", "Sign in first.");
  const { id } = await params;
  const access = await orderForUser(id, session.userId);
  if (!access || access.role !== "buyer") return apiError(404, "not_found", "Order not found.");
  if (!["authorized", "service_done"].includes(access.order.status)) {
    return apiError(409, "not_checkable", "A proof photo isn't needed for this order right now.");
  }
  if (!(await rateLimit(`proof:${session.userId}`, 30, HOUR)))
    return apiError(429, "rate_limited", "Too many uploads. Try again later.");
  return Response.json(signUpload(proofFolder(id)));
}
