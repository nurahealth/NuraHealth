import { NextRequest, NextResponse } from "next/server";
import { getUserSubscription } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const sub = await getUserSubscription(userId);
    if (!sub) {
      return NextResponse.json({ isPro: false, status: null, plan: null, current_period_end: null, cancel_at_period_end: false });
    }

    const active = sub.status === "active" || sub.status === "trialing";
    const notExpired = sub.current_period_end ? new Date(sub.current_period_end) > new Date() : false;
    const isPro = active && notExpired;

    return NextResponse.json({
      isPro,
      status: sub.status,
      plan: sub.plan,
      current_period_end: sub.current_period_end,
      cancel_at_period_end: sub.cancel_at_period_end,
    });
  } catch (err) {
    console.error("[subscription/status] error:", err);
    return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 });
  }
}
