import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const EXTRACTION_PROMPT = `Analyze this bloodwork lab report PDF and extract all biomarker data. Return ONLY valid JSON in this exact format, no other text:

{
  "panelName": "name of the lab panel (e.g. Comprehensive Metabolic Panel, Complete Blood Count, Hormone Panel, Lipid Panel)",
  "collectedDate": "YYYY-MM-DD format date when blood was collected, or null if not found",
  "biomarkers": [
    {
      "name": "full biomarker name exactly as shown in the report",
      "value": numeric_value_only,
      "unit": "unit string (e.g. ng/mL, mg/dL, IU/L)",
      "reference_range_low": numeric_or_null,
      "reference_range_high": numeric_or_null,
      "optimal_range_low": numeric_or_null,
      "optimal_range_high": numeric_or_null,
      "status": "low|optimal|watch|high|critical",
      "notes": "brief 1-sentence clinical note or null"
    }
  ],
  "insight": "2-3 sentence NURA insight highlighting the most clinically significant findings and top actionable recommendation"
}

Status assignment rules:
- "critical": value is dangerously outside the reference range (more than 50% beyond either end)
- "low": value is below reference_range_low
- "high": value is above reference_range_high
- "watch": value is within reference range but outside the optimal range
- "optimal": value is within the optimal range

For optimal_range values, use functional/integrative medicine guidelines which are typically tighter than standard lab ranges:
- Vitamin D: 40-80 ng/mL optimal (vs lab reference of 20-100)
- TSH: 1.0-2.5 mIU/L optimal (vs lab 0.4-4.5)
- Ferritin (female): 50-150 ng/mL optimal; (male): 70-200 ng/mL
- Fasting glucose: 70-85 mg/dL optimal (vs lab 70-100)
- HbA1c: <5.4% optimal (vs lab <5.7%)
- Total cholesterol: 150-200 mg/dL optimal
- LDL: <100 mg/dL optimal
- HDL (male): >55 mg/dL; (female): >65 mg/dL optimal
- Triglycerides: <100 mg/dL optimal (vs lab <150)
- hsCRP: <1.0 mg/L optimal (vs lab <3.0)
- B12: 500-900 pg/mL optimal (vs lab 200-900)
- Homocysteine: <8 umol/L optimal (vs lab <15)

Omit any biomarker whose result is non-numeric (e.g. "Negative", "Positive", "Normal", "See note").
Return ONLY the JSON object.`;

interface ExtractedBiomarker {
  name: string;
  value: number;
  unit: string;
  reference_range_low: number | null;
  reference_range_high: number | null;
  optimal_range_low: number | null;
  optimal_range_high: number | null;
  status: string;
  notes: string | null;
}

interface ClaudeExtraction {
  panelName: string;
  collectedDate: string | null;
  biomarkers: ExtractedBiomarker[];
  insight: string;
}

function sanitizeNumber(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

const VALID_STATUSES = new Set(["low", "optimal", "watch", "high", "critical"]);

function cleanBiomarkers(raw: unknown[]): ExtractedBiomarker[] {
  return raw
    .map((b) => {
      const bm = b as Record<string, unknown>;
      return {
        name: String(bm.name ?? ""),
        value: Number(bm.value) || 0,
        unit: String(bm.unit ?? ""),
        reference_range_low: sanitizeNumber(bm.reference_range_low),
        reference_range_high: sanitizeNumber(bm.reference_range_high),
        optimal_range_low: sanitizeNumber(bm.optimal_range_low),
        optimal_range_high: sanitizeNumber(bm.optimal_range_high),
        status: VALID_STATUSES.has(String(bm.status)) ? String(bm.status) : "optimal",
        notes: bm.notes ? String(bm.notes) : null,
      };
    })
    .filter((b) => b.name.length > 0 && !isNaN(b.value));
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Authenticate
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = authHeader.slice(7);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse form data
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Validate
  if (!file.type.includes("pdf") && !file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File must be under 10MB" }, { status: 400 });
  }

  // Read file buffer once
  const fileBuffer = await file.arrayBuffer();
  const fileBytes = Buffer.from(fileBuffer);

  // Upload PDF to Supabase Storage
  const storagePath = `${user.id}/${crypto.randomUUID()}.pdf`;
  const { error: storageError } = await supabase.storage
    .from("bloodwork")
    .upload(storagePath, fileBytes, { contentType: "application/pdf" });
  if (storageError) {
    return NextResponse.json({ error: "Storage upload failed: " + storageError.message }, { status: 500 });
  }
  const { data: urlData } = supabase.storage.from("bloodwork").getPublicUrl(storagePath);
  const pdfUrl = urlData.publicUrl;

  // Create panel row as 'processing'
  const { data: panelRow, error: panelError } = await supabase
    .from("lab_panels")
    .insert({
      user_id: user.id,
      name: file.name.replace(/\.pdf$/i, "").replace(/_/g, " "),
      pdf_url: pdfUrl,
      status: "processing",
    })
    .select("id")
    .single();
  if (panelError || !panelRow) {
    return NextResponse.json({ error: "Failed to create panel record" }, { status: 500 });
  }
  const panelId = (panelRow as { id: string }).id;

  // Extract with Claude
  let extraction: ClaudeExtraction;
  try {
    const base64Pdf = fileBytes.toString("base64");

    const response = await anthropic.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64Pdf,
              },
            },
            {
              type: "text",
              text: EXTRACTION_PROMPT,
            },
          ],
        },
      ],
    });

    const textBlock = response.content.find((c) => c.type === "text");
    const rawText = textBlock && "text" in textBlock ? textBlock.text : "";

    // Strip markdown code fences if present
    const cleaned = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");

    const parsed = JSON.parse(jsonMatch[0]) as Partial<ClaudeExtraction>;
    extraction = {
      panelName: String(parsed.panelName ?? "Lab Panel"),
      collectedDate: parsed.collectedDate ?? null,
      biomarkers: cleanBiomarkers(Array.isArray(parsed.biomarkers) ? parsed.biomarkers : []),
      insight: String(parsed.insight ?? ""),
    };
  } catch (err) {
    // Mark as failed
    await supabase
      .from("lab_panels")
      .update({ status: "failed" })
      .eq("id", panelId);
    console.error("Claude extraction error:", err);
    return NextResponse.json({ error: "Failed to analyze PDF" }, { status: 500 });
  }

  // Save biomarkers
  if (extraction.biomarkers.length > 0) {
    const collectedDate = extraction.collectedDate ?? new Date().toISOString().split("T")[0];
    const rows = extraction.biomarkers.map((b) => ({
      user_id: user.id,
      panel_id: panelId,
      name: b.name,
      value: b.value,
      unit: b.unit,
      reference_range_low: b.reference_range_low,
      reference_range_high: b.reference_range_high,
      optimal_range_low: b.optimal_range_low,
      optimal_range_high: b.optimal_range_high,
      status: b.status,
      notes: b.notes,
      collected_date: collectedDate,
    }));

    const { error: bmError } = await supabase.from("biomarkers").insert(rows);
    if (bmError) {
      console.error("Biomarker insert error:", bmError);
    }
  }

  // Update panel to analyzed
  await supabase
    .from("lab_panels")
    .update({
      name: extraction.panelName,
      collected_date: extraction.collectedDate,
      status: "analyzed",
      insight: extraction.insight,
    })
    .eq("id", panelId);

  return NextResponse.json({
    panelId,
    panelName: extraction.panelName,
    biomarkers: extraction.biomarkers,
    insight: extraction.insight,
  });
}
