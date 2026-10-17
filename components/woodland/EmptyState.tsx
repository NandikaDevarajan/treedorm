import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type Spirit =
  | "acorn-friend-01"
  | "acorn-friend-02"
  | "enchanted-owl"
  | "fantasy-hedgehog"
  | "flower-spirit"
  | "glowing-snail"
  | "leaf-creature"
  | "magical-fox"
  | "mushroom-friends"
  | "tiny-dragon"
  | "tree-spirit"
  | "woodland-sprite";

interface Props {
  title: string;
  children?: ReactNode;
  spirit?: Spirit;
  action?: ReactNode;
  className?: string;
}

/** Friendly "nothing here yet" panel with a woodland character. */
export function EmptyState({ title, children, spirit = "glowing-snail", action, className }: Props) {
  return (
    <div className={cn("flex flex-col items-center gap-3 px-6 py-8 text-center", className)}>
      <Image
        src={`/assets/characters/spirits/${spirit}.png`}
        alt=""
        width={112}
        height={112}
        className="h-28 w-auto"
      />
      <h3 className="font-display text-2xl text-bark">{title}</h3>
      {children && <p className="max-w-xs text-walnut/80">{children}</p>}
      {action}
    </div>
  );
}
