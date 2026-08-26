import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getLatestBiomarkersWith, type Biomarker } from "@/lib/bloodwork";
import { getOverallHealth } from "@/lib/dashboardData";
import NuraPageShell from "@/components/NuraPageShell";
import ProtocolClient from "./ProtocolClient";
import { CONDITION_BY_SLUG } from "../data";
import { latestCollected, matchCondition, resolveSignals, sampleBiomarkers } from "../match";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const condition = CONDITION_BY_SLUG.get(slug);
  if (!condition) return { title: "Conditions · NŪRA" };
  return {
    title: `${condition.name} · NŪRA`,
    description: condition.blurb,
  };
}

export default async function ConditionProtocolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const condition = CONDITION_BY_SLUG.get(slug);
  if (!condition) notFound();

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Same loader the Nutrition page uses — this section never fetches markers of
  // its own. No bloodwork on file simply means no signal chips.
  let biomarkers: Biomarker[] = [];
  if (user) {
    try {
      biomarkers = await getLatestBiomarkersWith(supabase, user.id);
    } catch {
      biomarkers = [];
    }
  }

  const isSample = biomarkers.length === 0;
  if (isSample) biomarkers = sampleBiomarkers();

  const signals = resolveSignals(condition, biomarkers);
  const pillars = getOverallHealth().pillars.map((p) => ({
    key: p.key, label: p.label, score: p.score,
  }));
  const match = matchCondition(condition, biomarkers, pillars);

  return (
    <NuraPageShell maxWidth={720} desktopMaxWidth={780}>
      <ProtocolClient
        condition={condition}
        signals={signals}
        collected={latestCollected(signals)}
        matched={match !== null}
        isSample={isSample}
      />
    </NuraPageShell>
  );
}
