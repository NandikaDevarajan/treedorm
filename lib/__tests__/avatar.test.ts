// @vitest-environment node
import { describe, expect, it } from "vitest";
import { DEFAULT_AVATAR } from "@/lib/avatar";
import { avatarSchema, toAvatar } from "@/lib/avatar-schema";

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

import { existsSync } from "node:fs";
import path from "node:path";
import { ACCESSORIES, HATS, SUNGLASSES } from "@/lib/avatar";

describe("accessory manifest (SPEC §9.9)", () => {
  it("has exactly one fit for every hat and pair of sunglasses", () => {
    expect(
      ACCESSORIES.filter((a) => a.type === "hat")
        .map((a) => a.id)
        .sort(),
    ).toEqual([...HATS].sort());
    expect(
      ACCESSORIES.filter((a) => a.type === "sunglasses")
        .map((a) => a.id)
        .sort(),
    ).toEqual([...SUNGLASSES].sort());
  });

  it("points at files that exist", () => {
    for (const a of ACCESSORIES)
      expect(existsSync(path.join(process.cwd(), "public", a.src)), a.src).toBe(true);
  });

  it("keeps sunglasses on the face and hats on the head", () => {
    for (const a of ACCESSORIES) {
      if (a.type === "sunglasses") {
        expect(a.y, a.id).toBeGreaterThan(40); // eye line is ~47–51% down
        expect(a.y, a.id).toBeLessThan(58);
      } else {
        expect(a.y, a.id).toBeLessThan(35); // above the eyes
      }
      expect(a.width, a.id).toBeGreaterThan(20);
      expect(Math.abs(a.rotate), a.id).toBeLessThan(30);
    }
  });

  it("falls back to the plain hedgehog for anything invalid", () => {
    expect(toAvatar(undefined)).toEqual({ base: "hedgehog", hat: null, sunglasses: null });
    expect(toAvatar({ base: "fox-soft", hat: "wizard", sunglasses: null }).base).toBe("hedgehog");
  });
});
