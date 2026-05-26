import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getUserSubscription } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

export async function POST(): Promise<NextResponse> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sub = await getUserSubscription(user.id);
    if (!sub?.stripe_customer_id) {
      return NextResponse.json({ error: "No customer found" }, { status: 404 });
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: sub.stripe_customer_id,
      payment_method_types: ["card"],
      usage: "off_session",
    });

    return NextResponse.json({ client_secret: setupIntent.client_secret });
  } catch (err) {
    console.error("[billing/setup-intent] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "SetupIntent failed" },
      { status: 500 }
    );
  }
}
