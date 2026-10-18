import type { Metadata } from "next";
import Link from "next/link";
import { ObjectId } from "mongodb";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app/AppHeader";
import { CreamCard } from "@/components/woodland/CreamCard";
import { EmptyState } from "@/components/woodland/EmptyState";
import { HedgehogAvatar } from "@/components/woodland/HedgehogAvatar";
import { LeafyBackground } from "@/components/woodland/LeafyBackground";
import { WoodButton } from "@/components/woodland/WoodButton";
import { getSession } from "@/lib/auth";
import { collections } from "@/lib/collections";
import { threadPeople } from "@/lib/threads";

export const metadata: Metadata = { title: "Messages · Tree Dorm" };

const ago = (d: Date) => {
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)}h`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

/** The user's private chats (SPEC §4), one per booking. */
export default async function MessagesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const uid = new ObjectId(session.userId);
  const { threads } = await collections();
  const rows = await threads
    .find({ $or: [{ buyerId: uid }, { sellerId: uid }] })
    .sort({ lastMessageAt: -1 })
    .limit(100)
    .toArray();
  const items = await Promise.all(
    rows.map(async (t) => {
      const people = await threadPeople(t);
      const other = t.buyerId.equals(uid) ? people.seller : people.buyer;
      return {
        id: t._id.toHexString(),
        other,
        listingTitle: people.listingTitle,
        last: t.lastMessage ?? "",
        at: t.lastMessageAt,
      };
    }),
  );

  return (
    <LeafyBackground tone="almond">
      <AppHeader />
      <main className="mx-auto flex max-w-2xl flex-col gap-5 px-safe pt-6 pb-12">
        <h1 className="font-display text-5xl leading-none text-bark">Messages</h1>
        {items.length ? (
          <CreamCard className="p-0">
            <ul className="divide-y divide-bark/10">
              {items.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/messages/${t.id}`}
                    className="flex min-h-18 items-center gap-3 px-4 py-3 hover:bg-almond/60"
                  >
                    <HedgehogAvatar avatar={t.other.avatar} variant="badge" className="size-12 shrink-0" />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate font-bold text-bark">{t.other.name}</span>
                        <span className="shrink-0 text-xs text-walnut/70">{ago(t.at)}</span>
                      </span>
                      {t.listingTitle && (
                        <span className="truncate text-sm font-semibold text-walnut/85">
                          {t.listingTitle}
                        </span>
                      )}
                      <span className="truncate text-sm text-walnut/75">{t.last}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </CreamCard>
        ) : (
          <CreamCard>
            <EmptyState
              title="No chats yet"
              action={<WoodButton href="/market">Explore the village</WoodButton>}
            >
              Booking a treehouse opens a private chat with the seller.
            </EmptyState>
          </CreamCard>
        )}
      </main>
    </LeafyBackground>
  );
}
