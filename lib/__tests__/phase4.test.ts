// @vitest-environment node
import { describe, expect, it } from "vitest";
import { formatAvailability, formatTime } from "@/lib/availability";
import { CATEGORY_IDS } from "@/lib/categories";
import { formatCents } from "@/lib/money";
import { looksLikeRoomNumber } from "@/lib/privacy";
import { slugify } from "@/lib/slug";
import { getVariant, TREEHOUSE_VARIANTS } from "@/lib/treehouse-variants";
import { listingUpdateBody, shopSurveySchema } from "@/lib/validators";
import { existsSync } from "node:fs";
import path from "node:path";

describe("room numbers stay private (SPEC §11)", () => {
  it.each(["McMahon Hall", "the IMA", "Lander lounge, 4th floor", "Building B", "North Campus"])(
    "allows %s",
    (a) => expect(looksLikeRoomNumber(a)).toBe(false),
  );
  it.each(["Room 312", "rm 4B", "McMahon #210", "Apt 3", "Unit 12", "Terry 1204", "suite 5"])(
    "rejects %s",
    (a) => expect(looksLikeRoomNumber(a)).toBe(true),
  );
});

const survey = {
  name: "Golden Hour Grads",
  category: "photography",
  offer: "Grad photos around campus, edited within a week.",
  priceMin: 40,
  priceMax: 80,
  area: "Suzzallo steps",
  availability: [{ day: 6, start: "16:00", end: "19:00" }],
};

describe("business survey", () => {
  it("accepts a normal survey", () => expect(shopSurveySchema.safeParse(survey).success).toBe(true));
  it("rejects a room number in the area", () =>
    expect(shopSurveySchema.safeParse({ ...survey, area: "McMahon 512" }).success).toBe(false));
  it("rejects a backwards price range or time window", () => {
    expect(shopSurveySchema.safeParse({ ...survey, priceMin: 90 }).success).toBe(false);
    expect(
      shopSurveySchema.safeParse({ ...survey, availability: [{ day: 1, start: "18:00", end: "09:00" }] })
        .success,
    ).toBe(false);
  });
  it("only allows the 8 categories", () =>
    expect(shopSurveySchema.safeParse({ ...survey, category: "weapons" }).success).toBe(false));
});

describe("listing publish", () => {
  const ok = {
    title: "Grad portraits",
    description: "30 minutes.",
    priceCents: 4000,
    tags: [],
    checkpoints: ["cap and gown"],
    customTextAllowed: false,
  };
  it("needs at least one checkpoint and $1", () => {
    expect(listingUpdateBody.safeParse(ok).success).toBe(true);
    expect(listingUpdateBody.safeParse({ ...ok, checkpoints: [] }).success).toBe(false);
    expect(listingUpdateBody.safeParse({ ...ok, priceCents: 50 }).success).toBe(false);
  });
});

describe("treehouse variants (SPEC §9.8)", () => {
  it("has one for every category, and Other is plain", () => {
    expect(Object.keys(TREEHOUSE_VARIANTS).sort()).toEqual([...CATEGORY_IDS].sort());
    expect(TREEHOUSE_VARIANTS.other.overlays).toEqual([]);
    for (const id of CATEGORY_IDS.filter((c) => c !== "other"))
      expect(TREEHOUSE_VARIANTS[id].overlays.length).toBeGreaterThan(0);
  });
  it("falls back to Other for unknown ids", () => expect(getVariant("spaceship").id).toBe("other"));
  it("points at decoration files that exist", () => {
    for (const v of Object.values(TREEHOUSE_VARIANTS))
      for (const o of v.overlays)
        expect(existsSync(path.join(process.cwd(), "public", o.src)), o.src).toBe(true);
  });
});

describe("formatting", () => {
  it("slugs names", () => {
    expect(slugify("Golden Hour Grads!")).toBe("golden-hour-grads");
    expect(slugify("Knot & Needle")).toBe("knot-and-needle");
    expect(slugify("☕☕")).toBe("treehouse");
  });
  it("formats money and times", () => {
    expect(formatCents(2500)).toBe("$25");
    expect(formatCents(2550)).toBe("$25.50");
    expect(formatTime("16:00")).toBe("4pm");
    expect(formatTime("09:30")).toBe("9:30am");
  });
  it("groups availability", () => {
    const slots = [1, 2, 3].map((day) => ({ day, start: "16:00", end: "20:00" })) as never;
    expect(formatAvailability(slots)).toBe("Mon–Wed 4pm–8pm");
    expect(formatAvailability([])).toBe("By arrangement");
  });
});
