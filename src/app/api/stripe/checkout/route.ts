import { NextRequest, NextResponse } from "next/server";
import { stripe, STRIPE_PRICE_ID_PRO } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getUserSubscription, createOrUpdateSubscription } from "@/lib/subscriptions";
import type Stripe from "stripe";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json() as { userId?: string; skipTrial?: boolean };
    const { userId } = body;
    const skipTrial = body.skipTrial === true;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (authError || !authUser?.user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const email = authUser.user.email;

    const existing = await getUserSubscription(userId);
    let customerId = existing?.stripe_customer_id ?? null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: email ?? undefined,
        metadata: { supabase_user_id: userId },
      });
      customerId = customer.id;
      await createOrUpdateSubscription(userId, { stripe_customer_id: customerId });
    }

    const subscriptionParams: Stripe.SubscriptionCreateParams = {
      customer: customerId,
      items: [{ price: STRIPE_PRICE_ID_PRO }],
      trial_period_days: skipTrial ? 0 : 3,
      payment_behavior: "default_incomplete",
      payment_settings: {
        save_default_payment_method: "on_subscription",
        payment_method_types: ["card"],
      },
      expand: ["pending_setup_intent", "latest_invoice.confirmation_secret"],
    };

    if (!skipTrial) {
      subscriptionParams.trial_settings = {
        end_behavior: { missing_payment_method: "cancel" },
      };
    }

    const subscription = await stripe.subscriptions.create(subscriptionParams);

    let clientSecret: string | null = null;
    if (skipTrial) {
      const invoice = subscription.latest_invoice as Stripe.Invoice | string | null;
      if (invoice && typeof invoice !== "string") {
        clientSecret = invoice.confirmation_secret?.client_secret ?? null;
      }
    } else {
      const setupIntent = subscription.pending_setup_intent as Stripe.SetupIntent | string | null;
      if (setupIntent && typeof setupIntent !== "string") {
        clientSecret = setupIntent.client_secret;
      }
    }

    if (!clientSecret) {
      console.error("[stripe/checkout] missing client_secret", {
        skipTrial,
        status: subscription.status,
        hasPendingSetupIntent: !!subscription.pending_setup_intent,
        hasLatestInvoice: !!subscription.latest_invoice,
      });
      return NextResponse.json(
        { error: skipTrial ? "No payment intent client secret" : "No setup intent client secret" },
        { status: 500 }
      );
    }

    const item = subscription.items?.data?.[0];
    const periodStart = item?.current_period_start ?? null;
    const periodEnd = item?.current_period_end ?? null;
    const stripePriceId =
      (item?.price as Stripe.Price | undefined)?.id ?? STRIPE_PRICE_ID_PRO;

    await createOrUpdateSubscription(userId, {
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      stripe_price_id: stripePriceId,
      status: subscription.status,
      plan: "pro",
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret,
      customerId,
      mode: skipTrial ? "now" : "trial",
    });
  } catch (err) {
    console.error("[stripe/checkout] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
