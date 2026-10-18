import { ObjectId } from "mongodb";
import { apiError } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { collections } from "@/lib/collections";

/** The signed-in user's chats, newest first (SPEC §7 GET /api/threads). */
export async function GET() {
  const session = await getSession();
  if (!session) return apiError(401, "unauthenticated", "Sign in first.");
  const uid = new ObjectId(session.userId);
  const { threads } = await collections();
  const rows = await threads
    .find({ $or: [{ buyerId: uid }, { sellerId: uid }] })
    .sort({ lastMessageAt: -1 })
    .limit(100)
    .toArray();
  return Response.json({
    threads: rows.map((t) => ({
      id: t._id.toHexString(),
      lastMessage: t.lastMessage ?? "",
      lastMessageAt: t.lastMessageAt.toISOString(),
    })),
  });
}
