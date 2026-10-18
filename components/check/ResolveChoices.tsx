"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { WoodButton } from "@/components/woodland/WoodButton";
import { cn } from "@/lib/cn";
import { formatCents } from "@/lib/money";

/**
 * The buyer decides after a mismatch or unsure check (SPEC §3.2 step 10): Accept anyway (pay in full),
 * Partial refund (pay only part), or Cancel (release the hold). Nothing happens without a choice.
 */
export function ResolveChoices({
  orderId,
  amountCents,
  shopName,
}: {
  orderId: string;
  amountCents: number;
  shopName: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"accept" | "partial" | "cancel" | null>(null);
  const [amount, setAmount] = useState((amountCents / 2 / 100).toFixed(2));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const partialCents = Math.round(Number(amount) * 100);
  const partialOk = Number.isFinite(partialCents) && partialCents > 0 && partialCents < amountCents;

  const submit = async () => {
    if (!mode) return;
    if (mode === "partial" && !partialOk)
      return setError(`Enter an amount between $0.01 and ${formatCents(amountCents - 1)}.`);
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/orders/${orderId}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mode === "partial" ? { action: "partial", partialCents } : { action: mode }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json?.error?.message ?? "That didn't go through. Your payment is still held.");
      setBusy(false);
      return;
    }
    router.refresh();
  };

  const option = (id: "accept" | "partial" | "cancel", title: string, detail: string) => (
    <button
      type="button"
      role="radio"
      aria-checked={mode === id}
      onClick={() => {
        setMode(id);
        setError(null);
      }}
      className={cn(
        "flex flex-col items-start gap-0.5 rounded-2xl border-[3px] bg-cream px-4 py-3 text-left",
        mode === id ? "border-leaf" : "border-bark/15 hover:border-bark/35",
      )}
    >
      <span className="font-bold text-bark">{title}</span>
      <span className="text-sm text-walnut/85">{detail}</span>
    </button>
  );

  return (
    <section aria-labelledby="choices" className="flex flex-col gap-3">
      <h2 id="choices" className="font-display text-3xl text-bark">
        What would you like to do?
      </h2>
      <div role="radiogroup" aria-labelledby="choices" className="flex flex-col gap-2">
        {option("accept", "Accept anyway", `Pay ${shopName} the full ${formatCents(amountCents)}.`)}
        {option("partial", "Partial refund", "Pay part of it and get the rest back.")}
        {option("cancel", "Cancel", "Release the hold. You won't be charged.")}
      </div>
      {mode === "partial" && (
        <div>
          <label htmlFor="partial-amount" className="mb-1.5 block font-semibold">
            Amount to pay {shopName}
          </label>
          <div className="relative max-w-48">
            <span
              aria-hidden
              className="absolute top-1/2 left-4 -translate-y-1/2 font-semibold text-walnut/70"
            >
              $
            </span>
            <input
              id="partial-amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, "").slice(0, 7))}
              aria-invalid={!partialOk}
              className="min-h-12 w-full rounded-2xl border-2 border-bark/30 bg-cream pr-4 pl-8 text-base focus:border-accent focus:outline-none aria-[invalid=true]:border-danger"
            />
          </div>
          <p className="mt-1.5 text-sm text-walnut/75">
            {partialOk
              ? `You get ${formatCents(amountCents - partialCents)} back.`
              : `Between $0.01 and ${formatCents(amountCents - 1)}.`}
          </p>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm font-semibold text-danger">
          {error}
        </p>
      )}
      <WoodButton size="lg" onClick={submit} disabled={!mode || busy}>
        {busy
          ? "Saving…"
          : mode === "accept"
            ? `Pay ${formatCents(amountCents)}`
            : mode === "partial"
              ? partialOk
                ? `Pay ${formatCents(partialCents)}`
                : "Pay part"
              : mode === "cancel"
                ? "Cancel and release the hold"
                : "Choose an option"}
      </WoodButton>
    </section>
  );
}
