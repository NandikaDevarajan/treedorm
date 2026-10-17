// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { contrast } from "@/lib/color";
import { TOKENS } from "@/lib/tokens";

// Reads the real token file so the test can't drift from what ships.
const css = readFileSync(path.join(process.cwd(), "styles/tokens.css"), "utf8");
const token = (name: string) => {
  const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, "i"));
  if (!match) throw new Error(`token --${name} not found`);
  return match[1];
};

describe("design tokens (SPEC §9.2)", () => {
  it("defines every colour from the spec", () => {
    expect(token("almond")).toMatch(/#eaddca/i);
    expect(token("carmel")).toMatch(/#c19a6b/i);
    expect(token("bark")).toMatch(/#6b4226/i);
    expect(token("walnut")).toMatch(/#3e2b20/i);
    expect(token("leaf")).toMatch(/#64764b/i);
    expect(token("sage")).toMatch(/#a8b58a/i);
    expect(token("cream")).toMatch(/#fff8ec/i);
    expect(token("gold")).toMatch(/#d9b56d/i);
  });

  it("lib/tokens.ts mirrors tokens.css exactly", () => {
    for (const [name, hex] of Object.entries(TOKENS))
      expect(token(name).toLowerCase()).toBe(hex.toLowerCase());
  });

  // Text/background pairs the components actually use must pass WCAG AA (4.5:1 for body text).
  it.each([
    ["walnut", "almond"],
    ["walnut", "cream"],
    ["walnut", "carmel"],
    ["bark", "cream"],
    ["bark", "almond"],
    ["cream", "bark"],
    ["cream", "leaf"],
  ])("%s text on %s meets AA", (fg, bg) => {
    expect(contrast(token(fg), token(bg))).toBeGreaterThanOrEqual(4.5);
  });
});
