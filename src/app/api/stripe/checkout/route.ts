import { NextRequest, NextResponse } from "next/server";
import { stripe, STRIPE_PRICE_ID_PRO } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getUserSubscription, createOrUpdateSubscription } from "@/lib/subscriptions";
import type Stripe from "stripe";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json() as { userId?: string };
    const { userId } = body;

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

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: STRIPE_PRICE_ID_PRO }],
      payment_behavior: "default_incomplete",
      payment_settings: {
        save_default_payment_method: "on_subscription",
        payment_method_types: ["card"],
      },
      trial_period_days: 3,
      trial_settings: {
        end_behavior: { missing_payment_method: "cancel" },
      },
      expand: ["pending_setup_intent"],
    });

    const setupIntent = subscription.pending_setup_intent as Stripe.SetupIntent | null;
    const clientSecret = setupIntent?.client_secret ?? null;

    if (!clientSecret) {
      return NextResponse.json({ error: "No setup intent client secret" }, { status: 500 });
    }

    // Store subscription immediately — trialing, no charge yet
    const item = subscription.items?.data?.[0];
    const periodStart = item?.current_period_start ?? null;
    const periodEnd = item?.current_period_end ?? null;

    await createOrUpdateSubscription(userId, {
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
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
    });
  } catch (err) {
    console.error("[stripe/checkout] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
