import Image from "next/image";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

// Fine paper grain: fractal noise tinted walnut. Tiles seamlessly; multiplied faintly over the base colour.
const GRAIN = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.24 0 0 0 0 0.17 0 0 0 0 0.12 0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>",
)}")`;

// A few loose leaves, all still. On phones only the bottom ones show, in the empty space below the content.
const LEAVES = [
  {
    src: "leaf-maple-orange",
    size: 34,
    rotate: -18,
    className: "hidden sm:block top-[18%] right-[12%]",
  },
  {
    src: "leaf-yellow",
    size: 28,
    rotate: 38,
    className: "bottom-[5%] left-[7%] sm:bottom-[12%] sm:left-[10%]",
  },
  { src: "leaf-oak", size: 32, rotate: -32, className: "hidden sm:block bottom-[20%] right-[9%]" },
  { src: "leaf-maple-red", size: 30, rotate: 24, className: "hidden sm:block top-[30%] left-[3%]" },
  {
    src: "leaf-maple-red",
    size: 22,
    rotate: -50,
    className: "bottom-[2%] right-[18%] sm:bottom-[6%] sm:right-[30%]",
  },
] as const;

interface Props extends HTMLAttributes<HTMLDivElement> {
  tone?: "almond" | "carmel";
  children: ReactNode;
}

/** Calm warm page background (SPEC §9.11): Almond or Carmel, soft texture, a few scattered leaves. */
export function LeafyBackground({ tone = "almond", children, className, ...rest }: Props) {
  return (
    <div
      {...rest}
      className={cn(
        "relative min-h-dvh overflow-hidden",
        tone === "almond" ? "bg-almond" : "bg-carmel",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.18] mix-blend-multiply"
        style={{ backgroundImage: GRAIN }}
      />
      {LEAVES.map((leaf, i) => (
        <Image
          key={i}
          src={`/assets/foliage/${leaf.src}.png`}
          alt=""
          aria-hidden
          width={leaf.size}
          height={leaf.size}
          className={cn("pointer-events-none absolute object-contain opacity-90 select-none", leaf.className)}
          style={{ height: leaf.size, width: "auto", transform: `rotate(${leaf.rotate}deg)` }}
        />
      ))}
      <div className="relative">{children}</div>
    </div>
  );
}
