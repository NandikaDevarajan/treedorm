"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { WoodButton } from "@/components/woodland/WoodButton";

/** Seller action (SPEC §7 POST /api/orders/[id]/done). */
export function ServiceDoneButton({ orderId, size = "md" }: { orderId: string; size?: "md" | "lg" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col items-end gap-1">
      <WoodButton
        size={size}
        disabled={busy}
        onClick={async () => {
          if (!confirm("Mark this order as done? The buyer will be asked for a proof photo.")) return;
          setBusy(true);
          setError(null);
          const res = await fetch(`/api/orders/${orderId}/done`, { method: "POST" });
          const json = await res.json().catch(() => ({}));
          if (!res.ok) setError(json?.error?.message ?? "Couldn't update the order.");
          setBusy(false);
          router.refresh();
        }}
      >
        {busy ? "Saving…" : "Service done"}
      </WoodButton>
      {error && (
        <p role="alert" className="text-sm font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
