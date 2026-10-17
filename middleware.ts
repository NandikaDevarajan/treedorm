import { NextResponse, type NextRequest } from "next/server";
import { homeFor, SESSION_COOKIE, verifySession } from "@/lib/session";

/** Pages anyone can see. Everything else needs a session. */
const PUBLIC_PAGES = ["/", "/about", "/trust"];
/** Sign-in pages: signed-in users are sent on to where they belong. */
const AUTH_PAGES = ["/login", "/signup"];
/** API routes that don't need a session (SPEC §7: /api/auth/*). */
const PUBLIC_API = ["/api/auth/"];

const matches = (path: string, prefixes: string[]) =>
  prefixes.some((p) => path === p || (p.endsWith("/") ? path.startsWith(p) : path.startsWith(`${p}/`)));

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);

  if (pathname.startsWith("/api/")) {
    if (session || matches(pathname, PUBLIC_API)) return NextResponse.next();
    return NextResponse.json(
      { error: { code: "unauthenticated", message: "Sign in first." } },
      { status: 401 },
    );
  }

  if (matches(pathname, AUTH_PAGES)) {
    return session ? NextResponse.redirect(new URL(homeFor(session), req.url)) : NextResponse.next();
  }

  if (PUBLIC_PAGES.includes(pathname) || pathname.startsWith("/dev/")) return NextResponse.next();

  if (!session) {
    const login = new URL("/login", req.url);
    login.searchParams.set("next", pathname + search);
    return NextResponse.redirect(login);
  }

  // New accounts pick Personal or Business before anything else.
  if (!session.accountType && !pathname.startsWith("/onboarding/account-type")) {
    return NextResponse.redirect(new URL("/onboarding/account-type", req.url));
  }

  return NextResponse.next();
}

export const config = {
  // Skip Next internals and static files (anything with an extension: images, manifest, icons).
  matcher: ["/((?!_next/|.*\\.[a-z0-9]+$).*)"],
};
