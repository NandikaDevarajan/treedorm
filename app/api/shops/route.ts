import { ObjectId } from "mongodb";
import { apiError, parseBody } from "@/lib/api";
import { rolesFor, sessionFromUser, setSessionCookie } from "@/lib/auth";
import { collections, type Availability, type ShopDoc } from "@/lib/collections";
import { getSellerContext } from "@/lib/seller";
import { slugify } from "@/lib/slug";
import { shopCreateBody } from "@/lib/validators";

/**
 * Saves the treehouse (SPEC §7 POST /api/shops).
 * SPEC-NOTE: the spec has this route call the Shop Builder; instead the review step calls
 * /api/shops/preview and this saves the seller-edited result, so edits aren't overwritten.
 */
export async function POST(req: Request) {
  const ctx = await getSellerContext();
  if (!ctx) return apiError(403, "not_business", "Only business accounts can open a treehouse.");
  if (ctx.shop) return apiError(409, "has_shop", "You already have a treehouse.");

  const parsed = await parseBody(req, shopCreateBody);
  if ("response" in parsed) return parsed.response;
  const { survey, tagline, bio, tags, aiAssisted } = parsed.data;

  const { shops, users } = await collections();
  const ownerId = new ObjectId(ctx.session.userId);
  const base = slugify(survey.name);
  const shop: ShopDoc = {
    _id: new ObjectId(),
    ownerId,
    schoolDomain: ctx.session.schoolDomain,
    slug: base,
    name: survey.name,
    category: survey.category,
    treehouseVariant: survey.category,
    tagline,
    bio,
    tags: [...new Set(tags)],
    priceRange: { min: survey.priceMin, max: survey.priceMax },
    area: survey.area,
    availability: survey.availability as Availability[],
    stats: { aiVerified: 0, reviewCount: 0, ratingAvg: 0 },
    offer: survey.offer,
    aiAssisted,
    createdAt: new Date(),
  };

  // Slugs are unique: try "name", then "name-2", "name-3", …
  for (let n = 1; n <= 50; n++) {
    shop.slug = n === 1 ? base : `${base}-${n}`;
    try {
      await shops.insertOne(shop);
      break;
    } catch (err) {
      const dup = (err as { code?: number; keyPattern?: Record<string, number> }) ?? {};
      if (dup.code === 11000 && dup.keyPattern?.ownerId)
        return apiError(409, "has_shop", "You already have a treehouse.");
      if (dup.code !== 11000 || n === 50) throw err;
    }
  }

  const user = await users.findOneAndUpdate(
    { _id: ownerId },
    { $set: { shopId: shop._id, accountType: "business", roles: rolesFor("business") } },
    { returnDocument: "after" },
  );
  if (user) await setSessionCookie(sessionFromUser(user));
  return Response.json({
    shop: { id: shop._id.toHexString(), slug: shop.slug },
    next: "/seller/listings/new?first=1",
  });
}
