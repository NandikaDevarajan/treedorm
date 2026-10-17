import { ObjectId } from "mongodb";
import { getSession } from "@/lib/auth";
import { collections } from "@/lib/collections";

/** The signed-in business user and their shop (if any). Null when signed out or not a business. */
export async function getSellerContext() {
  const session = await getSession();
  if (!session || !ObjectId.isValid(session.userId) || session.accountType !== "business") return null;
  const { shops } = await collections();
  const shop = await shops.findOne({ ownerId: new ObjectId(session.userId) });
  return { session, shop };
}

/**
 * Anyone signed in who has picked an account type can open a treehouse: business accounts during
 * onboarding, and Personal accounts switching to Business from their profile (they keep their
 * hedgehog and buyer features; saving the shop makes them a business). Null when signed out.
 */
export async function getOpenerContext() {
  const session = await getSession();
  if (!session || !ObjectId.isValid(session.userId) || !session.accountType) return null;
  const { shops } = await collections();
  const shop = await shops.findOne({ ownerId: new ObjectId(session.userId) });
  return { session, shop };
}
