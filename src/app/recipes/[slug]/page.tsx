import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import NuraPageShell from "@/components/NuraPageShell";
import { ArrowLeft, Clock, Users, Leaf } from "lucide-react";
import { sageGradient } from "@/lib/sageGradient";
import { resolveBack, type RawSearchParam } from "@/lib/backNav";
import { isUserAdmin } from "@/lib/admin";
import { withImageUrlFallback } from "@/lib/recipeSelect";
import RecipeImg from "@/components/RecipeImg";
import { SavedRecipesProvider } from "@/components/SavedRecipesProvider";
import SaveRecipeButton from "@/components/SaveRecipeButton";
import IngredientRow, { type RecipeIngredient } from "./IngredientRow";
import DraftPreviewBanner from "./DraftPreviewBanner";

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

interface Step { n?: number; text?: string }
interface ExplainerBlock { heading?: string; body?: string }

interface RecipeRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string;
  cuisine: string | null;
  total_minutes: number | null;
  servings: number | null;
  is_organic: boolean;
  system_tags: string[] | null;
  method_steps: Step[] | null;
  hero_style: string | null;
  image_url: string | null;
  focal_x: number | null;
  focal_y: number | null;
  status: string;
}

type IngredientEmbed = {
  slug: string;
  name: string;
  tagline: string | null;
  active_compounds: string[] | null;
  cellular_explainer: ExplainerBlock[] | null;
};

interface LinkRow {
  amount_text: string | null;
  order_index: number | null;
  primary_system: string | null;
  context_note: string | null;
  ingredients: IngredientEmbed | IngredientEmbed[] | null;
}

function pretty(t: string): string {
  return t.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function categoryLabel(v: string): string {
  return v.charAt(0).toUpperCase() + v.slice(1);
}

export default async function RecipeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: RawSearchParam; label?: RawSearchParam; preview?: RawSearchParam }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const back = resolveBack(sp, { href: "/recipes", label: "Recipes" });

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/dashboard");

  const recipe = await withImageUrlFallback<RecipeRow>((imageCol) =>
    supabaseAdmin
      .from("recipes")
      .select(`id, slug, title, description, category, cuisine, total_minutes, servings, is_organic, system_tags, method_steps, hero_style, status${imageCol}`)
      .eq("slug", slug)
      .maybeSingle()
  );
  if (!recipe) notFound();

  // Drafts are NOT public. Only an admin hitting ?preview=1 may view one; anyone
  // else (or a draft without the flag) gets the normal not-found — never draft
  // content leaking. Published recipes render for any signed-in user as before.
  const isDraft = recipe.status !== "published";
  const previewParam = Array.isArray(sp.preview) ? sp.preview[0] : sp.preview;
  const draftPreview = isDraft && previewParam === "1" && (await isUserAdmin(user.id));
  if (isDraft && !draftPreview) notFound();

  const [{ data: linkRows }, { data: savedRow }] = await Promise.all([
    supabaseAdmin
      .from("recipe_ingredients")
      .select("amount_text, order_index, primary_system, context_note, ingredients(slug, name, tagline, active_compounds, cellular_explainer)")
      .eq("recipe_id", recipe.id)
      .order("order_index", { ascending: true }),
    supabaseAdmin
      .from("saved_recipes")
      .select("recipe_id")
      .eq("user_id", user.id)
      .eq("recipe_id", recipe.id)
      .maybeSingle(),
  ]);

  // Normalize join rows → IngredientRow props. Handle missing ingredient embeds.
  const ingredients: RecipeIngredient[] = ((linkRows ?? []) as LinkRow[]).map((row) => {
    const ing = Array.isArray(row.ingredients) ? row.ingredients[0] : row.ingredients;
    const firstBlock = ing?.cellular_explainer?.[0] ?? null;
    return {
      slug: ing?.slug ?? null,
      name: ing?.name ?? "Ingredient",
      amountText: row.amount_text,
      primarySystem: row.primary_system,
      contextNote: row.context_note,
      primaryCompound: ing?.active_compounds?.[0] ?? null,
      explainerHeading: firstBlock?.heading ?? null,
      explainerBody: firstBlock?.body ?? null,
      tagline: ing?.tagline ?? null,
    };
  });

  const steps = (recipe.method_steps ?? [])
    .filter((s) => s && s.text)
    .sort((a, b) => (a.n ?? 0) - (b.n ?? 0));
  const systemTags = recipe.system_tags ?? [];
  const initialSaved = !!savedRow;

  const card: React.CSSProperties = { background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 14 };
  const heading: React.CSSProperties = { fontFamily: SANS, fontSize: 22, fontWeight: 600, color: TEXT, margin: "0 0 12px", letterSpacing: "-0.02em" };

  return (
    <NuraPageShell maxWidth={860} desktopMaxWidth={760}>
      <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>

        {draftPreview && <DraftPreviewBanner />}

        {/* Back — context-aware (recipes grid, or the food we arrived from) */}
        <Link href={back.href} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: SANS, fontSize: 13, fontWeight: 600, color: TEXT_SEC, textDecoration: "none", alignSelf: "flex-start", maxWidth: "100%" }}>
          <ArrowLeft size={15} style={{ flexShrink: 0 }} /> <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{back.label}</span>
        </Link>

        {/* Hero — tall clamped frame (not aspect-ratio, so mobile stays tall
            instead of collapsing to a strip). Photo fills it with the focal point
            honored; gradient fallback uses the same height. */}
        <div style={{ position: "relative", borderRadius: 18, overflow: "hidden", border: `0.5px solid ${BORDER}`, height: "clamp(300px, 40vw, 400px)", background: sageGradient(recipe.hero_style ?? recipe.slug) }}>
          {recipe.image_url && (
            <RecipeImg src={recipe.image_url} alt={recipe.title} focalX={recipe.focal_x} focalY={recipe.focal_y} priority />
          )}
          {/* Soft fade of the bottom edge into the page background */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 60%, var(--nura-bg) 100%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: 12, right: 12, zIndex: 2 }}>
            <SavedRecipesProvider userId={user.id} initialSavedIds={initialSaved ? [recipe.id] : []}>
              <SaveRecipeButton recipeId={recipe.id} />
            </SavedRecipesProvider>
          </div>
        </div>

        {/* Title block */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            <span style={{ fontFamily: SANS, fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--nura-accent-label)", background: `rgba(${SAGE_RGB},0.14)`, border: `0.5px solid rgba(${SAGE_RGB},0.3)`, borderRadius: 8, padding: "3px 8px" }}>
              {categoryLabel(recipe.category)}{recipe.cuisine ? ` · ${recipe.cuisine}` : ""}
            </span>
            {recipe.is_organic && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: SANS, fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--nura-accent-label)", border: `0.5px solid rgba(${SAGE_RGB},0.3)`, borderRadius: 8, padding: "3px 8px" }}>
                <Leaf size={10} /> Organic
              </span>
            )}
          </div>

          <h1 style={{ fontFamily: SANS, fontSize: "clamp(26px, 4.5vw, 34px)", fontWeight: 600, color: TEXT, margin: "0 0 10px", letterSpacing: "-0.02em", lineHeight: 1.12 }}>
            {recipe.title}
          </h1>

          {recipe.description && (
            <p style={{ fontFamily: SANS, fontSize: 14.5, color: TEXT_SEC, lineHeight: 1.6, margin: 0, maxWidth: 620 }}>
              {recipe.description}
            </p>
          )}

          <div style={{ display: "flex", gap: 16, marginTop: 14, flexWrap: "wrap" }}>
            {recipe.total_minutes !== null && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: SANS, fontSize: 13, color: TEXT_SEC }}>
                <Clock size={14} color={SAGE} /> {recipe.total_minutes} min
              </span>
            )}
            {recipe.servings !== null && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: SANS, fontSize: 13, color: TEXT_SEC }}>
                <Users size={14} color={SAGE} /> Serves {recipe.servings}
              </span>
            )}
          </div>
        </div>

        {/* What this bowl works on (system tags) */}
        {systemTags.length > 0 && (
          <section className="nura-card" style={{ ...card, padding: "16px 18px" }}>
            <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--nura-accent-label)", marginBottom: 10 }}>
              What this bowl works on
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {systemTags.map((t) => (
                <span key={t} style={{ fontFamily: SANS, fontSize: 12, fontWeight: 500, color: TEXT, background: `rgba(${SAGE_RGB},0.1)`, border: `0.5px solid rgba(${SAGE_RGB},0.25)`, borderRadius: 999, padding: "5px 12px" }}>
                  {pretty(t)}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Ingredients */}
        <section>
          <h2 style={heading}>Ingredients</h2>
          {ingredients.length === 0 ? (
            <div className="nura-card" style={{ ...card, padding: "16px 18px", fontFamily: SANS, fontSize: 13.5, color: TEXT_TER }}>
              Ingredients for this recipe are coming soon.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {ingredients.map((ing, i) => (
                <IngredientRow
                  key={`${ing.slug ?? "x"}-${i}`}
                  ing={ing}
                  fromPath={`/recipes/${recipe.slug}`}
                  fromLabel={recipe.title}
                />
              ))}
            </div>
          )}
        </section>

        {/* Method */}
        <section>
          <h2 style={heading}>Method</h2>
          {steps.length === 0 ? (
            <div className="nura-card" style={{ ...card, padding: "16px 18px", fontFamily: SANS, fontSize: 13.5, color: TEXT_TER }}>
              Step-by-step method is coming soon.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {steps.map((s, i) => (
                <div className="nura-card" key={i} style={{ ...card, padding: "14px 16px", display: "flex", gap: 13 }}>
                  <span style={{ flexShrink: 0, width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: `rgba(${SAGE_RGB},0.14)`, border: `0.5px solid rgba(${SAGE_RGB},0.3)`, fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: "var(--nura-accent-text)" }}>
                    {s.n ?? i + 1}
                  </span>
                  <p style={{ fontFamily: SANS, fontSize: 14, color: TEXT_SEC, lineHeight: 1.6, margin: "2px 0 0" }}>{s.text}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </NuraPageShell>
  );
}
