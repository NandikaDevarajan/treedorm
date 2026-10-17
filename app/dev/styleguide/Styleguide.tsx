"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import { BottomSheet } from "@/components/app/BottomSheet";
import { TabBar } from "@/components/app/TabBar";
import { AITag } from "@/components/woodland/AITag";
import { CreamCard } from "@/components/woodland/CreamCard";
import { EmptyState, type Spirit } from "@/components/woodland/EmptyState";
import { LeafChip } from "@/components/woodland/LeafChip";
import { SearchField } from "@/components/woodland/SearchField";
import { VineBorder } from "@/components/woodland/VineBorder";
import { WoodButton } from "@/components/woodland/WoodButton";

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

const SPIRITS: Spirit[] = [
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
];

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
      <VineBorder dense />
      <main className="mx-auto -mt-6 flex max-w-3xl flex-col gap-12 px-safe">
        <header className="flex flex-col gap-2">
          <p className="text-sm font-bold tracking-widest text-leaf uppercase">Phase 0 · design system</p>
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
          <CreamCard className="flex flex-col gap-3">
            <p className="font-display text-4xl text-bark">Golden Hour Grads</p>
            <p className="font-display text-2xl text-bark">Display — titles &amp; treehouse names</p>
            <p>
              Body — Nunito. Readable, rounded and friendly for paragraphs, labels, inputs and buttons. The
              display face is never used for paragraphs or small labels.
            </p>
            <p className="text-sm text-walnut/75">Small text — helper and validation messages.</p>
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
              spirit="glowing-snail"
              action={<WoodButton variant="secondary">Clear filters</WoodButton>}
            >
              Nothing matches those filters. Try another category.
            </EmptyState>
          </CreamCard>
        </Section>

        <Section title="Prepared art">
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
                <figcaption className="text-sm">hedgehog-default.png</figcaption>
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
              <h3 className="mb-2 font-bold">Woodland spirits</h3>
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
