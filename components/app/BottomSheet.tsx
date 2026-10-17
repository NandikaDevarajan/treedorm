"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}

/**
 * Phone bottom sheet on a native <dialog>: focus trapping, Esc to close and an inert
 * background come from the browser. Tapping the backdrop also closes it.
 */
export function BottomSheet({ open, onClose, title, children, className }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className={cn(
        "mx-auto mt-auto mb-0 max-h-[85dvh] w-full max-w-lg rounded-t-[2rem] border-2 border-b-0 border-bark/25",
        "bg-cream p-0 text-walnut shadow-soft backdrop:bg-walnut/40",
        "open:animate-[sheet-up_280ms_var(--ease-organic)]",
        className,
      )}
    >
      <div className="flex flex-col gap-4 px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div aria-hidden className="mx-auto h-1.5 w-12 rounded-full bg-bark/25" />
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-2xl text-bark">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid size-11 place-items-center rounded-full text-bark hover:bg-almond"
            aria-label="Close"
          >
            <svg aria-hidden viewBox="0 0 24 24" className="size-6 stroke-current stroke-2">
              <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
