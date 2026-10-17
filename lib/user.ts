import { ObjectId } from "mongodb";
import { getSession } from "@/lib/auth";
import { toAvatar } from "@/lib/avatar-schema";
import { collections, type UserDoc } from "@/lib/collections";

/** The signed-in user's record, with the avatar normalised; null when signed out or missing. */
export async function getCurrentUser(): Promise<(UserDoc & { avatar: ReturnType<typeof toAvatar> }) | null> {
  const session = await getSession();
  if (!session || !ObjectId.isValid(session.userId)) return null;
  const { users } = await collections();
  const user = await users.findOne({ _id: new ObjectId(session.userId) });
  return user ? { ...user, avatar: toAvatar(user.avatar) } : null;
}

/** First name for friendly copy ("Hi, Maya"). */
export const firstName = (user: Pick<UserDoc, "name" | "email">) =>
  user.name.trim().split(/\s+/)[0] || user.email.split("@")[0];
