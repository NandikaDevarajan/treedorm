/**
 * Woodland creatures (SPEC §9.15): still cartoon decorations cut from the two sheets in
 * public/assets/creatures/. Always shown sitting openly on grass via <Creature> — never peeking,
 * perching or half-hidden. Never animated, never a user avatar (only the hedgehog is, §9.9).
 */
export const CREATURES = [
  "bear-soft",
  "bird-flat",
  "deer-flat",
  "deer-soft",
  "fox-flat",
  "fox-soft",
  "moose-soft",
  "owl-flat",
  "owl-soft",
  "rabbit-flat",
  "rabbit-soft",
  "raccoon-flat",
  "raccoon-soft",
  "squirrel-flat",
  "squirrel-soft",
  "wolf-soft",
  "woodpecker-soft",
] as const;

export type CreatureName = (typeof CREATURES)[number];

export const creatureSrc = (name: CreatureName) => `/assets/creatures/cutouts/${name}.png`;

/** Which creature appears where. One per spot; at most 1–2 on screen at a time. */
export const CREATURE_FOR = {
  /** Sits above the message on empty states. */
  emptyState: "rabbit-soft",
  /** Eyes-closed deer resting on loading screens. */
  loading: "deer-soft",
  /** Sits beside "Photo check passed" (Phase 8). */
  checkPassed: "fox-soft",
} as const satisfies Record<string, CreatureName>;
