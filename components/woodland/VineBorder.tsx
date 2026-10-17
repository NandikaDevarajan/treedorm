import { cn } from "@/lib/cn";

// PLACEHOLDER-ART: swap to "/assets/foliage/vine-branch.png" once the watercolor vine is licensed (SPEC §9.13).
export const VINE_SRC = "/assets/foliage/vine-placeholder.svg";

/** Decorative hanging vines along the top of a page. Purely decorative: hidden from assistive tech. */
export function VineBorder({ className, dense = false }: { className?: string; dense?: boolean }) {
  return (
    <div aria-hidden className={cn("pointer-events-none relative h-20 overflow-hidden sm:h-24", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- tiny decorative SVG, no optimisation needed */}
      <img
        src={VINE_SRC}
        alt=""
        className="absolute -top-6 -left-6 w-64 origin-top-left animate-[sway_7s_ease-in-out_infinite] sm:w-80"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={VINE_SRC}
        alt=""
        className="absolute -top-8 -right-8 w-56 origin-top-right -scale-x-100 animate-[sway_9s_ease-in-out_infinite] sm:w-72"
      />
      {dense && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={VINE_SRC}
          alt=""
          className="absolute -top-10 left-1/2 hidden w-72 -translate-x-1/2 rotate-6 animate-[sway_11s_ease-in-out_infinite] md:block"
        />
      )}
    </div>
  );
}
