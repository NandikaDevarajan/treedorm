import Image from "next/image";
import { cn } from "@/lib/cn";

interface Props {
  title: string;
  description: string;
  imageSrc: string;
  imageClassName?: string;
  selected: boolean;
  onSelect: () => void;
}

/** One of the Personal / Business choices (SPEC §9.7). Rendered inside a role="radiogroup". */
export function AccountTypeCard({ title, description, imageSrc, imageClassName, selected, onSelect }: Props) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "group flex w-full items-center gap-4 rounded-card border-[3px] bg-cream p-4 text-left text-walnut",
        "transition-[transform,box-shadow,border-color] duration-200 ease-organic sm:flex-col sm:items-start sm:p-5",
        selected
          ? "-translate-y-1 border-leaf shadow-[0_10px_24px_-10px_rgb(62_43_32/0.55)]"
          : "border-transparent shadow-soft hover:-translate-y-0.5",
      )}
    >
      <span
        className={cn(
          "relative grid size-24 shrink-0 place-items-center overflow-hidden rounded-2xl bg-almond sm:h-40 sm:w-full",
          selected && "bg-sage/40",
        )}
      >
        <Image
          src={imageSrc}
          alt=""
          fill
          sizes="(min-width: 640px) 320px, 96px"
          className={cn("object-contain p-2", imageClassName)}
        />
      </span>
      <span className="flex flex-1 flex-col gap-1">
        <span className="flex items-center justify-between gap-2">
          <span className="font-display text-2xl text-bark">{title}</span>
          <span
            aria-hidden
            className={cn(
              "grid size-7 shrink-0 place-items-center rounded-full border-2",
              selected ? "border-leaf bg-leaf text-cream" : "border-bark/30",
            )}
          >
            {selected && (
              <svg viewBox="0 0 16 16" className="size-4 fill-none stroke-current stroke-[2.5]">
                <path d="m3.5 8.5 3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
        </span>
        <span className="text-sm leading-snug text-walnut/85">{description}</span>
      </span>
    </button>
  );
}
