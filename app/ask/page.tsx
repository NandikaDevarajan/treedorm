import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app/AppHeader";
import { AskChat } from "@/components/ask/AskChat";
import { LeafyBackground } from "@/components/woodland/LeafyBackground";
import { getUniversityTheme, SEED_SCHOOLS } from "@/lib/schools";
import { getCurrentUser } from "@/lib/user";

export const metadata: Metadata = { title: "Ask Tree Dorm · Tree Dorm" };

export default async function AskPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { q } = await searchParams;
  const theme = getUniversityTheme(user.schoolDomain, SEED_SCHOOLS);
  return (
    <LeafyBackground tone="almond">
      <AppHeader />
      <AskChat
        avatar={user.avatar}
        schoolShort={theme.short ?? user.schoolDomain}
        initialQuery={q?.slice(0, 500)}
      />
    </LeafyBackground>
  );
}
