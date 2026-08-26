import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getLatestBiomarkersWith } from "@/lib/bloodwork";
import { getOverallHealth } from "@/lib/dashboardData";
import NuraPageShell from "@/components/NuraPageShell";
import ConditionsIndex, { type MatchVM } from "./ConditionsIndex";
import { CONDITIONS } from "./data";
import { matchAll, sampleBiomarkers } from "./match";
import type { Biomarker } from "@/lib/bloodwork";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Conditions · NŪRA",
  description:
    "Natural protocols by health condition — matched to your data, evidence-graded and cited.",
};

export default async function ConditionsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Signed out, or bloodwork that fails to load, still gets the full library.
  let biomarkers: Biomarker[] = [];
  if (user) {
    try {
      biomarkers = await getLatestBiomarkersWith(supabase, user.id);
    } catch {
      biomarkers = [];
    }
  }

  // Same review fallback as the Nutrition page: no panels on file renders the
  // shared sample set, clearly labelled, rather than an empty matched block.
  const isSample = biomarkers.length === 0;
  if (isSample) biomarkers = sampleBiomarkers();

  // Pillar scores are the dashboard's seeded sample values today (see BRAIN.md
  // — no live wearable data exists yet). Reading them through the same accessor
  // the dashboard uses means this section inherits real scores for free the day
  // that module starts returning them.
  const pillars = getOverallHealth().pillars.map((p) => ({
    key: p.key, label: p.label, score: p.score,
  }));

  const matches: MatchVM[] = matchAll(CONDITIONS, biomarkers, pillars)
    .filter((r) => r.match !== null)
    .map((r) => ({ slug: r.slug, reason: r.match!.reason }));

  return (
    <NuraPageShell maxWidth={860} desktopMaxWidth={1080}>
      <ConditionsIndex matches={matches} isSample={isSample} />
    </NuraPageShell>
  );
}
