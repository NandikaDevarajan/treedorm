import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app/AppHeader";
import { MarketView } from "@/components/market/MarketView";
import { LeafyBackground } from "@/components/woodland/LeafyBackground";
import { VineBorder } from "@/components/woodland/VineBorder";
import { getSession } from "@/lib/auth";
import { collections } from "@/lib/collections";
import { getUniversityTheme, SEED_SCHOOLS } from "@/lib/schools";
import { parseShopQuery, searchShops } from "@/lib/shop-search";

export const metadata: Metadata = { title: "The village · Tree Dorm" };

type Props = { searchParams: Promise<{ q?: string; category?: string; sort?: string }> };

/** Marketplace (SPEC §9.10): only the signed-in student's own school. */
export default async function MarketPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");
  const query = parseShopQuery(await searchParams);
  const theme = getUniversityTheme(session.schoolDomain, SEED_SCHOOLS);
  const schoolShort = theme.short ?? session.schoolDomain;
  const [shops, total] = await Promise.all([
    searchShops(session.schoolDomain, query),
    collections().then(({ shops }) => shops.countDocuments({ schoolDomain: session.schoolDomain })),
  ]);

  return (
    <LeafyBackground tone="almond">
      <AppHeader />
      <VineBorder dense />
      <main className="mx-auto flex max-w-6xl flex-col gap-5 px-safe pb-12 md:px-8">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-5xl leading-none text-bark">The {schoolShort} village</h1>
          <p className="text-walnut/85">Little shops run by students at {theme.name ?? "your school"}.</p>
        </div>
        <MarketView
          initial={shops}
          initialQuery={query}
          schoolShort={schoolShort}
          schoolHasShops={total > 0}
          isSeller={session.accountType === "business"}
        />
      </main>
    </LeafyBackground>
  );
}
