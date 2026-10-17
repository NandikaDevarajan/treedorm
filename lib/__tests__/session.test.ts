// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { homeFor, signSession, verifySession, type Session } from "@/lib/session";
import { safeNext } from "@/lib/redirect";

const session: Session = {
  userId: "65f000000000000000000001",
  email: "ana@uw.edu",
  schoolDomain: "uw.edu",
  accountType: null,
  roles: ["buyer"],
};

describe("session tokens", () => {
  beforeEach(() => vi.stubEnv("SESSION_SECRET", "x".repeat(40)));

  it("round-trips", async () => {
    expect(await verifySession(await signSession(session))).toEqual(session);
  });

  it("rejects tampered tokens and tokens signed with another secret", async () => {
    const token = await signSession(session);
    expect(await verifySession(token.slice(0, -2) + "xx")).toBeNull();
    vi.stubEnv("SESSION_SECRET", "y".repeat(40));
    expect(await verifySession(token)).toBeNull();
  });

  it("rejects a missing token", async () => {
    expect(await verifySession(undefined)).toBeNull();
  });

  it("refuses to sign with a short secret", async () => {
    vi.stubEnv("SESSION_SECRET", "short");
    await expect(signSession(session)).rejects.toThrow(/SESSION_SECRET/);
  });

  it("routes new accounts to the account-type step", () => {
    expect(homeFor({ accountType: null })).toBe("/onboarding/account-type");
    expect(homeFor({ accountType: "business" })).toBe("/market");
  });
});

describe("safeNext", () => {
  it("keeps same-site paths", () => expect(safeNext("/orders/1?x=1")).toBe("/orders/1?x=1"));
  it.each(["https://evil.com", "//evil.com", "/\\evil.com", "", null, undefined])("drops %s", (v) =>
    expect(safeNext(v)).toBeNull(),
  );
});
