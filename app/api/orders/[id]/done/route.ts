import { ObjectId } from "mongodb";
import { apiError } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { collections } from "@/lib/collections";
import { systemMessage } from "@/lib/orders";

/**
 * Seller marks the service done (SPEC §7 POST /api/orders/[id]/done). Only the order's seller, and
 * only while the payment is held. SPEC-NOTE: allowed before the slot time too, so demos needn't wait.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return apiError(401, "unauthenticated", "Sign in first.");
  const { id } = await params;
  if (!ObjectId.isValid(id)) return apiError(404, "not_found", "Order not found.");
  const { orders } = await collections();
  const order = await orders.findOneAndUpdate(
    { _id: new ObjectId(id), sellerId: new ObjectId(session.userId), status: "authorized" },
    { $set: { status: "service_done" } },
    { returnDocument: "after" },
  );
  if (!order) return apiError(409, "not_allowed", "This order can't be marked done right now.");
  if (order.threadId)
    await systemMessage(
      order.threadId,
      "The seller marked the service as done. Next: the buyer snaps a proof photo so the payment can be released.",
    );
  return Response.json({ status: order.status });
}
