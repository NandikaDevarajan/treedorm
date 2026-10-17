/** Treehouse categories (SPEC §3.1), shared by onboarding surveys and marketplace filters. */
export const CATEGORIES = [
  { id: "beauty", label: "Beauty" },
  { id: "food", label: "Food" },
  { id: "fitness", label: "Fitness" },
  { id: "photography", label: "Photography" },
  { id: "tutoring", label: "Tutoring" },
  { id: "crafts", label: "Crafts" },
  { id: "reselling", label: "Reselling" },
  { id: "other", label: "Other" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];
export const CATEGORY_IDS = CATEGORIES.map((c) => c.id) as [CategoryId, ...CategoryId[]];
