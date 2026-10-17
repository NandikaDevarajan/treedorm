// @vitest-environment node
import { describe, expect, it } from "vitest";
import { avatarBody, personalSurveyBody } from "@/lib/validators";

describe("personal survey", () => {
  it("trims the name and defaults lookingFor", () => {
    expect(personalSurveyBody.parse({ name: "  Maya " })).toEqual({ name: "Maya", lookingFor: [] });
  });
  it("requires a name and known categories", () => {
    expect(personalSurveyBody.safeParse({ name: "   " }).success).toBe(false);
    expect(personalSurveyBody.safeParse({ name: "Maya", lookingFor: ["weapons"] }).success).toBe(false);
    expect(personalSurveyBody.safeParse({ name: "x".repeat(41) }).success).toBe(false);
  });
});

describe("avatar body", () => {
  it("only accepts the hedgehog", () => {
    expect(
      avatarBody.safeParse({ avatar: { base: "hedgehog", hat: "acorn-cap", sunglasses: null } }).success,
    ).toBe(true);
    expect(avatarBody.safeParse({ avatar: { base: "owl-soft", hat: null, sunglasses: null } }).success).toBe(
      false,
    );
  });
});
