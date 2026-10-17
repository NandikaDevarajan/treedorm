import type { Metadata } from "next";
import { ObjectId } from "mongodb";
import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/app/AppHeader";
import { ListingEditor } from "@/components/seller/ListingEditor";
import { LeafyBackground } from "@/components/woodland/LeafyBackground";
import { collections } from "@/lib/collections";
import { getSellerContext } from "@/lib/seller";

export const metadata: Metadata = { title: "Edit listing · Tree Dorm" };

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await getSellerContext();
  if (!ctx?.shop) redirect("/seller");
  const { id } = await params;
  if (!ObjectId.isValid(id)) notFound();
  const { listings } = await collections();
  const l = await listings.findOne({ _id: new ObjectId(id), shopId: ctx.shop._id });
  if (!l) notFound();
  return (
    <LeafyBackground tone="almond">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-safe py-8">
        <div className="rounded-[2rem] bg-cream p-6 shadow-soft sm:p-8">
          <ListingEditor
            shopSlug={ctx.shop.slug}
            initial={{
              id,
              title: l.title,
              description: l.description,
              priceCents: l.priceCents,
              tags: l.tags,
              checkpoints: l.checkpoints,
              customTextAllowed: l.customTextAllowed,
              photos: l.photos,
              aiAssisted: l.aiAssisted,
            }}
          />
        </div>
      </main>
    </LeafyBackground>
  );
}
