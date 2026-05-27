import { supabase } from "./supabase";

export type Day = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
export type Meal = "breakfast" | "lunch" | "dinner" | "bedtime";

export interface Schedule {
  days: Day[];
  meals: Meal[];
}

export const ALL_DAYS: Day[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
export const ALL_MEALS: Meal[] = ["breakfast", "lunch", "dinner", "bedtime"];

const DAY_SET = new Set<Day>(ALL_DAYS);
const MEAL_SET = new Set<Meal>(ALL_MEALS);

export function isValidDay(d: unknown): d is Day {
  return typeof d === "string" && DAY_SET.has(d as Day);
}
export function isValidMeal(m: unknown): m is Meal {
  return typeof m === "string" && MEAL_SET.has(m as Meal);
}

export function todayDay(date: Date = new Date()): Day {
  // JS getDay(): Sun=0, Mon=1, ..., Sat=6
  const order: Day[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return order[date.getDay()];
}

/** Local-date YYYY-MM-DD (not UTC). Use for supplement_logs.log_date. */
export function todayISO(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export interface SupplementLog {
  id: string;
  user_id: string;
  supplement_id: string;
  log_date: string;
  meal_slot: Meal | null;
  created_at: string;
}

/** Canonical key for the per-day check-off Set on the client. */
export function logKey(supplementId: string, mealSlot: Meal | null): string {
  return `${supplementId}|${mealSlot ?? ""}`;
}

export function isSupplementScheduledFor(
  supplement: { schedule: Schedule | null },
  day: Day,
  meal: Meal
): boolean {
  const s = supplement.schedule;
  if (!s) return false;
  return Array.isArray(s.days) && Array.isArray(s.meals)
    && s.days.includes(day) && s.meals.includes(meal);
}

export function isSupplementScheduled(
  supplement: { schedule: Schedule | null }
): boolean {
  const s = supplement.schedule;
  if (!s) return false;
  return Array.isArray(s.days) && Array.isArray(s.meals)
    && s.days.length > 0 && s.meals.length > 0;
}

const DAY_SHORT: Record<Day, string> = {
  mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun",
};
const MEAL_TITLE: Record<Meal, string> = {
  breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", bedtime: "Bedtime",
};
const WEEKDAYS: Day[] = ["mon", "tue", "wed", "thu", "fri"];
const WEEKENDS: Day[] = ["sat", "sun"];
const sameSet = (a: Day[], b: Day[]) =>
  a.length === b.length && a.every((d) => b.includes(d));

export function formatScheduleSummary(
  supplement: { schedule: Schedule | null }
): string {
  if (!isSupplementScheduled(supplement)) return "Unscheduled";
  const s = supplement.schedule!;
  const days = ALL_DAYS.filter((d) => s.days.includes(d));
  const meals = ALL_MEALS.filter((m) => s.meals.includes(m));

  let dayPart: string;
  if (sameSet(days, ALL_DAYS)) dayPart = "Daily";
  else if (sameSet(days, WEEKDAYS)) dayPart = "Weekdays";
  else if (sameSet(days, WEEKENDS)) dayPart = "Weekends";
  else dayPart = days.map((d) => DAY_SHORT[d]).join(", ");

  const mealPart = meals.map((m) => MEAL_TITLE[m]).join(", ");
  return `${dayPart} · ${mealPart}`;
}

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
  schedule: Schedule | null;
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
  fields: {
    name: string;
    dose?: string;
    timing?: string;
    frequency: string;
    notes?: string;
    recommended_by_nura?: boolean;
    recommendation_reason?: string;
    schedule?: Schedule;
  }
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
      recommended_by_nura: fields.recommended_by_nura ?? false,
      recommendation_reason: fields.recommendation_reason ?? null,
      started_at: new Date().toISOString(),
      ...(fields.schedule ? { schedule: fields.schedule } : {}),
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
