/**
 * All Gemini prompts (SPEC §8). Never include emails, people's names or room numbers — only shop and
 * listing content.
 */

const TONE =
  "Tone: friendly, student-to-student, plain words. No hype words (amazing, best, ultimate, premium, " +
  "world-class), no emojis in text fields, and never claim anything the seller didn't say.";

export const SHOP_BUILDER_SYSTEM = `You help a university student set up a small shop ("treehouse") on Tree Dorm, a campus marketplace.
From their survey, write:
- tagline: one short line, max 60 characters.
- bio: 1–3 sentences, max 300 characters, in the seller's voice ("I ..."). Mention what they offer and where (building/area only).
- tags: 3–6 short lowercase search tags.
- suggestedListings: 2–3 listing ideas with a title and a price in cents inside their price range.
- accentEmoji: one emoji that fits the shop.
${TONE}`;

export function shopBuilderPrompt(survey: {
  name: string;
  category: string;
  offer: string;
  priceMin: number;
  priceMax: number;
  area: string;
  availability: string;
  school: string;
}) {
  return [
    `Shop name: ${survey.name}`,
    `Category: ${survey.category}`,
    `What they offer: ${survey.offer}`,
    `Price range: $${survey.priceMin}–$${survey.priceMax}`,
    `Where: ${survey.area} at ${survey.school}`,
    `Availability: ${survey.availability}`,
  ].join("\n");
}

export const LISTING_WRITER_SYSTEM = `You help a student seller on Tree Dorm (a campus marketplace) write one listing from photos of their work.
Look at the photos and write:
- title: short and specific, max 60 characters.
- description: max 500 characters, what the buyer gets, based only on the photos and the seller's notes.
- suggestedPriceCents: a fair student price in cents, inside the shop's price range when one is given.
- tags: 3–6 short lowercase search tags.
- checkpoints: 3–5 things a buyer's photo of the finished result can clearly show, so it can be checked against the listing later — shape, colour, count, size, layout, or text. Each under 70 characters. No feelings or quality judgements ("tasty", "professional").
- customTextAllowed: true only if the work can include custom words, like cake writing, embroidery or a sign.
${TONE}`;

export function listingWriterPrompt(input: {
  category: string;
  shopName: string;
  priceMin?: number;
  priceMax?: number;
  notes?: string;
  photoCount: number;
}) {
  return [
    `Shop: ${input.shopName} (${input.category})`,
    input.priceMin != null && input.priceMax != null
      ? `Shop price range: $${input.priceMin}–$${input.priceMax}`
      : "",
    `Photos attached: ${input.photoCount}`,
    input.notes ? `Seller's notes: ${input.notes}` : "No seller notes.",
  ]
    .filter(Boolean)
    .join("\n");
}
