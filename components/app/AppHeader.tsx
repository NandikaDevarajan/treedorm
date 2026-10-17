import Link from "next/link";
import { HedgehogAvatar } from "@/components/woodland/HedgehogAvatar";
import { getCurrentUser } from "@/lib/user";

/** Signed-in header: Tree Dorm home link and the user's hedgehog avatar, linking to their profile. */
export async function AppHeader() {
  const user = await getCurrentUser();
  return (
    <header className="relative z-20 border-b-2 border-bark/15 bg-cream/95 pt-safe">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-safe">
        <Link href="/market" className="text-xl font-extrabold tracking-tight text-bark">
          Tree Dorm
        </Link>
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
    </header>
  );
}
