import { ObjectId } from "mongodb";
import { apiError, parseBody } from "@/lib/api";
import { collections } from "@/lib/collections";
import { refreshListingEmbeddings } from "@/lib/listing-embeddings";
import { getSellerContext } from "@/lib/seller";
import { listingUpdateBody } from "@/lib/validators";

/**
 * Seller edits a listing and optionally publishes it (SPEC §7 PATCH /api/listings/[id]).
 * Publishing (re)computes the listing's search embedding (SPEC §7, §8.3).
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getSellerContext();
  if (!ctx?.shop) return apiError(403, "no_shop", "Open your treehouse first.");
  const { id } = await params;
  if (!ObjectId.isValid(id)) return apiError(404, "not_found", "Listing not found.");

  const parsed = await parseBody(req, listingUpdateBody);
  if ("response" in parsed) return parsed.response;
  const { publish, ...fields } = parsed.data;

  const { listings } = await collections();
  // Only the shop that owns the listing can change it.
  const updated = await listings.findOneAndUpdate(
    { _id: new ObjectId(id), shopId: ctx.shop._id },
    {
      $set: {
        ...fields,
        tags: [...new Set(fields.tags)],
        ...(publish ? { active: true, publishedAt: new Date() } : {}),
      },
    },
    { returnDocument: "after" },
  );
  if (!updated) return apiError(404, "not_found", "Listing not found.");
  // Live listings are searchable by Ask Tree Dorm; a failed embed never blocks publishing.
  if (updated.active) await refreshListingEmbeddings([{ listing: updated, shop: ctx.shop }]);
  return Response.json({ listing: { id, active: updated.active }, next: `/t/${ctx.shop.slug}` });
}
