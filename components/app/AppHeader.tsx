import Link from "next/link";
import { TabBar } from "@/components/app/TabBar";
import { HedgehogAvatar } from "@/components/woodland/HedgehogAvatar";
import { getCurrentUser } from "@/lib/user";

const NAV = [
  { href: "/market", label: "Village" },
  { href: "/ask", label: "Ask" },
  { href: "/orders", label: "Orders" },
  { href: "/messages", label: "Messages" },
];

/**
 * Signed-in header: Tree Dorm, the main links (desktop) and the user's hedgehog avatar → profile.
 * On phones the same links live in the bottom tab bar (SPEC §4), rendered here so every signed-in
 * page gets it.
 */
export async function AppHeader() {
  const user = await getCurrentUser();
  return (
    <header className="relative z-20 border-b-2 border-bark/15 bg-cream/95 pt-safe">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-safe">
        <Link href="/market" className="text-xl font-extrabold tracking-tight text-bark">
          Tree Dorm
        </Link>
        {user && (
          <nav aria-label="Main" className="hidden flex-1 items-center gap-1 md:flex">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="min-h-11 content-center rounded-full px-3 font-semibold text-walnut hover:bg-almond"
              >
                {n.label}
              </Link>
            ))}
          </nav>
        )}
        {user && (
          <div className="flex items-center gap-1">
            {user.accountType === "business" && (
              <Link
                href="/seller"
                className="min-h-11 content-center rounded-full px-3 font-semibold text-bark hover:bg-almond"
              >
                Your treehouse
              </Link>
            )}
            <Link
              href="/profile"
              aria-label="Your profile"
              className="flex min-h-11 items-center gap-2 rounded-full py-1 pr-1 pl-3 font-semibold text-walnut hover:bg-almond"
            >
              <span className="hidden sm:inline">{user.name || "Profile"}</span>
              <HedgehogAvatar
                avatar={user.avatar}
                variant="badge"
                className="size-11 ring-2 ring-bark/20"
                priority
              />
            </Link>
          </div>
        )}
      </div>
      {user && (
        <TabBar
          isSeller={user.accountType === "business"}
          className="fixed inset-x-0 bottom-0 z-40 md:hidden"
        />
      )}
    </header>
  );
}
