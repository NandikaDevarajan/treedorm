import { ObjectId } from "mongodb";
import { collections } from "@/lib/collections";

/** The order if the user is its buyer or seller, plus which one they are; otherwise null. */
export async function orderForUser(orderId: string, userId: string) {
  if (!ObjectId.isValid(orderId) || !ObjectId.isValid(userId)) return null;
  const { orders } = await collections();
  const uid = new ObjectId(userId);
  const order = await orders.findOne({
    _id: new ObjectId(orderId),
    $or: [{ buyerId: uid }, { sellerId: uid }],
  });
  if (!order) return null;
  return { order, role: order.buyerId.equals(uid) ? ("buyer" as const) : ("seller" as const) };
}
