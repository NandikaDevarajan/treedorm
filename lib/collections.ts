import type { Collection, ObjectId } from "mongodb";
import type { Avatar } from "@/lib/avatar";
import type { CategoryId } from "@/lib/categories";
import { getDb } from "@/lib/db";
import { SEED_SCHOOLS, type School } from "@/lib/schools";

export type AccountType = "personal" | "business";
export type Role = "buyer" | "seller";

export interface UserDoc {
  _id: ObjectId;
  email: string;
  schoolDomain: string;
  name: string;
  // SPEC-NOTE: null until the account-type step (§9.7); the spec lists it as always set.
  accountType: AccountType | null;
  roles: Role[];
  shopId?: ObjectId;
  avatar: Avatar; // always the hedgehog; only hat/sunglasses vary (SPEC §9.9)
  lookingFor?: string;
  createdAt: Date;
}

export interface OtpDoc {
  email: string;
  codeHash: string;
  attempts: number;
  expiresAt: Date;
}

export interface RateLimitDoc {
  key: string;
  count: number;
  expiresAt: Date;
}

export type SchoolDoc = School;

export type OrderStatus =
  | "pending_payment"
  | "authorized"
  | "service_done"
  | "checking"
  | "passed"
  | "mismatch"
  | "captured"
  | "partially_refunded"
  | "canceled"
  | "expired";

/** SPEC §6 orders (booking and payments arrive in Phase 7; the seed adds past ones). */
export interface OrderDoc {
  _id: ObjectId;
  buyerId: ObjectId;
  sellerId: ObjectId;
  shopId: ObjectId;
  listingId: ObjectId;
  slot: { start: Date; end: Date };
  customText?: string;
  amountCents: number;
  status: OrderStatus;
  stripe: {
    /** Set when Checkout completes (the authorized, uncaptured PaymentIntent); "" until then. */
    paymentIntentId: string;
    /** The Stripe Checkout Session the buyer was sent to (SPEC §7). */
    checkoutSessionId?: string;
    capturedCents?: number;
  };
  check?: {
    /** Which checker answered ("none" = both failed, so the buyer decides). */
    provider: "perceptron" | "gemini" | "none";
    verdict: "pass" | "mismatch" | "unsure";
    confidence: number;
    reasons: string[];
    ocrText?: string;
    /** Only when customText was set: whether the photo's text matched it. */
    textMatched?: boolean;
    /** Why Perceptron wasn't used, if it wasn't. */
    fallbackReason?: string;
    checkedAt: Date;
  };
  /** The buyer's proof photo; deleted from Cloudinary once the order settles (SPEC §11). */
  proofPhoto?: Photo;
  /** Set while a capture/cancel is in flight, so double taps can't settle twice. */
  settling?: boolean;
  resolution?: {
    action: "auto_capture" | "accept" | "partial" | "cancel";
    byUserId: ObjectId | null;
    at: Date;
  };
  createdAt: Date;
  settledAt?: Date;
  /** Set on seed data so re-running the seed updates instead of duplicating. */
  seedKey?: string;
  /** `${shopId}|${slotStartISO}` while the order holds its slot; unique, so a slot can't be double-booked. */
  slotKey?: string;
  threadId?: ObjectId;
}

/** A private buyer–seller chat (SPEC §6). One per order. */
export interface ThreadDoc {
  _id: ObjectId;
  orderId?: ObjectId;
  buyerId: ObjectId;
  sellerId: ObjectId;
  lastMessageAt: Date;
  lastMessage?: string;
  createdAt: Date;
}

/** A chat message. `senderId: null` = a Tree Dorm system note (e.g. "booking confirmed"). */
export interface MessageDoc {
  _id: ObjectId;
  threadId: ObjectId;
  senderId: ObjectId | null;
  body: string;
  createdAt: Date;
}

export interface ReviewDoc {
  _id: ObjectId;
  orderId: ObjectId;
  shopId: ObjectId;
  buyerId: ObjectId;
  rating: 1 | 2 | 3 | 4 | 5;
  body: string;
  createdAt: Date;
  seedKey?: string;
}

/** Every money decision (SPEC §6, §8.5). */
export interface AuditLogDoc {
  _id: ObjectId;
  orderId: ObjectId;
  actor: "ai" | "buyer" | "system";
  action: string;
  inputs: Record<string, unknown>;
  outcome: string;
  at: Date;
}

/** Mongo fallback for buyer memory (SPEC §10). */
export interface BuyerMemoryDoc {
  buyerId: ObjectId;
  events: { type: "order_settled"; category: CategoryId; shopId: ObjectId; listingId: ObjectId; at: Date }[];
}

export interface Photo {
  url: string;
  publicId: string;
}

export interface Availability {
  day: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday
  start: string; // "HH:mm"
  end: string;
}

/** A treehouse (SPEC §6 shops). */
export interface ShopDoc {
  _id: ObjectId;
  ownerId: ObjectId;
  schoolDomain: string;
  slug: string;
  name: string;
  category: CategoryId;
  treehouseVariant: string;
  tagline: string;
  bio: string;
  tags: string[];
  priceRange: { min: number; max: number };
  area: string;
  availability: Availability[];
  stats: { aiVerified: number; reviewCount: number; ratingAvg: number };
  coverImage?: Photo;
  /** What the seller wrote they offer (survey), kept for the AI and editing. */
  offer: string;
  createdAt: Date;
}

/** A product or service in a treehouse (SPEC §6 listings). */
export interface ListingDoc {
  _id: ObjectId;
  shopId: ObjectId;
  title: string;
  description: string;
  priceCents: number;
  durationMin?: number;
  photos: Photo[];
  checkpoints: string[];
  customTextAllowed: boolean;
  tags: string[];
  embedding?: number[];
  /** Hash of the embedded text + model (lib/ai/embeddings.ts); a mismatch means re-embed. */
  embeddingKey?: string;
  active: boolean;
  createdAt: Date;
  publishedAt?: Date;
}

let indexes: Promise<unknown> | undefined;

/** Creates the indexes auth depends on, once per server instance. Safe to call repeatedly. */
export function ensureIndexes(): Promise<unknown> {
  indexes ??= (async () => {
    const db = await getDb();
    await Promise.all([
      db.collection("users").createIndex({ email: 1 }, { unique: true }),
      db.collection("otp_codes").createIndex({ email: 1 }, { unique: true }),
      db.collection("otp_codes").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      db.collection("rate_limits").createIndex({ key: 1 }, { unique: true }),
      db.collection("rate_limits").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      db.collection("schools").createIndex({ domain: 1 }, { unique: true }),
      db.collection("shops").createIndex({ slug: 1 }, { unique: true }),
      db.collection("shops").createIndex({ ownerId: 1 }, { unique: true }),
      db.collection("shops").createIndex({ schoolDomain: 1 }),
      db.collection("listings").createIndex({ shopId: 1 }),
      db.collection("orders").createIndex({ buyerId: 1 }),
      db.collection("orders").createIndex({ sellerId: 1 }),
      db.collection("orders").createIndex({ slotKey: 1 }, { unique: true, sparse: true }),
      db.collection("orders").createIndex({ shopId: 1, "slot.start": 1 }),
      db.collection("threads").createIndex({ buyerId: 1, lastMessageAt: -1 }),
      db.collection("threads").createIndex({ sellerId: 1, lastMessageAt: -1 }),
      db.collection("messages").createIndex({ threadId: 1, createdAt: 1 }),
      db.collection("reviews").createIndex({ orderId: 1 }, { unique: true }),
      db.collection("buyer_memory").createIndex({ buyerId: 1 }, { unique: true }),
      db.collection("audit_log").createIndex({ orderId: 1, at: 1 }),
    ]);
  })().catch((err) => {
    indexes = undefined;
    throw err;
  });
  return indexes;
}

export async function collections() {
  await ensureIndexes();
  const db = await getDb();
  return {
    users: db.collection<UserDoc>("users") as Collection<UserDoc>,
    otpCodes: db.collection<OtpDoc>("otp_codes"),
    rateLimits: db.collection<RateLimitDoc>("rate_limits"),
    schools: db.collection<SchoolDoc>("schools"),
    shops: db.collection<ShopDoc>("shops"),
    listings: db.collection<ListingDoc>("listings"),
    orders: db.collection<OrderDoc>("orders"),
    threads: db.collection<ThreadDoc>("threads"),
    messages: db.collection<MessageDoc>("messages"),
    reviews: db.collection<ReviewDoc>("reviews"),
    buyerMemory: db.collection<BuyerMemoryDoc>("buyer_memory"),
    auditLog: db.collection<AuditLogDoc>("audit_log"),
  };
}

/** Supported schools from the database, falling back to the seed list before `npm run seed`. */
export async function listSchools(): Promise<School[]> {
  try {
    const { schools } = await collections();
    const rows = await schools
      .find({}, { projection: { _id: 0 } })
      .sort({ name: 1 })
      .toArray();
    return rows.length ? rows : SEED_SCHOOLS;
  } catch (err) {
    console.error("listSchools: falling back to seed list", err);
    return SEED_SCHOOLS;
  }
}
