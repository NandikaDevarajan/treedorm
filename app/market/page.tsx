import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app/AppHeader";
import { PhasePlaceholder } from "@/components/auth/PhasePlaceholder";
import { getSession } from "@/lib/auth";

// SPEC-NOTE: placeholder so sign-in and onboarding have a real destination; built in Phase 5.
export default async function Page() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <PhasePlaceholder title="The village" phase={5} session={session} header={<AppHeader />} vines />;
}
