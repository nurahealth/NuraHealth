import { supabase } from "./supabase";

export interface LabPanel {
  id: string;
  user_id: string;
  name: string;
  collected_date: string | null;
  uploaded_at: string;
  pdf_url: string | null;
  raw_text: string | null;
  status: "processing" | "analyzed" | "failed";
  insight: string | null;
  created_at: string;
}

export interface Biomarker {
  id: string;
  user_id: string;
  panel_id: string;
  name: string;
  value: number;
  unit: string;
  reference_range_low: number | null;
  reference_range_high: number | null;
  optimal_range_low: number | null;
  optimal_range_high: number | null;
  status: "low" | "optimal" | "watch" | "high" | "critical";
  notes: string | null;
  collected_date: string | null;
}

export async function uploadPdfToStorage(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "pdf";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("bloodwork")
    .upload(path, file, { contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage.from("bloodwork").getPublicUrl(path);
  return data.publicUrl;
}

export async function createLabPanel(
  userId: string,
  data: { name: string; collected_date?: string; pdf_url?: string; status?: string }
): Promise<string> {
  const { data: panel, error } = await supabase
    .from("lab_panels")
    .insert({
      user_id: userId,
      name: data.name,
      collected_date: data.collected_date ?? null,
      pdf_url: data.pdf_url ?? null,
      status: data.status ?? "processing",
    })
    .select("id")
    .single();
  if (error) throw error;
  return (panel as { id: string }).id;
}

export async function updateLabPanelStatus(
  panelId: string,
  status: string,
  insight?: string
): Promise<void> {
  const { error } = await supabase
    .from("lab_panels")
    .update({ status, insight: insight ?? null })
    .eq("id", panelId);
  if (error) throw error;
}

export async function saveBiomarkers(
  userId: string,
  panelId: string,
  biomarkersArray: Array<{
    name: string;
    value: number;
    unit: string;
    reference_range_low?: number | null;
    reference_range_high?: number | null;
    optimal_range_low?: number | null;
    optimal_range_high?: number | null;
    status: string;
    notes?: string | null;
  }>,
  collectedDate: string
): Promise<void> {
  const rows = biomarkersArray.map((b) => ({
    user_id: userId,
    panel_id: panelId,
    name: b.name,
    value: b.value,
    unit: b.unit,
    reference_range_low: b.reference_range_low ?? null,
    reference_range_high: b.reference_range_high ?? null,
    optimal_range_low: b.optimal_range_low ?? null,
    optimal_range_high: b.optimal_range_high ?? null,
    status: b.status,
    notes: b.notes ?? null,
    collected_date: collectedDate,
  }));
  const { error } = await supabase.from("biomarkers").insert(rows);
  if (error) throw error;
}

export async function getUserPanels(userId: string): Promise<LabPanel[]> {
  const { data, error } = await supabase
    .from("lab_panels")
    .select("*")
    .eq("user_id", userId)
    .order("collected_date", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as LabPanel[];
}

export async function getPanelBiomarkers(panelId: string): Promise<Biomarker[]> {
  const { data, error } = await supabase
    .from("biomarkers")
    .select("*")
    .eq("panel_id", panelId)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Biomarker[];
}

export async function getPanelsBiomarkers(
  panelIds: string[]
): Promise<Record<string, Biomarker[]>> {
  if (panelIds.length === 0) return {};
  const { data, error } = await supabase
    .from("biomarkers")
    .select("*")
    .in("panel_id", panelIds);
  if (error) throw error;
  const result: Record<string, Biomarker[]> = {};
  for (const b of (data ?? []) as Biomarker[]) {
    if (!result[b.panel_id]) result[b.panel_id] = [];
    result[b.panel_id].push(b);
  }
  return result;
}

export async function getLatestBiomarkers(userId: string): Promise<Biomarker[]> {
  const { data, error } = await supabase
    .from("biomarkers")
    .select("*")
    .eq("user_id", userId)
    .order("collected_date", { ascending: false, nullsFirst: false });
  if (error) throw error;
  const all = (data ?? []) as Biomarker[];
  // Deduplicate by name — keep the most recently collected per biomarker name
  const seen = new Set<string>();
  return all.filter((b) => {
    if (seen.has(b.name)) return false;
    seen.add(b.name);
    return true;
  });
}

export async function deletePanelAndBiomarkers(panelId: string): Promise<void> {
  await supabase.from("biomarkers").delete().eq("panel_id", panelId);
  const { error } = await supabase.from("lab_panels").delete().eq("id", panelId);
  if (error) throw error;
}

// ─── Analytics helpers ────────────────────────────────────────────────────────

export interface HealthScore {
  score: number;
  optimalCount: number;
  watchCount: number;
  alertCount: number;
  total: number;
}

export interface ScoreTrendPoint {
  date: string;
  score: number;
  panelId: string;
  panelName: string;
}

export interface BiomarkerHistoryPoint {
  date: string;
  value: number;
  status: Biomarker["status"];
  panelId: string;
}

export interface ActionItem {
  title: string;
  reasoning: string;
  action_type: "add_supplement" | "lifestyle" | "follow_up";
  supplement_suggestion?: { name: string; dose: string; timing: string };
}

function computeScore(biomarkers: Biomarker[]): HealthScore {
  const total = biomarkers.length;
  if (total === 0) return { score: 0, optimalCount: 0, watchCount: 0, alertCount: 0, total: 0 };
  const optimalCount = biomarkers.filter((b) => b.status === "optimal").length;
  const watchCount = biomarkers.filter((b) => b.status === "watch").length;
  const alertCount = biomarkers.filter((b) => b.status === "low" || b.status === "high" || b.status === "critical").length;
  const score = Math.round((optimalCount / total) * 100);
  return { score, optimalCount, watchCount, alertCount, total };
}

export async function getOverallHealthScore(userId: string): Promise<HealthScore> {
  const panels = await getUserPanels(userId);
  const latest = panels.find((p) => p.status === "analyzed");
  if (!latest) return { score: 0, optimalCount: 0, watchCount: 0, alertCount: 0, total: 0 };
  const biomarkers = await getPanelBiomarkers(latest.id);
  return computeScore(biomarkers);
}

export async function getHealthScoreTrend(userId: string): Promise<ScoreTrendPoint[]> {
  const panels = await getUserPanels(userId);
  const analyzed = panels.filter((p) => p.status === "analyzed").slice(0, 6);
  if (analyzed.length === 0) return [];
  const ids = analyzed.map((p) => p.id);
  const byPanel = await getPanelsBiomarkers(ids);
  return analyzed
    .map((p) => ({
      date: p.collected_date ?? p.uploaded_at.split("T")[0],
      score: computeScore(byPanel[p.id] ?? []).score,
      panelId: p.id,
      panelName: p.name,
    }))
    .reverse();
}

export async function getBiomarkerHistory(
  userId: string,
  biomarkerName: string
): Promise<BiomarkerHistoryPoint[]> {
  const { data, error } = await supabase
    .from("biomarkers")
    .select("*")
    .eq("user_id", userId)
    .ilike("name", biomarkerName)
    .order("collected_date", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return ((data ?? []) as Biomarker[]).map((b) => ({
    date: b.collected_date ?? "",
    value: b.value,
    status: b.status,
    panelId: b.panel_id,
  }));
}

export async function getPanelById(panelId: string): Promise<{ panel: LabPanel; biomarkers: Biomarker[] }> {
  const { data: panel, error } = await supabase
    .from("lab_panels")
    .select("*")
    .eq("id", panelId)
    .single();
  if (error) throw error;
  const biomarkers = await getPanelBiomarkers(panelId);
  return { panel: panel as LabPanel, biomarkers };
}

export async function getPanelScore(panelId: string): Promise<HealthScore> {
  const biomarkers = await getPanelBiomarkers(panelId);
  return computeScore(biomarkers);
}

// Lookup table for action item derivation
const ACTION_RULES: Array<{
  match: (name: string, status: Biomarker["status"]) => boolean;
  item: ActionItem;
}> = [
  {
    match: (n, s) => /vitamin d|vit\.?\s*d\b/i.test(n) && (s === "low" || s === "critical"),
    item: {
      title: "Add Vitamin D3 + K2",
      reasoning: "Low Vitamin D impairs immune function, bone density, and mood regulation.",
      action_type: "add_supplement",
      supplement_suggestion: { name: "Vitamin D3 + K2", dose: "5000 IU D3 / 100mcg K2", timing: "Morning with fat" },
    },
  },
  {
    match: (n, s) => /\bhdl\b/i.test(n) && s === "low",
    item: {
      title: "Boost HDL with Omega-3",
      reasoning: "Low HDL increases cardiovascular risk. Omega-3 and aerobic exercise are first-line interventions.",
      action_type: "add_supplement",
      supplement_suggestion: { name: "Omega-3 Fish Oil", dose: "2–3g EPA+DHA", timing: "With meals" },
    },
  },
  {
    match: (n, s) => /triglyceride/i.test(n) && (s === "high" || s === "critical"),
    item: {
      title: "Reduce Refined Carbs",
      reasoning: "Elevated triglycerides are strongly linked to high refined carbohydrate and sugar intake.",
      action_type: "lifestyle",
    },
  },
  {
    match: (n, s) => /\bldl\b/i.test(n) && (s === "high" || s === "critical"),
    item: {
      title: "Schedule Lipid Follow-Up",
      reasoning: "Elevated LDL warrants repeat testing and evaluation for statin therapy or dietary intervention.",
      action_type: "follow_up",
    },
  },
  {
    match: (n, s) => /\bb12\b|vitamin b-?12/i.test(n) && (s === "low" || s === "critical"),
    item: {
      title: "Add B12 Methylcobalamin",
      reasoning: "B12 deficiency causes fatigue, neurological symptoms, and elevated homocysteine.",
      action_type: "add_supplement",
      supplement_suggestion: { name: "B12 Methylcobalamin", dose: "1000mcg", timing: "Morning sublingual" },
    },
  },
  {
    match: (n, s) => /ferritin/i.test(n) && (s === "low" || s === "critical"),
    item: {
      title: "Add Iron + Vitamin C",
      reasoning: "Low ferritin depletes iron stores leading to fatigue and impaired oxygen transport.",
      action_type: "add_supplement",
      supplement_suggestion: { name: "Iron Bisglycinate + Vitamin C", dose: "25mg iron + 250mg C", timing: "Away from coffee/calcium" },
    },
  },
  {
    match: (n, s) => /magnesium/i.test(n) && (s === "low" || s === "critical"),
    item: {
      title: "Add Magnesium Glycinate",
      reasoning: "Magnesium deficiency affects sleep, muscle function, and hundreds of enzymatic reactions.",
      action_type: "add_supplement",
      supplement_suggestion: { name: "Magnesium Glycinate", dose: "300–400mg", timing: "Evening before bed" },
    },
  },
  {
    match: (n, s) => /testosterone/i.test(n) && s === "low",
    item: {
      title: "Schedule Endocrine Follow-Up",
      reasoning: "Low testosterone warrants clinical evaluation to rule out secondary causes before intervention.",
      action_type: "follow_up",
    },
  },
  {
    match: (n, s) => /tsh|thyroid/i.test(n) && (s === "high" || s === "low" || s === "critical"),
    item: {
      title: "Schedule Thyroid Follow-Up",
      reasoning: "Abnormal thyroid markers should be evaluated with a full panel (TSH, T3, T4, antibodies).",
      action_type: "follow_up",
    },
  },
  {
    match: (n, s) => /glucose|hba1c|hemoglobin a1c/i.test(n) && (s === "high" || s === "critical"),
    item: {
      title: "Reduce Refined Carbs & Increase Movement",
      reasoning: "Elevated blood glucose indicates insulin resistance. Diet and exercise are primary interventions.",
      action_type: "lifestyle",
    },
  },
];

export async function getTopActionItems(
  panelIdOrUserId: string,
  mode: "panel" | "user" = "panel"
): Promise<ActionItem[]> {
  let biomarkers: Biomarker[];
  let insight: string | null = null;

  if (mode === "panel") {
    const result = await getPanelById(panelIdOrUserId);
    biomarkers = result.biomarkers;
    insight = result.panel.insight;
  } else {
    const panels = await getUserPanels(panelIdOrUserId);
    const latest = panels.find((p) => p.status === "analyzed");
    if (!latest) return [];
    biomarkers = await getPanelBiomarkers(latest.id);
    insight = latest.insight;
  }

  const alertBiomarkers = biomarkers.filter(
    (b) => b.status === "low" || b.status === "high" || b.status === "critical" || b.status === "watch"
  );

  const actions: ActionItem[] = [];
  const seen = new Set<string>();

  for (const b of alertBiomarkers) {
    if (actions.length >= 3) break;
    for (const rule of ACTION_RULES) {
      if (rule.match(b.name, b.status) && !seen.has(rule.item.title)) {
        seen.add(rule.item.title);
        actions.push(rule.item);
        break;
      }
    }
  }

  // If we have fewer than 1 action but there's an insight, synthesize one
  if (actions.length === 0 && insight) {
    actions.push({
      title: "Review NŪRA's Analysis",
      reasoning: insight.slice(0, 140),
      action_type: "lifestyle",
    });
  }

  return actions.slice(0, 3);
}
