"use client";

import { useId, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface Props {
  label: string;
  value: string[];
  onChange: (tags: string[]) => void;
  max?: number;
  placeholder?: string;
  /** Shown at the end of the label row, e.g. an AI tag. */
  badge?: ReactNode;
  className?: string;
}

/** Editable list of short tags: type and press Enter (or comma) to add, × to remove. */
export function TagEditor({
  label,
  value,
  onChange,
  max = 8,
  placeholder = "Add a tag",
  badge,
  className,
}: Props) {
  const id = useId();
  const [draft, setDraft] = useState("");

  const add = () => {
    const tag = draft.trim().toLowerCase().replace(/,/g, "");
    if (tag && !value.includes(tag) && value.length < max) onChange([...value, tag.slice(0, 30)]);
    setDraft("");
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add();
    } else if (e.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label htmlFor={id} className="font-semibold">
          {label}
        </label>
        {badge}
      </div>
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border-2 border-bark/30 bg-cream p-2 focus-within:border-accent">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-sage/45 py-1 pr-1 pl-3 text-sm font-semibold"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((t) => t !== tag))}
              aria-label={`Remove ${tag}`}
              className="grid size-7 place-items-center rounded-full hover:bg-cream"
            >
              <span aria-hidden>×</span>
            </button>
          </span>
        ))}
        {value.length < max && (
          <input
            id={id}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKey}
            onBlur={add}
            placeholder={value.length ? "" : placeholder}
            enterKeyHint="done"
            className={cn(
              "min-h-9 min-w-24 flex-1 bg-transparent px-2 text-base outline-none placeholder:text-walnut/55",
            )}
          />
        )}
      </div>
      <p className="mt-1.5 text-sm text-walnut/70">Press Enter after each one.</p>
    </div>
  );
}
