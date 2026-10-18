import Stripe from "stripe";

let client: Stripe | undefined;

/** Server-only Stripe client (one instance; never the deprecated global key pattern). */
export function stripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set (see .env.example)");
  // Uses the API version pinned by the installed SDK.
  return (client ??= new Stripe(key, { appInfo: { name: "Tree Dorm" } }));
}
