import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app/AppHeader";
import { AvatarEditor } from "@/components/avatar/AvatarEditor";
import { LeafyBackground } from "@/components/woodland/LeafyBackground";
import { getCurrentUser } from "@/lib/user";

export const metadata: Metadata = { title: "Edit avatar · Tree Dorm" };

export default async function ProfileAvatarPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <LeafyBackground tone="almond">
      <AppHeader />
      <AvatarEditor initial={user.avatar} mode="profile" tone="almond" />
    </LeafyBackground>
  );
}
