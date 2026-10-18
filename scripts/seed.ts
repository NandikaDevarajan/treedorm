/**
 * Seeds the database (SPEC §12). Idempotent: re-running updates the same records instead of
 * duplicating them (users by email, shops by slug, listings by shop + title, orders/reviews by seedKey).
 *
 *   npm run seed
 *
 * SPEC-NOTE: shop stats (Verified count, review count/average) are set directly to stand for a history
 * of past orders; a handful of real order + review records are also created for the demo buyers.
 */
import { ObjectId } from "mongodb";
import { rolesFor } from "@/lib/auth";
import { DEFAULT_AVATAR } from "@/lib/avatar";
import { collections } from "@/lib/collections";
import { closeDb } from "@/lib/db";
import { SEED_SCHOOLS } from "@/lib/schools";
import { SEED_BUYERS, SEED_ORDERS, SEED_SHOPS } from "./seed-data";

const DAY = 24 * 60 * 60 * 1000;

async function main() {
  const { schools, users, shops, listings, orders, reviews, buyerMemory } = await collections();

  for (const school of SEED_SCHOOLS) {
    await schools.updateOne({ domain: school.domain }, { $set: school }, { upsert: true });
  }
  console.log(`✓ ${SEED_SCHOOLS.length} schools`);

  // Users: sellers (one per shop) and buyers.
  const upsertUser = async (u: {
    email: string;
    name: string;
    school: string;
    accountType: "personal" | "business";
    avatar?: { hat: string | null; sunglasses: string | null };
    lookingFor?: string;
  }) => {
    const doc = await users.findOneAndUpdate(
      { email: u.email },
      {
        $set: {
          name: u.name,
          schoolDomain: u.school,
          accountType: u.accountType,
          roles: rolesFor(u.accountType),
          ...(u.avatar ? { avatar: { base: "hedgehog" as const, ...u.avatar } as never } : {}),
          ...(u.lookingFor ? { lookingFor: u.lookingFor } : {}),
        },
        $setOnInsert: {
          _id: new ObjectId(),
          email: u.email,
          ...(u.avatar ? {} : { avatar: DEFAULT_AVATAR }),
          createdAt: new Date(Date.now() - 120 * DAY),
        },
      },
      { upsert: true, returnDocument: "after" },
    );
    return doc!;
  };

  const buyerIds = new Map<string, ObjectId>();
  for (const b of SEED_BUYERS) {
    const user = await upsertUser({ ...b, accountType: "personal", avatar: { ...b.avatar } });
    buyerIds.set(b.email, user._id);
  }
  console.log(`✓ ${SEED_BUYERS.length} demo buyers`);

  // Shops and listings.
  const shopIds = new Map<string, { shopId: ObjectId; ownerId: ObjectId; category: string }>();
  const listingIds = new Map<string, ObjectId>();
  let listingCount = 0;
  for (const [i, s] of SEED_SHOPS.entries()) {
    const owner = await upsertUser({ ...s.owner, school: s.school, accountType: "business" });

    // One shop per owner: clear out any other treehouse this account made while testing.
    const stray = await shops.find({ ownerId: owner._id, slug: { $ne: s.slug } }).toArray();
    for (const old of stray) {
      await listings.deleteMany({ shopId: old._id });
      await shops.deleteOne({ _id: old._id });
      console.log(`  removed test treehouse "${old.name}" owned by ${s.owner.email}`);
    }

    const shop = await shops.findOneAndUpdate(
      { slug: s.slug },
      {
        $set: {
          ownerId: owner._id,
          schoolDomain: s.school,
          name: s.name,
          category: s.category,
          treehouseVariant: s.category,
          tagline: s.tagline,
          bio: s.bio,
          offer: s.offer,
          tags: s.tags,
          priceRange: s.priceRange,
          area: s.area,
          availability: s.availability,
          stats: s.stats,
        },
        $unset: { aiAssisted: "" },
        // Stagger creation dates so "Newest" sorting has something to sort.
        $setOnInsert: { _id: new ObjectId(), createdAt: new Date(Date.now() - (90 - i * 7) * DAY) },
      },
      { upsert: true, returnDocument: "after" },
    );
    await users.updateOne({ _id: owner._id }, { $set: { shopId: shop!._id } });
    shopIds.set(s.slug, { shopId: shop!._id, ownerId: owner._id, category: s.category });

    for (const [j, l] of s.listings.entries()) {
      const listing = await listings.findOneAndUpdate(
        { shopId: shop!._id, title: l.title },
        {
          $set: {
            description: l.description,
            priceCents: l.priceCents,
            ...(l.durationMin ? { durationMin: l.durationMin } : {}),
            photos: [l.photo],
            checkpoints: l.checkpoints,
            customTextAllowed: l.customTextAllowed ?? false,
            tags: l.tags,
            active: true,
            publishedAt: new Date(Date.now() - (80 - i * 7 - j) * DAY),
          },
          $unset: { aiAssisted: "" },
          $setOnInsert: { _id: new ObjectId(), createdAt: new Date(Date.now() - (80 - i * 7 - j) * DAY) },
        },
        { upsert: true, returnDocument: "after" },
      );
      listingIds.set(`${s.slug}::${l.title}`, listing!._id);
      listingCount++;
    }
    // Drop listings that were removed from the seed data.
    await listings.deleteMany({ shopId: shop!._id, title: { $nin: s.listings.map((l) => l.title) } });
  }
  console.log(`✓ ${SEED_SHOPS.length} treehouses, ${listingCount} listings`);

  // Past orders (settled), their reviews, and buyer memory for rebook reminders.
  for (const o of SEED_ORDERS) {
    const buyerId = buyerIds.get(o.buyer)!;
    const shop = shopIds.get(o.shop)!;
    const listingId = listingIds.get(`${o.shop}::${o.listing}`)!;
    const listing = SEED_SHOPS.find((s) => s.slug === o.shop)!.listings.find((l) => l.title === o.listing)!;
    const settledAt = new Date(Date.now() - o.daysAgo * DAY);
    const start = new Date(settledAt.getTime() - 2 * 60 * 60 * 1000);
    const order = await orders.findOneAndUpdate(
      { seedKey: o.key },
      {
        $set: {
          buyerId,
          sellerId: shop.ownerId,
          shopId: shop.shopId,
          listingId,
          slot: { start, end: new Date(start.getTime() + (listing.durationMin ?? 30) * 60 * 1000) },
          ...("customText" in o ? { customText: o.customText } : {}),
          amountCents: listing.priceCents,
          status: "captured" as const,
          stripe: { paymentIntentId: `pi_seed_${o.key}`, capturedCents: listing.priceCents },
          check: {
            provider: "gemini" as const,
            verdict: "pass" as const,
            confidence: 0.93,
            reasons: listing.checkpoints.map((c) => `Matches: ${c}`),
            checkedAt: settledAt,
          },
          resolution: { action: "auto_capture" as const, byUserId: null, at: settledAt },
          createdAt: new Date(settledAt.getTime() - 3 * DAY),
          settledAt,
        },
        $setOnInsert: { _id: new ObjectId() },
      },
      { upsert: true, returnDocument: "after" },
    );
    await reviews.updateOne(
      { seedKey: o.key },
      {
        $set: {
          orderId: order!._id,
          shopId: shop.shopId,
          buyerId,
          rating: o.review.rating,
          body: o.review.body,
          createdAt: new Date(settledAt.getTime() + DAY),
        },
        $setOnInsert: { _id: new ObjectId() },
      },
      { upsert: true },
    );
  }
  for (const [email, buyerId] of buyerIds) {
    const events = SEED_ORDERS.filter((o) => o.buyer === email).map((o) => {
      const shop = shopIds.get(o.shop)!;
      return {
        type: "order_settled" as const,
        category: shop.category as never,
        shopId: shop.shopId,
        listingId: listingIds.get(`${o.shop}::${o.listing}`)!,
        at: new Date(Date.now() - o.daysAgo * DAY),
      };
    });
    await buyerMemory.updateOne({ buyerId }, { $set: { events } }, { upsert: true });
  }
  console.log(
    `✓ ${SEED_ORDERS.length} past orders with reviews (Maya's Fade Lab haircut settled 30 days ago)`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(closeDb);
