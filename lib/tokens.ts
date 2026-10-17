/**
 * Hex values of the colour tokens, for places CSS variables can't reach (email HTML, contrast
 * checks). styles/tokens.css is the source of truth; a test fails if these drift from it.
 */
export const TOKENS = {
  almond: "#EADDCA",
  carmel: "#C19A6B",
  bark: "#6B4226",
  walnut: "#3E2B20",
  leaf: "#64764B",
  sage: "#A8B58A",
  cream: "#FFF8EC",
  gold: "#D9B56D",
  danger: "#A23B2A",
} as const;
