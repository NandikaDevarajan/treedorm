import Link from "next/link";
import type { ReactNode } from "react";
import { LeafyBackground } from "@/components/woodland/LeafyBackground";
import { VineBorder } from "@/components/woodland/VineBorder";

/** Calm backdrop for /signup and /login: almond, soft texture, a few leaves and the vine across the top. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <LeafyBackground tone="almond">
      <VineBorder dense />
      <div className="flex min-h-[calc(100dvh-7.5rem)] flex-col items-center px-safe pb-[max(2rem,env(safe-area-inset-bottom))] sm:justify-center sm:pb-16">
        <div className="flex w-full max-w-md flex-col gap-3">
          <Link
            href="/"
            className="flex min-h-11 w-fit items-center gap-1.5 font-semibold text-bark underline-offset-4 hover:underline"
          >
            <span aria-hidden>←</span> Tree Dorm home
          </Link>
          <main className="w-full rounded-[2rem] border border-bark/15 bg-cream p-6 shadow-soft sm:p-8">
            {children}
          </main>
        </div>
      </div>
    </LeafyBackground>
  );
}
