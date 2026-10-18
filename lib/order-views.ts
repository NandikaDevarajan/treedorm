import { ObjectId, type WithId } from "mongodb";
import { toAvatar } from "@/lib/avatar-schema";
import { collections, type OrderDoc, type OrderStatus } from "@/lib/collections";
import type { Avatar } from "@/lib/avatar";
import { expireStalePending } from "@/lib/orders";

export interface OrderCardData {
  id: string;
  status: OrderStatus;
  slotStart: string;
  slotEnd: string;
  amountCents: number;
  customText?: string;
  threadId?: string;
  shop: { name: string; slug: string };
  listing: { title: string; photo?: string };
  other: { name: string; avatar: Avatar };
}

/** Plain-language status for buyers and sellers. */
export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: "Waiting for payment",
  authorized: "Booked · payment held",
  service_done: "Service done · photo needed",
  checking: "Checking photo",
  passed: "Photo matched",
  mismatch: "Photo didn't match",
  captured: "Paid · Verified",
  partially_refunded: "Partly refunded",
  canceled: "Canceled",
  expired: "Expired",
};

const SETTLED: OrderStatus[] = ["captured", "partially_refunded", "canceled", "expired"];

/** Loads the user's orders as buyer or seller, with shop, listing and the other person's hedgehog. */
export async function ordersFor(userId: string, role: "buyer" | "seller"): Promise<OrderCardData[]> {
  await expireStalePending();
  const { orders, shops, listings, users } = await collections();
  const uid = new ObjectId(userId);
  const rows = await orders
    .find(role === "buyer" ? { buyerId: uid } : { sellerId: uid })
    .sort({ "slot.start": -1 })
    .limit(100)
    .toArray();
  return enrich(rows, role, { shops, listings, users });
}

async function enrich(
  rows: WithId<OrderDoc>[],
  role: "buyer" | "seller",
  c: Pick<Awaited<ReturnType<typeof collections>>, "shops" | "listings" | "users">,
): Promise<OrderCardData[]> {
  const ids = (key: "shopId" | "listingId" | "buyerId") =>
    [...new Set(rows.map((r) => r[key].toHexString()))].map((x) => new ObjectId(x));
  const [shops, listings, buyers] = await Promise.all([
    c.shops.find({ _id: { $in: ids("shopId") } }).toArray(),
    c.listings.find({ _id: { $in: ids("listingId") } }).toArray(),
    role === "seller" ? c.users.find({ _id: { $in: ids("buyerId") } }).toArray() : Promise.resolve([]),
  ]);
  const byId = <T extends { _id: ObjectId }>(list: T[]) => new Map(list.map((x) => [x._id.toHexString(), x]));
  const shopMap = byId(shops),
    listingMap = byId(listings),
    buyerMap = byId(buyers);
  return rows.map((o) => {
    const shop = shopMap.get(o.shopId.toHexString());
    const listing = listingMap.get(o.listingId.toHexString());
    const buyer = buyerMap.get(o.buyerId.toHexString());
    return {
      id: o._id.toHexString(),
      status: o.status,
      slotStart: o.slot.start.toISOString(),
      slotEnd: o.slot.end.toISOString(),
      amountCents: o.amountCents,
      customText: o.customText,
      threadId: o.threadId?.toHexString(),
      shop: { name: shop?.name ?? "Treehouse", slug: shop?.slug ?? "" },
      listing: { title: listing?.title ?? "Listing", photo: listing?.photos[0]?.url },
      other:
        role === "seller"
          ? { name: buyer?.name?.trim() || "Buyer", avatar: toAvatar(buyer?.avatar) }
          : { name: shop?.name ?? "Seller", avatar: toAvatar(undefined) },
    };
  });
}

/**
 * Buyer groups (SPEC §3.2): upcoming (booked, not happened yet), needs photo (service time has
 * passed or the seller marked it done — the proof photo comes next), settled (finished).
 */
export function groupBuyerOrders(list: OrderCardData[], now = new Date()) {
  const upcoming: OrderCardData[] = [];
  const needsPhoto: OrderCardData[] = [];
  const settled: OrderCardData[] = [];
  for (const o of list) {
    if (SETTLED.includes(o.status)) settled.push(o);
    else if (
      o.status === "service_done" ||
      o.status === "mismatch" ||
      (o.status === "authorized" && new Date(o.slotStart) <= now)
    )
      needsPhoto.push(o);
    else if (
      o.status === "pending_payment" ||
      o.status === "authorized" ||
      o.status === "checking" ||
      o.status === "passed"
    )
      upcoming.push(o);
    else settled.push(o);
  }
  upcoming.sort((a, b) => a.slotStart.localeCompare(b.slotStart));
  return { upcoming, needsPhoto, settled };
}
