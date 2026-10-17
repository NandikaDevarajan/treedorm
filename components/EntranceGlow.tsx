"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { ENTRANCE_EVENT } from "@/lib/entrance";

/**
 * The "interior bridge" of the door entrance (SPEC §9.5, steps 6–7). Lives in the root layout so it
 * survives navigation: the homepage covers the screen in warm light, the route changes underneath,
 * and the glow fades away once the destination has actually rendered (not its loading screen).
 */
export function EntranceGlow() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<"off" | "cover" | "reveal">("off");
  const pathRef = useRef(pathname);
  pathRef.current = pathname;

  useEffect(() => {
    const onCover = () => setPhase("cover");
    window.addEventListener(ENTRANCE_EVENT, onCover);
    return () => window.removeEventListener(ENTRANCE_EVENT, onCover);
  }, []);

  useEffect(() => {
    if (phase === "cover") {
      const coveredOn = pathRef.current;
      const started = Date.now();
      const poll = setInterval(() => {
        // Arrived = new URL, the homepage has left the DOM, and no route loading screen is showing.
        const arrived =
          pathRef.current !== coveredOn &&
          !document.querySelector("[data-entrance-origin]") &&
          !document.querySelector("[data-route-loading]");
        // Give up after 5s so a slow or failed navigation never leaves the screen covered.
        if (arrived || Date.now() - started > 5000) setPhase("reveal");
      }, 50);
      return () => clearInterval(poll);
    }
    if (phase === "reveal") {
      const t = setTimeout(() => setPhase("off"), 700);
      return () => clearTimeout(t);
    }
  }, [phase]);

  return (
    <div
      aria-hidden
      className={cn(
        "allow-fade pointer-events-none fixed inset-0 z-[100] transition-opacity",
        "bg-[radial-gradient(circle_at_50%_45%,var(--cream),var(--gold)_55%,var(--bark))]",
        phase === "cover" ? "opacity-100 duration-300" : "opacity-0 duration-700",
        phase === "off" && "hidden",
      )}
    />
  );
}
