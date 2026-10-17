// @vitest-environment node
import { describe, expect, it } from "vitest";
import { avatarSchema, DEFAULT_AVATAR } from "@/lib/avatar";

describe("avatar (SPEC §9.9)", () => {
  it("defaults to the plain hedgehog", () => {
    expect(avatarSchema.parse(DEFAULT_AVATAR)).toEqual({ base: "hedgehog", hat: null, sunglasses: null });
  });

  it("accepts hats and sunglasses from the asset set", () => {
    expect(
      avatarSchema.safeParse({ base: "hedgehog", hat: "wizard", sunglasses: "sunglasses-03" }).success,
    ).toBe(true);
  });

  it.each(["fox-soft", "rabbit-soft", "fantasy-hedgehog", "bear"])(
    "never allows %s as the avatar",
    (base) => {
      expect(avatarSchema.safeParse({ base, hat: null, sunglasses: null }).success).toBe(false);
    },
  );

  it("rejects unknown accessories", () => {
    expect(avatarSchema.safeParse({ base: "hedgehog", hat: "crown", sunglasses: null }).success).toBe(false);
  });
});
