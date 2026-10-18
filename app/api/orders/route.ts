import { apiError, parseBody } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { BookingError, createBooking } from "@/lib/orders";
import { HOUR, rateLimit } from "@/lib/rate-limit";
import { orderCreateBody } from "@/lib/validators";

/** Book a slot: creates the order + a manual-capture PaymentIntent + the private chat (SPEC §7). */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return apiError(401, "unauthenticated", "Sign in first.");
  const parsed = await parseBody(req, orderCreateBody);
  if ("response" in parsed) return parsed.response;
  if (!(await rateLimit(`orders:${session.userId}`, 20, HOUR))) {
    return apiError(429, "rate_limited", "That's a lot of bookings at once. Try again later.");
  }
  try {
    const result = await createBooking({
      buyerId: session.userId,
      buyerSchool: session.schoolDomain,
      ...parsed.data,
    });
    return Response.json({ ...result, next: `/checkout/${result.orderId}` });
  } catch (err) {
    if (err instanceof BookingError) return apiError(err.status, err.code, err.message);
    console.error("[orders]", err);
    return apiError(500, "booking_failed", "Something went wrong booking that. Try again.");
  }
}
