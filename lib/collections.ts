import type { Collection, ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { SEED_SCHOOLS, type School } from "@/lib/schools";

export type AccountType = "personal" | "business";
export type Role = "buyer" | "seller";

export interface UserDoc {
  _id: ObjectId;
  email: string;
  schoolDomain: string;
  name: string;
  // SPEC-NOTE: null until the account-type step (§9.7); the spec lists it as always set.
  accountType: AccountType | null;
  roles: Role[];
  shopId?: ObjectId;
  avatar: { base: "hedgehog"; hat: string | null; sunglasses: string | null };
  lookingFor?: string;
  createdAt: Date;
}

export interface OtpDoc {
  email: string;
  codeHash: string;
  attempts: number;
  expiresAt: Date;
}

export interface RateLimitDoc {
  key: string;
  count: number;
  expiresAt: Date;
}

export type SchoolDoc = School;

let indexes: Promise<unknown> | undefined;

/** Creates the indexes auth depends on, once per server instance. Safe to call repeatedly. */
export function ensureIndexes(): Promise<unknown> {
  indexes ??= (async () => {
    const db = await getDb();
    await Promise.all([
      db.collection("users").createIndex({ email: 1 }, { unique: true }),
      db.collection("otp_codes").createIndex({ email: 1 }, { unique: true }),
      db.collection("otp_codes").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      db.collection("rate_limits").createIndex({ key: 1 }, { unique: true }),
      db.collection("rate_limits").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      db.collection("schools").createIndex({ domain: 1 }, { unique: true }),
    ]);
  })().catch((err) => {
    indexes = undefined;
    throw err;
  });
  return indexes;
}

export async function collections() {
  await ensureIndexes();
  const db = await getDb();
  return {
    users: db.collection<UserDoc>("users") as Collection<UserDoc>,
    otpCodes: db.collection<OtpDoc>("otp_codes"),
    rateLimits: db.collection<RateLimitDoc>("rate_limits"),
    schools: db.collection<SchoolDoc>("schools"),
  };
}

/** Supported schools from the database, falling back to the seed list before `npm run seed`. */
export async function listSchools(): Promise<School[]> {
  try {
    const { schools } = await collections();
    const rows = await schools
      .find({}, { projection: { _id: 0 } })
      .sort({ name: 1 })
      .toArray();
    return rows.length ? rows : SEED_SCHOOLS;
  } catch (err) {
    console.error("listSchools: falling back to seed list", err);
    return SEED_SCHOOLS;
  }
}
