import type { Availability } from "@/lib/collections";

/**
 * All seeded schools are on Pacific time, so shop hours are read in America/Los_Angeles.
 * SPEC-NOTE: add a per-school timezone if schools outside Pacific time are added.
 */
export const SHOP_TZ = "America/Los_Angeles";
export const DEFAULT_SLOT_MIN = 30;
export const BOOKING_DAYS = 14;
export const LEAD_MINUTES = 120;

/** Minutes the given UTC instant is ahead of UTC in `tz` (e.g. -420 for PDT). */
function offsetMinutes(at: Date, tz: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(at)
      .map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(
    +parts.year,
    +parts.month - 1,
    +parts.day,
    +parts.hour,
    +parts.minute,
    +parts.second,
  );
  return Math.round((asUtc - at.getTime()) / 60000);
}

/** The UTC instant for a wall-clock time (y-m-d hh:mm) in `tz`. Handles DST changes. */
export function zonedTime(y: number, m: number, d: number, hhmm: string, tz = SHOP_TZ): Date {
  const [h, min] = hhmm.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, h, min);
  const first = guess - offsetMinutes(new Date(guess), tz) * 60000;
  return new Date(guess - offsetMinutes(new Date(first), tz) * 60000);
}

/** The calendar date and weekday of an instant in `tz`. */
function zonedDate(at: Date, tz = SHOP_TZ) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
    })
      .formatToParts(at)
      .map((x) => [x.type, x.value]),
  );
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday);
  return { y: +p.year, m: +p.month, d: +p.day, weekday };
}

export interface Slot {
  start: string; // ISO
  end: string;
  available: boolean;
}

/**
 * Bookable slots for the next BOOKING_DAYS days from the shop's weekly hours (SPEC §3.2 step 6),
 * one per half-hour-rounded block of the listing's duration. Slots that overlap a booking, or start within
 * LEAD_MINUTES, come back with `available: false` so the picker can grey them out.
 */
export function buildSlots(opts: {
  availability: Availability[];
  durationMin?: number;
  booked: { start: Date; end: Date }[];
  now?: Date;
  days?: number;
}): Slot[] {
  const now = opts.now ?? new Date();
  const length = (opts.durationMin && opts.durationMin > 0 ? opts.durationMin : DEFAULT_SLOT_MIN) * 60000;
  // Start times sit on the half-hour grid: a 40-minute service gets 5:00, 6:00, … rather than 5:40.
  const step = Math.ceil(length / (30 * 60000)) * 30 * 60000;
  const earliest = now.getTime() + LEAD_MINUTES * 60000;
  const out: Slot[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < (opts.days ?? BOOKING_DAYS); i++) {
    const { y, m, d, weekday } = zonedDate(new Date(now.getTime() + i * 86400000));
    for (const window of opts.availability.filter((a) => a.day === weekday)) {
      const winStart = zonedTime(y, m, d, window.start).getTime();
      const winEnd = zonedTime(y, m, d, window.end).getTime();
      for (let t = winStart; t + length <= winEnd; t += step) {
        const start = new Date(t);
        const end = new Date(t + length);
        const key = start.toISOString();
        if (seen.has(key)) continue;
        seen.add(key);
        const clash = opts.booked.some(
          (b) => b.start.getTime() < end.getTime() && b.end.getTime() > start.getTime(),
        );
        out.push({ start: key, end: end.toISOString(), available: !clash && t >= earliest });
      }
    }
  }
  return out.sort((a, b) => a.start.localeCompare(b.start));
}

/** "Sat, Oct 24 · 5:00 PM" in the shop's timezone. */
export function formatSlot(start: Date | string, tz = SHOP_TZ): string {
  const d = typeof start === "string" ? new Date(start) : start;
  const day = d.toLocaleDateString("en-US", {
    timeZone: tz,
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const time = d.toLocaleTimeString("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit" });
  return `${day} · ${time}`;
}
