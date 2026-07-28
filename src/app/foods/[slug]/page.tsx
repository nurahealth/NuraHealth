import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import NuraPageShell from "@/components/NuraPageShell";
import { ArrowLeft, Leaf } from "lucide-react";
import { sageGradient } from "@/lib/sageGradient";
import { resolveBack, withFrom, type RawSearchParam } from "@/lib/backNav";
import SaveButton from "./SaveButton";
import { RecipeCard, type Recipe } from "../../recipes/RecipesBrowseClient";
import { withImageUrlFallback } from "@/lib/recipeSelect";

export const dynamic = "force-dynamic";

// ── Design tokens ───────────────────────────────────────────────────────────
const TEXT = "var(--nura-text-primary)";
const TEXT_SEC = "var(--nura-text-secondary)";
const TEXT_TER = "var(--nura-text-tertiary)";
const BORDER = "var(--nura-border)";
const SURFACE = "var(--nura-surface)";
const SAGE = "var(--nura-sage)";
const SAGE_RGB = "var(--nura-sage-rgb)";
const SANS = "var(--font-inter), system-ui, sans-serif";

interface ExplainerBlock { heading?: string; body?: string }
interface HowToStep { n?: number; text?: string }

interface IngredientRow {
  id: string;
  slug: string;
  name: string;
  category: string;
  tagline: string | null;
  is_organic: boolean;
  supports_systems: string[] | null;
  active_compounds: string[] | null;
  cellular_explainer: ExplainerBlock[] | null;
  how_to_use: HowToStep[] | null;
  pairs_with: string[] | null;
}

function pretty(t: string): string {
  return t.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function FoodDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: RawSearchParam; label?: RawSearchParam }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  // Default back = the foods grid; overridden when we arrived from a recipe.
  const back = resolveBack(sp, { href: "/foods", label: "Foods" });

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/dashboard");

  const { data: ingredientData } = await supabaseAdmin
    .from("ingredients")
    .select("id, slug, name, category, tagline, is_organic, supports_systems, active_compounds, cellular_explainer, how_to_use, pairs_with")
    .eq("slug", slug)
    .maybeSingle();

  const ing = ingredientData as IngredientRow | null;
  if (!ing) notFound();

  const pairsWith = ing.pairs_with ?? [];

  // Reverse lookup: recipes that use this ingredient.
  const linkRows = await withImageUrlFallback<unknown[]>((imageCol) =>
    supabaseAdmin
      .from("recipe_ingredients")
      .select(`recipes(id, slug, title, description, category, cuisine, total_minutes, servings, is_organic, goal_tags, system_tags, status${imageCol})`)
      .eq("ingredient_id", ing.id)
  );

  type RecipeEmbed = {
    id: string; slug: string; title: string; description: string | null;
    category: string; cuisine: string | null; total_minutes: number | null;
    servings: number | null; is_organic: boolean;
    goal_tags: string[] | null; system_tags: string[] | null; status: string; image_url: string | null;
    focal_x: number | null; focal_y: number | null;
  };
  const foundIn: Recipe[] = ((linkRows ?? []) as Array<{ recipes: RecipeEmbed | RecipeEmbed[] | null }>)
    .map((row) => (Array.isArray(row.recipes) ? row.recipes[0] : row.recipes))
    .filter((r): r is RecipeEmbed => !!r)
    .map((r) => ({
      id: r.id, slug: r.slug, title: r.title, description: r.description,
      category: r.category, cuisine: r.cuisine, total_minutes: r.total_minutes,
      servings: r.servings, is_organic: r.is_organic,
      goal_tags: r.goal_tags ?? [], system_tags: r.system_tags ?? [],
      status: r.status, image_url: r.image_url ?? null,
      focal_x: r.focal_x ?? null, focal_y: r.focal_y ?? null, ingredientNames: [],
    }));

  // Which pairs_with slugs are real ingredients (linkable)?
  const linkable = new Set<string>();
  if (pairsWith.length > 0) {
    const { data: existing } = await supabaseAdmin
      .from("ingredients")
      .select("slug")
      .in("slug", pairsWith);
    for (const e of (existing ?? []) as { slug: string }[]) linkable.add(e.slug);
  }

  const supports = ing.supports_systems ?? [];
  const compounds = ing.active_compounds ?? [];
  const explainer = (ing.cellular_explainer ?? []).filter((b) => b && (b.heading || b.body));
  const howTo = (ing.how_to_use ?? []).filter((s) => s && s.text).sort((a, b) => (a.n ?? 0) - (b.n ?? 0));

  const card: React.CSSProperties = { background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 14 };
  const heading: React.CSSProperties = { fontFamily: SANS, fontSize: 22, fontWeight: 600, color: TEXT, margin: "0 0 12px", letterSpacing: "-0.02em" };

  const chip = (label: string, key: string) => (
    <span key={key} style={{ fontFamily: SANS, fontSize: 12, fontWeight: 500, color: TEXT, background: `rgba(${SAGE_RGB},0.1)`, border: `0.5px solid rgba(${SAGE_RGB},0.25)`, borderRadius: 999, padding: "5px 12px" }}>
      {label}
    </span>
  );

  return (
    <NuraPageShell maxWidth={860} desktopMaxWidth={760}>
      <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>

        {/* Back — context-aware: foods grid, or the recipe we arrived from */}
        <Link href={back.href} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: SANS, fontSize: 13, fontWeight: 600, color: TEXT_SEC, textDecoration: "none", alignSelf: "flex-start", maxWidth: "100%" }}>
          <ArrowLeft size={15} style={{ flexShrink: 0 }} /> <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{back.label}</span>
        </Link>

        {/* Hero */}
        <div style={{ position: "relative", borderRadius: 18, overflow: "hidden", border: `0.5px solid ${BORDER}`, minHeight: 180, background: sageGradient(ing.slug) }}>
          <div style={{ position: "absolute", top: 12, right: 12, zIndex: 2 }}>
            <SaveButton />
          </div>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Leaf size={30} color="rgba(var(--nura-bg-tint-rgb),0.22)" strokeWidth={1.5} />
          </div>
          <div style={{ minHeight: 180 }} />
        </div>

        {/* Title block */}
        <div>
          <span style={{ display: "inline-block", fontFamily: SANS, fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: SAGE, background: `rgba(${SAGE_RGB},0.14)`, border: `0.5px solid rgba(${SAGE_RGB},0.3)`, borderRadius: 8, padding: "3px 8px", marginBottom: 10 }}>
            {pretty(ing.category)}{ing.is_organic ? " · Organic" : ""}
          </span>
          <h1 style={{ fontFamily: SANS, fontSize: "clamp(26px, 4.5vw, 34px)", fontWeight: 600, color: TEXT, margin: "0 0 8px", letterSpacing: "-0.02em", lineHeight: 1.12 }}>
            {ing.name}
          </h1>
          {ing.tagline && (
            <p style={{ fontFamily: SANS, fontSize: 15.5, color: TEXT_SEC, lineHeight: 1.55, margin: 0, maxWidth: 620, fontStyle: "italic" }}>
              {ing.tagline}
            </p>
          )}
        </div>

        {/* Supports + compounds */}
        {(supports.length > 0 || compounds.length > 0) && (
          <section style={{ ...card, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 16 }}>
            {supports.length > 0 && (
              <div>
                <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: SAGE, marginBottom: 10 }}>Supports</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{supports.map((s) => chip(pretty(s), s))}</div>
              </div>
            )}
            {compounds.length > 0 && (
              <div>
                <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: SAGE, marginBottom: 10 }}>Active compounds</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{compounds.map((c) => chip(c, c))}</div>
              </div>
            )}
          </section>
        )}

        {/* What it does in your cells */}
        {explainer.length > 0 && (
          <section>
            <h2 style={heading}>What it does in your cells</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {explainer.map((b, i) => (
                <div key={i} style={{ ...card, padding: "16px 18px", borderLeft: `3px solid rgba(${SAGE_RGB},0.5)` }}>
                  {b.heading && (
                    <div style={{ fontFamily: SANS, fontSize: 15, fontWeight: 600, color: TEXT, marginBottom: 6, letterSpacing: "-0.01em" }}>{b.heading}</div>
                  )}
                  {b.body && (
                    <p style={{ fontFamily: SANS, fontSize: 13.5, color: TEXT_SEC, lineHeight: 1.6, margin: 0 }}>{b.body}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Get the most from it */}
        {howTo.length > 0 && (
          <section>
            <h2 style={heading}>Get the most from it</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {howTo.map((s, i) => (
                <div key={i} style={{ ...card, padding: "14px 16px", display: "flex", gap: 13 }}>
                  <span style={{ flexShrink: 0, width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: `rgba(${SAGE_RGB},0.14)`, border: `0.5px solid rgba(${SAGE_RGB},0.3)`, fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: SAGE }}>
                    {s.n ?? i + 1}
                  </span>
                  <p style={{ fontFamily: SANS, fontSize: 14, color: TEXT_SEC, lineHeight: 1.6, margin: "2px 0 0" }}>{s.text}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Pairs well with */}
        {pairsWith.length > 0 && (
          <section>
            <h2 style={heading}>Pairs well with</h2>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {pairsWith.map((p) =>
                linkable.has(p) ? (
                  <Link key={p} href={withFrom(`/foods/${p}`, `/foods/${ing.slug}`, ing.name)} className="fd-pair" style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: SAGE, background: `rgba(${SAGE_RGB},0.12)`, border: `0.5px solid rgba(${SAGE_RGB},0.3)`, borderRadius: 999, padding: "6px 13px", textDecoration: "none" }}>
                    {pretty(p)}
                  </Link>
                ) : (
                  <span key={p} style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 500, color: TEXT_TER, background: `rgba(var(--nura-bg-tint-rgb),0.04)`, border: `0.5px solid ${BORDER}`, borderRadius: 999, padding: "6px 13px" }}>
                    {pretty(p)}
                  </span>
                )
              )}
            </div>
            <style>{`.fd-pair { transition: background 160ms, border-color 160ms; } .fd-pair:hover { background: rgba(var(--nura-sage-rgb),0.18); }`}</style>
          </section>
        )}

        {/* Found in these recipes */}
        {foundIn.length > 0 && (
          <section>
            <h2 style={heading}>Found in these recipes</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(168px, 1fr))", gap: 14 }}>
              {foundIn.map((r) => <RecipeCard key={r.id} r={r} from={`/foods/${ing.slug}`} fromLabel={ing.name} />)}
            </div>
          </section>
        )}
      </div>
    </NuraPageShell>
  );
}
