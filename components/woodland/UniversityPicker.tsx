"use client";

import { useId, useMemo, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";
import type { School } from "@/lib/schools";

interface Props {
  schools: School[];
  value: string | null;
  onChange: (domain: string | null) => void;
  label?: string;
  className?: string;
}

const matchesQuery = (s: School, q: string) =>
  [s.name, s.short, s.domain].some((field) => field.toLowerCase().includes(q.trim().toLowerCase()));

/**
 * Searchable university autocomplete (SPEC §9.6), following the ARIA combobox pattern:
 * type to filter, arrow keys to move, Enter to choose, Escape to close.
 */
export function UniversityPicker({ schools, value, onChange, label = "Your university", className }: Props) {
  const id = useId();
  const selected = schools.find((s) => s.domain === value) ?? null;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const options = useMemo(() => schools.filter((s) => matchesQuery(s, query)), [schools, query]);

  const choose = (school: School) => {
    onChange(school.domain);
    setQuery("");
    setOpen(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && open && options[active]) {
      e.preventDefault();
      choose(options[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  if (selected) {
    return (
      <div className={className}>
        <p className="mb-1.5 text-sm font-semibold">{label}</p>
        <div className="flex min-h-12 items-center justify-between gap-3 rounded-2xl border-2 border-accent bg-cream px-4 py-2">
          <span className="flex items-center gap-2 font-bold text-accent">
            <span aria-hidden className="size-3 shrink-0 rounded-full bg-accent ring-2 ring-accent-2" />
            {selected.name}
          </span>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="min-h-11 rounded-full px-3 text-sm font-semibold text-walnut underline underline-offset-2"
            aria-label={`Change university (currently ${selected.name})`}
          >
            Change
          </button>
        </div>
      </div>
    );
  }

  const listId = `${id}-list`;
  const optionId = (i: number) => `${id}-opt-${i}`;

  return (
    <div className={cn("relative", className)}>
      <label htmlFor={`${id}-input`} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      <input
        id={`${id}-input`}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && options[active] ? optionId(active) : undefined}
        autoComplete="off"
        placeholder="Start typing your school…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        className="min-h-12 w-full rounded-2xl border-2 border-bark/30 bg-cream px-4 text-base text-walnut placeholder:text-walnut/55 focus:border-accent focus:outline-none"
      />
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Universities"
          className="absolute inset-x-0 top-full z-20 mt-2 max-h-64 overflow-auto rounded-2xl border-2 border-bark/20 bg-cream p-1.5 shadow-soft"
        >
          {options.length === 0 && (
            <li className="px-3 py-3 text-sm text-walnut/75">
              Not listed yet — just enter your .edu email below.
            </li>
          )}
          {options.map((s, i) => (
            <li
              key={s.domain}
              id={optionId(i)}
              role="option"
              aria-selected={i === active}
              // mousedown, not click, so the input's blur doesn't close the list first.
              onMouseDown={(e) => {
                e.preventDefault();
                choose(s);
              }}
              onMouseEnter={() => setActive(i)}
              className={cn(
                "flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2",
                i === active && "bg-almond",
              )}
            >
              <span className="flex items-center gap-2.5">
                <span
                  aria-hidden
                  className="size-3 shrink-0 rounded-full"
                  style={{ background: s.primary }}
                />
                <span className="font-semibold">{s.name}</span>
              </span>
              <span className="text-sm text-walnut/70">{s.domain}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
