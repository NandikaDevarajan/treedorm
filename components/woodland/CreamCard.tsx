import type { ComponentProps, ElementType } from "react";
import { cn } from "@/lib/cn";

type Props<T extends ElementType> = { as?: T } & ComponentProps<T>;

/** Cream surface for content and any text that sits over illustrations (SPEC §9.3). */
export function CreamCard<T extends ElementType = "div">({ as, className, ...rest }: Props<T>) {
  const Tag = as ?? "div";
  // Default padding only when the caller doesn't set its own (both classes would otherwise apply,
  // and whichever Tailwind emits later wins).
  const customPadding = /(^|\s)(sm:|md:|lg:)?p-\S+/.test(className ?? "");
  return (
    <Tag
      className={cn(
        "rounded-card border border-bark/15 bg-cream text-walnut shadow-soft",
        !customPadding && "p-5",
        className,
      )}
      {...rest}
    />
  );
}
