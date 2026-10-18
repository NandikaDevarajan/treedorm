"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { WoodButton } from "@/components/woodland/WoodButton";
import { cn } from "@/lib/cn";

const LABELS = ["", "Not great", "Okay", "Good", "Great", "Loved it"];

/** 1–5 stars plus a short note (SPEC §7 POST /api/reviews). */
export function ReviewForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!rating) return setError("Pick 1 to 5 stars.");
    setBusy(true);
    setError(null);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, rating, body: body.trim() }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json?.error?.message ?? "Couldn't save your review.");
      setBusy(false);
      return;
    }
    router.push(`/orders/${orderId}`);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-5 rounded-card border border-bark/15 bg-cream p-5 shadow-soft">
      <fieldset>
        <legend className="mb-2 font-semibold">Your rating</legend>
        <div role="radiogroup" aria-label="Rating" className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              onClick={() => {
                setRating(n);
                setError(null);
              }}
              className={cn(
                "grid size-12 place-items-center rounded-full text-4xl leading-none",
                n <= rating ? "text-gold" : "text-walnut/25",
              )}
            >
              ★
            </button>
          ))}
        </div>
        <p aria-live="polite" className="mt-1 min-h-6 text-sm font-semibold text-walnut/80">
          {LABELS[rating]}
        </p>
      </fieldset>
      <div>
        <label htmlFor="review-body" className="mb-1.5 block font-semibold">
          A short note (optional)
        </label>
        <textarea
          id="review-body"
          rows={3}
          maxLength={500}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What went well?"
          className="w-full rounded-2xl border-2 border-bark/30 bg-cream px-4 py-3 text-base text-walnut placeholder:text-walnut/55 focus:border-accent focus:outline-none"
        />
      </div>
      {error && (
        <p role="alert" className="text-sm font-semibold text-danger">
          {error}
        </p>
      )}
      <WoodButton size="lg" onClick={submit} disabled={busy}>
        {busy ? "Saving…" : "Post review"}
      </WoodButton>
    </div>
  );
}
