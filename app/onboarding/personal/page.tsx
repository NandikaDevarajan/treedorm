import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LeafyBackground } from "@/components/woodland/LeafyBackground";
import { CATEGORIES, type CategoryId } from "@/lib/categories";
import { getCurrentUser } from "@/lib/user";
import { PersonalSurvey } from "./PersonalSurvey";

export const metadata: Metadata = { title: "About you · Tree Dorm" };

export default async function PersonalOnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Pre-fill when someone comes back to this step.
  const saved = (user.lookingFor ?? "").split(",").map((s) => s.trim());
  const lookingFor = CATEGORIES.filter((c) => saved.includes(c.label)).map((c) => c.id) as CategoryId[];

  return (
    <LeafyBackground
      tone="carmel"
      className="px-safe pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]"
    >
      <main className="mx-auto flex max-w-lg flex-col gap-5 sm:pt-10">
        <PersonalSurvey initialName={user.name} initialLookingFor={lookingFor} />
      </main>
    </LeafyBackground>
  );
}
