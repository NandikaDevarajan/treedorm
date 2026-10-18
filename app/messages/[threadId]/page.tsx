import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/app/AppHeader";
import { ChatThread } from "@/components/chat/ChatThread";
import { LeafyBackground } from "@/components/woodland/LeafyBackground";
import { getSession } from "@/lib/auth";
import { collections } from "@/lib/collections";
import { serializeMessage, threadForUser, threadPeople } from "@/lib/threads";

export const metadata: Metadata = { title: "Chat · Tree Dorm" };

/** A private buyer–seller chat (SPEC §4). Only its two participants can open it. */
export default async function ThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const thread = await threadForUser((await params).threadId, session.userId);
  if (!thread) notFound(); // also for chats that aren't yours
  const people = await threadPeople(thread);
  const isBuyer = thread.buyerId.toHexString() === session.userId;
  const { messages } = await collections();
  const initial = (
    await messages.find({ threadId: thread._id }).sort({ createdAt: 1 }).limit(200).toArray()
  ).map(serializeMessage);

  return (
    <LeafyBackground tone="almond">
      <AppHeader />
      <ChatThread
        threadId={thread._id.toHexString()}
        me={isBuyer ? people.buyer : people.seller}
        other={isBuyer ? people.seller : people.buyer}
        listingTitle={people.listingTitle}
        orderId={people.orderId}
        initial={initial}
      />
    </LeafyBackground>
  );
}
