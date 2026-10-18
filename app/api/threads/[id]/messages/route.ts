import { ObjectId } from "mongodb";
import { apiError, parseBody } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { collections } from "@/lib/collections";
import { HOUR, rateLimit } from "@/lib/rate-limit";
import { serializeMessage, threadForUser } from "@/lib/threads";
import { messageBody } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

/** Messages in a thread, optionally only those after `?after=<ISO>` (the client polls every 3s). */
export async function GET(req: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session) return apiError(401, "unauthenticated", "Sign in first.");
  const thread = await threadForUser((await params).id, session.userId);
  if (!thread) return apiError(404, "not_found", "Chat not found."); // same answer for "not yours"
  const after = new URL(req.url).searchParams.get("after");
  const afterDate = after && !Number.isNaN(Date.parse(after)) ? new Date(after) : null;
  const { messages } = await collections();
  const rows = await messages
    .find({ threadId: thread._id, ...(afterDate ? { createdAt: { $gt: afterDate } } : {}) })
    .sort({ createdAt: 1 })
    .limit(200)
    .toArray();
  return Response.json({ messages: rows.map(serializeMessage) });
}

/** Send a message. Room numbers and exact meeting spots belong here (SPEC §11). */
export async function POST(req: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session) return apiError(401, "unauthenticated", "Sign in first.");
  const thread = await threadForUser((await params).id, session.userId);
  if (!thread) return apiError(404, "not_found", "Chat not found.");
  const parsed = await parseBody(req, messageBody);
  if ("response" in parsed) return parsed.response;
  if (!(await rateLimit(`msg:${session.userId}`, 120, HOUR))) {
    return apiError(429, "rate_limited", "You're sending a lot of messages. Take a short break.");
  }
  const { messages, threads } = await collections();
  const doc = {
    _id: new ObjectId(),
    threadId: thread._id,
    senderId: new ObjectId(session.userId),
    body: parsed.data.body,
    createdAt: new Date(),
  };
  await messages.insertOne(doc);
  await threads.updateOne(
    { _id: thread._id },
    { $set: { lastMessageAt: doc.createdAt, lastMessage: doc.body.slice(0, 140) } },
  );
  return Response.json({ message: serializeMessage(doc) });
}
