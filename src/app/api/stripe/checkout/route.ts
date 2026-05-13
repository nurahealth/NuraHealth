import { NextRequest, NextResponse } from "next/server";
import { stripe, STRIPE_PRICE_ID_PRO } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getUserSubscription, createOrUpdateSubscription } from "@/lib/subscriptions";

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

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded_page",
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: STRIPE_PRICE_ID_PRO, quantity: 1 }],
      return_url: `${origin}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      payment_method_collection: "always",
      subscription_data: { trial_period_days: 3 },
      metadata: { supabase_user_id: userId },
    });

    return NextResponse.json({ clientSecret: session.client_secret });
  } catch (err) {
    console.error("[stripe/checkout] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
