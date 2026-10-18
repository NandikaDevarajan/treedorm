"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { TreehouseScene, type EntrancePhase } from "@/components/home/TreehouseScene";
import { SiteLinks } from "@/components/site/SiteLinks";
import { LeafyBackground } from "@/components/woodland/LeafyBackground";
import { WoodButton } from "@/components/woodland/WoodButton";
import { cn } from "@/lib/cn";
import { coverForEntrance, prefersReducedMotion } from "@/lib/entrance";

const DESTINATION = "/market";

/**
 * Homepage (SPEC §9.5): the treehouse scene, brand title, one intro line and the two CTAs.
 * "Enter the village" or the door itself plays the entrance: door opens → camera pushes through
 * the doorway → warm light → the village. About 1.5s, skippable by tapping again; reduced motion
 * gets a short fade instead of any movement.
 */
export function HomeEntrance() {
  const router = useRouter();
  const [phase, setPhase] = useState<EntrancePhase>("idle");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const doorRef = useRef<HTMLButtonElement>(null);
  // Where the door sits on screen; the zoom converges there, so the vignette is centred on it.
  const [focus, setFocus] = useState({ x: "50%", y: "50%" });

  useEffect(() => {
    router.prefetch(DESTINATION);
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, [router]);

  const go = () => {
    timers.current.forEach(clearTimeout);
    coverForEntrance();
    router.push(DESTINATION);
  };

  const enter = () => {
    if (phase !== "idle") return go(); // second tap skips
    const door = doorRef.current?.getBoundingClientRect();
    if (door) setFocus({ x: `${door.left + door.width / 2}px`, y: `${door.top + door.height / 2}px` });
    const at = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms));

    if (prefersReducedMotion()) {
      setPhase("fading");
      coverForEntrance();
      at(320, () => router.push(DESTINATION));
      return;
    }
    setPhase("opening");
    at(420, () => setPhase("entering")); // door is open; the camera starts moving
    at(1000, coverForEntrance); // doorway fills the screen; warm light takes over
    at(1300, () => router.push(DESTINATION));
  };

  const leaving = phase !== "idle";

  return (
    <LeafyBackground tone="almond" data-entrance-origin="">
      <main className="mx-auto grid min-h-dvh max-w-7xl items-center gap-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] md:gap-12 md:px-10 md:py-10">
        <div className="relative z-10 md:order-2">
          <TreehouseScene
            phase={phase}
            onDoor={enter}
            doorRef={doorRef}
            className="rounded-b-[2.5rem] shadow-soft md:rounded-[2.5rem] md:border-4 md:border-cream"
          />
        </div>

        <div
          className={cn(
            "flex flex-col gap-5 px-safe transition-opacity duration-300 md:order-1 md:px-0",
            leaving && "opacity-0",
          )}
        >
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-6xl leading-none text-bark md:text-7xl">Tree Dorm</h1>
            <p className="max-w-sm text-lg text-walnut/90">
              Little shops run by students, tucked into the campus woods.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:max-w-sm">
            <WoodButton size="lg" onClick={enter} className="w-full">
              Enter the village
            </WoodButton>
            <WoodButton href="/signup?intent=business" variant="secondary" className="w-full">
              Open your treehouse
            </WoodButton>
          </div>
          <p className="text-walnut/90">
            <Link href="/login" className="font-semibold text-bark underline underline-offset-4">
              Log in
            </Link>
            <span aria-hidden> · </span>
            <Link href="/signup" className="font-semibold text-bark underline underline-offset-4">
              Sign up
            </Link>
          </p>
          <footer>
            <SiteLinks className="text-sm" />
          </footer>
        </div>
      </main>

      {/* Interior bridge: the edges fall into warm shadow as the camera nears the doorway. */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none fixed inset-0 z-20 transition-opacity duration-500",
          phase === "entering" ? "opacity-100" : "opacity-0",
        )}
        style={{
          background: `radial-gradient(circle at ${focus.x} ${focus.y}, transparent 0, transparent 14%, color-mix(in srgb, var(--walnut) 92%, transparent) 60%)`,
        }}
      />
    </LeafyBackground>
  );
}
