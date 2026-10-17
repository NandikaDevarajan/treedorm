import Image from "next/image";
import { cn } from "@/lib/cn";
import { creatureSrc, type CreatureName } from "@/lib/creatures";

interface Props {
  name: CreatureName;
  /** Height of the drawing in px; width follows its proportions. */
  size?: number;
  className?: string;
}

/**
 * A still woodland creature sitting openly on a little patch of grass (SPEC §9.15): small, friendly,
 * fully visible and grounded. Never place it peeking, perching or half-hidden behind anything.
 * Decorative only: hidden from assistive tech, not interactive, no animation.
 */
export function Creature({ name, size = 64, className }: Props) {
  return (
    <span
      aria-hidden
      className={cn("pointer-events-none inline-flex flex-col items-center select-none", className)}
    >
      <Image
        src={creatureSrc(name)}
        alt=""
        width={size}
        height={size}
        draggable={false}
        className="relative z-10 object-contain"
        style={{ height: size, width: "auto" }}
      />
      {/* Grass mound the creature sits on. */}
      <svg viewBox="0 0 100 22" className="-mt-[6%] fill-sage" style={{ width: size * 1.25 }}>
        <ellipse cx="50" cy="15" rx="48" ry="7" />
        <path
          d="M14 13c1-5 2-7 3-9 0 3 1 6 2 9M30 11c1-4 3-7 4-8 0 3 0 6 1 9M66 11c1-4 2-6 4-8-1 3-1 6 0 9M82 13c1-4 3-6 4-7 0 3 0 5 1 8"
          className="fill-none stroke-leaf"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
