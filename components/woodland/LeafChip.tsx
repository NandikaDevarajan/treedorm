import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Props = Omit<ComponentProps<"button">, "aria-pressed"> & { selected?: boolean };

/** Toggle chip for categories/filters. Selected = leaf fill (SPEC §9.2). */
export function LeafChip({ selected = false, className, type = "button", children, ...rest }: Props) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border-2 px-4 text-sm font-semibold",
        "transition-colors duration-150 ease-organic",
        selected
          ? "border-leaf bg-leaf text-cream"
          : "border-leaf/40 bg-cream text-walnut hover:border-leaf hover:bg-sage/30",
        className,
      )}
      {...rest}
    >
      {selected && (
        <svg aria-hidden viewBox="0 0 16 16" className="size-3.5 fill-current">
          <path d="M14 2C7 2 3 5 3 10c0 1.4.4 2.6 1 3.5L2.5 15l1 1 1.5-1.5c.9.6 2.1 1 3.5 1C13 15.5 14 9 14 2Z" />
        </svg>
      )}
      {children}
    </button>
  );
}
