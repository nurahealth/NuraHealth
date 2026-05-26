import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getUserSubscription } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sub = await getUserSubscription(user.id);
    if (!sub?.stripe_customer_id) {
      return NextResponse.json({ invoices: [] });
    }

    const list = await stripe.invoices.list({
      customer: sub.stripe_customer_id,
      limit: 24,
    });

    const invoices = list.data.map((inv) => ({
      id: inv.id,
      number: inv.number,
      amount_paid: inv.amount_paid,
      currency: inv.currency,
      status: inv.status,
      created: inv.created,
      hosted_invoice_url: inv.hosted_invoice_url,
      invoice_pdf: inv.invoice_pdf,
      period_start: inv.period_start,
      period_end: inv.period_end,
    }));

    return NextResponse.json({ invoices });
  } catch (err) {
    console.error("[billing/invoices] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}
