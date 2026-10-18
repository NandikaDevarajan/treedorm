import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app/AppHeader";
import { OrderCard } from "@/components/orders/OrderCard";
import { CreamCard } from "@/components/woodland/CreamCard";
import { EmptyState } from "@/components/woodland/EmptyState";
import { LeafyBackground } from "@/components/woodland/LeafyBackground";
import { WoodButton } from "@/components/woodland/WoodButton";
import { getSession } from "@/lib/auth";
import { groupBuyerOrders, ordersFor, type OrderCardData } from "@/lib/order-views";

export const metadata: Metadata = { title: "Your orders · Tree Dorm" };

/** Buyer orders (SPEC §4): upcoming, needs photo, settled. */
export default async function OrdersPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const { upcoming, needsPhoto, settled } = groupBuyerOrders(await ordersFor(session.userId, "buyer"));
  const none = !upcoming.length && !needsPhoto.length && !settled.length;

  const section = (id: string, title: string, list: OrderCardData[], hint: string, empty: string) => (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <div>
        <h2 id={id} className="font-display text-3xl text-bark">
          {title}
        </h2>
        <p className="text-sm text-walnut/80">{hint}</p>
      </div>
      {list.length ? (
        <ul className="flex flex-col gap-3">
          {list.map((o) => (
            <li key={o.id}>
              <OrderCard
                order={o}
                viewer="buyer"
                actions={
                  o.status === "pending_payment" ? (
                    <WoodButton href={`/checkout/${o.id}`}>Finish payment</WoodButton>
                  ) : o.threadId ? (
                    <WoodButton href={`/messages/${o.threadId}`} variant="secondary">
                      Chat
                    </WoodButton>
                  ) : undefined
                }
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl bg-cream/70 px-4 py-3 text-walnut/80">{empty}</p>
      )}
    </section>
  );

  return (
    <LeafyBackground tone="almond">
      <AppHeader />
      <main className="mx-auto flex max-w-2xl flex-col gap-8 px-safe pt-6 pb-12">
        <h1 className="font-display text-5xl leading-none text-bark">Your orders</h1>
        {none ? (
          <CreamCard>
            <EmptyState
              title="No orders yet"
              action={<WoodButton href="/market">Explore the village</WoodButton>}
            >
              When you book a treehouse, it shows up here.
            </EmptyState>
          </CreamCard>
        ) : (
          <>
            {section(
              "needs-photo",
              "Needs a photo",
              needsPhoto,
              "After the service, a photo of the result releases the payment.",
              "Nothing waiting on a photo.",
            )}
            {section(
              "upcoming",
              "Upcoming",
              upcoming,
              "Your card is held, not charged, until the order is verified.",
              "No upcoming bookings.",
            )}
            {section("settled", "Settled", settled, "Finished orders.", "Nothing settled yet.")}
          </>
        )}
      </main>
    </LeafyBackground>
  );
}
