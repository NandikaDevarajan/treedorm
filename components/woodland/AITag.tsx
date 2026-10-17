import { cn } from "@/lib/cn";

/** Marks AI-generated content (SPEC §4 content rules). */
export function AITag({ className, label = "AI" }: { className?: string; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-gold bg-gold/25 px-2 py-0.5",
        "text-xs font-bold text-walnut",
        className,
      )}
    >
      <span aria-hidden>✨</span>
      {label}
    </span>
  );
}
