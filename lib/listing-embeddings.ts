import type { ObjectId } from "mongodb";
import { embeddingKey, embedTexts, listingEmbeddingText } from "@/lib/ai/embeddings";
import { collections, type ListingDoc, type ShopDoc } from "@/lib/collections";

/**
 * (Re)embeds the given listings whose text changed since they were last embedded. Returns how many
 * were updated. Failures are logged, never thrown: search falls back to keywords for those listings.
 */
export async function refreshListingEmbeddings(
  items: { listing: ListingDoc; shop: Pick<ShopDoc, "name" | "category" | "tags"> }[],
): Promise<number> {
  const stale = items
    .map(({ listing, shop }) => {
      const text = listingEmbeddingText(listing, shop);
      return { id: listing._id as ObjectId, text, key: embeddingKey(text), current: listing.embeddingKey };
    })
    .filter((x) => x.key !== x.current);
  if (!stale.length) return 0;

  const { listings } = await collections();
  let done = 0;
  for (let i = 0; i < stale.length; i += 100) {
    const batch = stale.slice(i, i + 100);
    try {
      const vectors = await embedTexts(
        batch.map((b) => b.text),
        "document",
      );
      await listings.bulkWrite(
        batch.map((b, j) => ({
          updateOne: {
            filter: { _id: b.id },
            update: { $set: { embedding: vectors[j], embeddingKey: b.key } },
          },
        })),
      );
      done += batch.length;
    } catch (err) {
      console.error("[embeddings] couldn't embed listings:", err);
    }
  }
  return done;
}
