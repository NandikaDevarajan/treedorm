import type { VisionInput } from "@/lib/vision/types";

/**
 * Instructions shared by both checkers. The listing photos show what was promised; the last image is
 * the buyer's proof photo of what they received.
 */
export function visionPrompt(input: VisionInput): string {
  const lines = [
    `You check a student marketplace order. The first ${input.listingPhotoUrls.length} image(s) are the seller's listing photos${input.listingTitle ? ` for "${input.listingTitle}"` : ""}. The LAST image is the buyer's proof photo of what they actually received.`,
    "Decide whether the proof photo shows the same kind of result as the listing and meets each checkpoint below. Different angle, lighting, background or exact decoration is fine — judge the checkpoints, not pixel similarity.",
    "Checkpoints (things the proof photo should show):",
    ...(input.checkpoints.length
      ? input.checkpoints.map((c) => `- ${c}`)
      : ["- (none given: judge only that it is the same kind of result as the listing)"]),
  ];
  if (input.expectedText) {
    lines.push(
      `The buyer asked for this text on it: "${input.expectedText}". Read ALL text visible in the proof photo exactly as written and put it in ocrText (empty string if none).`,
    );
  } else {
    lines.push("Put any text visible in the proof photo in ocrText (empty string if none).");
  }
  lines.push(
    "verdict: pass = clearly the promised result and checkpoints are met; mismatch = clearly different or a checkpoint is clearly not met; unsure = blurry, cropped, too dark, or you can't tell.",
    "confidence: 0 to 1, how sure you are of the verdict.",
    `reasons: 2–5 short plain-language sentences for a student, one per checkpoint where possible, each ending with ✓ when met or ✗ when not, e.g. "Two round tiers ✓", "Expected pink frosting, photo shows white ✗"${input.expectedText ? `, "Cake text reads '…' ✓"` : ""}. No technical words.`,
  );
  return lines.join("\n");
}
