import { supabaseAdmin } from "./supabase-admin";

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  status: string | null;
  plan: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as Subscription | null;
}

export async function createOrUpdateSubscription(
  userId: string,
  data: Partial<Omit<Subscription, "id" | "user_id" | "created_at">>
): Promise<Subscription> {
  const { data: row, error } = await supabaseAdmin
    .from("subscriptions")
    .upsert(
      { user_id: userId, ...data, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    )
    .select()
    .single();
  if (error) throw error;
  return row as Subscription;
}

export async function isUserPro(userId: string): Promise<boolean> {
  const sub = await getUserSubscription(userId);
  if (!sub) return false;
  const active = sub.status === "active" || sub.status === "trialing";
  if (!active) return false;
  if (!sub.current_period_end) return false;
  return new Date(sub.current_period_end) > new Date();
}
