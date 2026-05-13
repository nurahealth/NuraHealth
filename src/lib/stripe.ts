// SERVER-ONLY: do not import in client components
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

export const STRIPE_PRICE_ID_PRO = process.env.STRIPE_PRICE_ID_PRO!;
