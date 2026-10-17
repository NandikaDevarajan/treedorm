"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import { BottomSheet } from "@/components/app/BottomSheet";
import { TabBar } from "@/components/app/TabBar";
import { AITag } from "@/components/woodland/AITag";
import { CreamCard } from "@/components/woodland/CreamCard";
import { Creature } from "@/components/woodland/Creature";
import { EmptyState } from "@/components/woodland/EmptyState";
import { LeafChip } from "@/components/woodland/LeafChip";
import { LoadingState } from "@/components/woodland/LoadingState";
import { SearchField } from "@/components/woodland/SearchField";
import { SunRays } from "@/components/woodland/SunRays";
import { VineBorder } from "@/components/woodland/VineBorder";
import { WoodButton } from "@/components/woodland/WoodButton";
import { CREATURES, CREATURE_FOR } from "@/lib/creatures";

const COLORS = [
  ["almond", "bg-almond", "Marketplace background"],
  ["carmel", "bg-carmel", "Account creation, warm accents"],
  ["bark", "bg-bark", "Wood, headings, primary controls"],
  ["walnut", "bg-walnut", "Text, outlines"],
  ["leaf", "bg-leaf", "Foliage, selected filters"],
  ["sage", "bg-sage", "Soft green surfaces"],
  ["cream", "bg-cream", "Cards, form fields"],
  ["gold", "bg-gold", "Highlights, magic"],
] as const;

const CATEGORIES = ["Hair", "Nails", "Photos", "Baked goods", "Tutoring", "Fitness"];

// Decorative spirits for category treehouse variants (Phase 4) — never avatars or ambient creatures.
const SPIRITS = [
  "mushroom-friends",
  "flower-spirit",
  "tiny-dragon",
  "enchanted-owl",
  "magical-fox",
  "glowing-snail",
  "fantasy-hedgehog",
  "woodland-sprite",
  "leaf-creature",
  "acorn-friend-01",
  "acorn-friend-02",
  "tree-spirit",
] as const;

const HATS = ["acorn-cap", "flower-crown", "straw-sunhat", "wizard"];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-3xl text-bark">{title}</h2>
      {children}
    </section>
  );
}

export function Styleguide() {
  const [selected, setSelected] = useState<string[]>(["Photos"]);
  const [sheetOpen, setSheetOpen] = useState(false);

  const toggle = (c: string) => setSelected((s) => (s.includes(c) ? s.filter((x) => x !== c) : [...s, c]));

  return (
    <div className="min-h-dvh pb-28">
      <VineBorder dense peeker />
      <main className="mx-auto -mt-6 flex max-w-3xl flex-col gap-12 px-safe">
        <header className="flex flex-col gap-2">
          <h1 className="font-display text-5xl text-bark">Tree Dorm styleguide</h1>
          <p className="max-w-prose text-walnut/80">
            Tokens and shared woodland components from SPEC §9. Every screen is built from these.
          </p>
        </header>

        <Section title="Colours">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {COLORS.map(([name, bg, use]) => (
              <li key={name} className="overflow-hidden rounded-2xl border border-bark/15 bg-cream">
                <div className={`h-16 ${bg}`} />
                <div className="p-3 text-sm">
                  <p className="font-bold">{name}</p>
                  <p className="text-walnut/75">{use}</p>
                </div>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Type">
          <CreamCard className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <p className="font-display text-5xl leading-none text-bark">Golden Hour Grads</p>
              <p className="font-display text-3xl text-bark">Sweet Dorm Bakes</p>
              <p className="text-sm text-walnut/75">
                Bloom Spring (--font-display): titles, short headings, treehouse names, decorative labels.
              </p>
            </div>
            <div className="flex flex-col gap-2 border-t border-bark/15 pt-4">
              <p>
                National Park (--font-body) carries everything else: paragraphs, labels, inputs, buttons,
                navigation, search and filters. Body text is set at 17px with 1.6 line spacing so it breathes
                on a phone.
              </p>
              <p className="font-semibold">Semibold — labels and emphasis.</p>
              <p className="font-bold">Bold — buttons and navigation.</p>
              <p className="text-sm text-walnut/75">Small — helper and validation messages.</p>
            </div>
          </CreamCard>
        </Section>

        <Section title="Buttons">
          <div className="flex flex-wrap gap-3">
            <WoodButton>Enter the village</WoodButton>
            <WoodButton variant="secondary">Open your treehouse</WoodButton>
            <WoodButton size="lg">Book</WoodButton>
            <WoodButton disabled>Disabled</WoodButton>
            <WoodButton href="/" variant="secondary">
              Link button
            </WoodButton>
          </div>
        </Section>

        <Section title="Search & chips">
          <SearchField label="Search treehouses" placeholder="Haircuts, grad photos, cookies…" />
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Categories">
            {CATEGORIES.map((c) => (
              <LeafChip key={c} selected={selected.includes(c)} onClick={() => toggle(c)}>
                {c}
              </LeafChip>
            ))}
          </div>
        </Section>

        <Section title="Cards & AI label">
          <div className="grid gap-4 sm:grid-cols-2">
            <CreamCard className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-2xl text-bark">Fade Lab</h3>
                <AITag />
              </div>
              <p className="text-walnut/80">
                Clean fades and lineups in the Lander lounge. Booked 40+ times.
              </p>
            </CreamCard>
            <CreamCard className="bg-carmel/40">
              <h3 className="font-display text-2xl text-bark">On a carmel page</h3>
              <p className="text-walnut">Cream cards stay readable over warm backgrounds.</p>
            </CreamCard>
          </div>
        </Section>

        <Section title="Bottom sheet">
          <div>
            <WoodButton variant="secondary" onClick={() => setSheetOpen(true)}>
              Open filters
            </WoodButton>
          </div>
          <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Filters">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <LeafChip key={c} selected={selected.includes(c)} onClick={() => toggle(c)}>
                  {c}
                </LeafChip>
              ))}
            </div>
            <WoodButton onClick={() => setSheetOpen(false)}>Show treehouses</WoodButton>
          </BottomSheet>
        </Section>

        <Section title="Empty state">
          <CreamCard>
            <EmptyState
              title="No treehouses yet"
              action={<WoodButton variant="secondary">Clear filters</WoodButton>}
            >
              Nothing matches those filters. Try another category.
            </EmptyState>
          </CreamCard>
        </Section>

        <Section title="Light">
          <div className="relative h-40 overflow-hidden rounded-card bg-leaf">
            <SunRays />
            <p className="absolute bottom-3 left-4 rounded-full bg-cream px-3 py-1 text-sm font-semibold">
              SunRays: still, warm canopy light from the mood references
            </p>
          </div>
        </Section>

        <Section title="Woodland creatures">
          <p className="max-w-prose text-walnut/85">
            Still drawings, never animated, never an avatar. In the app at most one or two show at a time, and
            never over buttons, text or forms. This page shows them all at once only as a catalogue.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <CreamCard className="flex flex-col gap-2 overflow-hidden p-0">
              <VineBorder peeker className="bg-almond" />
              <p className="px-5 pb-4 text-sm">
                <strong>Marketplace vines</strong> — {CREATURE_FOR.vinePeek} peeks out from behind the leaves.
              </p>
            </CreamCard>
            <CreamCard className="flex flex-col gap-2">
              <div className="relative mt-14 rounded-2xl border border-bark/15 bg-almond/60 p-4">
                <Creature name={CREATURE_FOR.authCard} size={60} className="absolute -top-[53px] right-4" />
                <p className="font-display text-2xl text-bark">Welcome back</p>
                <p className="text-sm text-walnut/80">Sign-in card</p>
              </div>
              <p className="text-sm">
                <strong>Sign-in card</strong> — {CREATURE_FOR.authCard} perches on the top edge.
              </p>
            </CreamCard>
            <CreamCard className="p-0">
              <EmptyState title="Nothing here yet">
                Empty states — {CREATURE_FOR.emptyState} says hello.
              </EmptyState>
            </CreamCard>
            <CreamCard className="p-0">
              <LoadingState label={`Loading screens — ${CREATURE_FOR.loading} dozes.`} />
            </CreamCard>
            <CreamCard className="flex items-center gap-4 sm:col-span-2">
              <Creature name={CREATURE_FOR.checkPassed} size={88} />
              <div>
                <p className="font-display text-3xl text-leaf">Photo check passed</p>
                <p className="text-sm text-walnut/85">
                  Phase 8 — {CREATURE_FOR.checkPassed} sits beside the result when a proof photo matches.
                </p>
              </div>
            </CreamCard>
          </div>
          <CreamCard>
            <h3 className="mb-3 font-bold">All cut-outs</h3>
            <ul className="grid grid-cols-3 gap-4 sm:grid-cols-6">
              {CREATURES.map((c) => (
                <li key={c} className="flex flex-col items-center gap-1 text-center text-xs">
                  <Creature name={c} size={64} />
                  {c}
                </li>
              ))}
            </ul>
          </CreamCard>
        </Section>

        <Section title="Avatar & accessories">
          <CreamCard className="flex flex-col gap-6">
            <div className="flex flex-wrap items-end gap-6">
              <figure className="flex flex-col items-center gap-2">
                <Image
                  src="/assets/characters/hedgehog-default.png"
                  alt="Default hedgehog avatar in an orange beanie"
                  width={160}
                  height={215}
                  className="h-40 w-auto"
                />
                <figcaption className="text-sm">hedgehog-default — the only avatar</figcaption>
              </figure>
              <figure className="flex flex-col items-center gap-2">
                <Image
                  src="/assets/treehouse/door.png"
                  alt="Treehouse door crop"
                  width={54}
                  height={78}
                  className="h-24 w-auto rounded-md"
                />
                <figcaption className="text-sm">door.png</figcaption>
              </figure>
            </div>

            <div>
              <h3 className="mb-2 font-bold">Woodland spirits (category decorations, Phase 4)</h3>
              <ul className="grid grid-cols-4 gap-3 sm:grid-cols-6">
                {SPIRITS.map((s) => (
                  <li key={s} className="flex flex-col items-center gap-1 text-center text-xs">
                    <Image
                      src={`/assets/characters/spirits/${s}.png`}
                      alt=""
                      width={64}
                      height={64}
                      className="h-16 w-auto max-w-full object-contain"
                    />
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-2 font-bold">Sunglasses</h3>
              <ul className="grid grid-cols-4 gap-3">
                {Array.from({ length: 8 }, (_, i) => `sunglasses-${String(i + 1).padStart(2, "0")}`).map(
                  (g) => (
                    <li key={g}>
                      <Image
                        src={`/assets/accessories/${g}.png`}
                        alt={g}
                        width={120}
                        height={50}
                        className="h-auto w-full"
                      />
                    </li>
                  ),
                )}
              </ul>
            </div>

            <div>
              <h3 className="mb-2 font-bold">
                Hats <span className="text-sm font-normal text-walnut/70">(placeholder art)</span>
              </h3>
              <ul className="grid grid-cols-4 gap-3">
                {HATS.map((h) => (
                  <li key={h} className="flex flex-col items-center gap-1 text-xs">
                    <Image
                      src={`/assets/accessories/hat-${h}.svg`}
                      alt=""
                      width={96}
                      height={64}
                      className="h-14 w-auto"
                    />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          </CreamCard>
        </Section>
      </main>

      <TabBar isSeller className="fixed inset-x-0 bottom-0" />
    </div>
  );
}
