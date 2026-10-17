// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateCode, hashCode } from "@/lib/otp";

describe("otp codes", () => {
  beforeEach(() => vi.stubEnv("SESSION_SECRET", "x".repeat(40)));

  it("are always 6 digits", () => {
    for (let i = 0; i < 200; i++) expect(generateCode()).toMatch(/^\d{6}$/);
  });

  it("are stored as a keyed hash bound to the email", () => {
    const h = hashCode("ana@uw.edu", "123456");
    expect(h).not.toContain("123456");
    expect(h).toBe(hashCode("ana@uw.edu", "123456"));
    expect(h).not.toBe(hashCode("bo@uw.edu", "123456"));
    vi.stubEnv("SESSION_SECRET", "y".repeat(40));
    expect(hashCode("ana@uw.edu", "123456")).not.toBe(h);
  });
});
