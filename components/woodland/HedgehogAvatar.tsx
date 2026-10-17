import Image from "next/image";
import { cn } from "@/lib/cn";
import { accessoryFit, AVATAR_BASE_SIZE, type Avatar } from "@/lib/avatar";

/*
 * The avatar canvas is the hedgehog image plus room around it for hats that rise above the head or
 * brims wider than the body. Manifest positions are % of the hedgehog image; these convert them.
 */
const PAD_X = 0.1; // each side, as a fraction of the hedgehog's width
const PAD_TOP = 0.24; // above, as a fraction of the hedgehog's height
const CANVAS_W = 1 + 2 * PAD_X;
const CANVAS_H = 1 + PAD_TOP;
const CANVAS_ASPECT = (AVATAR_BASE_SIZE.width * CANVAS_W) / (AVATAR_BASE_SIZE.height * CANVAS_H);
const pct = (n: number) => `${+(n * 100).toFixed(3)}%`;

interface Props {
  avatar: Avatar;
  /** "full": the whole hedgehog. "badge": a round crop on the face, for headers and chat. */
  variant?: "full" | "badge";
  /** Accessible name; omit when a visible label already says whose avatar it is. */
  label?: string;
  className?: string;
  priority?: boolean;
}

function Layers({ avatar, priority }: { avatar: Avatar; priority?: boolean }) {
  // Order matters: hedgehog, then sunglasses, then the hat on top.
  const fits = [accessoryFit(avatar.sunglasses), accessoryFit(avatar.hat)].filter((f) => !!f);
  return (
    <>
      <div
        className="absolute"
        style={{
          left: pct(PAD_X / CANVAS_W),
          top: pct(PAD_TOP / CANVAS_H),
          width: pct(1 / CANVAS_W),
          height: pct(1 / CANVAS_H),
        }}
      >
        <Image
          src={AVATAR_BASE_SIZE.src}
          alt=""
          fill
          priority={priority}
          sizes="(min-width: 768px) 360px, 60vw"
          className="object-contain"
        />
      </div>
      {fits.map((fit) => (
        // eslint-disable-next-line @next/next/no-img-element -- small SVG/PNG layers, positioned by the manifest
        <img
          key={fit.id}
          src={fit.src}
          alt=""
          draggable={false}
          className="absolute max-w-none select-none"
          style={{
            left: pct((PAD_X + fit.x / 100) / CANVAS_W),
            top: pct((PAD_TOP + fit.y / 100) / CANVAS_H),
            width: pct(fit.width / 100 / CANVAS_W),
            aspectRatio: fit.aspect,
            transform: `translate(-50%, -50%) rotate(${fit.rotate}deg)`,
          }}
        />
      ))}
    </>
  );
}

/**
 * The user's avatar (SPEC §9.9): always the default hedgehog, plus at most one hat and one pair of
 * sunglasses, each placed from public/assets/accessories/manifest.json so it sits on the head/face.
 */
export function HedgehogAvatar({ avatar, variant = "full", label, className, priority }: Props) {
  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": true };

  if (variant === "badge") {
    // Zoom the canvas so the face (and hat brim) fill a circle.
    const zoom = 1.45;
    const faceX = (PAD_X + 0.46) / CANVAS_W;
    const faceY = (PAD_TOP + 0.36) / CANVAS_H;
    const canvasH = zoom / CANVAS_ASPECT;
    return (
      <span
        {...a11y}
        className={cn(
          "relative inline-block aspect-square overflow-hidden rounded-full bg-sage/45",
          className,
        )}
      >
        <span
          className="absolute"
          style={{
            width: pct(zoom),
            height: pct(canvasH),
            left: pct(0.5 - zoom * faceX),
            top: pct(0.5 - canvasH * faceY),
          }}
        >
          <Layers avatar={avatar} priority={priority} />
        </span>
      </span>
    );
  }

  return (
    <span {...a11y} className={cn("relative inline-block", className)} style={{ aspectRatio: CANVAS_ASPECT }}>
      <Layers avatar={avatar} priority={priority} />
    </span>
  );
}
