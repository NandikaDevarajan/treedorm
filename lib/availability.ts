import type { Availability } from "@/lib/collections";

export const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const ORDER = [1, 2, 3, 4, 5, 6, 0]; // show the week starting Monday

/** "9:00" → "9am", "13:30" → "1:30pm" */
export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const h12 = h % 12 || 12;
  return m ? `${h12}:${String(m).padStart(2, "0")}${suffix}` : `${h12}${suffix}`;
}

/** Groups days with the same hours: "Mon–Wed, Fri 4pm–8pm · Sat 10am–2pm". */
export function formatAvailability(slots: Availability[]): string {
  if (!slots.length) return "By arrangement";
  const byHours = new Map<string, number[]>();
  for (const s of slots) {
    const key = `${s.start}-${s.end}`;
    byHours.set(key, [...(byHours.get(key) ?? []), s.day]);
  }
  return [...byHours.entries()]
    .map(([key, days]) => {
      const [start, end] = key.split("-");
      const sorted = ORDER.filter((d) => days.includes(d));
      const runs: number[][] = [];
      for (const d of sorted) {
        const last = runs.at(-1);
        if (last && ORDER.indexOf(d) === ORDER.indexOf(last.at(-1)!) + 1) last.push(d);
        else runs.push([d]);
      }
      const dayText = runs
        .map((r) => (r.length > 2 ? `${DAYS[r[0]]}–${DAYS[r.at(-1)!]}` : r.map((d) => DAYS[d]).join(", ")))
        .join(", ");
      return `${dayText} ${formatTime(start)}–${formatTime(end)}`;
    })
    .join(" · ");
}
