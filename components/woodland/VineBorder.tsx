import { cn } from "@/lib/cn";

// PLACEHOLDER-ART: swap to "/assets/foliage/vine-branch.png" once the watercolor vine is licensed (SPEC §9.13).
export const VINE_SRC = "/assets/foliage/vine-placeholder.svg";

/**
 * Decorative vines along the top of a page. The whole vine is always inside the screen (SPEC §9.10):
 * nothing is positioned off-edge and the band is tall enough for the art plus its gentle sway.
 * Purely decorative: hidden from assistive tech.
 */
export function VineBorder({ className, dense = false }: { className?: string; dense?: boolean }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none relative h-[calc(5.5rem+env(safe-area-inset-top))] w-full sm:h-[calc(7.5rem+env(safe-area-inset-top))]",
        className,
      )}
    >
      <div className="absolute inset-x-3 top-[calc(0.75rem+env(safe-area-inset-top))] flex items-start justify-between">
        {/* eslint-disable-next-line @next/next/no-img-element -- tiny decorative SVG, no optimisation needed */}
        <img
          src={VINE_SRC}
          alt=""
          className="w-[47%] max-w-80 origin-top-left animate-[sway_7s_ease-in-out_infinite]"
        />
        {dense && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={VINE_SRC}
            alt=""
            className="mt-3 hidden w-64 origin-top animate-[sway_11s_ease-in-out_infinite] md:block"
          />
        )}
        {/* Mirror on a wrapper flipped about its centre so the art stays in place; the sway pivots on the
            inner image's top-left, which the flip turns into the visual top-right. */}
        <span className="block w-[47%] max-w-80 -scale-x-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={VINE_SRC}
            alt=""
            className="w-full origin-top-left animate-[sway_9s_ease-in-out_infinite]"
          />
        </span>
      </div>
    </div>
  );
}
