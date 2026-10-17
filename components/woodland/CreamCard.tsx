import type { ComponentProps, ElementType } from "react";
import { cn } from "@/lib/cn";

type Props<T extends ElementType> = { as?: T } & ComponentProps<T>;

/** Cream surface for content and any text that sits over illustrations (SPEC §9.3). */
export function CreamCard<T extends ElementType = "div">({ as, className, ...rest }: Props<T>) {
  const Tag = as ?? "div";
  return (
    <Tag
      className={cn("rounded-card border border-bark/15 bg-cream p-5 text-walnut shadow-soft", className)}
      {...rest}
    />
  );
}
