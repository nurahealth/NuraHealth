import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createOrUpdateSubscription } from "@/lib/subscriptions";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function subPayload(sub: Stripe.Subscription) {
  // In Stripe API 2026-03-25, period fields are on subscription items
  const item = sub.items?.data?.[0];
  const periodStart = item?.current_period_start ?? null;
  const periodEnd = item?.current_period_end ?? null;
  return {
    stripe_subscription_id: sub.id,
    status: sub.status,
    plan: "pro",
    current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at_period_end: sub.cancel_at_period_end,
  };
}

async function resolveUserId(customerId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  if (data?.user_id) return data.user_id as string;

  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) return null;
  const meta = (customer as Stripe.Customer).metadata?.supabase_user_id;
  return meta ?? null;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn("[stripe/webhook] STRIPE_WEBHOOK_SECRET not set — skipping signature verification");
  }

  let event: Stripe.Event;
  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err) {
    console.error("[stripe/webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = await resolveUserId(sub.customer as string);
        if (userId) {
          await createOrUpdateSubscription(userId, {
            stripe_customer_id: sub.customer as string,
            ...subPayload(sub),
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = await resolveUserId(sub.customer as string);
        if (userId) {
          await createOrUpdateSubscription(userId, {
            stripe_customer_id: sub.customer as string,
            stripe_subscription_id: sub.id,
            status: "canceled",
            cancel_at_period_end: false,
          });
        }
        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;

        const userId =
          (session.metadata?.supabase_user_id as string | undefined) ??
          (await resolveUserId(session.customer as string));

        if (userId && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          await createOrUpdateSubscription(userId, {
            stripe_customer_id: session.customer as string,
            ...subPayload(sub),
          });
        }
        break;
      }
    }
  } catch (err) {
    console.error("[stripe/webhook] handler error:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
