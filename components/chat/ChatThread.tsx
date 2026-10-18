"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { HedgehogAvatar } from "@/components/woodland/HedgehogAvatar";
import type { Avatar } from "@/lib/avatar";
import { cn } from "@/lib/cn";

type Msg = { id: string; senderId: string | null; body: string; createdAt: string };
type Person = { id: string; name: string; avatar: Avatar };

const POLL_MS = 3000; // SPEC §7: the open thread polls every 3 seconds

const time = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

/** Chat bubbles with both hedgehogs, polling for new messages every 3s while open. */
export function ChatThread(props: {
  threadId: string;
  me: Person;
  other: Person;
  listingTitle?: string;
  orderId?: string;
  initial: Msg[];
}) {
  const { threadId, me, other } = props;
  const [msgs, setMsgs] = useState<Msg[]>(props.initial);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const lastAt = useRef(props.initial.at(-1)?.createdAt ?? "");

  const merge = useCallback((incoming: Msg[]) => {
    if (!incoming.length) return;
    setMsgs((cur) => {
      const ids = new Set(cur.map((m) => m.id));
      const next = [...cur, ...incoming.filter((m) => !ids.has(m.id))];
      lastAt.current = next.at(-1)?.createdAt ?? lastAt.current;
      return next;
    });
  }, []);

  useEffect(() => {
    let stopped = false;
    const poll = async () => {
      if (document.hidden) return; // don't poll in background tabs
      try {
        const qs = lastAt.current ? `?after=${encodeURIComponent(lastAt.current)}` : "";
        const res = await fetch(`/api/threads/${threadId}/messages${qs}`, { cache: "no-store" });
        if (res.ok && !stopped) merge((await res.json()).messages);
      } catch {
        /* try again next tick */
      }
    };
    const t = setInterval(poll, POLL_MS);
    return () => {
      stopped = true;
      clearInterval(t);
    };
  }, [threadId, merge]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [msgs.length]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/threads/${threadId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Couldn't send. Try again.");
      merge([json.message]);
      setText("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100dvh-4rem-var(--tabbar-h,0px))] flex-col">
      <div className="sticky top-0 z-10 border-b border-bark/10 bg-almond/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-safe py-3">
          <Link
            href="/messages"
            aria-label="All messages"
            className="grid size-11 place-items-center rounded-full text-xl text-bark hover:bg-cream"
          >
            <span aria-hidden>←</span>
          </Link>
          <HedgehogAvatar avatar={other.avatar} variant="badge" className="size-11" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-2xl leading-tight text-bark">{other.name}</h1>
            {props.listingTitle && <p className="truncate text-sm text-walnut/80">{props.listingTitle}</p>}
          </div>
          {props.orderId && (
            <Link
              href={`/orders/${props.orderId}`}
              className="min-h-11 shrink-0 content-center rounded-full border-2 border-bark/25 bg-cream px-3 text-sm font-bold text-bark"
            >
              Order
            </Link>
          )}
        </div>
      </div>

      <ol aria-live="polite" className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-3 px-safe py-4">
        {msgs.map((m) => {
          if (!m.senderId) {
            return (
              <li
                key={m.id}
                className="mx-auto max-w-[90%] rounded-2xl bg-cream/80 px-4 py-2 text-center text-sm text-walnut/85"
              >
                {m.body}
              </li>
            );
          }
          const mine = m.senderId === me.id;
          const who = mine ? me : other;
          return (
            <li key={m.id} className={cn("flex items-end gap-2", mine ? "flex-row-reverse" : "flex-row")}>
              <HedgehogAvatar
                avatar={who.avatar}
                variant="badge"
                label={who.name}
                className="size-8 shrink-0"
              />
              <div className={cn("flex max-w-[75%] flex-col gap-0.5", mine ? "items-end" : "items-start")}>
                <p
                  className={cn(
                    "rounded-3xl px-4 py-2.5 break-words whitespace-pre-wrap",
                    mine ? "rounded-br-lg bg-accent text-on-accent" : "rounded-bl-lg bg-cream shadow-soft",
                  )}
                >
                  {m.body}
                </p>
                <span className="px-1 text-xs text-walnut/65">{time(m.createdAt)}</span>
              </div>
            </li>
          );
        })}
        <div ref={endRef} />
      </ol>

      <form
        onSubmit={send}
        className="sticky bottom-[var(--tabbar-h,0px)] border-t-2 border-bark/15 bg-cream/95 px-safe pt-2 pb-3 backdrop-blur-sm md:pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        <p className="mx-auto mb-2 max-w-2xl text-xs text-walnut/75">
          Private between you and {other.name}. Share your room number or exact meeting spot here — never on
          your public page.
        </p>
        {error && (
          <p role="alert" className="mx-auto mb-2 max-w-2xl text-sm font-semibold text-danger">
            {error}
          </p>
        )}
        <div className="mx-auto flex max-w-2xl items-end gap-2">
          <label htmlFor="chat-input" className="sr-only">
            Message {other.name}
          </label>
          <textarea
            id="chat-input"
            rows={1}
            maxLength={1000}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(e as unknown as FormEvent);
              }
            }}
            enterKeyHint="send"
            placeholder="Write a message"
            className="max-h-36 min-h-12 flex-1 resize-none rounded-3xl border-2 border-bark/25 bg-cream px-4 py-2.5 text-base text-walnut placeholder:text-walnut/55 focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            disabled={!text.trim() || busy}
            className="min-h-12 shrink-0 rounded-full bg-accent px-5 font-bold text-on-accent disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
