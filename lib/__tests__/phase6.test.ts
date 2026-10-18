// @vitest-environment node
import { describe, expect, it } from "vitest";
import { cosine, embeddingKey, listingEmbeddingText, normalize } from "@/lib/ai/embeddings";
import { searchBody } from "@/lib/validators";

describe("embeddings maths", () => {
  it("normalises to unit length and scores identical vectors as 1", () => {
    const v = normalize([3, 4]);
    expect(Math.hypot(...v)).toBeCloseTo(1);
    expect(cosine(v, v)).toBeCloseTo(1);
    expect(cosine(normalize([1, 0]), normalize([0, 1]))).toBeCloseTo(0);
  });

  it("re-embeds only when the listing text changes", () => {
    const shop = { name: "Fade Lab", category: "beauty" as const, tags: ["barber"] };
    const a = listingEmbeddingText({ title: "Skin fade", description: "40 minutes", tags: ["fade"] }, shop);
    const b = listingEmbeddingText({ title: "Skin fade", description: "45 minutes", tags: ["fade"] }, shop);
    expect(embeddingKey(a)).toBe(embeddingKey(a));
    expect(embeddingKey(a)).not.toBe(embeddingKey(b));
    expect(a).toContain("Shop: Fade Lab (Beauty)");
  });
});

describe("Ask Tree Dorm request (SPEC §8.3)", () => {
  const user = (text: string) => ({ role: "user" as const, text });
  it("keeps at most the last 6 turns and needs the student to speak last", () => {
    expect(searchBody.safeParse({ messages: [user("grad photos")] }).success).toBe(true);
    expect(searchBody.safeParse({ messages: Array(7).fill(user("hi")) }).success).toBe(false);
    expect(
      searchBody.safeParse({ messages: [user("hi"), { role: "assistant", text: "What do you need?" }] })
        .success,
    ).toBe(false);
    expect(searchBody.safeParse({ messages: [] }).success).toBe(false);
  });
});
