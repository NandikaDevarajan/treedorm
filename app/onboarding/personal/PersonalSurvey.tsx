"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { CreamCard } from "@/components/woodland/CreamCard";
import { LeafChip } from "@/components/woodland/LeafChip";
import { WoodButton } from "@/components/woodland/WoodButton";
import { CATEGORIES, type CategoryId } from "@/lib/categories";

/** Personal survey (SPEC §3.2 step 3): what to call you and what you usually look for. */
export function PersonalSurvey({
  initialName,
  initialLookingFor,
}: {
  initialName: string;
  initialLookingFor: CategoryId[];
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [lookingFor, setLookingFor] = useState<CategoryId[]>(initialLookingFor);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const toggle = (id: CategoryId) =>
    setLookingFor((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Tell us what to call you.");
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding/personal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), lookingFor }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Couldn't save that. Try again.");
      router.push(json.next);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <CreamCard as="form" onSubmit={submit} noValidate className="flex flex-col gap-6 p-6 sm:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-4xl leading-tight text-bark">A little about you</h1>
        <p className="text-walnut/85">Two quick questions so the village feels like yours.</p>
      </div>

      <div>
        <label htmlFor="name" className="mb-1.5 block font-semibold">
          What should we call you?
        </label>
        <input
          id="name"
          autoComplete="given-name"
          maxLength={40}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          aria-invalid={!!error}
          aria-describedby={error ? "survey-error" : "name-help"}
          placeholder="Your first name"
          className="min-h-12 w-full rounded-2xl border-2 border-bark/30 bg-cream px-4 text-base text-walnut placeholder:text-walnut/55 focus:border-accent focus:outline-none aria-[invalid=true]:border-danger"
        />
        <p id="name-help" className="mt-1.5 text-sm text-walnut/75">
          Shown to sellers when you book or chat.
        </p>
      </div>

      <fieldset>
        <legend className="mb-1.5 font-semibold">What are you usually looking for?</legend>
        <p className="mb-3 text-sm text-walnut/75">Pick any that fit. Optional.</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <LeafChip key={c.id} selected={lookingFor.includes(c.id)} onClick={() => toggle(c.id)}>
              {c.label}
            </LeafChip>
          ))}
        </div>
      </fieldset>

      {error && (
        <p id="survey-error" role="alert" className="text-sm font-semibold text-danger">
          {error}
        </p>
      )}
      <WoodButton type="submit" size="lg" disabled={busy}>
        {busy ? "Saving…" : "Continue"}
      </WoodButton>
    </CreamCard>
  );
}
