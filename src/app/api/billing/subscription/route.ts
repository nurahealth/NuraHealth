import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getUserSubscription } from "@/lib/subscriptions";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";

interface CardInfo {
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
}

function cardFromPaymentMethod(pm: Stripe.PaymentMethod | null | undefined): CardInfo | null {
  if (!pm || !pm.card) return null;
  return {
    brand: pm.card.brand,
    last4: pm.card.last4,
    exp_month: pm.card.exp_month,
    exp_year: pm.card.exp_year,
  };
}

async function resolvePaymentMethod(
  stripeSub: Stripe.Subscription | null,
  customerId: string | null
): Promise<CardInfo | null> {
  // 1. Subscription's default_payment_method (already expanded on the sub)
  if (stripeSub) {
    const pm = stripeSub.default_payment_method;
    if (pm && typeof pm !== "string") {
      const card = cardFromPaymentMethod(pm);
      if (card) return card;
    }
  }

  if (!customerId) return null;

  // 2. Customer's invoice_settings.default_payment_method
  try {
    const customer = await stripe.customers.retrieve(customerId, {
      expand: ["invoice_settings.default_payment_method"],
    });
    if (!customer.deleted) {
      const pm = (customer as Stripe.Customer).invoice_settings?.default_payment_method;
      if (pm && typeof pm !== "string") {
        const card = cardFromPaymentMethod(pm);
        if (card) return card;
      }
    }
  } catch (err) {
    console.error("[billing/subscription] customer retrieve failed:", err);
  }

  // 3. Most recent card on the customer
  try {
    const list = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
      limit: 1,
    });
    const pm = list.data[0];
    if (pm) {
      const card = cardFromPaymentMethod(pm);
      if (card) return card;
    }
  } catch (err) {
    console.error("[billing/subscription] paymentMethods.list failed:", err);
  }

  return null;
}

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sub = await getUserSubscription(user.id);
    if (!sub || !sub.stripe_subscription_id) {
      return NextResponse.json({ subscription: null });
    }

    let stripeSub: Stripe.Subscription | null = null;
    try {
      stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id, {
        expand: ["default_payment_method"],
      });
    } catch (err) {
      console.error("[billing/subscription] stripe retrieve failed:", err);
    }

    const paymentMethod = await resolvePaymentMethod(stripeSub, sub.stripe_customer_id);

    let cancelAt: string | null = null;
    let trialEnd: string | null = null;

    if (stripeSub) {
      if (stripeSub.cancel_at_period_end && stripeSub.cancel_at) {
        cancelAt = new Date(stripeSub.cancel_at * 1000).toISOString();
      }
      if (stripeSub.status === "trialing" && stripeSub.trial_end) {
        trialEnd = new Date(stripeSub.trial_end * 1000).toISOString();
      }
    }

    return NextResponse.json({
      subscription: {
        id: sub.id,
        user_id: sub.user_id,
        stripe_customer_id: sub.stripe_customer_id,
        stripe_subscription_id: sub.stripe_subscription_id,
        status: sub.status,
        plan: sub.plan,
        current_period_start: sub.current_period_start,
        current_period_end: sub.current_period_end,
        cancel_at_period_end: sub.cancel_at_period_end,
        created_at: sub.created_at,
        updated_at: sub.updated_at,
        cancel_at: cancelAt,
        trial_end: trialEnd,
      },
      paymentMethod,
      trial: trialEnd ? { trial_end: trialEnd } : null,
    });
  } catch (err) {
    console.error("[billing/subscription] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}
