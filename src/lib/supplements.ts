import { supabase } from "./supabase";

export interface Supplement {
  id: string;
  user_id: string;
  name: string;
  dose: string | null;
  timing: string | null;
  frequency: string;
  notes: string | null;
  recommended_by_nura: boolean;
  recommendation_reason: string | null;
  started_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function getUserSupplements(userId: string): Promise<Supplement[]> {
  const { data, error } = await supabase
    .from("supplements")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Supplement[];
}

export async function addSupplement(
  userId: string,
  fields: { name: string; dose?: string; timing?: string; frequency: string; notes?: string }
): Promise<Supplement> {
  const { data, error } = await supabase
    .from("supplements")
    .insert({
      user_id: userId,
      name: fields.name,
      dose: fields.dose || null,
      timing: fields.timing || null,
      frequency: fields.frequency,
      notes: fields.notes || null,
      recommended_by_nura: false,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data as Supplement;
}

export async function updateSupplement(
  supplementId: string,
  fields: Partial<{
    name: string;
    dose: string | null;
    timing: string | null;
    frequency: string;
    notes: string | null;
  }>
): Promise<Supplement> {
  const { data, error } = await supabase
    .from("supplements")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", supplementId)
    .select()
    .single();
  if (error) throw error;
  return data as Supplement;
}

export async function deleteSupplement(supplementId: string): Promise<void> {
  const { error } = await supabase
    .from("supplements")
    .delete()
    .eq("id", supplementId);
  if (error) throw error;
}

export async function logSupplementTaken(userId: string, supplementId: string): Promise<void> {
  const today = new Date().toISOString().split("T")[0];
  const { error } = await supabase
    .from("supplement_logs")
    .upsert(
      {
        user_id: userId,
        supplement_id: supplementId,
        taken_at: new Date().toISOString(),
        log_date: today,
      },
      { onConflict: "supplement_id,log_date" }
    );
  if (error) throw error;
}

export async function unlogSupplementTaken(userId: string, supplementId: string): Promise<void> {
  const today = new Date().toISOString().split("T")[0];
  const { error } = await supabase
    .from("supplement_logs")
    .delete()
    .eq("user_id", userId)
    .eq("supplement_id", supplementId)
    .eq("log_date", today);
  if (error) throw error;
}

export async function getTodaysLogs(userId: string): Promise<string[]> {
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("supplement_logs")
    .select("supplement_id")
    .eq("user_id", userId)
    .eq("log_date", today);
  if (error) throw error;
  return ((data ?? []) as Array<{ supplement_id: string }>).map((l) => l.supplement_id);
}

export async function getSupplementStreak(supplementId: string): Promise<number> {
  const { data, error } = await supabase
    .from("supplement_logs")
    .select("log_date")
    .eq("supplement_id", supplementId)
    .order("log_date", { ascending: false })
    .limit(60);
  if (error || !data || data.length === 0) return 0;

  const logSet = new Set((data as Array<{ log_date: string }>).map((l) => l.log_date));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  // If today not yet logged, start counting from yesterday so streak stays alive
  const start = new Date(today);
  if (!logSet.has(todayStr)) {
    start.setDate(start.getDate() - 1);
  }

  let streak = 0;
  const cur = new Date(start);
  for (let i = 0; i < 60; i++) {
    const ds = cur.toISOString().split("T")[0];
    if (logSet.has(ds)) {
      streak++;
      cur.setDate(cur.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}
