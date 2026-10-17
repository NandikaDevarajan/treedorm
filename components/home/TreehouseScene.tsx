import Image from "next/image";
import type { CSSProperties, Ref } from "react";
import { cn } from "@/lib/cn";
import { CROPS, DOOR, doorOrigin, imageFrame, sceneBox } from "@/lib/treehouse-scene";

export type EntrancePhase = "idle" | "opening" | "entering" | "fading";

interface Props {
  phase: EntrancePhase;
  onDoor: () => void;
  doorRef?: Ref<HTMLButtonElement>;
  className?: string;
}

const portrait = { frame: imageFrame(CROPS.portrait), door: doorOrigin(CROPS.portrait) };
const landscape = { frame: imageFrame(CROPS.landscape), door: doorOrigin(CROPS.landscape) };

// Crop geometry as CSS variables; the md: classes below switch to the landscape set.
const vars = {
  "--ar": CROPS.portrait.w / CROPS.portrait.h,
  "--ar-lg": CROPS.landscape.w / CROPS.landscape.h,
  "--img-w": portrait.frame.width,
  "--img-l": portrait.frame.left,
  "--img-t": portrait.frame.top,
  "--img-w-lg": landscape.frame.width,
  "--img-l-lg": landscape.frame.left,
  "--img-t-lg": landscape.frame.top,
  "--door-x": portrait.door.x,
  "--door-y": portrait.door.y,
  "--door-x-lg": landscape.door.x,
  "--door-y-lg": landscape.door.y,
} as CSSProperties;

const door = sceneBox(DOOR);

/**
 * The close-up treehouse (SPEC §9.5): treehouse-main framed tight with little sky, plus the layers
 * the entrance needs — a warm doorway, the door panel that swings open on its hinge, and the
 * railing that stays in front of it. The whole frame is the "camera": it zooms into the door.
 */
export function TreehouseScene({ phase, onDoor, doorRef, className }: Props) {
  const open = phase === "opening" || phase === "entering";
  return (
    <div
      style={vars}
      className={cn(
        "relative aspect-(--ar) overflow-hidden md:aspect-(--ar-lg)",
        "origin-[var(--door-x)_var(--door-y)] md:origin-[var(--door-x-lg)_var(--door-y-lg)]",
        // Push through the doorway; transform only, so it stays smooth on phones.
        "transition-transform duration-[800ms] ease-[cubic-bezier(0.5,0,0.6,1)] will-change-transform",
        // Far enough that the doorway fills the screen before the warm light takes over.
        phase === "entering" && "scale-[14] md:scale-[24]",
        className,
      )}
    >
      <div className="absolute aspect-[740/636] w-(--img-w) top-(--img-t) left-(--img-l) md:w-(--img-w-lg) md:top-(--img-t-lg) md:left-(--img-l-lg)">
        <Image
          src="/assets/treehouse/treehouse-main.webp"
          alt="A wooden treehouse with a red roof built into a big oak tree"
          fill
          priority
          sizes="(min-width: 768px) 60vw, 100vw"
          className="object-cover"
        />

        {/* Doorway behind the door: dark at first, warming to gold as the door opens. */}
        <div
          aria-hidden
          className={cn(
            "allow-fade absolute transition-[background-color,box-shadow] duration-500",
            "bg-[radial-gradient(ellipse_at_50%_62%,var(--gold),var(--bark)_55%,var(--walnut))]",
            open && "shadow-[0_0_18px_6px_color-mix(in_srgb,var(--gold)_70%,transparent)]",
          )}
          style={door}
        />
        {/* Door panel swings inward on its left hinge; the railing layer stays in front. */}
        <div aria-hidden className="absolute [perspective:160px]" style={door}>
          {/* eslint-disable-next-line @next/next/no-img-element -- 36×68 layer cut to match the art */}
          <img
            src="/assets/treehouse/door-panel.png"
            alt=""
            className={cn(
              "h-full w-full origin-left transition-transform duration-[450ms] ease-out",
              open && "[transform:rotateY(-78deg)]",
            )}
          />
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img aria-hidden src="/assets/treehouse/door-railing.png" alt="" className="absolute" style={door} />

        {/* The door is a real button: tap, click or Enter/Space to go in. Hit area padded past 44px. */}
        <button
          ref={doorRef}
          type="button"
          onClick={onDoor}
          aria-label="Open the door and enter the village"
          className="group absolute rounded-md focus-visible:outline-3 focus-visible:outline-gold"
          style={{ ...door, padding: 0 }}
        >
          <span
            aria-hidden
            className="absolute -inset-x-3 -inset-y-2 rounded-lg transition-shadow group-hover:shadow-[0_0_0_3px_color-mix(in_srgb,var(--gold)_80%,transparent)]"
          />
        </button>
      </div>

      {/* Idle: a couple of leaves drifting down past the treehouse. Off for reduced motion. */}
      {phase === "idle" && (
        <div aria-hidden className="pointer-events-none absolute inset-0 motion-reduce:hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/foliage/leaf-maple-orange.png"
            alt=""
            className="absolute top-[-6%] left-[22%] w-6 animate-[leaf-drift_13s_linear_infinite] opacity-0"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/foliage/leaf-yellow.png"
            alt=""
            className="absolute top-[-6%] left-[68%] w-5 animate-[leaf-drift_16s_linear_6s_infinite] opacity-0"
          />
        </div>
      )}
    </div>
  );
}
