import { DEFAULT_AVATAR } from "@/lib/avatar";
/**
 * Seeds the database (SPEC §12). Idempotent: safe to re-run.
 *
 *   npm run seed
 *
 * SPEC-NOTE: Phase 2 seeds schools and the two demo accounts only. Shops, listings, orders and the
 * Berkeley demo data are added in Phase 5.
 */
import { rolesFor } from "@/lib/auth";
import { collections } from "@/lib/collections";
import { closeDb } from "@/lib/db";
import { DEMO_USERS } from "@/lib/demo";
import { SEED_SCHOOLS } from "@/lib/schools";
import { ObjectId } from "mongodb";

async function main() {
  const { schools, users } = await collections();

  for (const school of SEED_SCHOOLS) {
    await schools.updateOne({ domain: school.domain }, { $set: school }, { upsert: true });
  }
  console.log(`✓ ${SEED_SCHOOLS.length} schools`);

  for (const demo of Object.values(DEMO_USERS)) {
    await users.updateOne(
      { email: demo.email },
      {
        $set: {
          name: demo.name,
          accountType: demo.accountType,
          roles: rolesFor(demo.accountType),
          schoolDomain: "uw.edu",
        },
        $setOnInsert: {
          _id: new ObjectId(),
          email: demo.email,
          avatar: DEFAULT_AVATAR,
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );
  }
  console.log(
    `✓ demo users: ${Object.values(DEMO_USERS)
      .map((d) => d.email)
      .join(", ")}`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(closeDb);
