"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AccountTypeCard } from "@/components/woodland/AccountTypeCard";
import { WoodButton } from "@/components/woodland/WoodButton";
import type { AccountType } from "@/lib/collections";

const CARDS: {
  type: AccountType;
  title: string;
  description: string;
  image: string;
  imageClassName?: string;
}[] = [
  {
    type: "personal",
    title: "Personal",
    description:
      "Browse the village, discover student businesses, book what you need and dress up your own hedgehog.",
    image: "/assets/characters/hedgehog-default.png",
  },
  {
    type: "business",
    title: "Business",
    description:
      "Open your own treehouse: name your shop, customise its look and list what you offer. You can still shop too.",
    image: "/assets/treehouse/treehouse-main.webp",
    imageClassName: "object-cover object-[55%_45%] scale-150 p-0",
  },
];

export function AccountTypeChooser({ initial }: { initial: AccountType | null }) {
  const router = useRouter();
  const [choice, setChoice] = useState<AccountType | null>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!choice) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding/account-type", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountType: choice }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Couldn't save that. Try again.");
      router.push(json.next);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div role="radiogroup" aria-label="Account type" className="grid gap-4 sm:grid-cols-2">
        {CARDS.map((c) => (
          <AccountTypeCard
            key={c.type}
            title={c.title}
            description={c.description}
            imageSrc={c.image}
            imageClassName={c.imageClassName}
            selected={choice === c.type}
            onSelect={() => setChoice(c.type)}
          />
        ))}
      </div>
      {error && (
        <p role="alert" className="rounded-xl bg-cream px-4 py-2 text-sm font-semibold text-danger">
          {error}
        </p>
      )}
      <div className="sticky bottom-[max(1rem,env(safe-area-inset-bottom))] mx-auto w-full max-w-sm">
        <WoodButton size="lg" className="w-full" onClick={submit} disabled={!choice || busy}>
          {busy
            ? "Saving…"
            : choice === "business"
              ? "Continue as a business"
              : choice
                ? "Continue"
                : "Pick one to continue"}
        </WoodButton>
      </div>
    </div>
  );
}
