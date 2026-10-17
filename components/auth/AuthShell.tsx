import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

/** Woodland backdrop for /signup and /login: the vine-oak treehouse scene behind a cream card. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-almond">
      <div className="absolute inset-x-0 top-0 h-[42dvh] sm:fixed sm:inset-0 sm:h-auto">
        <Image
          src="/assets/treehouse/treehouse-hedgehog.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[50%_30%]"
        />
        {/* Soft fade into the almond page so the card never sits on a hard edge. */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-almond sm:hidden" />
      </div>

      <div className="relative flex min-h-dvh flex-col items-center px-safe pt-[calc(30dvh+env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:justify-center sm:pt-12">
        <Link
          href="/"
          className="absolute top-[max(1rem,env(safe-area-inset-top))] left-4 rounded-full bg-cream/90 px-4 py-2 font-display text-xl text-bark shadow-soft"
        >
          Tree Dorm
        </Link>
        <main className="w-full max-w-md rounded-[2rem] border border-bark/15 bg-cream p-6 shadow-soft sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
