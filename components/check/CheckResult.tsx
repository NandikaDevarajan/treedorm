import { cn } from "@/lib/cn";

/** The Photo check's verdict and its plain-language reasons (SPEC §11: always show why). */
export function CheckResult({
  check,
}: {
  check: { verdict: "pass" | "mismatch" | "unsure"; confidence: number; reasons: string[] };
}) {
  const title =
    check.verdict === "pass"
      ? "Photo check: looks like a match"
      : check.verdict === "mismatch"
        ? "Photo check: doesn't match"
        : "Photo check: not sure";
  return (
    <section
      aria-labelledby="check-title"
      className={cn(
        "flex flex-col gap-2 rounded-card border-2 bg-cream p-5 shadow-soft",
        check.verdict === "mismatch" ? "border-danger/40" : "border-gold",
      )}
    >
      <h2 id="check-title" className="font-display text-3xl text-bark">
        {title}
      </h2>
      <ul className="flex flex-col gap-1.5">
        {check.reasons.map((r, i) => (
          <li key={i} className="leading-snug">
            {r}
          </li>
        ))}
      </ul>
      <p className="text-sm text-walnut/75">How sure the check is: {Math.round(check.confidence * 100)}%</p>
    </section>
  );
}
