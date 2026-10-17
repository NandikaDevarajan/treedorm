import Link from "next/link";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { CreamCard } from "@/components/woodland/CreamCard";
import { EmptyState, type Spirit } from "@/components/woodland/EmptyState";
import type { Session } from "@/lib/session";

/** Stand-in for screens built in later phases, so the auth flow has somewhere real to land. */
export function PhasePlaceholder({
  title,
  phase,
  spirit,
  session,
}: {
  title: string;
  phase: number;
  spirit: Spirit;
  session: Session;
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-safe py-10">
      <CreamCard>
        <EmptyState title={title} spirit={spirit}>
          This screen arrives in Phase {phase}. You&apos;re signed in as <strong>{session.email}</strong> (
          {session.accountType ?? "no account type yet"}, {session.schoolDomain}).
        </EmptyState>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/onboarding/account-type" className="min-h-11 content-center font-semibold underline">
            Change account type
          </Link>
          <LogoutButton />
        </div>
      </CreamCard>
    </main>
  );
}
