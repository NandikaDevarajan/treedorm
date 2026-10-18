import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { cancelPendingOrder } from "@/lib/orders";
import { safeNext } from "@/lib/redirect";

/**
 * Stripe Checkout's cancel_url: the buyer backed out, so the order is canceled (slot freed, session
 * expired) and they go back to the listing. Only the order's buyer, and only while it's unpaid.
 */
export async function GET(req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const url = new URL(req.url);
  const back = safeNext(url.searchParams.get("back")) ?? "/orders";
  const session = await getSession();
  if (session) await cancelPendingOrder((await params).orderId, session.userId);
  const dest = new URL(back, url.origin);
  dest.searchParams.set("canceled", "1");
  return NextResponse.redirect(dest, 303);
}
