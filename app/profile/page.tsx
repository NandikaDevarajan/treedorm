import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app/AppHeader";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { SiteLinks } from "@/components/site/SiteLinks";
import { CreamCard } from "@/components/woodland/CreamCard";
import { HedgehogAvatar } from "@/components/woodland/HedgehogAvatar";
import { LeafyBackground } from "@/components/woodland/LeafyBackground";
import { WoodButton } from "@/components/woodland/WoodButton";
import { accessoryFit } from "@/lib/avatar";
import { getUniversityTheme, SEED_SCHOOLS } from "@/lib/schools";
import { getCurrentUser } from "@/lib/user";

export const metadata: Metadata = { title: "Profile · Tree Dorm" };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const school = getUniversityTheme(user.schoolDomain, SEED_SCHOOLS).name ?? user.schoolDomain;
  const wearing = [accessoryFit(user.avatar.hat)?.label, accessoryFit(user.avatar.sunglasses)?.label].filter(
    Boolean,
  );
  const rows: [string, string][] = [
    ["Email", user.email],
    ["School", school],
    ["Account", user.accountType === "business" ? "Business" : "Personal"],
    ...(user.lookingFor ? ([["Usually looking for", user.lookingFor]] as [string, string][]) : []),
  ];

  return (
    <LeafyBackground tone="almond">
      <AppHeader />
      <main className="mx-auto flex max-w-md flex-col gap-5 px-safe py-8">
        <CreamCard className="flex flex-col items-center gap-4 p-6 text-center">
          <HedgehogAvatar avatar={user.avatar} label="Your hedgehog avatar" className="w-48" priority />
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-4xl text-bark">{user.name || "Your profile"}</h1>
            <p className="text-walnut/80">
              {wearing.length ? `Wearing ${wearing.join(" and ")}` : "Just your hedgehog"}
            </p>
          </div>
          <WoodButton href="/profile/avatar" className="w-full">
            Edit avatar
          </WoodButton>
        </CreamCard>

        <CreamCard className="p-0">
          <dl className="divide-y divide-bark/10">
            {rows.map(([label, value]) => (
              <div key={label} className="flex flex-col gap-0.5 px-5 py-3">
                <dt className="text-sm text-walnut/70">{label}</dt>
                <dd className="font-semibold break-words">{value}</dd>
              </div>
            ))}
          </dl>
        </CreamCard>

        {user.accountType === "business" ? (
          <CreamCard className="flex flex-col gap-3">
            <h2 className="font-display text-3xl text-bark">Your treehouse</h2>
            <p className="text-walnut/85">Manage your shop, listings and storefront.</p>
            <WoodButton href="/seller" variant="secondary">
              Go to your treehouse
            </WoodButton>
          </CreamCard>
        ) : (
          <CreamCard className="flex flex-col gap-3">
            <h2 className="font-display text-3xl text-bark">Sell something too?</h2>
            <p className="text-walnut/85">
              Open your own treehouse to offer haircuts, bakes, lessons or anything you make. You keep your
              hedgehog and can still book from other shops.
            </p>
            <WoodButton href="/onboarding/business" variant="secondary">
              Open your treehouse
            </WoodButton>
          </CreamCard>
        )}

        <div className="flex flex-col items-center gap-2">
          <SiteLinks className="justify-center" />
          <LogoutButton />
        </div>
      </main>
    </LeafyBackground>
  );
}
