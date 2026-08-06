"use client";

import { useId, useState, type CSSProperties, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import { getOverallHealth, type HealthPillar, type HealthTrend } from "@/lib/dashboardData";
import { useThemeTokens, useIsLightForm } from "@/lib/themeTokens";
import { useAccents } from "@/lib/accents";
import { MONO } from "@/components/dashboard/chartTheme";

// ─────────────────────────────────────────────────────────────────────────────
// Overall Health — the dashboard's top section: a single Health Score blended
// from six pillars, an interactive energy-ring, a pillar accordion, a stat strip,
// and an expandable "What to improve" plan. Matches the Overall Health mockup.
// ─────────────────────────────────────────────────────────────────────────────

const SANS = "var(--font-inter), system-ui, sans-serif";
const SERIF = "'Fraunces', Georgia, serif";
const TEXT = "var(--nura-text-primary)";
const MUTED = "var(--nura-ink-muted)";
const FAINT = "var(--nura-ink-faint)";
const GOLD = "var(--nura-good)";

// Colours this card needs as concrete values rather than var() references: the
// ring ramp is interpolated, and SVG presentation attributes do not accept
// var(). Fallbacks are the dark values, so SSR and first paint agree.
// See lib/themeTokens.ts.
// The dial's ramp was sage → HRV teal → sleep indigo: three metrics' hues
// borrowed to make one arc, on a card that is about none of them. It is now
// three steps of the shared ordered ramp, so the hero mark on the dashboard is
// the same colour idea as every chart beneath it — magnitude as depth, one hue.
const RING_TOKENS = {
  // What survives the halo dial: the pillar text needs ink and the alert hue
  // for its trend arrows. Everything the filament ring resolved — the three
  // dial stops, the glow rgb, the score gradient, the ring head — went with
  // it; the new dial reads --nura-dial-* straight from CSS, because it has no
  // colour maths to do.
  trendUp: ["--nura-trend-up", "#5dccae"],
  alert:   ["--nura-alert", "#e8745a"],
  inkRgb:  ["--nura-fg-rgb", "235,230,216"],
} as const;

const tArrow = (t: HealthTrend) => (t === "up" ? "▲" : t === "down" ? "▼" : "–");
type RingTokens = Record<keyof typeof RING_TOKENS, string>;
const tCol = (t: HealthTrend, tk: RingTokens) =>
  t === "up" ? tk.trendUp : t === "down" ? tk.alert : `rgba(${tk.inkRgb},0.4)`;

const Chevron = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={FAINT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
);

// Plan-chip icons.
function PlanIcon({ name, color }: { name: string; color: string }) {
  const common = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "move": return <svg {...common}><path d="M13 4v6l4 2M9 20l2-6-3-3 1-4 3 2 3 1" /><circle cx="14" cy="5" r="1.6" /></svg>;
    case "moon": return <svg {...common}><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8z" /></svg>;
    case "fork": return <svg {...common}><path d="M6 3v7a2 2 0 0 0 4 0V3M8 10v11M18 3c-1.5 0-2.5 1.5-2.5 4.5S16.5 12 18 12v9" /></svg>;
    case "sugar": return <svg {...common}><path d="M12 3s5 5.5 5 10a5 5 0 0 1-10 0c0-4.5 5-10 5-10z" /></svg>;
    case "pill": return <svg {...common}><rect x="3" y="8" width="18" height="8" rx="4" /><path d="M12 8v8" /></svg>;
    default: return <svg {...common}><circle cx="12" cy="12" r="8" /></svg>;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
export default function OverallHealthCard() {
  const tk = useThemeTokens(RING_TOKENS);
  const acc = useAccents();
  const router = useRouter();
  const d = getOverallHealth();
  const [selected, setSelected] = useState<string | null>(null);
  const [openPlan, setOpenPlan] = useState<string | null>(null);

  const togglePillar = (k: string) => setSelected((s) => (s === k ? null : k));
  const togglePlan = (t: string) => setOpenPlan((s) => (s === t ? null : t));

  return (
    <div className="oh-card" style={{
      position: "relative", overflow: "hidden",
      display: "flex", flexDirection: "column",
      background: "var(--nura-glass)", border: "1px solid var(--nura-glass-line)",
      borderRadius: 24, padding: "20px 16px 18px", marginBottom: 16,
      boxShadow: "inset 0 1px 0 var(--nura-card-highlight), var(--nura-card-shadow)",
    }}>
      <style>{`
        .oh-pill-head:hover .oh-nm { color: var(--nura-text-strong); }
        .oh-imp-item { transition: border-color .18s; }

        /* Phone: one column, ring at the full card width — unchanged. The
           halo sizes live here rather than inline so the wide breakpoint can
           scale the lg one with the dial. */
        .oh-ring { position: relative; width: 100%; }
        .oh-halo-sm { width: 300px; height: 300px; }
        .oh-halo-lg { display: none; width: 300px; height: 300px; }

        @media (min-width: 1024px) {
          /* The desktop card spans the whole page measure, so anything that
             was sized as "100% of a half-width column" needs a ceiling of its
             own — otherwise the prose runs edge to edge. */
          .oh-card { padding: 28px 32px 26px !important; }
          /* Laptop width: still one column, but the dial is a hero rather than
             a 300px token — it fills the card at 1024 and is capped just under
             what the two-column layout hands it at 1280, so crossing that
             breakpoint never shrinks the dial. */
          .oh-ring { max-width: 500px; margin: 0 auto; }
          .oh-explain, .oh-imp-body { max-width: 74ch; }
          .oh-explain { margin-left: auto; margin-right: auto; }
          /* The halo is anchored to the card, whose height changed; at this
             width it rides with the ring instead. */
          .oh-halo-sm { display: none; }
          .oh-halo-lg { display: block; }
        }

        @media (min-width: 1280px) {
          /* Wide enough to seat the dial and the pillar list side by side.
             That is what kills the flanking whitespace the centred dial used
             to float in: the dial takes ~55% of the card and reads as the
             hero, and the six pillars balance it on the right instead of
             stretching across a 1000px row.

             align-items:center rather than start on purpose — if one column
             runs taller (a pillar opens, say) the difference splits into
             symmetric breathing room around the dial instead of stranding a
             void under one of them. */
          .oh-body {
            display: grid;
            grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
            gap: 40px;
            align-items: center;
          }
          .oh-ring { max-width: none; margin: 0; }
          /* The explainer belongs to the dial, so it sits under it and is
             measured against the dial column, not the card. */
          .oh-explain { max-width: none; text-align: center; margin-top: 10px; }
          .oh-side { min-width: 0; }
          /* Glow scales with the dial instead of staying a fixed 300px disc. */
          .oh-halo-lg { width: 58%; height: auto; aspect-ratio: 1; }
        }
      `}</style>
      {/* Soft glow core behind the ring — dark only (see the flattening
          layer in globals.css). */}
      <div aria-hidden className="nura-halo oh-halo-sm" style={{ position: "absolute", left: "50%", top: 120, transform: "translate(-50%,-50%)", pointerEvents: "none", background: "radial-gradient(circle, rgba(var(--nura-teal-rgb),0.12) 0%, rgba(var(--nura-teal-rgb),0) 62%)" }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "0 4px", position: "relative" }}>
        <div>
          <div style={{ fontFamily: SERIF, fontSize: 22, letterSpacing: "-0.2px", color: TEXT }}>
            Overall <span style={{ fontStyle: "italic", color: "var(--nura-accent-text)" }}>health</span>
          </div>
          <div style={{ fontSize: 12, color: FAINT, marginTop: 3 }}>
            A complete read on how your body&apos;s doing · <span style={{ color: "var(--nura-metric-hrv)" }}>▲ {d.weeklyTrend}</span> this week
          </div>
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", color: "var(--nura-metric-hrv)", border: "1px solid var(--nura-tint-accent-border)", padding: "5px 11px", borderRadius: 999, background: "var(--nura-tint-accent)", whiteSpace: "nowrap" }}>
          {d.status}
        </div>
      </div>

      {/* Body — the dial (with its explainer) and the pillar list. One column
          on phones and laptops; from 1200 they sit side by side so the dial
          can grow into the width instead of floating in it. */}
      <div className="oh-body">
        <div className="oh-main">
          {/* Hero ring */}
          <div className="oh-ring">
            <div aria-hidden className="nura-halo oh-halo-lg" style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none", background: "radial-gradient(circle, rgba(var(--nura-teal-rgb),0.12) 0%, rgba(var(--nura-teal-rgb),0) 62%)" }} />
            <HealthRing d={d} selected={selected} onSelect={togglePillar} />
          </div>

          {/* Explainer */}
          <div className="oh-explain" style={{ fontSize: 12.5, lineHeight: 1.5, color: MUTED, marginTop: 2, padding: "0 4px" }}>
            <b style={{ color: TEXT, fontWeight: 600 }}>Your Health Score</b> is a weighted blend of six pillars — your single best read on how your whole body is doing right now.
          </div>
        </div>

        <div className="oh-side">
          {!selected && (
            <div className="oh-hint" style={{ fontSize: 11, color: "var(--nura-accent-label)", fontWeight: 600, textAlign: "center", marginTop: 12, letterSpacing: "0.2px" }}>
              Tap a pillar to see what it means ↓
            </div>
          )}

          {/* Pillar accordion */}
          <div style={{ marginTop: 6 }}>
            {d.pillars.map((p) => {
              const open = selected === p.key;
              return (
                <div key={p.key} style={{ borderTop: "1px solid var(--nura-hairline)" }}>
                  <div className="oh-pill-head nura-row" onClick={() => togglePillar(p.key)} style={{ display: "flex", alignItems: "center", gap: 11, padding: "13px 2px", cursor: "pointer" }}>
                    <span style={{ width: 9, height: 9, borderRadius: "50%", flex: "none", background: acc[p.color] }} />
                    <span className="oh-nm" style={{ fontSize: 14, fontWeight: 700, flex: 1, color: TEXT, transition: "color .15s" }}>{p.label}</span>
                    <span className="nura-datum-ink" style={{ fontSize: 15, fontWeight: 700, color: acc[p.color] }}>
                      {p.score}<span style={{ fontSize: 9, marginLeft: 3, color: tCol(p.trend, tk) }}>{tArrow(p.trend)}</span>
                    </span>
                    <span style={{ display: "flex", transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }}><Chevron /></span>
                  </div>
                  <div style={{ fontSize: 12, color: MUTED, margin: "-6px 0 0 20px", paddingBottom: 11 }}>{p.measures}</div>
                  {open && (
                    <div className="oh-imp-body" style={{ padding: "2px 2px 15px 20px" }}>
                      {[
                        { k: "What it measures", v: p.measures },
                        { k: "Built from", v: p.builtFrom },
                        { k: `Your reading · ${p.score}`, v: p.reading },
                      ].map((row) => (
                        <div key={row.k} style={{ marginBottom: 11 }}>
                          <div style={{ fontSize: 9.5, letterSpacing: "1px", textTransform: "uppercase", color: FAINT, fontWeight: 700, marginBottom: 3 }}>{row.k}</div>
                          <div style={{ fontSize: 13, lineHeight: 1.5, color: "var(--nura-ink-strong)" }}>{row.v}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Stat strip */}
          <div style={{ display: "flex", marginTop: 8, borderTop: "1px solid var(--nura-hairline-strong)", borderBottom: "1px solid var(--nura-hairline-strong)" }}>
            {[
              { k: "Health age", v: String(d.healthAge.value), x: d.healthAge.note, mut: false },
              { k: "Percentile", v: d.percentile.value, x: d.percentile.note, mut: true },
              { k: "Best pillar", v: d.bestPillar.label, x: d.bestPillar.note, mut: false },
            ].map((s, i) => (
              <div key={s.k} style={{ flex: 1, textAlign: "center", padding: "12px 6px", borderLeft: i > 0 ? "1px solid var(--nura-hairline)" : undefined }}>
                <div style={{ fontSize: 9, letterSpacing: "0.8px", textTransform: "uppercase", color: FAINT, fontWeight: 600 }}>{s.k}</div>
                <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4, letterSpacing: "-0.4px", color: TEXT }}>{s.v}</div>
                <div style={{ fontSize: 10, color: s.mut ? FAINT : "var(--nura-teal)", fontWeight: 600, marginTop: 2 }}>{s.x}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* What to improve */}
      <div className="oh-improve" style={{ marginTop: 14, padding: 15, borderRadius: 16, border: "1px solid var(--nura-tint-warn-border)", background: "var(--nura-tint-warn)" }}>
        <div style={{ fontSize: 10.5, letterSpacing: "1.4px", textTransform: "uppercase", color: GOLD, fontWeight: 700 }}>What to improve</div>
        <div style={{ fontSize: 11.5, color: FAINT, marginTop: 3 }}>Personalized from your readings — tap any to go deeper</div>

        <div style={{ marginTop: 4 }}>
          {d.plan.map((item) => {
            const open = openPlan === item.title;
            return (
              <div key={item.title} className="oh-imp-item" style={{ borderTop: "1px solid var(--nura-hairline)", marginTop: 11, paddingTop: 11 }}>
                <div onClick={() => togglePlan(item.title)} style={{ display: "flex", alignItems: "center", gap: 11, cursor: "pointer" }}>
                  <span style={{ width: 28, height: 28, borderRadius: 9, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", background: `${acc[item.color]}1f`, border: `1px solid ${acc[item.color]}55` }}>
                    <PlanIcon name={item.icon} color={acc[item.color]} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: TEXT }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: MUTED, marginTop: 1 }}>{item.summary}</div>
                  </div>
                  <span style={{ display: "flex", flex: "none", transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }}><Chevron /></span>
                </div>
                {open && (
                  <div className="oh-imp-body" style={{ fontSize: 13, lineHeight: 1.5, color: "var(--nura-ink-strong)", margin: "10px 0 4px 39px" }}>
                    {item.body}
                    {item.link && (
                      <div style={{ marginTop: 9 }}>
                        <button
                          onClick={() => router.push(item.link!)}
                          style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: SANS, fontSize: 13, fontWeight: 700, color: acc[item.color] }}
                        >
                          {item.linkLabel ?? "Learn more →"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Hero ring — the HALO dial ────────────────────────────────────────────────
//
// ONE DESIGN, TWO SKINS. Everything below is structural and identical in both
// themes; the only thing that differs is which colours the tokens resolve to.
// That is deliberate and it is what the previous tick-ring dial could not do:
// its shimmer was built out of 168 per-filament colour interpolations, so the
// two themes were drawing genuinely different instruments.
//
// Layer order, back to front — the halo has to sit UNDER the track, or the
// blur washes over the very arc it is supposed to be lighting:
//   1  halo      blurred copy of the score arc, wider stroke
//   2  track     full circle
//   3  ticks     72 short marks, purely textural
//   4  arc       the score, 12 o'clock clockwise
//   5  edge      a hairline highlight just inside the arc
//   6  cap       a dot punched out of the card at the arc's end
//   7  centre    score + label
//
// GEOMETRY is specified against a 300x300 box and scaled by DIAL_S to fit
// inside the pillar labels, which sit at r=120 in this component's own
// coordinate space and must not move. Scaling here rather than resizing the
// viewBox is what keeps those labels pinned.
const DIAL = { arcR: 118, arcW: 13, haloW: 18, tickInner: 86, tickOuter: 93, tickW: 1.6, edgeR: 114, edgeW: 1.6, capR: 4.5, capW: 2.5 } as const;
/** 124.5 is the arc's outer edge in spec units; 108 is where it may land here. */
const DIAL_S = 108 / (DIAL.arcR + DIAL.arcW / 2);

function HealthRing({ d, selected, onSelect }: { d: ReturnType<typeof getOverallHealth>; selected: string | null; onSelect: (k: string) => void }) {
  const tk = useThemeTokens(RING_TOKENS);
  const acc = useAccents();
  const lightForm = useIsLightForm();
  const rawId = useId();
  const uid = `oh-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const cx = 195, cy = 184;
  const frac0 = Math.max(0, Math.min(1, d.score / 100));
  const sel = selected;
  const selPillar = sel ? d.pillars.find((p) => p.key === sel) : null;

  const s = DIAL_S;
  const arcR = DIAL.arcR * s;
  const arcW = DIAL.arcW * s;
  const circ = 2 * Math.PI * arcR;
  const offset = circ * (1 - frac0);

  // Blur is the one value that cannot come from a token: stdDeviation is an
  // SVG attribute, and an attribute will not resolve var().
  const blur = lightForm ? 7 * s : 5 * s;
  const haloOpacity = lightForm ? 0.32 : 0.45;

  // 72 textural ticks. Not data — they give the empty centre something to be.
  const ticks: ReactElement[] = [];
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * 2 * Math.PI - Math.PI / 2;
    const ca = Math.cos(a), sa = Math.sin(a);
    ticks.push(
      <line
        key={i}
        x1={(cx + DIAL.tickInner * s * ca).toFixed(2)} y1={(cy + DIAL.tickInner * s * sa).toFixed(2)}
        x2={(cx + DIAL.tickOuter * s * ca).toFixed(2)} y2={(cy + DIAL.tickOuter * s * sa).toFixed(2)}
        stroke="var(--nura-dial-ticks)" strokeWidth={DIAL.tickW * s} strokeLinecap="round"
      />,
    );
  }

  // The inner-edge highlight, inset a touch at both ends so it reads as light
  // catching the arc rather than as a second, thinner arc.
  const edgeR = DIAL.edgeR * s;
  const a0 = -Math.PI / 2 + 0.06;
  const a1 = -Math.PI / 2 + frac0 * 2 * Math.PI - 0.06;
  const edgePath = a1 <= a0 ? "" : [
    `M ${(cx + edgeR * Math.cos(a0)).toFixed(2)} ${(cy + edgeR * Math.sin(a0)).toFixed(2)}`,
    `A ${edgeR.toFixed(2)} ${edgeR.toFixed(2)} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1`,
    `${(cx + edgeR * Math.cos(a1)).toFixed(2)} ${(cy + edgeR * Math.sin(a1)).toFixed(2)}`,
  ].join(" ");

  // End cap. Authored at its final angle; the sweep rotates it back to zero.
  const capA = -Math.PI / 2 + frac0 * 2 * Math.PI;
  const capX = cx + arcR * Math.cos(capA);
  const capY = cy + arcR * Math.sin(capA);

  const sweepVars = {
    "--dial-c": `${circ.toFixed(2)}`,
    "--dial-o": `${offset.toFixed(2)}`,
  } as CSSProperties;
  const capVars = {
    "--dial-a": `${(-frac0 * 360).toFixed(2)}deg`,
    "--dial-ox": `${cx}px`,
    "--dial-oy": `${cy}px`,
  } as CSSProperties;

  const arcGeom = {
    cx, cy, r: arcR, fill: "none" as const,
    strokeDasharray: circ.toFixed(2),
    strokeDashoffset: offset.toFixed(2),
    strokeLinecap: "round" as const,
    transform: `rotate(-90 ${cx} ${cy})`,
  };

  return (
    <svg viewBox="0 0 390 372" style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id={`${uid}-arc`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--nura-dial-arc-from)" />
          <stop offset="100%" stopColor="var(--nura-dial-arc-to)" />
        </linearGradient>
        {/* Generous region: the default -10%/+10% clips a 7px blur on a ring
            this size, which shows up as the halo being sliced off at 390px. */}
        <filter id={`${uid}-halo`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={blur.toFixed(2)} />
        </filter>
      </defs>

      {/* 1 — halo, beneath everything */}
      <circle
        {...arcGeom} className="nura-dial-arc" style={sweepVars}
        stroke="var(--nura-dial-halo)" strokeWidth={DIAL.haloW * s}
        opacity={sel ? haloOpacity * 0.5 : haloOpacity}
        filter={`url(#${uid}-halo)`}
      />

      {/* 2 — track */}
      <circle cx={cx} cy={cy} r={arcR} fill="none" stroke="var(--nura-dial-track)" strokeWidth={arcW} />

      {/* 3 — tick texture */}
      <g opacity={sel ? 0.5 : 1}>{ticks}</g>

      {/* 4 — the score arc */}
      <circle
        {...arcGeom} className="nura-dial-arc" style={sweepVars}
        stroke={`url(#${uid}-arc)`} strokeWidth={arcW}
        opacity={sel ? 0.5 : 1}
      />

      {/* 5 — inner-edge highlight */}
      {edgePath && (
        <path
          d={edgePath} fill="none" stroke="var(--nura-dial-edge)"
          strokeWidth={DIAL.edgeW * s} strokeLinecap="round"
          opacity={sel ? 0.5 : 1}
        />
      )}

      {/* 6 — end cap */}
      <circle
        className="nura-dial-cap" style={capVars}
        cx={capX.toFixed(2)} cy={capY.toFixed(2)} r={DIAL.capR * s}
        fill="var(--nura-dial-dot-fill)" stroke="var(--nura-dial-dot-stroke)" strokeWidth={DIAL.capW * s}
        opacity={sel ? 0.5 : 1}
      />

      {/* 7 — centre */}
      {selPillar ? (
        <>
          <text x={cx} y={cy - 2} textAnchor="middle" fontFamily={SANS} fontSize={32} fontWeight={700} className="nura-datum-ink" style={{ fill: acc[selPillar.color] }}>{selPillar.score}</text>
          <text x={cx} y={cy + 18} textAnchor="middle" fontFamily={SANS} fontSize={9} fontWeight={700} letterSpacing="1.4" fill={`rgba(${tk.inkRgb},0.5)`}>{selPillar.label.toUpperCase()}</text>
        </>
      ) : (
        <>
          <text x={cx} y={cy + 5} textAnchor="middle" fontFamily={MONO} fontSize={54} fontWeight={700} letterSpacing="-2" fill="var(--nura-dial-score)">{d.score}</text>
          <text x={cx} y={cy + 27} textAnchor="middle" fontFamily={SANS} fontSize={9.5} fontWeight={600} letterSpacing="3.2" fill="var(--nura-dial-label)">HEALTH SCORE</text>
        </>
      )}

      {/* Pillar labels — unchanged position and styling. The spokes, connector
          lines and dots that used to join them to the ring belonged to the old
          instrument and went with it; the numbers and labels did not move. */}
      {d.pillars.map((p: HealthPillar) => {
        const a = (p.ang * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a);
        const on = !sel || sel === p.key;
        const o = on ? 1 : 0.25;
        const lx = cx + 120 * ca, ly = cy + 120 * sa;
        const anchor = Math.abs(ca) < 0.2 ? "middle" : ca > 0 ? "start" : "end";
        const vy = sa < -0.2 ? ly - 3 : ly;
        return (
          <g key={p.key} style={{ cursor: "pointer" }} onClick={() => onSelect(p.key)}>
            <text x={lx.toFixed(1)} y={vy.toFixed(1)} textAnchor={anchor} fontFamily={SANS} fontSize={17.5} fontWeight={700} className="nura-datum-ink" style={{ fill: acc[p.color] }} opacity={o}>
              {p.score}<tspan fontSize="9" dx="3" dy="-5" fill={tCol(p.trend, tk)}>{tArrow(p.trend)}</tspan>
            </text>
            <text x={lx.toFixed(1)} y={(vy + 11).toFixed(1)} textAnchor={anchor} fontFamily={SANS} fontSize={8.5} fontWeight={600} letterSpacing="0.6" fill={`rgba(${tk.inkRgb},0.5)`} opacity={o}>{p.label.toUpperCase()}</text>
          </g>
        );
      })}
    </svg>
  );
}
