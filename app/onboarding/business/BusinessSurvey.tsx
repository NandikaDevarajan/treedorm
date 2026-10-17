"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { inputClass, textareaClass } from "@/components/seller/field";
import { TagEditor } from "@/components/seller/TagEditor";
import { AITag } from "@/components/woodland/AITag";
import { LeafChip } from "@/components/woodland/LeafChip";
import { TreehousePreview } from "@/components/woodland/TreehousePreview";
import { WoodButton } from "@/components/woodland/WoodButton";
import { DAYS, formatTime } from "@/lib/availability";
import { CATEGORIES, type CategoryId } from "@/lib/categories";
import { cn } from "@/lib/cn";
import { looksLikeRoomNumber, ROOM_NUMBER_MESSAGE } from "@/lib/privacy";

const OFFER_HINTS: Record<CategoryId, string> = {
  beauty: "e.g. Fades, lineups and beard trims. I bring my own clippers.",
  food: "e.g. Custom birthday cakes and cupcakes, with your message piped on top.",
  fitness: "e.g. 1-on-1 strength sessions at the IMA for beginners.",
  photography: "e.g. Grad and portrait photos around campus, edited within a week.",
  tutoring: "e.g. CSE 142 help: Java basics, homework walkthroughs and exam prep.",
  crafts: "e.g. Handmade crochet plushies and bucket hats in your colours.",
  reselling: "e.g. Thrifted jackets and used textbooks, picked up from my building.",
  other: "e.g. What you do, and anything buyers should know.",
};

const TIMES = Array.from({ length: 33 }, (_, i) => {
  const mins = 7 * 60 + i * 30; // 7:00 → 23:00
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
});
const WEEK = [1, 2, 3, 4, 5, 6, 0];

type Draft = { tagline: string; bio: string; tags: string[]; ai: boolean };

/**
 * Business survey (SPEC §3.1 step 4, §9.8): one question per screen, with the category treehouse
 * preview always visible and updating live; then the Gemini draft to review and edit.
 */
export function BusinessSurvey() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [offer, setOffer] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [area, setArea] = useState("");
  const [days, setDays] = useState<number[]>([]);
  const [start, setStart] = useState("16:00");
  const [end, setEnd] = useState("20:00");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const survey = () => ({
    name: name.trim(),
    category: category ?? "other",
    offer: offer.trim(),
    priceMin: Number(priceMin),
    priceMax: Number(priceMax),
    area: area.trim(),
    availability: days.map((day) => ({ day, start, end })),
  });

  const post = async (url: string, body: unknown) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error?.message ?? "Something went wrong. Try again.");
    return json;
  };

  const generate = async () => {
    setBusy(true);
    setError(null);
    setDraft(null);
    try {
      const res = await post("/api/shops/preview", { survey: survey() });
      setDraft({
        tagline: res.draft.tagline,
        bio: res.draft.bio.slice(0, 300),
        tags: res.draft.tags,
        ai: res.ai,
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // Per-step checks; returns an error message or null.
  const check = (): string | null => {
    if (step === 0 && name.trim().length < 2) return "Give your treehouse a name.";
    if (step === 1 && !category) return "Pick the category that fits best.";
    if (step === 2 && offer.trim().length < 10) return "Tell buyers a little more (a sentence or two).";
    if (step === 3) {
      const lo = Number(priceMin),
        hi = Number(priceMax);
      if (!priceMin || !priceMax || !Number.isInteger(lo) || !Number.isInteger(hi))
        return "Enter whole-dollar prices.";
      if (lo > hi) return "The lowest price can't be above the highest.";
      if (hi < 1 || hi > 1000) return "Keep prices between $1 and $1,000.";
    }
    if (step === 4) {
      if (area.trim().length < 2) return "Where do you work? A building or area is enough.";
      if (looksLikeRoomNumber(area)) return ROOM_NUMBER_MESSAGE;
      if (days.length && start >= end) return "End time must be after start time.";
    }
    return null;
  };

  const next = async (e: FormEvent) => {
    e.preventDefault();
    const problem = check();
    if (problem) return setError(problem);
    setError(null);
    if (step === 4) {
      setStep(5);
      await generate();
      return;
    }
    if (step === 5) return save();
    setStep(step + 1);
  };

  const save = async () => {
    if (!draft) return;
    if (!draft.tagline.trim() || !draft.bio.trim()) return setError("Add a tagline and a short bio.");
    setBusy(true);
    setError(null);
    try {
      const res = await post("/api/shops", {
        survey: survey(),
        tagline: draft.tagline,
        bio: draft.bio,
        tags: draft.tags,
        aiAssisted: draft.ai,
      });
      router.push(res.next);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  const total = 6;
  const steps: { title: string; body: ReactNode }[] = [
    {
      title: "What's your treehouse called?",
      body: (
        <Field
          id="biz-name"
          label="Business name"
          hint="This is the sign on your door. You can change it later."
        >
          <input
            id="biz-name"
            autoFocus
            maxLength={40}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Golden Hour Grads"
            className={inputClass}
          />
        </Field>
      ),
    },
    {
      title: "What kind of shop is it?",
      body: (
        <div role="radiogroup" aria-label="Category" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={category === c.id}
              onClick={() => setCategory(c.id)}
              className={cn(
                "min-h-12 rounded-2xl border-[3px] px-3 font-bold transition-colors",
                category === c.id
                  ? "border-leaf bg-leaf text-cream"
                  : "border-bark/15 bg-cream text-walnut hover:border-bark/35",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: "What do you offer?",
      body: (
        <Field id="biz-offer" label="In a sentence or two" hint={`${offer.trim().length}/300`}>
          <textarea
            id="biz-offer"
            autoFocus
            rows={4}
            maxLength={300}
            value={offer}
            onChange={(e) => setOffer(e.target.value)}
            placeholder={OFFER_HINTS[category ?? "other"]}
            className={textareaClass}
          />
        </Field>
      ),
    },
    {
      title: "What do you usually charge?",
      body: (
        <fieldset>
          <legend className="mb-3 text-walnut/85">
            A typical range in dollars. Each listing gets its own price later.
          </legend>
          <div className="flex items-end gap-3">
            <Money id="price-min" label="From" value={priceMin} onChange={setPriceMin} />
            <span aria-hidden className="pb-3 font-bold">
              –
            </span>
            <Money id="price-max" label="To" value={priceMax} onChange={setPriceMax} />
          </div>
        </fieldset>
      ),
    },
    {
      title: "Where and when?",
      body: (
        <div className="flex flex-col gap-5">
          <Field
            id="biz-area"
            label="Building or area"
            hint="No room numbers — you'll share exact details in private chat."
          >
            <input
              id="biz-area"
              maxLength={60}
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="e.g. McMahon Hall, or the IMA"
              aria-invalid={!!error && looksLikeRoomNumber(area)}
              className={inputClass}
            />
          </Field>
          <fieldset>
            <legend className="mb-2 font-semibold">Days you&apos;re usually free</legend>
            <div className="flex flex-wrap gap-2">
              {WEEK.map((d) => (
                <LeafChip
                  key={d}
                  selected={days.includes(d)}
                  onClick={() => setDays((x) => (x.includes(d) ? x.filter((y) => y !== d) : [...x, d]))}
                >
                  {DAYS[d]}
                </LeafChip>
              ))}
            </div>
            <p className="mt-2 text-sm text-walnut/70">
              Optional. Leave blank for &ldquo;by arrangement&rdquo;.
            </p>
          </fieldset>
          {days.length > 0 && (
            <div className="flex items-end gap-3">
              <TimeSelect id="t-start" label="From" value={start} onChange={setStart} />
              <span aria-hidden className="pb-3 font-bold">
                –
              </span>
              <TimeSelect id="t-end" label="Until" value={end} onChange={setEnd} />
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Here's your treehouse sign",
      body:
        busy && !draft ? (
          <div role="status" aria-label="Writing your shop" className="flex flex-col gap-4">
            <p className="text-walnut/85">Writing your tagline and bio…</p>
            {[48, 96, 40].map((h, i) => (
              <div key={i} className="animate-pulse rounded-2xl bg-almond" style={{ height: h }} />
            ))}
          </div>
        ) : draft ? (
          <div className="flex flex-col gap-5">
            <p className="text-walnut/85">
              {draft.ai
                ? "We drafted these from your answers. Change anything you like."
                : "Our writing helper is resting, so fill these in yourself."}
            </p>
            <Field
              id="d-tagline"
              label="Tagline"
              badge={draft.ai && <AITag />}
              hint={`${draft.tagline.length}/80`}
            >
              <input
                id="d-tagline"
                maxLength={80}
                value={draft.tagline}
                onChange={(e) => setDraft({ ...draft, tagline: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field id="d-bio" label="Bio" badge={draft.ai && <AITag />} hint={`${draft.bio.length}/300`}>
              <textarea
                id="d-bio"
                rows={4}
                maxLength={300}
                value={draft.bio}
                onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
                className={textareaClass}
              />
            </Field>
            <TagEditor
              label="Search tags"
              value={draft.tags}
              onChange={(tags) => setDraft({ ...draft, tags })}
              badge={draft.ai && <AITag />}
            />
            <button
              type="button"
              onClick={generate}
              disabled={busy}
              className="min-h-11 w-fit font-semibold text-bark underline underline-offset-4 disabled:text-walnut/40"
            >
              Write it again
            </button>
          </div>
        ) : (
          <WoodButton variant="secondary" onClick={generate}>
            Try again
          </WoodButton>
        ),
    },
  ];
  const current = steps[step];
  const label = CATEGORIES.find((c) => c.id === category)?.label;

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:grid-cols-2 md:items-start md:gap-10 md:px-8 md:py-10">
      {/* Live preview: always visible, changes with the category. */}
      <section aria-label="Treehouse preview" className="flex flex-col gap-2 md:sticky md:top-10">
        <TreehousePreview
          variant={category}
          className="rounded-b-[2rem] shadow-soft md:rounded-[2rem] md:border-4 md:border-cream"
          priority
        />
        <div className="px-safe text-center md:px-0">
          <p className="font-display text-3xl leading-tight text-bark">{name.trim() || "Your treehouse"}</p>
          <p aria-live="polite" className="text-sm font-semibold text-walnut/80">
            {label ? `${label} treehouse` : "Pick a category to decorate it"}
          </p>
        </div>
      </section>

      <form
        onSubmit={next}
        noValidate
        className="mx-4 flex flex-col gap-6 rounded-[2rem] bg-cream p-6 shadow-soft sm:p-8 md:mx-0"
      >
        <div
          className="flex gap-1.5"
          role="progressbar"
          aria-label="Survey progress"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={step + 1}
          aria-valuetext={`Step ${step + 1} of ${total}`}
        >
          {steps.map((_, i) => (
            <span key={i} className={cn("h-2 flex-1 rounded-full", i <= step ? "bg-leaf" : "bg-almond")} />
          ))}
        </div>
        <h1 className="font-display text-4xl leading-tight text-bark">{current.title}</h1>
        {current.body}
        {error && (
          <p role="alert" className="text-sm font-semibold text-danger">
            {error}
          </p>
        )}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          {step > 0 ? (
            <WoodButton
              variant="secondary"
              onClick={() => {
                setError(null);
                setStep(step - 1);
              }}
              disabled={busy}
            >
              Back
            </WoodButton>
          ) : (
            <span />
          )}
          <WoodButton type="submit" size="lg" disabled={busy || (step === 5 && !draft)}>
            {step === 5
              ? busy && draft
                ? "Opening…"
                : "Open my treehouse"
              : step === 4
                ? "Write my shop"
                : "Next"}
          </WoodButton>
        </div>
      </form>
    </div>
  );
}

function Field({
  id,
  label,
  hint,
  badge,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label htmlFor={id} className="font-semibold">
          {label}
        </label>
        {badge}
      </div>
      {children}
      {hint && <p className="mt-1.5 text-sm text-walnut/70">{hint}</p>}
    </div>
  );
}

function Money({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex-1">
      <label htmlFor={id} className="mb-1.5 block font-semibold">
        {label}
      </label>
      <div className="relative">
        <span aria-hidden className="absolute top-1/2 left-4 -translate-y-1/2 font-semibold text-walnut/70">
          $
        </span>
        <input
          id={id}
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 4))}
          className={`${inputClass} pl-8`}
        />
      </div>
    </div>
  );
}

function TimeSelect({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex-1">
      <label htmlFor={id} className="mb-1.5 block font-semibold">
        {label}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
        {TIMES.map((t) => (
          <option key={t} value={t}>
            {formatTime(t)}
          </option>
        ))}
      </select>
    </div>
  );
}
