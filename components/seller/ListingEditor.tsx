"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";
import { inputClass, textareaClass } from "@/components/seller/field";
import { TagEditor } from "@/components/seller/TagEditor";
import { AITag } from "@/components/woodland/AITag";
import { WoodButton } from "@/components/woodland/WoodButton";
import { cn } from "@/lib/cn";

export interface EditablePhoto {
  url: string;
  publicId: string;
}

export interface ListingFields {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  tags: string[];
  checkpoints: string[];
  customTextAllowed: boolean;
  photos: EditablePhoto[];
  aiAssisted: boolean;
}

type Upload = { key: string; preview: string; status: "uploading" | "done" | "error"; photo?: EditablePhoto };

const MAX_PHOTOS = 5;

/** Shrinks a phone photo to ≤1600px JPEG before upload; falls back to the original file. */
async function shrink(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await new Promise((resolve) => canvas.toBlob((b) => resolve(b ?? file), "image/jpeg", 0.86));
  } catch {
    return file;
  }
}

async function api<T>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error?.message ?? "Something went wrong. Try again.");
  return json as T;
}

/**
 * New listing (SPEC §3.1 step 6, §8.2): add 1–5 photos (uploaded straight to Cloudinary), the Listing
 * Writer drafts every field, the seller edits and publishes. Also edits an existing draft.
 */
export function ListingEditor({
  initial,
  shopSlug,
  first,
}: {
  initial?: ListingFields;
  shopSlug: string;
  first?: boolean;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [notes, setNotes] = useState("");
  const [listing, setListing] = useState<ListingFields | null>(initial ?? null);
  const [price, setPrice] = useState(initial ? (initial.priceCents / 100).toFixed(2) : "");
  const [newCheckpoint, setNewCheckpoint] = useState("");
  const [busy, setBusy] = useState<"" | "writing" | "saving" | "publishing">("");
  const [error, setError] = useState<string | null>(null);

  const ready = uploads.filter((u) => u.status === "done");
  const uploading = uploads.some((u) => u.status === "uploading");

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    const room = MAX_PHOTOS - uploads.length;
    const picked = [...files]
      .filter((f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name))
      .slice(0, room);
    if (files.length > room) setError(`Up to ${MAX_PHOTOS} photos.`);
    if (!picked.length) return;

    let sign: Record<string, string | number>;
    try {
      sign = await api("/api/uploads/sign", "POST");
    } catch (err) {
      return setError((err as Error).message);
    }
    const fresh: Upload[] = picked.map((f) => ({
      key: crypto.randomUUID(),
      preview: URL.createObjectURL(f),
      status: "uploading",
    }));
    setUploads((u) => [...u, ...fresh]);

    await Promise.all(
      picked.map(async (file, i) => {
        const key = fresh[i].key;
        try {
          const form = new FormData();
          form.append("file", await shrink(file));
          for (const k of ["api_key", "timestamp", "signature", "folder", "allowed_formats"] as const) {
            form.append(k, String(k === "api_key" ? sign.apiKey : sign[k]));
          }
          const res = await fetch(String(sign.url), { method: "POST", body: form });
          const json = await res.json();
          if (!res.ok) throw new Error(json?.error?.message ?? "upload failed");
          const photo = { url: json.secure_url as string, publicId: json.public_id as string };
          setUploads((u) => u.map((x) => (x.key === key ? { ...x, status: "done", photo } : x)));
        } catch {
          setUploads((u) => u.map((x) => (x.key === key ? { ...x, status: "error" } : x)));
          setError("A photo didn't upload. Remove it and try again.");
        }
      }),
    );
  };

  const write = async () => {
    setBusy("writing");
    setError(null);
    try {
      const res = await api<{ listing: ListingFields & { _id: string }; ai: boolean }>(
        "/api/listings",
        "POST",
        {
          photos: ready.map((u) => u.photo),
          sellerNotes: notes.trim() || undefined,
        },
      );
      const l = res.listing;
      setListing({ ...l, id: l._id, aiAssisted: res.ai });
      setPrice((l.priceCents / 100).toFixed(2));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy("");
    }
  };

  const save = async (publish: boolean) => {
    if (!listing) return;
    const cents = Math.round(Number(price) * 100);
    if (!Number.isFinite(cents) || cents < 100) return setError("Set a price of at least $1.");
    if (!listing.title.trim() || !listing.description.trim()) return setError("Add a title and description.");
    if (!listing.checkpoints.length) return setError("Add at least one photo checkpoint.");
    setBusy(publish ? "publishing" : "saving");
    setError(null);
    try {
      const res = await api<{ next: string }>(`/api/listings/${listing.id}`, "PATCH", {
        title: listing.title,
        description: listing.description,
        priceCents: cents,
        tags: listing.tags,
        checkpoints: listing.checkpoints,
        customTextAllowed: listing.customTextAllowed,
        publish,
      });
      router.push(publish ? res.next : "/seller");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy("");
    }
  };

  // ---- Step 1: photos -------------------------------------------------------------------------
  if (!listing) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-4xl leading-tight text-bark">
            {first ? "Add your first listing" : "Add a listing"}
          </h1>
          <p className="text-walnut/85">
            Add 1–5 photos of your work. We&apos;ll draft the title, description, price and photo checkpoints
            for you to edit.
          </p>
        </div>

        <div>
          <p className="mb-2 font-semibold">
            Photos{" "}
            <span className="font-normal text-walnut/70">
              ({uploads.length}/{MAX_PHOTOS})
            </span>
          </p>
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {uploads.map((u, i) => (
              <li
                key={u.key}
                className="relative aspect-square overflow-hidden rounded-2xl border-2 border-bark/15 bg-almond"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- local preview of a just-picked file */}
                <img
                  src={u.preview}
                  alt={`Photo ${i + 1}`}
                  className={cn("size-full object-cover", u.status !== "done" && "opacity-60")}
                />
                {u.status === "uploading" && (
                  <span className="absolute inset-x-2 bottom-2 rounded-full bg-cream/90 py-0.5 text-center text-xs font-bold">
                    Uploading…
                  </span>
                )}
                {u.status === "error" && (
                  <span className="absolute inset-x-2 bottom-2 rounded-full bg-danger py-0.5 text-center text-xs font-bold text-cream">
                    Failed
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setUploads((x) => x.filter((y) => y.key !== u.key))}
                  aria-label={`Remove photo ${i + 1}`}
                  className="absolute top-1.5 right-1.5 grid size-8 place-items-center rounded-full bg-cream/95 font-bold text-walnut shadow-soft"
                >
                  <span aria-hidden>×</span>
                </button>
              </li>
            ))}
            {uploads.length < MAX_PHOTOS && (
              <li>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-bark/40 bg-cream font-semibold text-bark hover:bg-almond"
                >
                  <span aria-hidden className="text-3xl leading-none">
                    +
                  </span>
                  <span className="text-sm">Add photos</span>
                </button>
              </li>
            )}
          </ul>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => {
              void addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        <Field
          id="notes"
          label="Anything we should know? (optional)"
          hint="e.g. sizes, what's included, how long it takes."
        >
          <textarea
            id="notes"
            rows={3}
            maxLength={300}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={textareaClass}
          />
        </Field>

        {error && <ErrorText>{error}</ErrorText>}
        <WoodButton size="lg" onClick={write} disabled={!ready.length || uploading || busy === "writing"}>
          {busy === "writing"
            ? "Writing your listing…"
            : uploading
              ? "Uploading photos…"
              : "Write my listing"}
        </WoodButton>
        {busy === "writing" && (
          <div role="status" className="flex flex-col gap-3">
            <span className="sr-only">Writing your listing</span>
            {[44, 88, 44, 120].map((h, i) => (
              <div key={i} className="animate-pulse rounded-2xl bg-almond" style={{ height: h }} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ---- Step 2: review & publish ---------------------------------------------------------------
  const ai = listing.aiAssisted && <AITag />;
  const set = (patch: Partial<ListingFields>) => setListing({ ...listing, ...patch });
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-4xl leading-tight text-bark">Check your listing</h1>
        <p className="text-walnut/85">
          {listing.aiAssisted
            ? "Drafted from your photos. Change anything before you publish."
            : "Fill in the details before you publish."}
        </p>
      </div>

      <ul className="flex gap-3 overflow-x-auto pb-1">
        {listing.photos.map((p, i) => (
          <li
            key={p.publicId}
            className="relative size-24 shrink-0 overflow-hidden rounded-2xl border-2 border-bark/15"
          >
            <Image src={p.url} alt={`Listing photo ${i + 1}`} fill sizes="96px" className="object-cover" />
          </li>
        ))}
      </ul>

      <Field id="l-title" label="Title" badge={ai} hint={`${listing.title.length}/80`}>
        <input
          id="l-title"
          maxLength={80}
          value={listing.title}
          onChange={(e) => set({ title: e.target.value })}
          className={inputClass}
        />
      </Field>
      <Field id="l-desc" label="Description" badge={ai} hint={`${listing.description.length}/500`}>
        <textarea
          id="l-desc"
          rows={5}
          maxLength={500}
          value={listing.description}
          onChange={(e) => set({ description: e.target.value })}
          className={textareaClass}
        />
      </Field>
      <Field id="l-price" label="Price" badge={ai}>
        <div className="relative max-w-48">
          <span aria-hidden className="absolute top-1/2 left-4 -translate-y-1/2 font-semibold text-walnut/70">
            $
          </span>
          <input
            id="l-price"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, "").slice(0, 7))}
            className={`${inputClass} pl-8`}
          />
        </div>
      </Field>
      <TagEditor label="Search tags" value={listing.tags} onChange={(tags) => set({ tags })} badge={ai} />

      <fieldset>
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <legend className="font-semibold">Photo checkpoints</legend>
          {ai}
        </div>
        <p className="mb-3 text-sm text-walnut/75">
          What a buyer&apos;s photo of the finished result should show. These are used to check the result
          before you&apos;re paid.
        </p>
        <ul className="flex flex-col gap-2">
          {listing.checkpoints.map((c, i) => (
            <li key={i} className="flex items-center gap-2">
              <input
                aria-label={`Checkpoint ${i + 1}`}
                maxLength={90}
                value={c}
                onChange={(e) =>
                  set({ checkpoints: listing.checkpoints.map((x, j) => (j === i ? e.target.value : x)) })
                }
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => set({ checkpoints: listing.checkpoints.filter((_, j) => j !== i) })}
                aria-label={`Remove checkpoint ${i + 1}`}
                className="grid size-11 shrink-0 place-items-center rounded-full text-xl text-walnut hover:bg-almond"
              >
                <span aria-hidden>×</span>
              </button>
            </li>
          ))}
        </ul>
        {listing.checkpoints.length < 6 && (
          <div className="mt-2 flex gap-2">
            <input
              aria-label="New checkpoint"
              placeholder="e.g. round two-tier cake"
              maxLength={90}
              value={newCheckpoint}
              onChange={(e) => setNewCheckpoint(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newCheckpoint.trim()) {
                  e.preventDefault();
                  set({ checkpoints: [...listing.checkpoints, newCheckpoint.trim()] });
                  setNewCheckpoint("");
                }
              }}
              className={inputClass}
            />
            <WoodButton
              variant="secondary"
              disabled={!newCheckpoint.trim()}
              onClick={() => {
                set({ checkpoints: [...listing.checkpoints, newCheckpoint.trim()] });
                setNewCheckpoint("");
              }}
            >
              Add
            </WoodButton>
          </div>
        )}
      </fieldset>

      <label className="flex min-h-11 cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={listing.customTextAllowed}
          onChange={(e) => set({ customTextAllowed: e.target.checked })}
          className="mt-1 size-5 accent-[var(--leaf)]"
        />
        <span>
          <span className="font-semibold">Buyers can ask for custom words</span>
          <span className="block text-sm text-walnut/75">Like writing on a cake or an embroidered name.</span>
        </span>
      </label>

      {error && <ErrorText>{error}</ErrorText>}
      <div className="flex flex-col gap-3 sm:flex-row-reverse">
        <WoodButton size="lg" onClick={() => save(true)} disabled={!!busy} className="sm:flex-1">
          {busy === "publishing" ? "Publishing…" : "Publish listing"}
        </WoodButton>
        <WoodButton variant="secondary" onClick={() => save(false)} disabled={!!busy} className="sm:flex-1">
          {busy === "saving" ? "Saving…" : "Save as draft"}
        </WoodButton>
      </div>
      <p className="text-center text-sm text-walnut/70">Published listings show on {`/t/${shopSlug}`}.</p>
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

function ErrorText({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="text-sm font-semibold text-danger">
      {children}
    </p>
  );
}
