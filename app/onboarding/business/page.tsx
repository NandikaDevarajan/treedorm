import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LeafyBackground } from "@/components/woodland/LeafyBackground";
import { getOpenerContext } from "@/lib/seller";
import { BusinessSurvey } from "./BusinessSurvey";

export const metadata: Metadata = { title: "Open your treehouse · Tree Dorm" };

export default async function BusinessOnboardingPage() {
  const ctx = await getOpenerContext();
  if (!ctx) redirect("/onboarding/account-type");
  if (ctx.shop) redirect("/seller");
  return (
    <LeafyBackground tone="carmel">
      {/* Personal accounts arrive from their profile ("Open your treehouse") and can back out. */}
      <BusinessSurvey cancelHref={ctx.session.accountType === "personal" ? "/profile" : undefined} />
    </LeafyBackground>
  );
}
