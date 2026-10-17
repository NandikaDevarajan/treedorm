import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LeafyBackground } from "@/components/woodland/LeafyBackground";
import { getSellerContext } from "@/lib/seller";
import { BusinessSurvey } from "./BusinessSurvey";

export const metadata: Metadata = { title: "Open your treehouse · Tree Dorm" };

export default async function BusinessOnboardingPage() {
  const ctx = await getSellerContext();
  if (!ctx) redirect("/onboarding/account-type");
  if (ctx.shop) redirect("/seller");
  return (
    <LeafyBackground tone="carmel">
      <BusinessSurvey />
    </LeafyBackground>
  );
}
