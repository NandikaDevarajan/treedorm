import { cn } from "@/lib/cn";

/**
 * Soft, still beams of warm light falling through the canopy, after the mood references
 * (SPEC §9.16). Pure CSS, decorative, no motion. Lay it over illustrations, never over text.
 */
export function SunRays({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden mix-blend-soft-light", className)}
      style={{
        background: [
          "repeating-linear-gradient(118deg, transparent 0 7%, color-mix(in srgb, var(--gold) 55%, transparent) 9% 13%, transparent 16% 26%)",
          "radial-gradient(120% 80% at 85% -10%, color-mix(in srgb, var(--cream) 70%, transparent), transparent 60%)",
        ].join(","),
        maskImage: "linear-gradient(to bottom, black 0%, black 45%, transparent 90%)",
        WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 45%, transparent 90%)",
      }}
    />
  );
}
