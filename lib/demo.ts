import type { AccountType } from "@/lib/collections";

/** Demo accounts for the dev-only login shortcut (SPEC §12). scripts/seed.ts fills in their data. */
export const DEMO_USERS = {
  buyer: { email: "demo.buyer@uw.edu", name: "Maya (demo buyer)", accountType: "personal" as AccountType },
  seller: {
    email: "demo.seller@uw.edu",
    name: "Jordan (demo seller)",
    accountType: "business" as AccountType,
  },
} as const;

export const demoLoginEnabled = () => process.env.NODE_ENV !== "production";
