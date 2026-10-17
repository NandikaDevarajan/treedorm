import { CreamCard } from "@/components/woodland/CreamCard";
import { EmptyState } from "@/components/woodland/EmptyState";
import { LeafyBackground } from "@/components/woodland/LeafyBackground";
import { WoodButton } from "@/components/woodland/WoodButton";

// Replaces Next's default 404, which uses its own system-font styling.
export default function NotFound() {
  return (
    <LeafyBackground tone="almond">
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-safe py-10">
        <CreamCard>
          <EmptyState
            title="Lost in the woods"
            action={
              <WoodButton href="/" className="mt-2">
                Back to Tree Dorm
              </WoodButton>
            }
          >
            We couldn&apos;t find that page. It may have moved, or the link might be wrong.
          </EmptyState>
        </CreamCard>
      </main>
    </LeafyBackground>
  );
}
