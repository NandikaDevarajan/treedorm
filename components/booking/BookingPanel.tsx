"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { BottomSheet } from "@/components/app/BottomSheet";
import { WoodButton } from "@/components/woodland/WoodButton";
import { cn } from "@/lib/cn";
import { formatCents } from "@/lib/money";
import { formatSlot, SHOP_TZ, type Slot } from "@/lib/slots";

interface Props {
  listingId: string;
  priceCents: number;
  customTextAllowed: boolean;
  slots: Slot[];
  /** Why this viewer can't book (own listing, other school), if so. */
  blocked: string | null;
}

const dayKey = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: SHOP_TZ });
const dayLabel = (iso: string) => {
  const d = new Date(iso);
  return {
    weekday: d.toLocaleDateString("en-US", { timeZone: SHOP_TZ, weekday: "short" }),
    date: d.toLocaleDateString("en-US", { timeZone: SHOP_TZ, month: "short", day: "numeric" }),
  };
};
const timeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", { timeZone: SHOP_TZ, hour: "numeric", minute: "2-digit" });

/**
 * Booking (SPEC §3.2 step 6): pick a day and a time from the shop's hours (booked or too-soon times
 * are greyed out), add custom words if the listing allows them, then Book → order + payment hold.
 * On phones the picker opens in a bottom sheet and Book sticks to the bottom of the screen.
 */
export function BookingPanel({ listingId, priceCents, customTextAllowed, slots, blocked }: Props) {
  const router = useRouter();
  const days = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const s of slots) map.set(dayKey(s.start), [...(map.get(dayKey(s.start)) ?? []), s]);
    return [...map.entries()].map(([key, list]) => ({ key, list, open: list.some((s) => s.available) }));
  }, [slots]);
  const [day, setDay] = useState(days.find((d) => d.open)?.key ?? days[0]?.key ?? "");
  const [slot, setSlot] = useState<string | null>(null);
  const [customText, setCustomText] = useState("");
  const [sheet, setSheet] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const current = days.find((d) => d.key === day);

  const book = async () => {
    if (!slot) {
      setSheet(true);
      return setError("Pick a time first.");
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          slotStart: slot,
          customText: customTextAllowed ? customText.trim() || undefined : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Couldn't book that. Try again.");
      router.push(json.next);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
      router.refresh(); // pick up newly taken slots
    }
  };

  const picker = (
    <div className="flex flex-col gap-4">
      {days.length === 0 ? (
        <p className="text-walnut/85">
          No open times in the next two weeks. Message the seller after booking another time, or check back
          soon.
        </p>
      ) : (
        <>
          <div
            role="radiogroup"
            aria-label="Day"
            className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]"
          >
            {days.map((d) => {
              const { weekday, date } = dayLabel(d.list[0].start);
              return (
                <button
                  key={d.key}
                  type="button"
                  role="radio"
                  aria-checked={day === d.key}
                  disabled={!d.open}
                  onClick={() => {
                    setDay(d.key);
                    setSlot(null);
                  }}
                  className={cn(
                    "flex min-h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl border-2 font-bold",
                    day === d.key ? "border-leaf bg-leaf text-cream" : "border-bark/20 bg-cream text-walnut",
                    !d.open && "opacity-40",
                  )}
                >
                  <span className="text-sm">{weekday}</span>
                  <span className="text-xs font-semibold">{date}</span>
                </button>
              );
            })}
          </div>
          <div role="radiogroup" aria-label="Time" className="grid grid-cols-3 gap-2">
            {current?.list.map((s) => (
              <button
                key={s.start}
                type="button"
                role="radio"
                aria-checked={slot === s.start}
                aria-label={`${timeLabel(s.start)}${s.available ? "" : ", not available"}`}
                disabled={!s.available}
                onClick={() => {
                  setSlot(s.start);
                  setError(null);
                }}
                className={cn(
                  "min-h-11 rounded-xl border-2 text-sm font-bold",
                  slot === s.start
                    ? "border-leaf bg-leaf text-cream"
                    : s.available
                      ? "border-bark/20 bg-cream text-walnut hover:border-bark/40"
                      : "cursor-not-allowed border-transparent bg-almond text-walnut/40 line-through",
                )}
              >
                {timeLabel(s.start)}
              </button>
            ))}
          </div>
          <p className="text-xs text-walnut/70">
            Times are Pacific time. Greyed-out times are booked or too soon.
          </p>
        </>
      )}
    </div>
  );

  if (blocked) {
    return (
      <aside className="rounded-card border border-bark/15 bg-cream p-5 shadow-soft">
        <p className="font-semibold">{blocked}</p>
      </aside>
    );
  }

  return (
    <>
      <aside className="flex flex-col gap-5 rounded-card border border-bark/15 bg-cream p-5 shadow-soft md:sticky md:top-6">
        <h2 className="font-display text-3xl text-bark">Book a time</h2>
        {/* Phones: the picker opens in a sheet. Desktop: inline. */}
        <div className="md:hidden">
          <button
            type="button"
            onClick={() => setSheet(true)}
            className="flex min-h-14 w-full items-center justify-between rounded-2xl border-2 border-bark/25 bg-cream px-4 text-left"
          >
            <span>
              <span className="block text-sm text-walnut/75">Time</span>
              <span className="font-bold">{slot ? formatSlot(slot) : "Pick a day and time"}</span>
            </span>
            <span aria-hidden className="font-bold text-bark">
              Change
            </span>
          </button>
        </div>
        <div className="hidden md:block">{picker}</div>

        {customTextAllowed && (
          <div>
            <label htmlFor="custom-text" className="mb-1.5 block font-semibold">
              What should it say?
            </label>
            <input
              id="custom-text"
              maxLength={80}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="e.g. Happy Birthday Maya"
              className="min-h-12 w-full rounded-2xl border-2 border-bark/30 bg-cream px-4 text-base text-walnut placeholder:text-walnut/55 focus:border-accent focus:outline-none"
            />
            <p className="mt-1.5 text-sm text-walnut/70">
              Optional. The seller sees this exactly as you write it.
            </p>
          </div>
        )}

        <p className="rounded-2xl bg-sage/35 px-4 py-3 text-sm">
          <strong>Your card is held, not charged,</strong> until your order is verified with a photo after the
          service.
        </p>
        {error && (
          <p role="alert" className="text-sm font-semibold text-danger">
            {error}
          </p>
        )}
        <div className="fixed inset-x-0 bottom-[var(--tabbar-h,0px)] z-30 border-t-2 border-bark/15 bg-cream/95 px-safe pt-3 pb-3 backdrop-blur-sm md:static md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
          <WoodButton size="lg" className="w-full" onClick={book} disabled={busy}>
            {busy ? "Booking…" : slot ? `Book · ${formatCents(priceCents)}` : "Pick a time"}
          </WoodButton>
        </div>
      </aside>

      <BottomSheet open={sheet} onClose={() => setSheet(false)} title="Pick a time">
        {picker}
        <WoodButton onClick={() => setSheet(false)} disabled={!slot}>
          {slot ? `Done · ${formatSlot(slot)}` : "Pick a time"}
        </WoodButton>
      </BottomSheet>
    </>
  );
}
