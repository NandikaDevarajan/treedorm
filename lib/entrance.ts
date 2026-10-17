/** Window event the homepage fires to cover the screen in warm light just before navigating (SPEC §9.5). */
export const ENTRANCE_EVENT = "treedorm:entrance";

export const coverForEntrance = () => window.dispatchEvent(new Event(ENTRANCE_EVENT));

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
