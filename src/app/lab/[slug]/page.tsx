import { redirect, notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import NuraPageShell from "@/components/NuraPageShell";
import ScoreRing from "../ScoreRing";
import SaveButton from "./SaveButton";
import CollapsibleSection from "./CollapsibleSection";
import { ProductCard, type LabProduct } from "../LabBrowseClient";
import {
  ArrowUpRight, FlaskConical, AlertTriangle, Leaf, Droplets, FileText,
} from "lucide-react";

// ── Design tokens ───────────────────────────────────────────────────────────
const TEXT = "var(--nura-text-primary)";
const TEXT_SEC = "var(--nura-text-secondary)";
const TEXT_TER = "var(--nura-text-tertiary)";
const BORDER = "var(--nura-border)";
const SURFACE = "var(--nura-surface)";
const SAGE = "var(--nura-sage)";
const SAGE_ON = "var(--nura-sage-bg-on)";
const SAGE_RGB = "var(--nura-sage-rgb)";
const FG_RGB = "var(--nura-fg-rgb)";
const SANS = "var(--font-inter), system-ui, sans-serif";
const AMBER = "var(--nura-watch)";
const RED = "var(--nura-danger)";

// ── Types ───────────────────────────────────────────────────────────────────
interface ProductRow {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  category_id: string | null;
  score: number | null;
  score_label: string | null;
  score_rationale: string | null;
  lab_tested: boolean | null;
  microplastics_present: boolean | null;
  image_url: string | null;
  shop_url: string | null;
  properties: Record<string, unknown> | null;
}

interface Measurement {
  name: string;
  description: string | null;
  unit: string | null;
  kind: string | null;
  sort_order: number | null;
  value: number | null;
  risk_count: number | null;
}

interface DocRow {
  id: string;
  title: string;
  doc_type: string | null;
  year: number | null;
  source_url: string | null;
  storage_path: string | null;
}

// ── Small presentational helpers ──────────────────────────────────────────────
function Eyebrow({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: color ?? TEXT_TER }}>
      {children}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontFamily: SANS, fontSize: 22, fontWeight: 600, color: TEXT, margin: "0 0 12px", letterSpacing: "-0.02em" }}>
      {children}
    </h2>
  );
}

function valueLabel(m: { value: number | null; unit: string | null }): string {
  if (m.value === null || m.value === undefined) return "—";
  return m.unit ? `${m.value} ${m.unit}` : `${m.value}`;
}

// Non-interactive status marker: a small solid rounded pill — sage/green for
// good signals, salmon/red for flagged, muted for unknown. Purely a color
// indicator (no knob, not a control). Theme-aware via NŪRA tokens.
function StatusPill({ good }: { good: boolean | null }) {
  const color =
    good === true ? SAGE : good === false ? RED : `rgba(${FG_RGB},0.16)`;
  return (
    <span
      aria-hidden
      style={{
        width: 22, height: 8, borderRadius: 999,
        background: color, flexShrink: 0, display: "inline-block",
      }}
    />
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function LabProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/dashboard");

  // Beta-flag gate — same as the browse page
  const { data: profileData } = await supabaseAdmin
    .from("profiles")
    .select("catalog_beta_enabled")
    .eq("id", user.id)
    .single();
  if ((profileData as { catalog_beta_enabled: boolean } | null)?.catalog_beta_enabled !== true) {
    redirect("/dashboard");
  }

  // Product by slug — published only
  const { data: productData } = await supabaseAdmin
    .from("catalog_products")
    .select("id, slug, name, brand, category_id, score, score_label, score_rationale, lab_tested, microplastics_present, image_url, shop_url, properties")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  const product = productData as ProductRow | null;
  if (!product) notFound();

  // Related data
  const [
    { data: measurementRows },
    { data: documentRows },
    { data: relatedRows },
    { data: categoryRow },
    { data: savedRow },
  ] = await Promise.all([
    supabaseAdmin
      .from("catalog_product_measurements")
      .select("value, risk_count, catalog_measurement_types(name, description, unit, kind, sort_order)")
      .eq("product_id", product.id),
    supabaseAdmin
      .from("catalog_product_documents")
      .select("id, title, doc_type, year, source_url, storage_path")
      .eq("product_id", product.id)
      .order("sort_order", { ascending: true }),
    product.category_id
      ? supabaseAdmin
          .from("catalog_products")
          .select("id, slug, name, brand, score, lab_tested, image_url, category_id")
          .eq("status", "published")
          .eq("category_id", product.category_id)
          .neq("id", product.id)
          .order("score", { ascending: false, nullsFirst: false })
          .limit(10)
      : Promise.resolve({ data: [] as LabProduct[] }),
    product.category_id
      ? supabaseAdmin.from("catalog_categories").select("name, slug").eq("id", product.category_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabaseAdmin
      .from("catalog_saved_products")
      .select("product_id")
      .eq("user_id", user.id)
      .eq("product_id", product.id)
      .maybeSingle(),
  ]);

  // Normalize measurements + sort by the type's sort_order.
  // The embedded relation can come back as an object or a single-element array.
  type MType = { name: string; description: string | null; unit: string | null; kind: string | null; sort_order: number | null };
  const measurements: Measurement[] = ((measurementRows ?? []) as unknown as Array<{
    value: number | null;
    risk_count: number | null;
    catalog_measurement_types: MType | MType[] | null;
  }>)
    .map((r) => {
      const t = Array.isArray(r.catalog_measurement_types) ? r.catalog_measurement_types[0] : r.catalog_measurement_types;
      return t ? { ...t, value: r.value, risk_count: r.risk_count } : null;
    })
    .filter((m): m is Measurement => m !== null)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const contaminants = measurements.filter((m) => m.kind === "contaminant");
  const nutrients = measurements.filter((m) => m.kind === "nutrient");

  const documents = (documentRows ?? []) as DocRow[];
  const related = (relatedRows ?? []) as LabProduct[];
  const category = categoryRow as { name: string; slug: string } | null;
  const initialSaved = !!savedRow;

  // Resolve document URLs (storage_path → public URL in the catalog-documents bucket)
  const docLinks = documents
    .map((d) => {
      let url = d.source_url ?? null;
      if (!url && d.storage_path) {
        url = supabaseAdmin.storage.from("catalog-documents").getPublicUrl(d.storage_path).data.publicUrl;
      }
      return { ...d, url };
    })
    .filter((d) => !!d.url);

  // Properties → entries (only meaningful key/value pairs)
  const propEntries: [string, string][] = product.properties && typeof product.properties === "object" && !Array.isArray(product.properties)
    ? Object.entries(product.properties)
        .filter(([, v]) => v !== null && v !== undefined && v !== "")
        .map(([k, v]) => [k, typeof v === "object" ? JSON.stringify(v) : String(v)])
    : [];

  // Count every flagged measurement (risk_count > 0) across all sections, not
  // just the ones grouped under "Contaminants".
  const flaggedContaminants = measurements.filter((m) => (m.risk_count ?? 0) > 0).length;
  const indexed = documents.length > 0 || product.lab_tested === true;

  // Summary chips
  const summary: { Icon: typeof FlaskConical; label: string; value: string; good: boolean | null }[] = [
    { Icon: FlaskConical, label: "Lab tested", value: product.lab_tested ? "Yes" : "No", good: product.lab_tested ? true : null },
    { Icon: AlertTriangle, label: "Contaminants", value: String(flaggedContaminants), good: flaggedContaminants === 0 ? true : false },
    { Icon: Leaf, label: "Nutrients", value: String(nutrients.length), good: nutrients.length > 0 ? true : null },
    {
      Icon: Droplets,
      label: "Microplastics",
      value: product.microplastics_present === null || product.microplastics_present === undefined ? "—" : product.microplastics_present ? "Yes" : "No",
      good: product.microplastics_present === null || product.microplastics_present === undefined ? null : product.microplastics_present ? false : true,
    },
  ];

  const card: React.CSSProperties = { background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 14 };

  return (
    <NuraPageShell maxWidth={860} desktopMaxWidth={760}>
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

        {/* ── Header card ─────────────────────────────────────────────────── */}
        <div style={{ ...card, padding: 18 }}>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {/* Image — generous padding so the bottle sits centered with whitespace around it */}
            <div style={{ position: "relative", width: 300, maxWidth: "100%", aspectRatio: "1 / 1", flexShrink: 0, borderRadius: 14, overflow: "hidden", background: `rgba(${FG_RGB},0.04)`, border: `0.5px solid ${BORDER}` }}>
              <div style={{ position: "absolute", inset: 0, padding: "clamp(22px, 11%, 40px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {product.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.image_url} alt={product.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" }} />
                ) : (
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke={`rgba(${FG_RGB},0.22)`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
                  </svg>
                )}
              </div>

              {/* Top-right actions — Shop button immediately left of the bookmark */}
              <div style={{ position: "absolute", top: 8, right: 8, display: "flex", alignItems: "center", gap: 8 }}>
                {product.shop_url && (
                  <a
                    href={product.shop_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 5, height: 34, boxSizing: "border-box",
                      padding: "0 12px", borderRadius: 999,
                      background: SAGE, color: SAGE_ON, textDecoration: "none",
                      fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.28)",
                    }}
                  >
                    Shop <ArrowUpRight size={13} />
                  </a>
                )}
                <SaveButton productId={product.id} userId={user.id} initialSaved={initialSaved} />
              </div>
            </div>

            {/* Info column — title block, then summary rows, divider, and "Why this score" */}
            <div style={{ flex: 1, minWidth: 240, display: "flex", flexDirection: "column" }}>
              {/* Title row: name/brand/pill + score ring */}
              <div style={{ display: "flex", gap: 16, justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ minWidth: 0 }}>
                  {category && (
                    <span style={{ display: "inline-block", fontFamily: SANS, fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--nura-accent-label)", background: `rgba(${SAGE_RGB},0.14)`, border: `0.5px solid rgba(${SAGE_RGB},0.3)`, borderRadius: 8, padding: "3px 8px", marginBottom: 10 }}>
                      {category.name}
                    </span>
                  )}
                  <h1 style={{ fontFamily: SANS, fontSize: "clamp(26px, 4.5vw, 34px)", fontWeight: 600, color: TEXT, margin: "0 0 4px", letterSpacing: "-0.02em", lineHeight: 1.12 }}>
                    {product.name}
                  </h1>
                  {product.brand && (
                    <div style={{ fontFamily: SANS, fontSize: 14, color: TEXT_SEC }}>{product.brand}</div>
                  )}
                </div>

                {product.score !== null && (
                  <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <ScoreRing score={product.score} size={92} showScale />
                    {product.score_label && <Eyebrow color={TEXT_TER}>{product.score_label}</Eyebrow>}
                  </div>
                )}
              </div>

              {/* Summary — full-width rows: icon + label · value + toggle pill */}
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column" }}>
                {summary.map(({ Icon, label, value, good }, i) => (
                  <div
                    key={label}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                      minHeight: 44, padding: "9px 0",
                      borderTop: i === 0 ? "none" : `0.5px solid ${BORDER}`,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      <Icon size={16} color={TEXT_TER} style={{ flexShrink: 0 }} />
                      <span style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: 500, color: TEXT_SEC }}>{label}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                      <span style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: 600, color: TEXT }}>{value}</span>
                      <StatusPill good={good} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div style={{ borderTop: `0.5px solid ${BORDER}`, marginTop: 6 }} />

              {/* Why this score */}
              <div style={{ marginTop: 16, padding: 14, background: `rgba(${SAGE_RGB},0.06)`, border: `0.5px solid rgba(${SAGE_RGB},0.18)`, borderRadius: 12 }}>
                <Eyebrow color={SAGE}>Why this score</Eyebrow>
                <div style={{ marginTop: 8, fontFamily: SANS, fontSize: 13, color: TEXT_SEC, lineHeight: 1.6 }}>
                  {product.score_rationale ? (
                    product.score_rationale
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span>Lab report indexed: <span style={{ color: TEXT, fontWeight: 500 }}>{indexed ? "Indexed" : "Not indexed"}</span></span>
                      <span>Contaminants: <span style={{ color: TEXT, fontWeight: 500 }}>{flaggedContaminants} flagged</span></span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Contaminants ─────────────────────────────────────────────────── */}
        {contaminants.length > 0 && (
          <CollapsibleSection title="Contaminants">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {contaminants.map((m, i) => (
                <div key={`${m.name}-${i}`} style={{ ...card, padding: "14px 16px", borderLeft: `3px solid ${RED}` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: TEXT }}>{m.name}</span>
                      {(m.risk_count ?? 0) > 0 && (
                        <span style={{ fontFamily: SANS, fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: RED, background: "rgba(var(--nura-danger-rgb),0.12)", border: "0.5px solid rgba(var(--nura-danger-rgb),0.4)", borderRadius: 7, padding: "2px 7px" }}>
                          {m.risk_count} {m.risk_count === 1 ? "risk" : "risks"}
                        </span>
                      )}
                    </div>
                    <span style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: 600, color: TEXT_SEC }}>{valueLabel(m)}</span>
                  </div>
                  {m.description && (
                    <p style={{ margin: "8px 0 0", fontFamily: SANS, fontSize: 12.5, color: TEXT_TER, lineHeight: 1.55 }}>{m.description}</p>
                  )}
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* ── Ingredients & minerals ───────────────────────────────────────── */}
        {nutrients.length > 0 && (
          <CollapsibleSection title="Ingredients & minerals">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {nutrients.map((m, i) => {
                const flagged = (m.risk_count ?? 0) > 0;
                return (
                  <div key={`${m.name}-${i}`} style={{ ...card, padding: "14px 16px", borderLeft: `3px solid ${flagged ? AMBER : `rgba(${SAGE_RGB},0.5)`}` }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: TEXT }}>{m.name}</span>
                        {flagged && (
                          <span style={{ fontFamily: SANS, fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: AMBER, background: "rgba(var(--nura-watch-rgb),0.12)", border: "0.5px solid rgba(var(--nura-watch-rgb),0.4)", borderRadius: 7, padding: "2px 7px" }}>
                            {m.risk_count} {m.risk_count === 1 ? "risk" : "risks"}
                          </span>
                        )}
                      </div>
                      <span style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: 600, color: TEXT_SEC }}>{valueLabel(m)}</span>
                    </div>
                    {m.description && (
                      <p style={{ margin: "8px 0 0", fontFamily: SANS, fontSize: 12.5, color: TEXT_TER, lineHeight: 1.55 }}>{m.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </CollapsibleSection>
        )}

        {/* ── Properties ───────────────────────────────────────────────────── */}
        {propEntries.length > 0 && (
          <CollapsibleSection title="Details">
            <div className="lab-props-grid">
              {propEntries.map(([k, v]) => (
                <div key={k} style={{ ...card, padding: "12px 14px", height: "100%" }}>
                  <Eyebrow color={TEXT_TER}>{k}</Eyebrow>
                  <div style={{ marginTop: 5, fontFamily: SANS, fontSize: 14, color: TEXT, lineHeight: 1.5, wordBreak: "break-word" }}>{v}</div>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* ── Sources ──────────────────────────────────────────────────────── */}
        {docLinks.length > 0 && (
          <CollapsibleSection title="Sources">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
              {docLinks.map((d) => (
                <a
                  key={d.id}
                  href={d.url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lab-source"
                  style={{ ...card, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit" }}
                >
                  <FileText size={16} color={SAGE} style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: 500, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.title}</div>
                    {(d.doc_type || d.year) && (
                      <Eyebrow color={TEXT_TER}>{[d.doc_type, d.year].filter(Boolean).join(" · ")}</Eyebrow>
                    )}
                  </div>
                  <ArrowUpRight size={14} color={TEXT_TER} style={{ flexShrink: 0 }} />
                </a>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* ── Related ──────────────────────────────────────────────────────── */}
        {related.length > 0 && (
          <section>
            <SectionHeading>More in this category</SectionHeading>
            <div className="lab-rel-row" style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 4 }}>
              {related.map((p) => (
                <div key={p.id} style={{ width: 168, flexShrink: 0 }}>
                  <ProductCard p={p} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <style>{`
        .lab-source { transition: border-color 180ms, background 180ms; }
        .lab-source:hover { border-color: rgba(var(--nura-sage-rgb),0.4); background: var(--nura-surface-elevated); }
        .lab-rel-row { scrollbar-width: none; }
        .lab-rel-row::-webkit-scrollbar { display: none; }
        /* Details grid — uniform 2-up cells that size to content, single column on mobile */
        .lab-props-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; align-items: stretch; }
        @media (max-width: 480px) { .lab-props-grid { grid-template-columns: 1fr; } }
      `}</style>
    </NuraPageShell>
  );
}
