import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getUserSubscription, createOrUpdateSubscription } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

export async function POST(): Promise<NextResponse> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sub = await getUserSubscription(user.id);
    if (!sub?.stripe_subscription_id) {
      return NextResponse.json({ error: "No subscription" }, { status: 404 });
    }
    if (!sub.cancel_at_period_end) {
      return NextResponse.json(
        { error: "Subscription is not scheduled to cancel" },
        { status: 400 }
      );
    }

    await stripe.subscriptions.update(sub.stripe_subscription_id, {
      cancel_at_period_end: false,
    });

    await createOrUpdateSubscription(user.id, {
      cancel_at_period_end: false,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[billing/reactivate] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Reactivate failed" },
      { status: 500 }
    );
  }
}
