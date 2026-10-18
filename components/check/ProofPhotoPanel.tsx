"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Creature } from "@/components/woodland/Creature";
import { WoodButton } from "@/components/woodland/WoodButton";
import { CREATURE_FOR } from "@/lib/creatures";

/** Shrinks a phone photo to ≤1600px JPEG before upload; falls back to the original file. */
async function shrink(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await new Promise((resolve) => canvas.toBlob((b) => resolve(b ?? file), "image/jpeg", 0.88));
  } catch {
    return file;
  }
}

/**
 * "Snap proof photo" (SPEC §3.2 steps 9–10): opens the camera on phones (capture="environment") or a
 * file picker on desktop, uploads straight to Cloudinary, then runs the Photo check.
 */
export function ProofPhotoPanel({ orderId, retry = false }: { orderId: string; retry?: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [stage, setStage] = useState<"idle" | "uploading" | "checking">("idle");
  const [error, setError] = useState<string | null>(null);

  const run = async (file: File) => {
    setError(null);
    setPreview(URL.createObjectURL(file));
    setStage("uploading");
    try {
      const signRes = await fetch(`/api/orders/${orderId}/proof-sign`, { method: "POST" });
      const sign = await signRes.json();
      if (!signRes.ok) throw new Error(sign?.error?.message ?? "Couldn't start the upload.");
      const form = new FormData();
      form.append("file", await shrink(file));
      form.append("api_key", sign.apiKey);
      for (const k of ["timestamp", "signature", "folder", "allowed_formats"])
        form.append(k, String(sign[k]));
      const up = await fetch(sign.url, { method: "POST", body: form });
      const uploaded = await up.json();
      if (!up.ok) throw new Error("The photo didn't upload. Try again.");

      setStage("checking");
      const res = await fetch(`/api/orders/${orderId}/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proofPhoto: { url: uploaded.secure_url, publicId: uploaded.public_id } }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "The photo check didn't finish. Try again.");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setStage("idle");
    }
  };

  return (
    <section
      aria-labelledby="proof-title"
      className="flex flex-col gap-3 rounded-card border-2 border-leaf/40 bg-cream p-5 shadow-soft"
    >
      <h2 id="proof-title" className="font-display text-3xl text-bark">
        {retry ? "Try another photo" : "Snap proof photo"}
      </h2>
      <p className="text-walnut/90">
        Take a clear photo of what you received. The Photo check compares it with the listing, and the payment
        is released when it matches.
      </p>
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element -- local preview of the photo just taken
        <img src={preview} alt="Your proof photo" className="max-h-72 w-full rounded-2xl object-cover" />
      )}
      {stage !== "idle" ? (
        <div role="status" className="flex items-center gap-3">
          <Creature name={CREATURE_FOR.loading} size={44} />
          <span className="font-semibold">
            {stage === "uploading" ? "Uploading your photo…" : "Checking your photo…"}
          </span>
        </div>
      ) : (
        <WoodButton size="lg" onClick={() => inputRef.current?.click()}>
          {retry ? "Take another photo" : "Snap proof photo"}
        </WoodButton>
      )}
      {error && (
        <p role="alert" className="text-sm font-semibold text-danger">
          {error}
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void run(file);
        }}
      />
    </section>
  );
}
