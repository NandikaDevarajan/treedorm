import { ObjectId } from "mongodb";
import { apiError, parseBody } from "@/lib/api";
import { writeListingDraft } from "@/lib/ai/listing-writer";
import { CATEGORIES } from "@/lib/categories";
import { isOwnUpload, listingFolder, resized } from "@/lib/cloudinary";
import { collections, type ListingDoc } from "@/lib/collections";
import { HOUR, rateLimit } from "@/lib/rate-limit";
import { getSellerContext } from "@/lib/seller";
import { listingCreateBody } from "@/lib/validators";

/**
 * Creates a draft listing from uploaded photos: Gemini Listing Writer fills in the fields
 * (SPEC §7, §8.2). The draft stays inactive until the seller reviews and publishes it.
 */
export async function POST(req: Request) {
  const ctx = await getSellerContext();
  if (!ctx?.shop) return apiError(403, "no_shop", "Open your treehouse first.");
  const shop = ctx.shop;

  const parsed = await parseBody(req, listingCreateBody);
  if ("response" in parsed) return parsed.response;
  const { photos, sellerNotes } = parsed.data;

  const folder = listingFolder(shop._id.toHexString());
  if (!photos.every((p) => isOwnUpload(p, folder))) {
    return apiError(400, "bad_photo", "Those photos didn't come from this treehouse's uploads.");
  }
  if (!(await rateLimit(`ai:listing:${ctx.session.userId}`, 30, HOUR))) {
    return apiError(429, "rate_limited", "That's a lot of drafts — try again in a little while.");
  }

  // Send Gemini smaller copies, fetched from Cloudinary.
  const images = await Promise.all(
    photos.map(async (p) => {
      const res = await fetch(resized(p, 1024));
      if (!res.ok) throw new Error(`photo fetch ${res.status}`);
      return { mimeType: "image/jpeg", data: Buffer.from(await res.arrayBuffer()).toString("base64") };
    }),
  ).catch(() => null);
  if (!images)
    return apiError(502, "photo_fetch", "We couldn't read those photos. Try uploading them again.");

  const result = await writeListingDraft({
    images,
    category: CATEGORIES.find((c) => c.id === shop.category)?.label ?? "Other",
    shopName: shop.name,
    priceMin: shop.priceRange.min,
    priceMax: shop.priceRange.max,
    notes: sellerNotes,
  });
  // SPEC §11: block listings flagged as unsafe.
  if (result.blocked) {
    return apiError(
      422,
      "blocked",
      "These photos or notes can't be listed on Tree Dorm. Try different photos.",
    );
  }

  const { draft } = result;
  const listing: ListingDoc = {
    _id: new ObjectId(),
    shopId: shop._id,
    title: draft.title,
    description: draft.description.slice(0, 500),
    priceCents: draft.suggestedPriceCents,
    photos,
    checkpoints: draft.checkpoints,
    customTextAllowed: draft.customTextAllowed,
    tags: [...new Set(draft.tags)],
    active: false,
    aiAssisted: result.ai,
    createdAt: new Date(),
  };
  const { listings } = await collections();
  await listings.insertOne(listing);
  return Response.json({
    listing: { ...listing, _id: listing._id.toHexString(), shopId: shop._id.toHexString() },
    ai: result.ai,
  });
}
