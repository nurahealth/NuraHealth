import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type Stripe from "stripe";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json() as { sessionId?: string; userId?: string };
    const { sessionId, userId } = body;

    if (!sessionId || !userId) {
      return NextResponse.json({ error: "sessionId and userId are required" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "customer"],
    });

    if (!session.subscription || typeof session.subscription === "string") {
      return NextResponse.json({ error: "No subscription found in session" }, { status: 400 });
    }

    const subscription = session.subscription as Stripe.Subscription;
    const customer = session.customer as Stripe.Customer | null;
    const customerId = customer?.id ?? (typeof session.customer === "string" ? session.customer : null);

    // Period fields are on subscription items in Stripe API 2026-03-25
    const item = subscription.items?.data?.[0];
    const periodStart = item?.current_period_start ?? null;
    const periodEnd = item?.current_period_end ?? null;
    const priceId = item?.price?.id ?? null;

    const { error: upsertError } = await supabaseAdmin
      .from("subscriptions")
      .upsert(
        {
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          stripe_price_id: priceId,
          status: subscription.status,
          plan: "pro",
          current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
          current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
          cancel_at_period_end: subscription.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (upsertError) {
      console.error("[stripe/sync-session] upsert error:", upsertError);
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, status: subscription.status });
  } catch (err) {
    console.error("[stripe/sync-session] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 }
    );
  }
}
