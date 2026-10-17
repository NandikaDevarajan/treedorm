import Image from "next/image";
import { cn } from "@/lib/cn";
import { creatureSrc, type CreatureName } from "@/lib/creatures";

interface Props {
  name: CreatureName;
  /** Rendered height in px; width follows the drawing's proportions. */
  size?: number;
  className?: string;
}

/**
 * A still woodland creature (SPEC §9.15). Purely decorative: hidden from assistive tech, never
 * clickable, and no animation. Place it so it never covers buttons, text or form fields.
 */
export function Creature({ name, size = 64, className }: Props) {
  return (
    <Image
      src={creatureSrc(name)}
      alt=""
      aria-hidden
      width={size}
      height={size}
      draggable={false}
      className={cn("pointer-events-none select-none object-contain", className)}
      style={{ height: size, width: "auto" }}
    />
  );
}
