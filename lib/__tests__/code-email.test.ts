// @vitest-environment node
import { describe, expect, it } from "vitest";
import { codeEmail, HEDGEHOG_CID } from "@/lib/email/code-email";
import { mix } from "@/lib/color";

describe("sign-in email", () => {
  const email = codeEmail("042517");

  it("uses the agreed subject", () => expect(email.subject).toBe("Your Tree Dorm code"));

  it("shows the code, the inline hedgehog and the cream card", () => {
    // The code is one unbroken run so it copies cleanly and never wraps.
    expect(email.html).toContain(">042517<");
    expect(email.html).toContain("white-space:nowrap");
    expect(email.html).toContain(`cid:${HEDGEHOG_CID}`);
    expect(email.html.toLowerCase()).toContain("#fff8ec");
  });

  it("has a plain-text version with the code", () => expect(email.text).toContain("042517"));

  it("doesn't imply a university runs Tree Dorm", () => expect(email.text).toMatch(/not affiliated/i));
});

describe("mix", () => {
  it("blends two colours", () => {
    expect(mix("#000000", "#ffffff", 0.5)).toBe("#808080");
    expect(mix("#6b4226", "#fff8ec", 0)).toBe("#fff8ec");
  });
});
