"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AccessoryPicker } from "@/components/woodland/AccessoryPicker";
import { HedgehogAvatar } from "@/components/woodland/HedgehogAvatar";
import { WoodButton } from "@/components/woodland/WoodButton";
import { accessoryFit, DEFAULT_AVATAR, type Avatar } from "@/lib/avatar";
import { cn } from "@/lib/cn";
import { coverForEntrance } from "@/lib/entrance";

interface Props {
  initial: Avatar;
  /** onboarding: Save / Skip for now → the village. profile: Save / Cancel → back to the profile. */
  mode: "onboarding" | "profile";
  /** Page colour behind the pinned preview, so the sheet scrolls under it cleanly. */
  tone?: "carmel" | "almond";
}

/**
 * Live hedgehog preview + accessory browser (SPEC §9.9). On phones the preview stays pinned at the top
 * while the accessories scroll in a sheet below; on desktop they sit side by side.
 */
export function AvatarEditor({ initial, mode, tone = "carmel" }: Props) {
  const router = useRouter();
  const [avatar, setAvatar] = useState<Avatar>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const done = mode === "onboarding" ? "/market" : "/profile";
  const changed = avatar.hat !== initial.hat || avatar.sunglasses !== initial.sunglasses;

  const leave = () => {
    if (mode === "onboarding") coverForEntrance(); // warm light into the village
    router.push(done);
    router.refresh();
  };

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/me/avatar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Couldn't save your hedgehog. Try again.");
      leave();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  const wearing = [accessoryFit(avatar.hat)?.label, accessoryFit(avatar.sunglasses)?.label].filter(Boolean);
  const isDefault = !avatar.hat && !avatar.sunglasses;

  return (
    <div className="mx-auto grid w-full max-w-5xl md:grid-cols-2 md:items-start md:gap-10 md:px-8 md:py-10">
      {/* Preview: pinned on phones so it stays visible while browsing. */}
      <section
        aria-label="Preview"
        className={cn(
          "sticky top-0 z-10 flex flex-col items-center gap-2 px-safe md:bg-transparent",
          tone === "carmel" ? "bg-carmel" : "bg-almond",
          "pt-[max(1rem,env(safe-area-inset-top))] pb-3 md:static md:pt-0",
        )}
      >
        <div className="flex h-[30dvh] max-h-72 w-full items-end justify-center md:h-auto md:max-h-none">
          <HedgehogAvatar
            avatar={avatar}
            label={isDefault ? "Your hedgehog" : `Your hedgehog wearing ${wearing.join(" and ")}`}
            className="h-full md:h-auto md:w-full md:max-w-sm"
            priority
          />
        </div>
        <p aria-live="polite" className="min-h-6 text-sm font-semibold text-walnut/85">
          {isDefault ? "Just your hedgehog" : wearing.join(" + ")}
        </p>
      </section>

      {/* Controls: a sheet on phones, a card on desktop. */}
      <section className="flex flex-col gap-5 rounded-t-[2rem] border-t border-bark/10 bg-cream px-5 pt-6 pb-0 shadow-soft md:rounded-[2rem] md:border md:p-8">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-display text-4xl leading-tight text-bark">Dress up your hedgehog</h1>
          <p className="text-walnut/85">
            Add one hat and one pair of sunglasses if you like.
            {mode === "onboarding" && " You can change them any time from your profile."}
          </p>
        </div>

        <AccessoryPicker value={avatar} onChange={setAvatar} />

        <button
          type="button"
          onClick={() => setAvatar(DEFAULT_AVATAR)}
          disabled={isDefault}
          className="min-h-11 w-fit font-semibold text-bark underline underline-offset-4 disabled:text-walnut/40 disabled:no-underline"
        >
          Take everything off
        </button>

        {error && (
          <p role="alert" className="text-sm font-semibold text-danger">
            {error}
          </p>
        )}

        {/* Actions stay reachable at the bottom of the sheet; "Skip for now" is always visible. */}
        <div
          className={cn(
            "sticky bottom-0 -mx-5 flex flex-col gap-2 border-t border-bark/10 bg-cream px-5 pt-3",
            "pb-[max(1rem,env(safe-area-inset-bottom))] md:static md:mx-0 md:border-0 md:p-0",
          )}
        >
          <WoodButton size="lg" onClick={save} disabled={busy || (mode === "profile" && !changed)}>
            {busy ? "Saving…" : mode === "onboarding" ? "Save my hedgehog" : "Save changes"}
          </WoodButton>
          {mode === "onboarding" ? (
            <WoodButton variant="secondary" onClick={leave} disabled={busy}>
              Skip for now
            </WoodButton>
          ) : (
            <Link
              href="/profile"
              className="min-h-11 self-center content-center font-semibold text-bark underline underline-offset-4"
            >
              Cancel
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
