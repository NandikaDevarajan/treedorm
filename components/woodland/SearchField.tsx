import { useId, type ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Props = Omit<ComponentProps<"input">, "type"> & { label: string; hideLabel?: boolean };

/** Rounded cream search input with a visible or screen-reader label. */
export function SearchField({ label, hideLabel = true, className, id, ...rest }: Props) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className={cn("relative", className)}>
      <label htmlFor={inputId} className={hideLabel ? "sr-only" : "mb-1.5 block text-sm font-semibold"}>
        {label}
      </label>
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="pointer-events-none absolute bottom-3.5 left-4 size-5 fill-none stroke-bark stroke-2"
      >
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m15.5 15.5 5 5" strokeLinecap="round" />
      </svg>
      <input
        id={inputId}
        type="search"
        enterKeyHint="search"
        className={cn(
          "min-h-12 w-full rounded-full border-2 border-bark/30 bg-cream pr-4 pl-12 text-base text-walnut",
          "placeholder:text-walnut/55 focus:border-bark focus:outline-none focus-visible:outline-3",
        )}
        {...rest}
      />
    </div>
  );
}
