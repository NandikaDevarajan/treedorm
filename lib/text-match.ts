/**
 * Custom-text matching for the photo check (SPEC §8.4): case-insensitive, ignores punctuation and
 * spacing differences, and allows up to 2 character edits (small typos or OCR slips).
 */
export const normalizeText = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Levenshtein distance, stopping early once it exceeds `max`. */
export function editDistance(a: string, b: string, max = Infinity): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      rowMin = Math.min(rowMin, cur[j]);
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

export const MAX_TEXT_EDITS = 2;

/** Short words (names like "Maya", "Lena") get 1 edit, so "Mia" doesn't pass for "Maya". */
const wordAllowance = (word: string) => (word.length <= 4 ? 1 : 2);

/** Word-by-word comparison of equal-length word lists within the per-word and total limits. */
function wordsMatch(want: string[], got: string[]): boolean {
  let total = 0;
  for (let i = 0; i < want.length; i++) {
    const allow = wordAllowance(want[i]);
    const d = editDistance(want[i], got[i], allow);
    if (d > allow) return false;
    total += d;
    if (total > MAX_TEXT_EDITS) return false;
  }
  return true;
}

/**
 * True when the expected words appear in the text read from the photo: case-insensitive, ignoring
 * punctuation, at most 2 small typos in total (and at most 1 in short words). The photo may contain
 * other words around it (e.g. a bakery stamp), so any run of words of the right length can match.
 */
export function textMatches(expected: string, ocrText: string | undefined | null): boolean {
  const want = normalizeText(expected).split(" ").filter(Boolean);
  const got = normalizeText(ocrText ?? "")
    .split(" ")
    .filter(Boolean);
  if (!want.length) return true;
  if (!got.length) return false;
  for (let i = 0; i + want.length <= got.length; i++) {
    if (wordsMatch(want, got.slice(i, i + want.length))) return true;
  }
  // Words run together or split differently ("HappyBirthday Maya"): compare without spaces, 1 edit max.
  const squashedWant = want.join("");
  const squashedGot = got.join("");
  if (squashedGot.includes(squashedWant)) return true;
  return editDistance(squashedWant, squashedGot, 1) <= 1;
}
