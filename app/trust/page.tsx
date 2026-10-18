import type { Metadata } from "next";
import Link from "next/link";
import { AppHeader } from "@/components/app/AppHeader";
import { SiteLinks } from "@/components/site/SiteLinks";
import { CreamCard } from "@/components/woodland/CreamCard";
import { LeafyBackground } from "@/components/woodland/LeafyBackground";

export const metadata: Metadata = {
  title: "How we keep you safe · Tree Dorm",
  description: "How Tree Dorm keeps students and their money safe, in plain language.",
};

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "Only students from your school",
    body: [
      "You sign up with your school's .edu email. We send a one-time code to that inbox, so only people who can open it get in.",
      "You only see and book treehouses at your own school.",
    ],
  },
  {
    title: "Your room stays private",
    body: [
      "Shop pages never show room numbers or addresses. Once you book, a private chat opens for just you and the seller. That's the only place to share where to meet.",
    ],
  },
  {
    title: "Your card is held, not charged",
    body: [
      "When you book, your card is held for the price. No money moves yet.",
      "You're only charged after the order is verified, or when you choose to pay.",
    ],
  },
  {
    title: "How the photo check works",
    body: [
      "When your order is done, you snap one photo of it. The check compares your photo with the shop's listing photos and its checklist (like “clean neckline”). If you asked for custom writing, it reads the text in your photo too, and small typos are fine.",
      "You always see the reasons, line by line, so you know why it decided what it did.",
    ],
  },
  {
    title: "The check can only release payment",
    body: [
      "If your photo clearly matches, the check releases the payment to the seller. That's the only thing it can do on its own.",
      "It can never refund or cancel anything by itself. Those choices are always yours.",
    ],
  },
  {
    title: "If it doesn't match, you choose",
    body: [
      "When the check isn't sure, or something looks different, nothing is charged until you pick one:",
      "Accept anyway: pay the full price. Partial refund: pay part of it. Cancel: pay nothing.",
    ],
  },
  {
    title: "Proof photos don't stick around",
    body: ["Your proof photo is deleted as soon as the order settles. We keep the reasons, not the picture."],
  },
];

/** /trust (SPEC §11): how Tree Dorm keeps people safe, in plain words. Public. */
export default function TrustPage() {
  return (
    <LeafyBackground tone="almond">
      <AppHeader />
      <main className="mx-auto flex max-w-2xl flex-col gap-5 px-safe py-8">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-5xl leading-none text-bark">How we keep you safe</h1>
          <p className="text-lg text-walnut/90">
            Tree Dorm is a small village. Here&apos;s how we keep it friendly and fair.
          </p>
        </div>

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

        <p className="text-walnut/90">
          Questions? Ask the seller in your order chat, or{" "}
          <Link href="/about" className="font-semibold text-bark underline underline-offset-4">
            read about Tree Dorm
          </Link>
          .
        </p>
        <SiteLinks />
      </main>
    </LeafyBackground>
  );
}
