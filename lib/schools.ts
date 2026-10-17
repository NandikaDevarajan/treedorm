import { contrast, isHex } from "@/lib/color";

export interface School {
  domain: string;
  name: string;
  short: string;
  primary: string;
  secondary: string;
  accentBg?: string;
  logoUrl?: string; // none by default — only add a permitted asset (SPEC §9.6)
}

/** Seed list (SPEC §9.6). scripts/seed.ts writes these to the `schools` collection. */
export const SEED_SCHOOLS: School[] = [
  {
    domain: "uw.edu",
    name: "University of Washington",
    short: "UW",
    primary: "#4B2E83",
    secondary: "#B7A57A",
  },
  { domain: "wsu.edu", name: "Washington State", short: "WSU", primary: "#981E32", secondary: "#5E6A71" },
  {
    domain: "seattleu.edu",
    name: "Seattle University",
    short: "SU",
    primary: "#AA0000",
    secondary: "#000000",
  },
  { domain: "stanford.edu", name: "Stanford", short: "Stanford", primary: "#8C1515", secondary: "#FFFFFF" },
  {
    domain: "berkeley.edu",
    name: "UC Berkeley",
    short: "Berkeley",
    primary: "#002676",
    secondary: "#FDB515",
  },
];

// Token values (styles/tokens.css) for the default woodland theme and contrast checks.
const BARK = "#6B4226";
const GOLD = "#D9B56D";
const CREAM = "#FFF8EC";

export interface UniversityTheme {
  name: string | null;
  short: string | null;
  /** Buttons, accent borders, selected states, focus rings. */
  primary: string;
  /** Text/icons drawn on `primary`. */
  onPrimary: string;
  /** Small decorative details only. */
  secondary: string;
  accentBg?: string;
  logoUrl?: string;
  isDefault: boolean;
}

export const DEFAULT_THEME: UniversityTheme = {
  name: null,
  short: null,
  primary: BARK,
  onPrimary: CREAM,
  secondary: GOLD,
  isDefault: true,
};

/** Lowercased domain part of an email, or null. */
export function emailDomain(email: string): string | null {
  const at = email.trim().toLowerCase().lastIndexOf("@");
  if (at < 1) return null;
  const domain = email
    .trim()
    .toLowerCase()
    .slice(at + 1);
  return domain.includes(".") ? domain : null;
}

export const isEduEmail = (email: string) => /^[^\s@]+@([a-z0-9-]+\.)+edu$/i.test(email.trim());

/** True when `domain` is the school's domain or one of its subdomains (cs.uw.edu → uw.edu). */
export const domainMatches = (domain: string, schoolDomain: string) =>
  domain === schoolDomain || domain.endsWith(`.${schoolDomain}`);

/** The known school whose domain an email belongs to, if any. */
export function schoolForEmail(email: string, schools: School[] = SEED_SCHOOLS): School | undefined {
  const domain = emailDomain(email);
  return domain ? schools.find((s) => domainMatches(domain, s.domain)) : undefined;
}

/**
 * Theme for a school domain (SPEC §9.6). Unknown schools, or colours that can't carry readable
 * button text, fall back to the default woodland theme — never guessed.
 */
export function getUniversityTheme(
  domain: string | null | undefined,
  schools: School[] = SEED_SCHOOLS,
): UniversityTheme {
  const school = domain ? schools.find((s) => domainMatches(domain, s.domain)) : undefined;
  if (!school || !isHex(school.primary) || !isHex(school.secondary)) return DEFAULT_THEME;

  // The primary is used both as a fill under cream text and as text on cream cards, so it must
  // read against cream either way.
  if (contrast(school.primary, CREAM) < 4.5) return DEFAULT_THEME;

  return {
    name: school.name,
    short: school.short,
    primary: school.primary,
    onPrimary: CREAM,
    secondary: school.secondary,
    accentBg: school.accentBg,
    logoUrl: school.logoUrl,
    isDefault: false,
  };
}

/** CSS custom properties that re-theme everything inside the element they're applied to. */
export function themeStyle(theme: UniversityTheme): Record<string, string> {
  return {
    "--accent": theme.primary,
    "--on-accent": theme.onPrimary,
    "--accent-2": theme.secondary,
  };
}
