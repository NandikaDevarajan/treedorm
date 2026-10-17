"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";
import { HAT_FITS, SUNGLASSES_FITS, type AccessoryFit, type Avatar } from "@/lib/avatar";

type Tab = "hat" | "sunglasses";

interface Props {
  value: Avatar;
  onChange: (avatar: Avatar) => void;
  className?: string;
}

const TABS: { id: Tab; label: string; fits: AccessoryFit[] }[] = [
  { id: "hat", label: "Hats", fits: HAT_FITS },
  { id: "sunglasses", label: "Sunglasses", fits: SUNGLASSES_FITS },
];

/**
 * Browse and pick one hat and one pair of sunglasses (SPEC §9.9). Each group is a radio group with a
 * "None" choice; tapping the selected item again also takes it off.
 */
export function AccessoryPicker({ value, onChange, className }: Props) {
  const id = useId();
  const [tab, setTab] = useState<Tab>("hat");
  const current = TABS.find((t) => t.id === tab)!;
  const selected = tab === "hat" ? value.hat : value.sunglasses;

  const pick = (next: string | null) =>
    onChange(
      tab === "hat"
        ? { ...value, hat: next as Avatar["hat"] }
        : { ...value, sunglasses: next as Avatar["sunglasses"] },
    );

  const onTabKey = (e: KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = tab === "hat" ? "sunglasses" : "hat";
    setTab(next);
    document.getElementById(`${id}-tab-${next}`)?.focus();
  };

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div
        role="tablist"
        aria-label="Accessory type"
        className="grid grid-cols-2 gap-1 rounded-full bg-almond p-1"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            id={`${id}-tab-${t.id}`}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            aria-controls={`${id}-panel`}
            tabIndex={tab === t.id ? 0 : -1}
            onClick={() => setTab(t.id)}
            onKeyDown={onTabKey}
            className={cn(
              "min-h-11 rounded-full px-4 font-bold transition-colors",
              tab === t.id ? "bg-cream text-bark shadow-soft" : "text-walnut/75 hover:text-walnut",
            )}
          >
            {t.label}
            {(t.id === "hat" ? value.hat : value.sunglasses) && (
              <span aria-hidden className="ml-1.5 inline-block size-2 rounded-full bg-leaf align-middle" />
            )}
          </button>
        ))}
      </div>

      <div
        id={`${id}-panel`}
        role="radiogroup"
        aria-labelledby={`${id}-tab-${tab}`}
        className="grid grid-cols-3 gap-3 sm:grid-cols-4"
      >
        <Option
          label={`No ${tab === "hat" ? "hat" : "sunglasses"}`}
          selected={!selected}
          onSelect={() => pick(null)}
        >
          <span className="text-sm font-semibold text-walnut/70">None</span>
        </Option>
        {current.fits.map((fit) => (
          <Option
            key={fit.id}
            label={fit.label}
            selected={selected === fit.id}
            onSelect={() => pick(selected === fit.id ? null : fit.id)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- tiny accessory thumbnail */}
            <img src={fit.src} alt="" className="max-h-14 w-[78%] object-contain" />
          </Option>
        ))}
      </div>
    </div>
  );
}

function Option({
  label,
  selected,
  onSelect,
  children,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      onClick={onSelect}
      className={cn(
        "relative flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border-[3px] bg-cream p-2",
        "transition-[transform,border-color] duration-150 ease-organic",
        selected ? "border-leaf" : "border-bark/15 hover:-translate-y-0.5 hover:border-bark/35",
      )}
    >
      {children}
      {selected && (
        <span
          aria-hidden
          className="absolute top-1.5 right-1.5 grid size-5 place-items-center rounded-full bg-leaf text-cream"
        >
          <svg viewBox="0 0 16 16" className="size-3.5 fill-none stroke-current stroke-[2.5]">
            <path d="m3.5 8.5 3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </button>
  );
}
