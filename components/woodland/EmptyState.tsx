import type { ReactNode } from "react";
import { Creature } from "@/components/woodland/Creature";
import { cn } from "@/lib/cn";
import { CREATURE_FOR, type CreatureName } from "@/lib/creatures";

interface Props {
  title: string;
  children?: ReactNode;
  creature?: CreatureName;
  action?: ReactNode;
  className?: string;
}

/** Friendly "nothing here yet" panel with a woodland creature greeting you. */
export function EmptyState({
  title,
  children,
  creature = CREATURE_FOR.emptyState,
  action,
  className,
}: Props) {
  return (
    <div className={cn("flex flex-col items-center gap-3 px-6 py-8 text-center", className)}>
      <Creature name={creature} size={104} />
      <h3 className="font-display text-3xl text-bark">{title}</h3>
      {children && <p className="max-w-xs text-walnut/85">{children}</p>}
      {action}
    </div>
  );
}
