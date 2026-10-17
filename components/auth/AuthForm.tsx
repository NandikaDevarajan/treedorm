"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { UniversityPicker } from "@/components/woodland/UniversityPicker";
import { WoodButton } from "@/components/woodland/WoodButton";
import { safeNext } from "@/lib/redirect";
import {
  domainMatches,
  emailDomain,
  getUniversityTheme,
  isEduEmail,
  schoolForEmail,
  themeStyle,
  type School,
} from "@/lib/schools";

type Mode = "signup" | "login";

interface Props {
  mode: Mode;
  schools: School[];
  next?: string;
  intent?: "business";
  demoLogin: boolean;
}

const REMEMBERED_SCHOOL = "td_school";

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error?.message ?? "Something went wrong. Try again.");
  return json as T;
}

/**
 * Email → 6-digit code sign-in, shared by /signup and /login (SPEC §9.6). The chosen school
 * re-themes the whole form through the accent CSS variables.
 */
export function AuthForm({ mode, schools, next, intent, demoLogin }: Props) {
  const router = useRouter();
  const [school, setSchool] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [devCode, setDevCode] = useState<{ code: string; reason: string } | null>(null);
  const [resendIn, setResendIn] = useState(0);

  // Per-device convenience: re-theme to the last school used here. Storage can be unavailable.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBERED_SCHOOL);
      if (saved && schools.some((s) => s.domain === saved)) setSchool(saved);
    } catch {}
  }, [schools]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  // Theme follows the picked school, or the school the typed email belongs to.
  const themeSchool = school ?? schoolForEmail(email, schools)?.domain ?? null;
  const theme = getUniversityTheme(themeSchool, schools);

  const onEmailChange = (value: string) => {
    setEmail(value);
    setError(null);
    // Typing an email first pre-selects its school (SPEC §9.6).
    const match = schoolForEmail(value, schools);
    if (match && !school) setSchool(match.domain);
  };

  const sendCode = async (e?: FormEvent) => {
    e?.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!isEduEmail(normalized)) return setError("Use your school's .edu email address.");
    if (school && !domainMatches(emailDomain(normalized)!, school)) {
      return setError(
        `That email isn't a ${school} address. Use your ${theme.short ?? "school"} email or change university.`,
      );
    }
    setBusy(true);
    setError(null);
    try {
      const res = await post<{ devCode?: string; devReason?: string }>("/api/auth/start", {
        email: normalized,
        schoolDomain: school ?? undefined,
      });
      setDevCode(res.devCode ? { code: res.devCode, reason: res.devReason ?? "Dev only" } : null);
      setStep("code");
      setCode("");
      setResendIn(30);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const finish = (serverNext: string) => {
    try {
      if (themeSchool) localStorage.setItem(REMEMBERED_SCHOOL, themeSchool);
    } catch {}
    // Honour ?next= only for users who are fully set up; new users go to account type first.
    let dest = serverNext === "/market" ? (safeNext(next) ?? serverNext) : serverNext;
    if (dest === "/onboarding/account-type" && intent === "business") dest += "?intent=business";
    router.replace(dest);
    router.refresh();
  };

  const verify = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code.trim())) return setError("Enter the 6-digit code.");
    setBusy(true);
    setError(null);
    try {
      const res = await post<{ next: string }>("/api/auth/verify", {
        email: email.trim().toLowerCase(),
        code: code.trim(),
      });
      finish(res.next);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  const demo = async (as: "buyer" | "seller") => {
    setBusy(true);
    setError(null);
    try {
      const res = await post<{ next: string }>("/api/auth/demo", { as });
      finish(res.next);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <div style={themeStyle(theme)} className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-5xl leading-[1.05] text-bark">
          {mode === "signup" ? "Climb into Tree Dorm" : "Welcome back"}
        </h1>
        <p className="text-walnut/85">
          {mode === "signup"
            ? "Students only. We'll email a one-time code to your .edu address."
            : "Enter your .edu email and we'll send you a code."}
        </p>
      </header>

      {step === "email" ? (
        <form onSubmit={sendCode} noValidate className="flex flex-col gap-4">
          <UniversityPicker
            schools={schools}
            value={school}
            onChange={(d) => {
              setSchool(d);
              setError(null);
            }}
            label={mode === "signup" ? "Your university" : "Your university (optional)"}
          />
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-semibold">
              School email
            </label>
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              required
              placeholder={school ? `you@${school}` : "you@school.edu"}
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              aria-invalid={!!error}
              aria-describedby={error ? "auth-error" : undefined}
              className="min-h-12 w-full rounded-2xl border-2 border-bark/30 bg-cream px-4 text-base text-walnut placeholder:text-walnut/55 focus:border-accent focus:outline-none aria-[invalid=true]:border-danger"
            />
          </div>
          {error && <ErrorText message={error} />}
          <WoodButton type="submit" size="lg" disabled={busy}>
            {busy ? "Sending…" : "Send my code"}
          </WoodButton>
        </form>
      ) : (
        <form onSubmit={verify} noValidate className="flex flex-col gap-4">
          <p>
            We sent a 6-digit code to <strong className="break-all">{email.trim().toLowerCase()}</strong>.
          </p>
          <div>
            <label htmlFor="code" className="mb-1.5 block text-sm font-semibold">
              6-digit code
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              autoFocus
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                setError(null);
              }}
              aria-invalid={!!error}
              aria-describedby={error ? "auth-error" : undefined}
              className="min-h-14 w-full rounded-2xl border-2 border-bark/30 bg-cream px-4 text-center text-2xl font-semibold tracking-[0.5em] tabular-nums text-walnut focus:border-accent focus:outline-none aria-[invalid=true]:border-danger"
            />
          </div>
          {error && <ErrorText message={error} />}
          <WoodButton type="submit" size="lg" disabled={busy || code.length !== 6}>
            {busy ? "Checking…" : mode === "signup" ? "Create my account" : "Log in"}
          </WoodButton>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <button
              type="button"
              onClick={() => sendCode()}
              disabled={busy || resendIn > 0}
              className="min-h-11 font-semibold text-accent underline underline-offset-2 disabled:text-walnut/50 disabled:no-underline"
            >
              {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setError(null);
                setDevCode(null);
              }}
              className="min-h-11 font-semibold text-walnut underline underline-offset-2"
            >
              Use a different email
            </button>
          </div>
        </form>
      )}

      <p className="text-center text-sm">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-accent underline underline-offset-2">
              Log in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link href="/signup" className="font-bold text-accent underline underline-offset-2">
              Create an account
            </Link>
          </>
        )}
      </p>

      {demoLogin && mode === "login" && (
        <div className="flex flex-col gap-2 rounded-2xl border-2 border-dashed border-bark/30 p-3">
          <div className="grid gap-2 sm:grid-cols-2" aria-label="Sign in as a demo account" role="group">
            <WoodButton variant="secondary" onClick={() => demo("buyer")} disabled={busy}>
              Demo buyer
            </WoodButton>
            <WoodButton variant="secondary" onClick={() => demo("seller")} disabled={busy}>
              Demo seller
            </WoodButton>
          </div>
          <p className="text-center text-xs text-walnut/75">Dev only: skips the email code.</p>
        </div>
      )}

      <p className="text-center text-xs text-walnut/70">
        {theme.name ? `Not affiliated with ${theme.name}. ` : ""}Tree Dorm is an independent student
        marketplace.
      </p>

      {devCode && step === "code" && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-sm items-center justify-between gap-3 rounded-2xl bg-walnut px-4 py-3 text-cream shadow-soft"
        >
          <span className="text-sm">
            <span className="block text-xs text-cream/75">Dev only · {devCode.reason}</span>
            Your code: <strong className="text-lg tracking-widest tabular-nums">{devCode.code}</strong>
          </span>
          <button
            type="button"
            onClick={() => setCode(devCode.code)}
            className="min-h-11 rounded-xl bg-cream px-3 text-sm font-bold text-walnut"
          >
            Fill in
          </button>
        </div>
      )}
    </div>
  );
}

function ErrorText({ message }: { message: string }) {
  return (
    <p id="auth-error" role="alert" className="flex items-start gap-2 text-sm font-semibold text-danger">
      <span aria-hidden>⚠</span>
      {message}
    </p>
  );
}
