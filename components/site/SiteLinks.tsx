import Link from "next/link";
import { cn } from "@/lib/cn";

/** "How Tree Dorm keeps you safe · About Tree Dorm" — the homepage footer and the profile page. */
export function SiteLinks({ className }: { className?: string }) {
  return (
    <nav
      aria-label="About Tree Dorm"
      className={cn("flex flex-wrap items-center gap-x-1 text-walnut/90", className)}
    >
      <Link
        href="/trust"
        className="min-h-11 content-center font-semibold text-bark underline underline-offset-4"
      >
        How we keep you safe
      </Link>
      <span aria-hidden> · </span>
      <Link
        href="/about"
        className="min-h-11 content-center font-semibold text-bark underline underline-offset-4"
      >
        About Tree Dorm
      </Link>
    </nav>
  );
}
