import type { Metadata } from "next";
import { AppHeader } from "@/components/app/AppHeader";
import { SiteLinks } from "@/components/site/SiteLinks";
import { CreamCard } from "@/components/woodland/CreamCard";
import { LeafyBackground } from "@/components/woodland/LeafyBackground";
import { WoodButton } from "@/components/woodland/WoodButton";
import { getTraction } from "@/lib/traction";

export const metadata: Metadata = {
  title: "About · Tree Dorm",
  description:
    "Tree Dorm: little shops run by students, with payment released only when the work is verified.",
};

export const dynamic = "force-dynamic";

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "The problem",
    body: [
      "Every campus is full of students who cut hair, bake, tutor, coach and make things. They sell through group chats and Instagram DMs.",
      "Buyers can't tell who's good, pay up front and hope, and end up sharing room numbers with strangers. Sellers chase payments and no-shows.",
    ],
  },
  {
    title: "Our answer",
    body: [
      "Tree Dorm gives each student seller a little treehouse shop, open only to their school's .edu emails.",
      "Buyers book a time and their card is held, not charged. When the order is done, the buyer snaps one photo. If it matches the listing, payment is released. If it doesn't, the buyer chooses: accept, partial refund or cancel.",
      "Every completed order adds to the shop's Verified count, so trust builds with real work, not just reviews.",
    ],
  },
  {
    title: "How we make money",
    body: [
      "An 8% platform fee on payments we capture. If a buyer cancels, nobody pays anything.",
      "An optional Featured Treehouse boost for $4 a month puts a shop at the top of its school's village.",
    ],
  },
  {
    title: "Where we start",
    body: [
      "We start at the University of Washington, where we can win sellers one by one and learn fast. Then we grow school by school: each new campus is its own village with its own sellers, so every school starts small and close-knit.",
    ],
  },
  {
    title: "Why now",
    body: [
      "Students already run side businesses, but the tools they use weren't made for it. Phone cameras are everywhere, held payments are easy to set up, and checking a photo against a listing now takes seconds. That makes “pay only when it's right” practical for a $20 haircut, not just a big purchase.",
    ],
  },
];

/** /about (SPEC §15): the SideShift pitch, with a traction strip from seed data. Public. */
export default async function AboutPage() {
  const t = await getTraction().catch(() => null);
  const stats = t
    ? [
        { value: String(t.shops), label: "treehouses" },
        { value: String(t.verifiedOrders), label: "verified orders" },
        { value: t.averageRating ? `${t.averageRating.toFixed(1)}★` : "—", label: "average rating" },
      ]
    : null;

  return (
    <LeafyBackground tone="almond">
      <AppHeader />
      <main className="mx-auto flex max-w-2xl flex-col gap-5 px-safe py-8">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-5xl leading-none text-bark">About Tree Dorm</h1>
          <p className="text-lg text-walnut/90">
            Little shops run by students, where you only pay once the work is right.
          </p>
        </div>

        {stats && (
          <CreamCard as="section" aria-labelledby="traction" className="flex flex-col gap-3">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <h2 id="traction" className="font-display text-3xl text-bark">
                So far
              </h2>
              <p className="text-sm font-semibold text-walnut/75">Demo data</p>
            </div>
            <dl className="grid grid-cols-3 gap-2 text-center">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="flex flex-col-reverse gap-0.5 rounded-2xl bg-almond/60 px-2 py-3"
                >
                  <dt className="text-sm leading-tight text-walnut/80">{s.label}</dt>
                  <dd className="text-2xl font-extrabold text-bark">{s.value}</dd>
                </div>
              ))}
            </dl>
            <p className="text-sm text-walnut/75">
              These numbers come from our demo seed, not real customers.
            </p>
          </CreamCard>
        )}

        {SECTIONS.map((s) => (
          <CreamCard key={s.title} as="section" className="flex flex-col gap-2">
            <h2 className="font-display text-3xl leading-tight text-bark">{s.title}</h2>
            {s.body.map((p) => (
              <p key={p} className="leading-relaxed">
                {p}
              </p>
            ))}
          </CreamCard>
        ))}

        <div className="flex flex-col gap-3 sm:flex-row">
          <WoodButton href="/market" className="w-full sm:w-auto">
            Visit the village
          </WoodButton>
          <WoodButton href="/signup?intent=business" variant="secondary" className="w-full sm:w-auto">
            Open your treehouse
          </WoodButton>
        </div>
        <SiteLinks />
      </main>
    </LeafyBackground>
  );
}
