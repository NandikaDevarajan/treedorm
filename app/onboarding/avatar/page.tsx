import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AvatarEditor } from "@/components/avatar/AvatarEditor";
import { LeafyBackground } from "@/components/woodland/LeafyBackground";
import { getCurrentUser } from "@/lib/user";

export const metadata: Metadata = { title: "Your hedgehog · Tree Dorm" };

export default async function OnboardingAvatarPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <LeafyBackground tone="carmel">
      <AvatarEditor initial={user.avatar} mode="onboarding" />
    </LeafyBackground>
  );
}
