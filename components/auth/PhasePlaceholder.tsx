import Link from "next/link";
import type { ReactNode } from "react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { CreamCard } from "@/components/woodland/CreamCard";
import { EmptyState } from "@/components/woodland/EmptyState";
import { LeafyBackground } from "@/components/woodland/LeafyBackground";
import { VineBorder } from "@/components/woodland/VineBorder";
import type { Session } from "@/lib/session";

/** Stand-in for screens built in later phases, so signed-in flows have somewhere real to land. */
export function PhasePlaceholder({
  title,
  phase,
  session,
  header,
  vines = false,
}: {
  title: string;
  phase: number;
  session: Session;
  /** e.g. <AppHeader />, shown above everything. */
  header?: ReactNode;
  /** Show the marketplace vine band. */
  vines?: boolean;
}) {
  return (
    <LeafyBackground tone="almond">
      {header}
      {vines && <VineBorder />}
      <main className="mx-auto flex max-w-md flex-col gap-4 px-safe py-10">
        <CreamCard>
          <EmptyState title={title}>
            This screen arrives in Phase {phase}. You&apos;re signed in as <strong>{session.email}</strong> (
            {session.accountType ?? "no account type yet"}, {session.schoolDomain}).
          </EmptyState>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/profile" className="min-h-11 content-center font-semibold underline">
              Your profile
            </Link>
            <LogoutButton />
          </div>
        </CreamCard>
      </main>
    </LeafyBackground>
  );
}
