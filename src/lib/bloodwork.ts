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
