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
