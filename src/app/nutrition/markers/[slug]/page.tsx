import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getLatestBiomarkersWith } from "@/lib/bloodwork";
import NuraPageShell from "@/components/NuraPageShell";
import { ArrowLeft, Activity, Lightbulb, ChevronRight } from "lucide-react";
import { resolveBack, withFrom, type RawSearchParam } from "@/lib/backNav";
import { RecipeCard, type Recipe } from "../../../recipes/RecipesBrowseClient";
import {
  resolveMarkerValue,
  computeMarkerGeometry,
  amberGradient,
  MARKER_GOALS,
  SAMPLE_VALUES,
  SAMPLE_COLLECTED,
  type MarkerDirection,
} from "@/lib/nutrition";

export const dynamic = "force-dynamic";

const TEXT = "var(--nura-text-primary)";
const TEXT_SEC = "var(--nura-text-secondary)";
const TEXT_TER = "var(--nura-text-tertiary)";
const BORDER = "var(--nura-border)";
const SURFACE = "var(--nura-surface)";
const SAGE = "var(--nura-sage)";
const SAGE_RGB = "var(--nura-sage-rgb)";
const AMBER = "#d3a253";
const AMBER_RGB = "211,162,83";
const SANS = "var(--font-inter), system-ui, sans-serif";

interface MarkerRow {
  id: string;
  slug: string;
  name: string;
  unit: string | null;
  optimal_min: number | null;
  optimal_max: number | null;
  direction: MarkerDirection;
  description: string | null;
  absorption_tip: string | null;
}

function foodsHeading(direction: MarkerDirection): string {
  if (direction === "lower-better") return "Foods that lower it";
  if (direction === "higher-better") return "Foods that raise it";
  return "Foods that support it";
}

export default async function MarkerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: RawSearchParam; label?: RawSearchParam }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const back = resolveBack(sp, { href: "/nutrition", label: "Nutrition" });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/dashboard");

  const { data: markerData } = await supabaseAdmin
    .from("health_markers")
    .select("id, slug, name, unit, optimal_min, optimal_max, direction, description, absorption_tip")
    .eq("slug", slug)
    .maybeSingle();
  const marker = markerData as MarkerRow | null;
  if (!marker) notFound();

  const [realBiomarkers, { data: foodRows }, { data: recipeRows }, { data: riRows }] = await Promise.all([
    getLatestBiomarkersWith(supabase, user.id),
    supabaseAdmin
      .from("marker_foods")
      .select("food_name, why_text, frequency_text, order_index, ingredients(slug, name)")
      .eq("marker_id", marker.id)
      .order("order_index", { ascending: true }),
    supabaseAdmin
      .from("recipes")
      .select("id, slug, title, description, category, cuisine, total_minutes, servings, is_organic, goal_tags, system_tags, status, image_url")
      .eq("status", "published"),
    supabaseAdmin.from("recipe_ingredients").select("recipe_id, ingredients(slug, name)"),
  ]);

  // ── User value (real, or labeled sample fallback) ──────────────────────────
  const isSample = realBiomarkers.length === 0;
  let value: number | null = null;
  let collected: string | null = null;
  if (isSample) {
    if (marker.slug in SAMPLE_VALUES) {
      value = SAMPLE_VALUES[marker.slug];
      collected = SAMPLE_COLLECTED;
    }
  } else {
    const resolved = resolveMarkerValue(marker.slug, realBiomarkers);
    if (resolved) {
      value = resolved.value;
      collected = resolved.collected_date;
    }
  }
  const geo =
    value != null
      ? computeMarkerGeometry(value, marker.optimal_min, marker.optimal_max, marker.direction, marker.unit)
      : null;

  // ── Foods ──────────────────────────────────────────────────────────────────
  interface FoodItem {
    label: string;
    slug: string | null;
    why: string | null;
    freq: string | null;
  }
  const foods: FoodItem[] = ((foodRows ?? []) as Array<{
    food_name: string | null;
    why_text: string | null;
    frequency_text: string | null;
    ingredients: { slug: string; name: string } | { slug: string; name: string }[] | null;
  }>).map((row) => {
    const ing = Array.isArray(row.ingredients) ? row.ingredients[0] : row.ingredients;
    return {
      label: ing?.name ?? row.food_name ?? "—",
      slug: ing?.slug ?? null,
      why: row.why_text,
      freq: row.frequency_text,
    };
  });
  const foodSlugs = new Set(foods.map((f) => f.slug).filter((s): s is string => !!s));

  // ── Recipes that help (goal_tags match OR contain one of the marker's foods) ─
  const slugsByRecipe = new Map<string, Set<string>>();
  const namesByRecipe = new Map<string, string[]>();
  for (const row of (riRows ?? []) as Array<{
    recipe_id: string;
    ingredients: { slug: string; name: string } | { slug: string; name: string }[] | null;
  }>) {
    const ing = Array.isArray(row.ingredients) ? row.ingredients[0] : row.ingredients;
    if (!ing) continue;
    if (ing.slug) {
      const s = slugsByRecipe.get(row.recipe_id) ?? new Set<string>();
      s.add(ing.slug);
      slugsByRecipe.set(row.recipe_id, s);
    }
    if (ing.name) {
      const n = namesByRecipe.get(row.recipe_id) ?? [];
      n.push(ing.name);
      namesByRecipe.set(row.recipe_id, n);
    }
  }
  const markerGoals = MARKER_GOALS[marker.slug] ?? [];
  const helpfulRecipes: Recipe[] = ((recipeRows ?? []) as Array<{
    id: string;
    slug: string;
    title: string;
    description: string | null;
    category: string;
    cuisine: string | null;
    total_minutes: number | null;
    servings: number | null;
    is_organic: boolean;
    goal_tags: string[] | null;
    system_tags: string[] | null;
    status: string;
    image_url: string | null;
  }>)
    .filter((r) => {
      const tags = r.goal_tags ?? [];
      const byGoal = markerGoals.some((g) => tags.includes(g));
      const recSlugs = slugsByRecipe.get(r.id);
      const byFood = recSlugs ? [...foodSlugs].some((s) => recSlugs.has(s)) : false;
      return byGoal || byFood;
    })
    .map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      description: r.description,
      category: r.category,
      cuisine: r.cuisine,
      total_minutes: r.total_minutes,
      servings: r.servings,
      is_organic: r.is_organic,
      goal_tags: r.goal_tags ?? [],
      system_tags: r.system_tags ?? [],
      status: r.status,
      image_url: r.image_url ?? null,
      ingredientNames: namesByRecipe.get(r.id) ?? [],
    }));

  const statusColor = geo?.status === "attention" ? AMBER : SAGE;
  const statusRgb = geo?.status === "attention" ? AMBER_RGB : SAGE_RGB;
  const collectedLabel = collected
    ? new Date(collected).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  const cardStyle: React.CSSProperties = { background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 14 };
  const h2: React.CSSProperties = { fontFamily: SANS, fontSize: 20, fontWeight: 600, color: TEXT, margin: "0 0 12px", letterSpacing: "-0.02em" };

  const bandLeft = geo ? Math.min(geo.bandStartPct, geo.bandEndPct) : 0;
  const bandWidth = geo ? Math.max(2, Math.abs(geo.bandEndPct - geo.bandStartPct)) : 0;

  return (
    <NuraPageShell maxWidth={760}>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Back */}
        <Link href={back.href} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: SANS, fontSize: 13, fontWeight: 600, color: TEXT_SEC, textDecoration: "none", alignSelf: "flex-start", maxWidth: "100%" }}>
          <ArrowLeft size={15} style={{ flexShrink: 0 }} /> <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{back.label}</span>
        </Link>

        {/* Hero (amber-tinted) */}
        <div style={{ position: "relative", borderRadius: 18, overflow: "hidden", border: `0.5px solid ${BORDER}`, minHeight: 150, background: amberGradient(marker.slug) }}>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Activity size={30} color={`rgba(${AMBER_RGB},0.35)`} strokeWidth={1.5} />
          </div>
          <div style={{ minHeight: 150 }} />
        </div>

        {/* Title + value */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            {geo && (
              <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", color: statusColor, background: `rgba(${statusRgb},0.12)`, border: `0.5px solid rgba(${statusRgb},0.32)`, borderRadius: 999, padding: "4px 11px" }}>
                {geo.status === "optimal" ? "Optimal" : "Needs attention"}
              </span>
            )}
            {isSample && (
              <span style={{ fontFamily: SANS, fontSize: 10.5, fontWeight: 600, color: TEXT_TER, background: `rgba(${AMBER_RGB},0.08)`, border: `0.5px solid rgba(${AMBER_RGB},0.22)`, borderRadius: 999, padding: "4px 10px" }}>Sample</span>
            )}
          </div>
          <h1 style={{ fontFamily: SANS, fontSize: "clamp(26px, 4.5vw, 32px)", fontWeight: 600, color: TEXT, margin: "0 0 12px", letterSpacing: "-0.02em", lineHeight: 1.12 }}>{marker.name}</h1>

          {value != null ? (
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontFamily: SANS, fontSize: 40, fontWeight: 600, color: TEXT, letterSpacing: "-0.03em", lineHeight: 1 }}>{value}</span>
              {marker.unit && <span style={{ fontFamily: SANS, fontSize: 15, color: TEXT_SEC }}>{marker.unit}</span>}
              <span style={{ fontFamily: SANS, fontSize: 13, color: TEXT_TER, marginLeft: 6 }}>Optimal {geo?.rangeLabel}</span>
            </div>
          ) : (
            <div style={{ fontFamily: SANS, fontSize: 15, color: TEXT_TER }}>Not tested yet — add your bloodwork to see your level.</div>
          )}

          {/* Range bar */}
          {geo && (
            <div style={{ position: "relative", height: 7, borderRadius: 999, background: `rgba(var(--nura-bg-tint-rgb),0.08)`, marginTop: 16, maxWidth: 460 }}>
              <div style={{ position: "absolute", top: 0, bottom: 0, left: `${bandLeft}%`, width: `${bandWidth}%`, borderRadius: 999, background: `rgba(${SAGE_RGB},0.30)` }} />
              <div style={{ position: "absolute", top: "50%", left: `${geo.dotPct}%`, width: 13, height: 13, borderRadius: "50%", background: statusColor, border: "2px solid var(--nura-bg)", transform: "translate(-50%,-50%)", boxShadow: `0 0 0 1px rgba(${statusRgb},0.5)` }} />
            </div>
          )}

          {collectedLabel && (
            <div style={{ fontFamily: SANS, fontSize: 12, color: TEXT_TER, marginTop: 12 }}>Last tested {collectedLabel}</div>
          )}
        </div>

        {/* Description */}
        {marker.description && (
          <section>
            <h2 style={h2}>What this marker is</h2>
            <div style={{ ...cardStyle, padding: "16px 18px" }}>
              <p style={{ fontFamily: SANS, fontSize: 14, color: TEXT_SEC, lineHeight: 1.6, margin: 0 }}>{marker.description}</p>
            </div>
          </section>
        )}

        {/* Foods (direction-aware) */}
        {foods.length > 0 && (
          <section>
            <h2 style={h2}>{foodsHeading(marker.direction)}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {foods.map((f, i) => {
                const inner = (
                  <>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <span style={{ fontFamily: SANS, fontSize: 15, fontWeight: 600, color: TEXT, letterSpacing: "-0.01em" }}>{f.label}</span>
                      {f.freq && (
                        <span style={{ flexShrink: 0, fontFamily: SANS, fontSize: 10.5, fontWeight: 600, color: SAGE, background: `rgba(${SAGE_RGB},0.12)`, border: `0.5px solid rgba(${SAGE_RGB},0.28)`, borderRadius: 999, padding: "3px 10px" }}>{f.freq}</span>
                      )}
                    </div>
                    {f.why && <p style={{ fontFamily: SANS, fontSize: 13, color: TEXT_SEC, lineHeight: 1.55, margin: "7px 0 0" }}>{f.why}</p>}
                    {f.slug && (
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: SANS, fontSize: 12, fontWeight: 600, color: SAGE, marginTop: 9 }}>
                        Full food profile <ChevronRight size={13} />
                      </div>
                    )}
                  </>
                );
                return f.slug ? (
                  <Link key={i} href={withFrom(`/foods/${f.slug}`, `/nutrition/markers/${marker.slug}`, marker.name)} className="mk-food" style={{ ...cardStyle, padding: "15px 17px", textDecoration: "none", color: "inherit", display: "block" }}>
                    {inner}
                  </Link>
                ) : (
                  <div key={i} style={{ ...cardStyle, padding: "15px 17px" }}>{inner}</div>
                );
              })}
            </div>
          </section>
        )}

        {/* Absorption tip */}
        {marker.absorption_tip && (
          <section>
            <div style={{ ...cardStyle, padding: "15px 17px", display: "flex", gap: 12, borderLeft: `3px solid rgba(${SAGE_RGB},0.5)` }}>
              <Lightbulb size={18} color={SAGE} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 4 }}>Make it count</div>
                <p style={{ fontFamily: SANS, fontSize: 13.5, color: TEXT_SEC, lineHeight: 1.55, margin: 0 }}>{marker.absorption_tip}</p>
              </div>
            </div>
          </section>
        )}

        {/* Recipes that help */}
        {helpfulRecipes.length > 0 && (
          <section>
            <h2 style={h2}>Recipes that help</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(168px, 1fr))", gap: 14 }}>
              {helpfulRecipes.map((r) => (
                <RecipeCard key={r.id} r={r} from={`/nutrition/markers/${marker.slug}`} fromLabel={marker.name} />
              ))}
            </div>
          </section>
        )}

        {/* Disclaimer */}
        <p style={{ fontFamily: SANS, fontSize: 11.5, color: TEXT_TER, lineHeight: 1.55, margin: "4px 0 0", fontStyle: "italic" }}>
          Food supports your levels alongside — not instead of — your doctor&rsquo;s guidance. NŪRA doesn&rsquo;t diagnose or treat medical conditions.
        </p>

        <style>{`.mk-food { transition: border-color 160ms, background 160ms; } .mk-food:hover { border-color: rgba(${SAGE_RGB},0.4); background: rgba(${SAGE_RGB},0.05); }`}</style>
      </div>
    </NuraPageShell>
  );
}
