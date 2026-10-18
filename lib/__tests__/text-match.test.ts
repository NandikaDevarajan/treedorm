// @vitest-environment node
import { describe, expect, it } from "vitest";
import { editDistance, textMatches } from "@/lib/text-match";

describe("custom text match (SPEC §8.4)", () => {
  it.each([
    ["Happy Birthday Maya", "HAPPY BIRTHDAY MAYA"],
    ["Happy Birthday Maya", "Happy Birthday, Maya!"],
    ["Happy Birthday Maya", "Happy Birthdy Maya"], // 1 typo
    ["Happy Birthday Maya", "Hapy Birthdy Maya"], // 2 typos
    ["Happy Birthday Maya", "Sweet Dorm Bakes · Happy Birthday Maya"], // extra words around it
    ["Happy Birthday Maya", "HappyBirthday Maya"], // words run together
    ["Happy 20th Lena", "happy 20th lena"],
    ["Happy 20th Lena", "Happy 20th Lana"], // short word, 1 edit allowed
  ])("matches %s ~ %s", (want, got) => expect(textMatches(want, got)).toBe(true));

  it.each([
    ["Happy Birthday Maya", "Happy Birthday Mia"], // a different name, not a typo
    ["Happy Birthday Maya", "Happy Anniversary"],
    ["Happy Birthday Maya", "Hapy Brthdy Maya"], // 3 typos
    ["Happy Birthday Maya", ""],
    ["Happy Birthday Maya", undefined],
  ])("rejects %s vs %s", (want, got) => expect(textMatches(want, got as string)).toBe(false));

  it("counts edits", () => {
    expect(editDistance("kitten", "sitting")).toBe(3);
    expect(editDistance("abc", "abc")).toBe(0);
  });
});
