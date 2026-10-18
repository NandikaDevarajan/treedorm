"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { MatchCard } from "@/components/ask/MatchCard";
import { Creature } from "@/components/woodland/Creature";
import { HedgehogAvatar } from "@/components/woodland/HedgehogAvatar";
import type { ChatTurn, Match } from "@/lib/ai/match-types";
import type { Avatar } from "@/lib/avatar";
import { cn } from "@/lib/cn";
import { CREATURE_FOR } from "@/lib/creatures";

type Message =
  | { role: "user"; text: string }
  | { role: "assistant"; text: string; matches: Match[]; clarify: boolean }
  | { role: "error"; text: string; retry: string };

const SUGGESTIONS = [
  "I need someone to take my grad photos Saturday",
  "A birthday cake that says Happy Birthday Maya by Friday",
  "Help with my Java homework this week",
  "A fresh haircut before an interview",
];

/** Turns sent to the server: the last 6 user/assistant messages (SPEC §8.3). */
const history = (messages: Message[]): ChatTurn[] =>
  messages
    .filter((m): m is Exclude<Message, { role: "error" }> => m.role !== "error")
    .map((m) => ({ role: m.role, text: m.text }))
    .slice(-6);

/**
 * Ask Tree Dorm (SPEC §8.3): describe what you need in plain words; the reply is up to 3 shops from
 * your school with a one-line reason each, or one clarifying question. Plain cream cards, no AI labels.
 */
export function AskChat({
  avatar,
  schoolShort,
  initialQuery,
}: {
  avatar: Avatar;
  schoolShort: string;
  initialQuery?: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const started = useRef(false);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  const send = async (raw: string, base: Message[] = messages) => {
    const ask = raw.trim().slice(0, 500);
    if (!ask || busy) return;
    const next: Message[] = [...base.filter((m) => m.role !== "error"), { role: "user", text: ask }];
    setMessages(next);
    setText("");
    setBusy(true);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history(next) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Something went wrong. Try again.");
      setMessages([
        ...next,
        { role: "assistant", text: json.reply, matches: json.matches, clarify: json.clarify },
      ]);
    } catch (err) {
      setMessages([...next, { role: "error", text: (err as Error).message, retry: ask }]);
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  // Arriving from the marketplace with ?q= asks straight away.
  useEffect(() => {
    if (initialQuery && !started.current) {
      started.current = true;
      void send(initialQuery, []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on arrival
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void send(text);
  };

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-safe pt-6 pb-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-5xl leading-none text-bark">Ask Tree Dorm</h1>
          <p className="text-walnut/85">
            Say what you need in your own words and we&apos;ll find treehouses at {schoolShort} that fit.
          </p>
        </div>

        {messages.length === 0 && !busy && (
          <div className="flex flex-col gap-3">
            <p className="font-semibold">Try one of these</p>
            <ul className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {SUGGESTIONS.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => send(s)}
                    className="min-h-11 w-full rounded-2xl border-2 border-bark/20 bg-cream px-4 py-2 text-left font-semibold text-walnut hover:border-bark/40 sm:w-auto"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <ol aria-live="polite" className="flex flex-col gap-4">
          {messages.map((m, i) => (
            <li key={i} className={cn("flex gap-2", m.role === "user" ? "justify-end" : "justify-start")}>
              {m.role === "user" ? (
                <>
                  <p className="max-w-[80%] rounded-3xl rounded-br-lg bg-accent px-4 py-2.5 text-on-accent">
                    {m.text}
                  </p>
                  <HedgehogAvatar avatar={avatar} variant="badge" className="size-9 shrink-0 self-end" />
                </>
              ) : m.role === "error" ? (
                <div
                  role="alert"
                  className="flex max-w-[90%] flex-col gap-2 rounded-3xl rounded-bl-lg border-2 border-danger/40 bg-cream px-4 py-3"
                >
                  <p className="font-semibold text-danger">{m.text}</p>
                  <button
                    type="button"
                    onClick={() => send(m.retry, messages.slice(0, i - 1))}
                    className="min-h-11 w-fit font-semibold text-bark underline underline-offset-4"
                  >
                    Try again
                  </button>
                </div>
              ) : (
                <div className="flex w-full flex-col gap-3">
                  <p className="w-fit max-w-[90%] rounded-3xl rounded-bl-lg bg-cream px-4 py-2.5 shadow-soft">
                    {m.text}
                  </p>
                  {m.matches.length > 0 && (
                    <ul className="flex flex-col gap-3" aria-label="Suggested treehouses">
                      {m.matches.map((match, j) => (
                        <li key={match.listing.id}>
                          <MatchCard match={match} rank={j + 1} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </li>
          ))}
          {busy && (
            <li role="status" className="flex items-center gap-2 text-walnut/85">
              <Creature name={CREATURE_FOR.loading} size={40} />
              <span className="font-semibold">Looking around the village…</span>
            </li>
          )}
        </ol>
        <div ref={endRef} />
      </div>

      <form
        onSubmit={submit}
        className="sticky bottom-0 border-t-2 border-bark/15 bg-cream/95 px-safe pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm"
      >
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <label htmlFor="ask-input" className="sr-only">
            What do you need?
          </label>
          <textarea
            id="ask-input"
            ref={inputRef}
            rows={1}
            maxLength={500}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(text);
              }
            }}
            enterKeyHint="send"
            placeholder="What do you need?"
            className="max-h-36 min-h-12 flex-1 resize-none rounded-3xl border-2 border-bark/25 bg-cream px-4 py-2.5 text-base text-walnut placeholder:text-walnut/55 focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            disabled={!text.trim() || busy}
            className="min-h-12 shrink-0 rounded-full bg-accent px-5 font-bold text-on-accent disabled:opacity-50"
          >
            Ask
          </button>
        </div>
      </form>
    </div>
  );
}
