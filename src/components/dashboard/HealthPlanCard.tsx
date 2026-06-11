"use client";

import { useState, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import { getHealthPlan, getOverallHealth, type HealthPlanDomain } from "@/lib/dashboardData";
import { hex } from "@/components/dashboard/ActiveEnergyTodayChart";

// ─────────────────────────────────────────────────────────────────────────────
// Health Plan — the dashboard's "Your health plan" section: a personalized
// protocol with a Now→Target bar, a collapsible "where to focus" deep-dive, this-
// week focus chips, an intro, six expandable domain accordions (why it works +
// protocol), and a closing projection. Matches the Health Plan mockup.
//
// The deepened copy (deep-dive, intro, per-domain "why it works") is seeded here
// as a local plan-data object — colocated rather than in dashboardData so this
// change stays confined to the Health Plan component. In production it's
// AI-generated/derived from the user's readings (the deep-dive is templated from
// the user's two lowest pillars + score + target).
// ─────────────────────────────────────────────────────────────────────────────

const SANS = "'Inter', system-ui, sans-serif";
const SERIF = "'Fraunces', Georgia, serif";
const TEXT = "#ebe6d8";
const MUTED = "rgba(235,230,216,0.58)";
const FAINT = "rgba(235,230,216,0.32)";
const SAGE = "#9bb0a5";

// hexA built on the shared hex tuple helper — "#5dccae" + alpha → rgba string.
const hexA = (h: string, a: number) => {
  const [r, g, b] = hex(h);
  return `rgba(${r},${g},${b},${a})`;
};

// Exact intro copy (bold "Tap any one to open it" and "why").
const INTRO_HTML =
  "Each section below is a piece of your protocol. <b>Tap any one to open it</b> — inside you'll find how it actually works in your body, the specific actions to take, and which of your six health pillars it strengthens. It's the <b>why</b> behind every recommendation, not just the what.";

// Collapsible deep-dive. Paragraphs are templated from the user's two lowest
// pillars (p1/p2 with scores), current score, and target — not hardcoded.
const DEEP = {
  label: "Where to focus",
  headline: "What's holding your score back — and how you fix it",
  teaser: "A look at the two pillars dragging your score — and the single loop that connects them.",
  paragraphs: (p1: { label: string; score: number }, p2: { label: string; score: number }, now: number, target: number): string[] => [
    `Your two lowest pillars right now are <span class="sg">${p1.label}</span> at <b>${p1.score}</b> and <span class="sg">${p2.label}</span> at <b>${p2.score}</b> — and they're not independent. They're two ends of the same loop, which is why lifting them together moves your whole score the fastest.`,
    `Here's the chain. When daily <b>activity</b> runs low, your muscles clear glucose from your blood more slowly, so your <b>blood sugar swings</b> higher and lingers longer after meals. Those swings push your <b>overnight heart rate up</b> and <b>fragment your deep sleep</b> — which in turn drags down the <b>HRV</b> your Recovery and Resilience are built on. One quiet pillar quietly taxes the others.`,
    `Your plan is built to break that cycle at every link. <b>Post-meal walks</b> and <b>zone-2 cardio</b> teach your muscles to soak up glucose again; <b>magnesium</b> and <b>slow breathing</b> settle your nervous system so your heart rate drops overnight. As the swings flatten, deep sleep consolidates and HRV climbs — so <span class="sg">${p1.label}</span>, <span class="sg">${p2.label}</span>, <span class="sg">Recovery</span> and <span class="sg">Resilience</span> rise together instead of one at a time.`,
    `None of this is dramatic on any single day. Repeated for a few weeks, though, the effects compound — each better night makes the next day's movement easier, which makes the next night deeper. Staying <b>consistent</b> is what carries you from <b>${now}</b> toward your target of <span class="sg">${target}</span>.`,
  ],
};

// Per-domain "why it works" physiology (keyed by domain key).
const DOMAIN_WHY: Record<string, string> = {
  nutrition: "Protein and fiber blunt the blood-sugar spike after a meal, so insulin works less hard and your energy stays even. Omega-3 fats lower the inflammation that otherwise stiffens blood vessels and nudges resting heart rate up. Eating earlier and lighter lets digestion finish before bed, protecting your overnight temperature and deep sleep.",
  supplements: "These are small, evidence-backed levers on the exact systems your readings flag. Magnesium calms the nervous system and deepens slow-wave sleep; omega-3s support a steady heart rhythm and lower inflammation; vitamin D underpins immune and metabolic function; adaptogens blunt the cortisol response when stress runs high.",
  "essential-oils": "Scent reaches the limbic system — the brain's emotion and arousal hub — within seconds, which is why aromatherapy shifts your state faster than most interventions. Lavender and cedarwood downshift the nervous system before sleep; peppermint and eucalyptus open and alert. It's a gentle, drug-free nudge on the same recovery pathways your plan targets.",
  movement: "Muscle is your largest glucose sink — a short walk after eating pulls sugar out of your blood without much insulin, flattening the post-meal swing. Zone-2 cardio builds the mitochondria that make your heart more efficient at rest, lowering resting heart rate and lifting HRV over time. Strength work keeps that muscle responsive as you age.",
  sleep: "Deep sleep is when your body does most of its repair — clearing metabolic waste, consolidating memory, and resetting your stress hormones. A consistent bedtime anchors your circadian rhythm so that repair lands reliably; a cool, dark room and morning light keep the signal clean. This is the single biggest input to your Recovery.",
  stress: "Slow breathing with longer exhales activates the vagus nerve, shifting you out of fight-or-flight and raising HRV in real time. Daylight and protected wind-down time lower circulating cortisol, which otherwise keeps heart rate elevated and sleep shallow. Built into a daily routine, this is how your nervous system learns to recover faster.",
};

const Chevron = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={FAINT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
);

// Domain icons — paths ported from the mockup, stroked in the domain color.
function DomainIcon({ name, color }: { name: string; color: string }) {
  const paths: Record<string, ReactElement> = {
    leaf: <><path d="M5 21c0-9 7-16 16-16 0 9-7 16-16 16z" /><path d="M9 17c2-4 5-6 8-7" /></>,
    pill: <><rect x="3.5" y="8.5" width="17" height="7" rx="3.5" transform="rotate(-35 12 12)" /><line x1="12" y1="6" x2="12" y2="18" transform="rotate(-35 12 12)" /></>,
    drop: <path d="M12 3s6 7 6 11a6 6 0 01-12 0c0-4 6-11 6-11z" />,
    activity: <path d="M3 12h4l2.5-7 4 14 2.5-7H21" />,
    moon: <path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z" />,
    wind: <><path d="M3 8h11a3 3 0 100-6 3 3 0 00-2.8 2" /><path d="M3 16h15a3 3 0 110 6 3 3 0 01-2.8-2" /><path d="M3 12h7" /></>,
  };
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

// Section label — "WHY IT WORKS" (sage) / "YOUR PROTOCOL" (muted).
const SectionLabel = ({ children, color }: { children: string; color: string }) => (
  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color, marginBottom: 7 }}>{children}</div>
);

// ─────────────────────────────────────────────────────────────────────────────
export default function HealthPlanCard() {
  const router = useRouter();
  const p = getHealthPlan();
  const oh = getOverallHealth();
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [deepOpen, setDeepOpen] = useState(false);

  const toggle = (k: string) => setOpen((s) => {
    const n = new Set(s);
    if (n.has(k)) n.delete(k); else n.add(k);
    return n;
  });

  const span = (p.scaleMax - p.scaleMin) || 1;
  const sc = (v: number) => ((v - p.scaleMin) / span) * 100;

  // Two lowest pillars (templating source for the deep-dive).
  const lowest = [...oh.pillars].sort((a, b) => a.score - b.score);
  const ddParas = DEEP.paragraphs(lowest[0], lowest[1], p.now, p.target);

  return (
    <div style={{
      position: "relative", overflow: "hidden",
      background: "var(--nura-glass)", border: "1px solid var(--nura-glass-line)",
      borderRadius: 24, padding: "20px 16px 16px", marginBottom: 16,
      boxShadow: "inset 0 1px 0 rgba(235,230,216,0.10), 0 22px 60px rgba(0,0,0,.45)",
    }}>
      <style>{`
        .hp-step b, .hp-proj b, .hp-dd b { font-weight: 700; }
        .hp-step b { color: ${TEXT}; }
        .hp-proj b { color: ${SAGE}; }
        .hp-dd b { color: ${TEXT}; font-weight: 600; }
        .hp-dd .sg { color: ${SAGE}; font-weight: 600; }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "0 4px" }}>
        <div>
          <div style={{ fontFamily: SERIF, fontSize: 23, letterSpacing: "-0.2px", color: TEXT }}>
            Your health <span style={{ fontStyle: "italic", color: SAGE }}>plan</span>
          </div>
          <div style={{ fontSize: 12, color: MUTED, marginTop: 4, lineHeight: 1.45 }}>{p.subtitle}</div>
        </div>
        <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", color: SAGE, border: "1px solid rgba(155,176,165,0.4)", padding: "5px 10px", borderRadius: 999, background: "rgba(155,176,165,0.07)", whiteSpace: "nowrap" }}>
          Personalized
        </div>
      </div>

      {/* Target bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 13, margin: "18px 4px 4px" }}>
        <div style={{ textAlign: "center", flex: "none" }}>
          <div style={{ fontSize: 9, letterSpacing: "0.8px", textTransform: "uppercase", color: FAINT, fontWeight: 600 }}>Now</div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px", color: TEXT }}>{p.now}</div>
        </div>
        <div style={{ flex: 1, position: "relative", height: 8, borderRadius: 999, background: "rgba(235,230,216,0.08)" }}>
          <div style={{ position: "absolute", left: 0, top: 0, height: "100%", borderRadius: 999, width: `${sc(p.now).toFixed(1)}%`, background: "linear-gradient(90deg,#9bb0a5,#5dccae)" }} />
          <div style={{ position: "absolute", top: -4, width: 3, height: 16, borderRadius: 2, left: `${sc(p.target).toFixed(1)}%`, background: SAGE, boxShadow: `0 0 7px ${SAGE}` }} />
        </div>
        <div style={{ textAlign: "center", flex: "none" }}>
          <div style={{ fontSize: 9, letterSpacing: "0.8px", textTransform: "uppercase", color: FAINT, fontWeight: 600 }}>Target</div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px", color: SAGE }}>{p.target}</div>
        </div>
      </div>
      <div style={{ fontSize: 11, color: FAINT, textAlign: "center", marginTop: 7 }}>{p.targetCaption}</div>

      {/* Deep-dive (collapsible) — below the target caption, above the focus row */}
      <div style={{ borderTop: "1px solid rgba(235,230,216,0.07)", marginTop: 14 }}>
        <div onClick={() => setDeepOpen((v) => !v)} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "13px 2px", cursor: "pointer" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", color: SAGE, marginBottom: 6 }}>{DEEP.label}</div>
            <div style={{ fontFamily: SERIF, fontSize: 17, lineHeight: 1.25, color: TEXT, letterSpacing: "-0.1px" }}>{DEEP.headline}</div>
            {!deepOpen && <div style={{ fontSize: 12, color: MUTED, marginTop: 5, lineHeight: 1.45 }}>{DEEP.teaser}</div>}
          </div>
          <span style={{ display: "flex", flex: "none", marginTop: 2, transform: deepOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }}><Chevron /></span>
        </div>
        {deepOpen && (
          <div className="hp-dd" style={{ padding: "0 2px 15px 2px" }}>
            {ddParas.map((para, i) => (
              <p key={i} style={{ fontSize: 12.8, lineHeight: 1.55, color: "rgba(235,230,216,0.82)", marginTop: i === 0 ? 0 : 11 }} dangerouslySetInnerHTML={{ __html: para }} />
            ))}
          </div>
        )}
      </div>

      {/* This week's focus */}
      <div style={{ margin: "16px 0 4px", padding: "0 2px" }}>
        <div style={{ fontSize: 10, letterSpacing: "1.2px", textTransform: "uppercase", color: SAGE, fontWeight: 700, marginBottom: 9 }}>This week&apos;s focus</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {p.focus.map((f) => (
            <span key={f} style={{ fontSize: 12, fontWeight: 600, color: TEXT, padding: "7px 12px", borderRadius: 999, background: "rgba(155,176,165,0.1)", border: "1px solid rgba(155,176,165,0.22)" }}>{f}</span>
          ))}
        </div>
      </div>

      {/* Intro — soft sage-tinted box above the domain list */}
      <div className="hp-dd" style={{ margin: "14px 2px 4px", padding: "13px 15px", borderRadius: 14, background: "rgba(155,176,165,0.07)", border: "1px solid rgba(155,176,165,0.18)", fontSize: 12.5, lineHeight: 1.5, color: MUTED }} dangerouslySetInnerHTML={{ __html: INTRO_HTML }} />

      {/* Domain accordions */}
      <div>
        {p.domains.map((d: HealthPlanDomain) => {
          const isOpen = open.has(d.key);
          return (
            <div key={d.key} style={{ borderTop: "1px solid rgba(235,230,216,0.07)" }}>
              <div onClick={() => toggle(d.key)} style={{ display: "flex", gap: 12, alignItems: "center", padding: "13px 2px", cursor: "pointer" }}>
                <div style={{ flex: "none", width: 34, height: 34, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", background: hexA(d.color, 0.13), border: `1px solid ${hexA(d.color, 0.26)}` }}>
                  <DomainIcon name={d.icon} color={d.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{d.title}</div>
                  <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{d.summary}</div>
                </div>
                <span style={{ display: "flex", flex: "none", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }}><Chevron /></span>
              </div>
              {isOpen && (
                <div style={{ padding: "0 2px 15px 46px" }}>
                  {/* LIFTS */}
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.3px", color: FAINT, marginBottom: 13 }}>
                    LIFTS · <b style={{ color: MUTED, fontWeight: 600 }}>{d.lifts}</b>
                  </div>
                  {/* WHY IT WORKS */}
                  <SectionLabel color={SAGE}>WHY IT WORKS</SectionLabel>
                  <p style={{ fontSize: 12.8, lineHeight: 1.5, color: "rgba(235,230,216,0.82)", margin: "0 0 14px" }}>{DOMAIN_WHY[d.key]}</p>
                  {/* YOUR PROTOCOL */}
                  <SectionLabel color={FAINT}>YOUR PROTOCOL</SectionLabel>
                  {d.steps.map((s, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "6px 0" }}>
                      <span style={{ width: 16, height: 16, borderRadius: "50%", border: "1.6px solid rgba(155,176,165,0.5)", marginTop: 1, flex: "none" }} />
                      <span className="hp-step" style={{ fontSize: 12.8, lineHeight: 1.45, color: "rgba(235,230,216,0.82)" }} dangerouslySetInnerHTML={{ __html: s }} />
                    </div>
                  ))}
                  {d.link && (
                    <button
                      onClick={() => router.push(d.link!)}
                      style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 11, background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: SANS, fontSize: 12, fontWeight: 600, color: SAGE }}
                    >
                      {d.linkLabel ?? "Learn more"}
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={SAGE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Projection */}
      <div className="hp-proj" style={{ marginTop: 6, padding: "14px 16px", borderTop: "1px solid rgba(235,230,216,0.07)", fontSize: 12.5, lineHeight: 1.5, color: MUTED }} dangerouslySetInnerHTML={{ __html: p.projection }} />
    </div>
  );
}
