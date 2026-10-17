import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AccountTypeChooser } from "./AccountTypeChooser";

export const metadata: Metadata = { title: "Choose your account · Tree Dorm" };

export default async function AccountTypePage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { intent } = await searchParams;
  const initial = session.accountType ?? (intent === "business" ? "business" : null);

  return (
    <div className="min-h-dvh bg-carmel px-safe pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
      <main className="mx-auto flex max-w-3xl flex-col gap-6">
        <header className="rounded-card bg-cream/95 p-5 text-center shadow-soft">
          <p className="text-sm font-bold tracking-wide text-leaf">Welcome to the village 🌿</p>
          <h1 className="font-display text-4xl leading-tight text-bark">How will you use Tree Dorm?</h1>
          <p className="mt-1 text-walnut/85">
            You can always shop. Business accounts also get their own treehouse.
          </p>
        </header>
        <AccountTypeChooser initial={initial} />
      </main>
    </div>
  );
}
