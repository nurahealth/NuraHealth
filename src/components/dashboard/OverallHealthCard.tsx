"use client";

import { useId, useState, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import { getOverallHealth, type HealthPillar, type HealthTrend } from "@/lib/dashboardData";
import { hex, lerp, light } from "@/components/dashboard/ActiveEnergyTodayChart";
import { useThemeTokens } from "@/lib/themeTokens";
import { useAccents } from "@/lib/accents";

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
const SAGE = "var(--nura-sage)";
const GOLD = "var(--nura-good)";

// Colours this card needs as concrete values rather than var() references: the
// ring ramp is interpolated, and SVG presentation attributes do not accept
// var(). Fallbacks are the dark values, so SSR and first paint agree.
// See lib/themeTokens.ts.
const RING_TOKENS = {
  sage:      ["--nura-sage", "#9bb0a5"],
  teal:      ["--nura-teal", "#5dccae"],
  blue:      ["--nura-sleep-deep", "#5aa0e6"],
  alert:     ["--nura-alert", "#e8745a"],
  inkRgb:    ["--nura-fg-rgb", "235,230,216"],
  tealRgb:   ["--nura-teal-rgb", "93,204,174"],
  scoreFrom: ["--nura-score-from", "#ffffff"],
  scoreTo:   ["--nura-score-to", "#cfe0d6"],
  ringHead:  ["--nura-ring-head", "#ffffff"],
} as const;

// Defined locally (reusing the shared hex/lerp/light) so colorAt is guaranteed
// available wherever the ring renders — a missing colorAt silently blanks it.
function colorAtRgb(t: number, stops: [number, string][]): [number, number, number] {
  const u = Math.max(0, Math.min(1, t));
  for (let i = 0; i < stops.length - 1; i++) {
    const [s0, c0] = stops[i];
    const [s1, c1] = stops[i + 1];
    if (u >= s0 && u <= s1) {
      const k = (u - s0) / ((s1 - s0) || 1);
      const A = hex(c0), B = hex(c1);
      return [lerp(A[0], B[0], k), lerp(A[1], B[1], k), lerp(A[2], B[2], k)];
    }
  }
  return hex(stops[stops.length - 1][1]);
}
const rgb = ([r, g, b]: [number, number, number]) => `rgb(${r},${g},${b})`;
function colorAt(t: number, stops: [number, string][]): string {
  return rgb(colorAtRgb(t, stops));
}

const tArrow = (t: HealthTrend) => (t === "up" ? "▲" : t === "down" ? "▼" : "–");
type RingTokens = Record<keyof typeof RING_TOKENS, string>;
const tCol = (t: HealthTrend, tk: RingTokens) =>
  t === "up" ? tk.teal : t === "down" ? tk.alert : `rgba(${tk.inkRgb},0.4)`;

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
    <div style={{
      position: "relative", overflow: "hidden",
      // See HealthPlanCard: the two hero cards stretch to a shared row height at
      // desktop, so whichever ends up shorter pins its closing panel to the
      // bottom instead of leaving a dead strip. Inert at the card's natural
      // height, which is every width below lg.
      display: "flex", flexDirection: "column",
      background: "var(--nura-glass)", border: "1px solid var(--nura-glass-line)",
      borderRadius: 24, padding: "20px 16px 18px", marginBottom: 16,
      boxShadow: "inset 0 1px 0 var(--nura-card-highlight), var(--nura-card-shadow)",
    }}>
      <style>{`
        .oh-pill-head:hover .oh-nm { color: var(--nura-text-strong); }
        .oh-imp-item { transition: border-color .18s; }
        @media (min-width: 1024px) { .oh-improve { margin-top: auto !important; } }
      `}</style>
      {/* Soft glow core behind the ring — dark only (see the flattening
          layer in globals.css). */}
      <div aria-hidden className="nura-halo" style={{ position: "absolute", left: "50%", top: 120, width: 300, height: 300, transform: "translate(-50%,-50%)", pointerEvents: "none", background: "radial-gradient(circle, rgba(var(--nura-teal-rgb),0.12) 0%, rgba(var(--nura-teal-rgb),0) 62%)" }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "0 4px", position: "relative" }}>
        <div>
          <div style={{ fontFamily: SERIF, fontSize: 22, letterSpacing: "-0.2px", color: TEXT }}>
            Overall <span style={{ fontStyle: "italic", color: "var(--nura-accent-text)" }}>health</span>
          </div>
          <div style={{ fontSize: 12, color: FAINT, marginTop: 3 }}>
            A complete read on how your body&apos;s doing · <span style={{ color: "var(--nura-teal)" }}>▲ {d.weeklyTrend}</span> this week
          </div>
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", color: "var(--nura-teal)", border: "1px solid var(--nura-tint-accent-border)", padding: "5px 11px", borderRadius: 999, background: "var(--nura-tint-accent)", whiteSpace: "nowrap" }}>
          {d.status}
        </div>
      </div>

      {/* Hero ring */}
      <div style={{ position: "relative" }}>
        <HealthRing d={d} selected={selected} onSelect={togglePillar} />
      </div>

      {/* Explainer + hint */}
      <div style={{ fontSize: 12.5, lineHeight: 1.5, color: MUTED, marginTop: 2, padding: "0 4px" }}>
        <b style={{ color: TEXT, fontWeight: 600 }}>Your Health Score</b> is a weighted blend of six pillars — your single best read on how your whole body is doing right now.
      </div>
      {!selected && (
        <div style={{ fontSize: 11, color: "var(--nura-accent-label)", fontWeight: 600, textAlign: "center", marginTop: 12, letterSpacing: "0.2px" }}>
          Tap a pillar to see what it means ↓
        </div>
      )}

      {/* Pillar accordion */}
      <div style={{ marginTop: 6 }}>
        {d.pillars.map((p) => {
          const open = selected === p.key;
          return (
            <div key={p.key} style={{ borderTop: "1px solid var(--nura-hairline)" }}>
              <div className="oh-pill-head" onClick={() => togglePillar(p.key)} style={{ display: "flex", alignItems: "center", gap: 11, padding: "13px 2px", cursor: "pointer" }}>
                <span style={{ width: 9, height: 9, borderRadius: "50%", flex: "none", background: acc[p.color] }} />
                <span className="oh-nm" style={{ fontSize: 14, fontWeight: 700, flex: 1, color: TEXT, transition: "color .15s" }}>{p.label}</span>
                <span className="nura-datum-ink" style={{ fontSize: 15, fontWeight: 700, color: acc[p.color] }}>
                  {p.score}<span style={{ fontSize: 9, marginLeft: 3, color: tCol(p.trend, tk) }}>{tArrow(p.trend)}</span>
                </span>
                <span style={{ display: "flex", transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }}><Chevron /></span>
              </div>
              <div style={{ fontSize: 12, color: MUTED, margin: "-6px 0 0 20px", paddingBottom: 11 }}>{p.measures}</div>
              {open && (
                <div style={{ padding: "2px 2px 15px 20px" }}>
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
                  <div style={{ fontSize: 13, lineHeight: 1.5, color: "var(--nura-ink-strong)", margin: "10px 0 4px 39px" }}>
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

// ── Hero ring ─────────────────────────────────────────────────────────────────
// Energy filaments (bright up to score%, dimmed after) under faint depth rings, a
// slowly rotating dotted outer ring, a crisp gradient progress arc with a pulsing
// white head, a radial glow core, the centered Health Score, and six pillar
// spokes (notch · connector · glowing dot · value + trend · label). Selecting a
// pillar dims the ring + other pillars and shows that pillar's score in the center.
function HealthRing({ d, selected, onSelect }: { d: ReturnType<typeof getOverallHealth>; selected: string | null; onSelect: (k: string) => void }) {
  const tk = useThemeTokens(RING_TOKENS);
  const acc = useAccents();
  // Health-Score ring ramp: sage → teal → blue, resolved from the theme.
  const RAMP: [number, string][] = [[0, tk.sage], [0.45, tk.teal], [1, tk.blue]];
  const rawId = useId();
  const uid = `oh-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const cx = 195, cy = 184;
  const frac0 = d.score / 100;
  const sel = selected;
  const selPillar = sel ? d.pillars.find((p) => p.key === sel) : null;

  // Depth rings.
  const depth: ReactElement[] = [
    <circle key="core" className="nura-halo" cx={cx} cy={cy} r={118} fill={`url(#${uid}-core)`} />,
    <circle key="r100" cx={cx} cy={cy} r={100} fill="none" stroke={`rgba(${tk.inkRgb},0.045)`} />,
    <circle key="r110" cx={cx} cy={cy} r={110} fill="none" stroke={`rgba(${tk.inkRgb},0.03)`} />,
  ];

  // Rotating dotted outer ring.
  const odots: ReactElement[] = [];
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * 2 * Math.PI;
    odots.push(<circle key={i} cx={(cx + 114 * Math.cos(a)).toFixed(1)} cy={(cy + 114 * Math.sin(a)).toFixed(1)} r={i % 6 === 0 ? 1.1 : 0.7} fill={`rgba(${tk.inkRgb},0.16)`} />);
  }

  // Energy filaments.
  const N = 168;
  const filaments: ReactElement[] = [];
  for (let i = 0; i < N; i++) {
    const frac = i / N, a = frac * 2 * Math.PI - Math.PI / 2;
    const seed = (Math.sin(i * 0.5) * 0.5 + 0.5) * 0.55 + (Math.sin(i * 1.7 + 1) * 0.5 + 0.5) * 0.45;
    const inner = 66, outer = inner + 4 + seed * 12, bright = frac <= frac0;
    const col = bright ? colorAt(frac / frac0, RAMP) : `rgba(${tk.inkRgb},0.10)`;
    const op = bright ? 0.32 + seed * 0.55 : 0.5;
    const x1 = cx + inner * Math.cos(a), y1 = cy + inner * Math.sin(a);
    const x2 = cx + outer * Math.cos(a), y2 = cy + outer * Math.sin(a);
    filaments.push(<line key={`f${i}`} x1={x1.toFixed(1)} y1={y1.toFixed(1)} x2={x2.toFixed(1)} y2={y2.toFixed(1)} stroke={col} strokeWidth={1.8} strokeLinecap="round" opacity={Number((sel ? op * 0.5 : op).toFixed(2))} />);
    if (bright && seed > 0.82 && !sel) {
      filaments.push(<circle key={`s${i}`} cx={x2.toFixed(1)} cy={y2.toFixed(1)} r={1.3} fill={rgb(light(colorAtRgb(frac / frac0, RAMP), 0.45))} opacity={0.9} />);
    }
  }

  // Progress arc + pulsing head.
  const pr = 60, circ = 2 * Math.PI * pr, vis = circ * frac0;
  const headA = ((-90 + 360 * frac0) * Math.PI) / 180;
  const hx = cx + pr * Math.cos(headA), hy = cy + pr * Math.sin(headA);

  return (
    <svg viewBox="0 0 390 372" style={{ width: "100%", height: "auto", display: "block" }}>
      <defs>
        <radialGradient id={`${uid}-core`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={`rgba(${tk.tealRgb},0.22)`} />
          <stop offset="60%" stopColor={`rgba(${tk.tealRgb},0.06)`} />
          <stop offset="100%" stopColor={`rgba(${tk.tealRgb},0)`} />
        </radialGradient>
        <linearGradient id={`${uid}-parc`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={tk.sage} /><stop offset="55%" stopColor={tk.teal} /><stop offset="100%" stopColor={tk.blue} />
        </linearGradient>
        <linearGradient id={`${uid}-num`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tk.scoreFrom} /><stop offset="100%" stopColor={tk.scoreTo} />
        </linearGradient>
      </defs>

      {depth}

      {/* Rotating dotted ring */}
      <g>
        {odots}
        <animateTransform attributeName="transform" type="rotate" from={`0 ${cx} ${cy}`} to={`360 ${cx} ${cy}`} dur="90s" repeatCount="indefinite" />
      </g>

      {/* Energy filaments */}
      <g style={{ filter: `drop-shadow(0 0 5px rgba(${tk.tealRgb},0.28))` }}>{filaments}</g>

      {/* Progress arc + pulsing head */}
      <circle cx={cx} cy={cy} r={pr} fill="none" stroke={`rgba(${tk.inkRgb},0.06)`} strokeWidth={3} />
      <circle cx={cx} cy={cy} r={pr} fill="none" stroke={`url(#${uid}-parc)`} strokeWidth={3.2} strokeLinecap="round" strokeDasharray={`${vis.toFixed(1)} ${circ.toFixed(1)}`} transform={`rotate(-90 ${cx} ${cy})`} style={{ filter: `drop-shadow(0 0 5px rgba(${tk.tealRgb},0.55))` }} opacity={sel ? 0.5 : 1} />
      <circle cx={hx.toFixed(1)} cy={hy.toFixed(1)} r={3.4} fill={tk.ringHead} style={{ filter: `drop-shadow(0 0 7px ${tk.teal})` }}>
        <animate attributeName="opacity" values="1;0.45;1" dur="2.6s" repeatCount="indefinite" />
      </circle>

      {/* Center number */}
      {selPillar ? (
        <>
          <text x={cx} y={cy - 2} textAnchor="middle" fontFamily={SANS} fontSize={32} fontWeight={700} className="nura-datum-ink" style={{ fill: acc[selPillar.color] }}>{selPillar.score}</text>
          <text x={cx} y={cy + 18} textAnchor="middle" fontFamily={SANS} fontSize={9} fontWeight={700} letterSpacing="1.4" fill={`rgba(${tk.inkRgb},0.5)`}>{selPillar.label.toUpperCase()}</text>
        </>
      ) : (
        <>
          <text x={cx} y={cy + 5} textAnchor="middle" fontFamily={SANS} fontSize={54} fontWeight={700} fill={`url(#${uid}-num)`} style={{ filter: `drop-shadow(0 0 20px rgba(${tk.tealRgb},0.4))` }}>{d.score}</text>
          <text x={cx} y={cy + 27} textAnchor="middle" fontFamily={SANS} fontSize={9} fontWeight={700} letterSpacing="1.8" fill={`rgba(${tk.inkRgb},0.45)`}>HEALTH SCORE</text>
        </>
      )}

      {/* Pillar spokes */}
      {d.pillars.map((p: HealthPillar) => {
        const a = (p.ang * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a);
        const on = !sel || sel === p.key;
        const o = on ? 1 : 0.25;
        const big = sel === p.key;
        const lx = cx + 120 * ca, ly = cy + 120 * sa;
        const anchor = Math.abs(ca) < 0.2 ? "middle" : ca > 0 ? "start" : "end";
        const vy = sa < -0.2 ? ly - 3 : ly;
        return (
          <g key={p.key} style={{ cursor: "pointer" }} onClick={() => onSelect(p.key)}>
            <line x1={(cx + 64 * ca).toFixed(1)} y1={(cy + 64 * sa).toFixed(1)} x2={(cx + (big ? 86 : 82) * ca).toFixed(1)} y2={(cy + (big ? 86 : 82) * sa).toFixed(1)} stroke={acc[p.color]} strokeWidth={big ? 3 : 2.2} strokeLinecap="round" opacity={Number((0.85 * o).toFixed(2))} />
            <line x1={(cx + 92 * ca).toFixed(1)} y1={(cy + 92 * sa).toFixed(1)} x2={(cx + 110 * ca).toFixed(1)} y2={(cy + 110 * sa).toFixed(1)} stroke={acc[p.color]} strokeWidth={1.3} opacity={Number((0.45 * o).toFixed(2))} />
            <circle cx={(cx + 92 * ca).toFixed(1)} cy={(cy + 92 * sa).toFixed(1)} r={big ? 3.4 : 2.4} fill={acc[p.color]} opacity={o} style={{ filter: `drop-shadow(0 0 ${big ? 7 : 4}px ${acc[p.color]})` }} />
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
