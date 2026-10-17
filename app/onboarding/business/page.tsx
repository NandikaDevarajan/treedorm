import { redirect } from "next/navigation";
import { PhasePlaceholder } from "@/components/auth/PhasePlaceholder";
import { getSession } from "@/lib/auth";

// SPEC-NOTE: placeholder so Phase 2 sign-in has a real destination; built in Phase 4.
export default async function Page() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <PhasePlaceholder title="Your treehouse" phase={4} session={session} />;
}
