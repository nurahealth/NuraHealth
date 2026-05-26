import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getUserSubscription } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as { payment_method_id?: string };
    const paymentMethodId = body.payment_method_id;
    if (!paymentMethodId) {
      return NextResponse.json({ error: "payment_method_id required" }, { status: 400 });
    }

    const sub = await getUserSubscription(user.id);
    if (!sub?.stripe_customer_id) {
      return NextResponse.json({ error: "No customer found" }, { status: 404 });
    }

    await stripe.customers.update(sub.stripe_customer_id, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    if (sub.stripe_subscription_id) {
      await stripe.subscriptions.update(sub.stripe_subscription_id, {
        default_payment_method: paymentMethodId,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[billing/set-default-payment-method] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to set payment method" },
      { status: 500 }
    );
  }
}
