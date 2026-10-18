import { ObjectId } from "mongodb";
import { toAvatar } from "@/lib/avatar-schema";
import { collections, type ThreadDoc } from "@/lib/collections";
import type { Avatar } from "@/lib/avatar";

/** The thread if the user is one of its two participants; otherwise null (SPEC §7: only participants). */
export async function threadForUser(threadId: string, userId: string) {
  if (!ObjectId.isValid(threadId) || !ObjectId.isValid(userId)) return null;
  const { threads } = await collections();
  const uid = new ObjectId(userId);
  return threads.findOne({ _id: new ObjectId(threadId), $or: [{ buyerId: uid }, { sellerId: uid }] });
}

export interface ThreadPerson {
  id: string;
  name: string;
  avatar: Avatar;
}

/** Names and hedgehog avatars for a thread's two participants (no emails). */
export async function threadPeople(thread: ThreadDoc): Promise<{
  buyer: ThreadPerson;
  seller: ThreadPerson;
  shopName?: string;
  listingTitle?: string;
  orderId?: string;
}> {
  const { users, orders, shops, listings } = await collections();
  const [buyer, seller] = await Promise.all([
    users.findOne({ _id: thread.buyerId }),
    users.findOne({ _id: thread.sellerId }),
  ]);
  const order = thread.orderId ? await orders.findOne({ _id: thread.orderId }) : null;
  const [shop, listing] = order
    ? await Promise.all([shops.findOne({ _id: order.shopId }), listings.findOne({ _id: order.listingId })])
    : [null, null];
  const person = (u: typeof buyer, fallback: string): ThreadPerson => ({
    id: u?._id.toHexString() ?? "",
    name: u?.name?.trim() || fallback,
    avatar: toAvatar(u?.avatar),
  });
  return {
    buyer: person(buyer, "Buyer"),
    seller: { ...person(seller, "Seller"), name: shop?.name ?? (seller?.name || "Seller") },
    shopName: shop?.name,
    listingTitle: listing?.title,
    orderId: order?._id.toHexString(),
  };
}

export const serializeMessage = (m: {
  _id: ObjectId;
  senderId: ObjectId | null;
  body: string;
  createdAt: Date;
}) => ({
  id: m._id.toHexString(),
  senderId: m.senderId?.toHexString() ?? null,
  body: m.body,
  createdAt: m.createdAt.toISOString(),
});
