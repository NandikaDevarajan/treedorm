import Image from "next/image";
import { cn } from "@/lib/cn";
import { imageFrame, sceneBox, type Crop } from "@/lib/treehouse-scene";
import { getVariant } from "@/lib/treehouse-variants";

/** Tight crop on the house itself, so the small decorations read clearly. */
export const PREVIEW_CROP: Crop = { x: 175, y: 150, w: 420, h: 300 };

interface Props {
  variant: string | null | undefined;
  crop?: Crop;
  label?: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}

/**
 * A business's treehouse (SPEC §9.8): treehouse-main plus its category's decorations, from
 * lib/treehouse-variants.ts. Used live in business onboarding, on the storefront and in tiles.
 */
export function TreehousePreview({ variant, crop = PREVIEW_CROP, label, className, priority, sizes }: Props) {
  const v = getVariant(variant);
  const frame = imageFrame(crop);
  return (
    <div
      role="img"
      aria-label={label ?? `Treehouse decorated for ${v.label}`}
      className={cn("relative overflow-hidden", className)}
      style={{ aspectRatio: crop.w / crop.h }}
    >
      <div
        className="absolute aspect-[740/636]"
        style={{ width: frame.width, left: frame.left, top: frame.top }}
      >
        <Image
          src="/assets/treehouse/treehouse-main.webp"
          alt=""
          fill
          priority={priority}
          sizes={sizes ?? "(min-width: 768px) 50vw, 100vw"}
          className="object-cover"
        />
        {v.tint && <div aria-hidden className="absolute inset-0" style={{ background: v.tint }} />}
        {v.overlays.map((o) => (
          // eslint-disable-next-line @next/next/no-img-element -- small SVG decoration layers
          <img
            key={o.src}
            src={o.src}
            alt=""
            draggable={false}
            className="absolute max-w-none select-none drop-shadow-[0_1px_0_rgba(62,43,32,0.35)]"
            style={{ ...sceneBox(o), transform: o.rotate ? `rotate(${o.rotate}deg)` : undefined }}
          />
        ))}
      </div>
    </div>
  );
}
