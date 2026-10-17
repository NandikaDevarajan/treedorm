// @vitest-environment node
import { describe, expect, it } from "vitest";
import { contrast } from "@/lib/color";
import {
  DEFAULT_THEME,
  SEED_SCHOOLS,
  emailDomain,
  getUniversityTheme,
  isEduEmail,
  schoolForEmail,
  type School,
} from "@/lib/schools";

describe("isEduEmail", () => {
  it.each(["ana@uw.edu", "Ana.Lee@CS.UW.EDU", "x@seattleu.edu"])("accepts %s", (e) => {
    expect(isEduEmail(e)).toBe(true);
  });
  it.each(["ana@gmail.com", "ana@uw.edu.evil.com", "ana@edu", "@uw.edu", "ana@uw.education", "a b@uw.edu"])(
    "rejects %s",
    (e) => expect(isEduEmail(e)).toBe(false),
  );
});

describe("schoolForEmail", () => {
  it("matches the school domain and its subdomains", () => {
    expect(schoolForEmail("a@uw.edu")?.short).toBe("UW");
    expect(schoolForEmail("a@cs.uw.edu")?.short).toBe("UW");
    expect(emailDomain(" A@CS.UW.EDU ")).toBe("cs.uw.edu");
  });
  it("doesn't match look-alike domains", () => {
    expect(schoolForEmail("a@notuw.edu")).toBeUndefined();
    expect(schoolForEmail("a@uw.edu.co")).toBeUndefined();
  });
});

describe("getUniversityTheme", () => {
  it("gives UW purple and gold (SPEC §9.6)", () => {
    const t = getUniversityTheme("uw.edu");
    expect(t).toMatchObject({ short: "UW", primary: "#4B2E83", secondary: "#B7A57A", isDefault: false });
  });

  it("falls back to the woodland theme for unknown schools", () => {
    expect(getUniversityTheme("unknown.edu")).toBe(DEFAULT_THEME);
    expect(getUniversityTheme(null)).toBe(DEFAULT_THEME);
  });

  it("falls back rather than guessing when colours are unusable", () => {
    const pale: School = {
      domain: "pale.edu",
      name: "Pale U",
      short: "PU",
      primary: "#F5F5F5",
      secondary: "#FFFFFF",
    };
    const broken: School = {
      domain: "bad.edu",
      name: "Bad U",
      short: "BU",
      primary: "purple",
      secondary: "#000000",
    };
    expect(getUniversityTheme("pale.edu", [pale])).toBe(DEFAULT_THEME);
    expect(getUniversityTheme("bad.edu", [broken])).toBe(DEFAULT_THEME);
  });

  it.each(SEED_SCHOOLS.map((s) => [s.domain]))("%s keeps button text readable", (domain) => {
    const t = getUniversityTheme(domain);
    expect(t.isDefault).toBe(false);
    expect(contrast(t.primary, t.onPrimary)).toBeGreaterThanOrEqual(4.5);
  });
});
