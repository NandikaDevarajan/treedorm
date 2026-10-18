"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type Appearance, type Stripe } from "@stripe/stripe-js";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { WoodButton } from "@/components/woodland/WoodButton";
import { TOKENS } from "@/lib/tokens";

let stripePromise: Promise<Stripe | null> | undefined;
const getStripe = (key: string) => (stripePromise ??= loadStripe(key));

// Payment Element in the woodland look (it renders in Stripe's iframe, so tokens are passed as values).
const appearance: Appearance = {
  theme: "stripe",
  variables: {
    colorPrimary: TOKENS.bark,
    colorBackground: TOKENS.cream,
    colorText: TOKENS.walnut,
    colorDanger: TOKENS.danger,
    fontFamily: "'National Park', system-ui, sans-serif",
    fontSizeBase: "16px",
    borderRadius: "14px",
    spacingUnit: "4px",
  },
  rules: {
    ".Input": { border: `2px solid ${TOKENS.carmel}66`, boxShadow: "none" },
    ".Input:focus": { borderColor: TOKENS.bark },
  },
};
const fonts = [
  { cssSrc: "https://fonts.googleapis.com/css2?family=National+Park:wght@400;600;700&display=swap" },
];

/** Stripe Payment Element (test mode). Confirming authorizes the card; nothing is captured here. */
export function CheckoutForm(props: {
  orderId: string;
  clientSecret: string;
  publishableKey: string;
  amountLabel: string;
}) {
  if (!props.publishableKey)
    return <p className="text-danger">Payments aren&apos;t set up (missing publishable key).</p>;
  return (
    <Elements
      stripe={getStripe(props.publishableKey)}
      options={{ clientSecret: props.clientSecret, appearance, fonts }}
    >
      <Form {...props} />
    </Elements>
  );
}

function Form({ orderId, amountLabel }: { orderId: string; amountLabel: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    setError(null);
    const { error: err, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/orders/${orderId}?held=1` },
      redirect: "if_required", // cards finish here; redirect-based methods come back to return_url
    });
    if (err) {
      setError(err.message ?? "Your card couldn't be held. Try another card.");
      setBusy(false);
      return;
    }
    if (paymentIntent && ["requires_capture", "processing", "succeeded"].includes(paymentIntent.status)) {
      router.push(`/orders/${orderId}?held=1`);
      router.refresh();
    } else {
      setError("Something didn't go through. Try again.");
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-4 rounded-card border border-bark/15 bg-cream p-5 shadow-soft"
    >
      <PaymentElement onReady={() => setReady(true)} options={{ layout: "tabs" }} />
      {!ready && <div aria-hidden className="h-40 animate-pulse rounded-2xl bg-almond" />}
      {error && (
        <p role="alert" className="text-sm font-semibold text-danger">
          {error}
        </p>
      )}
      <WoodButton type="submit" size="lg" disabled={!stripe || !ready || busy}>
        {busy ? "Holding…" : `Hold ${amountLabel}`}
      </WoodButton>
    </form>
  );
}
