"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, BookOpen, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { SavedItem } from "@/lib/saved";
import { CATEGORY_LABELS, type Condition } from "../data";
import type { ResolvedSignal } from "../match";
import { formatValue, formatCollected } from "../match";
import { addProtocolToPlan, findSavedProtocol, removeProtocolFromPlan } from "../plan";
import StepModal from "./StepModal";
import {
  AMBER, AMBER_RGB, BORDER, CARD, CARD_SHADOW, MONO, SAGE, SAGE_RGB, SANS, SERIF,
  SP, SURFACE, TEXT, TEXT_SEC, TEXT_TER,
  Disclaimer, Eyebrow, GroupLabel, Prose, SkipTheHypeCard,
} from "../ui";

interface Props {
  condition: Condition;
  signals: ResolvedSignal[];
  /** Most recent collection date across the signals, ISO. */
  collected: string | null;
  /** Set when this condition matched the user's data. */
  matched: boolean;
  /** True when the signals came from the shared sample panel. */
  isSample: boolean;
}

type PlanState = "unknown" | "out" | "in" | "busy";

export default function ProtocolClient({
  condition, signals, collected, matched, isSample,
}: Props) {
  const [openStep, setOpenStep] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanState>("unknown");
  const [savedItem, setSavedItem] = useState<SavedItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Existing saved-items store — a protocol row tagged with this condition slug.
  useEffect(() => {
    let live = true;
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!live) return;
      if (!user) { setPlan("out"); return; }
      setUserId(user.id);
      try {
        const hit = await findSavedProtocol(user.id, condition.slug);
        if (!live) return;
        setSavedItem(hit);
        setPlan(hit ? "in" : "out");
      } catch {
        if (live) setPlan("out");
      }
    });
    return () => { live = false; };
  }, [condition.slug]);

  const toggle = useCallback(async () => {
    if (plan === "busy" || plan === "unknown") return;
    if (!userId) { setError("Sign in to keep this protocol in your plan."); return; }
    setError(null);
    const wasIn = plan === "in";
    setPlan("busy");
    try {
      if (wasIn && savedItem) {
        await removeProtocolFromPlan(savedItem.id);
        setSavedItem(null);
        setPlan("out");
      } else {
        const item = await addProtocolToPlan(userId, condition);
        setSavedItem(item);
        setPlan("in");
      }
    } catch {
      setPlan(wasIn ? "in" : "out");
      setError("Couldn't save that just now. Try again in a moment.");
    }
  }, [plan, userId, savedItem, condition]);

  const hasTail =
    !!condition.nameEmphasis && condition.name.endsWith(condition.nameEmphasis);
  const head = hasTail
    ? condition.name.slice(0, -condition.nameEmphasis!.length)
    : condition.name;
  const tail = hasTail ? condition.nameEmphasis! : null;

  const inPlan = plan === "in";

  return (
    <>
      <style>{`
        .cond-step { text-align: left; width: 100%; font-family: ${SANS}; cursor: pointer;
                     transition: border-color 160ms; }
        .cond-step:hover { border-color: rgba(${SAGE_RGB}, 0.32); }
        @media (min-width: 1024px) { .cond-protocol-title { font-size: 46px; } }
      `}</style>

      <Link
        href="/conditions"
        style={{
          display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 22,
          fontSize: 12.5, color: TEXT_SEC, background: SURFACE,
          border: `1px solid ${BORDER}`, borderRadius: 10, padding: "7px 12px 7px 9px",
          textDecoration: "none",
        }}
      >
        <ChevronLeft size={14} strokeWidth={1.8} /> Conditions
      </Link>

      <Eyebrow>{CATEGORY_LABELS[condition.category]}</Eyebrow>
      <h1 className="cond-protocol-title" style={{
        fontFamily: SERIF, fontWeight: 400, fontSize: 39, lineHeight: 1.05,
        letterSpacing: "-0.5px", color: TEXT, margin: "0 0 14px",
      }}>
        {head}
        {tail && <em style={{ fontStyle: "italic", color: "var(--nura-accent-text)" }}>{tail}</em>}
      </h1>

      <Prose
        text={matched && condition.matchedIntro
          ? `${condition.intro}\n\n${condition.matchedIntro}`
          : condition.intro}
        style={{ marginBottom: SP.section }}
      />

      {/* Hidden entirely when the user has no bloodwork — never a row of dashes. */}
      {signals.length > 0 && (
        <div style={{ marginBottom: SP.section }}>
          <GroupLabel>Your signals</GroupLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {signals.map((s) => (
              <span key={s.label} style={{
                fontFamily: MONO, fontSize: 11.5, fontVariantNumeric: "tabular-nums",
                borderRadius: 999, padding: "6px 11px", border: "1px solid",
                color: s.flagged ? AMBER : SAGE,
                background: s.flagged ? `rgba(${AMBER_RGB}, 0.13)` : `rgba(${SAGE_RGB}, 0.12)`,
                borderColor: s.flagged ? `rgba(${AMBER_RGB}, 0.3)` : `rgba(${SAGE_RGB}, 0.28)`,
              }}>
                {s.label} {formatValue(s.value)}{s.unit ? ` ${s.unit}` : ""}
              </span>
            ))}
          </div>
          <p style={{ fontSize: 11.5, color: TEXT_TER, margin: `${SP.stack}px 0 0` }}>
            {isSample
              ? "From the sample panel — add your bloodwork to see your own."
              : collected
                ? `From your bloodwork uploaded ${formatCollected(collected)}.`
                : "From your latest bloodwork."}
          </p>
        </div>
      )}

      {condition.doctorBanner && (
        <div style={{
          display: "flex", gap: 12, alignItems: "flex-start",
          background: `rgba(${AMBER_RGB}, 0.09)`,
          border: `1px solid rgba(${AMBER_RGB}, 0.28)`,
          borderRadius: CARD.radius, padding: CARD.padding, marginBottom: SP.section,
        }}>
          <AlertTriangle size={17} strokeWidth={1.8} style={{ color: AMBER, flex: "0 0 auto", marginTop: 2 }} />
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: TEXT, marginBottom: 5 }}>
              {condition.doctorBanner.title}
            </div>
            <div style={{ fontSize: 12.5, lineHeight: 1.7, color: TEXT_SEC }}>
              {condition.doctorBanner.body}
            </div>
          </div>
        </div>
      )}

      <GroupLabel>The protocol</GroupLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: SP.stack, marginBottom: SP.section }}>
        {condition.steps.map((step, i) => (
          <button
            key={step.id}
            className="cond-step"
            onClick={() => setOpenStep(i)}
            aria-label={`${step.title} — open detail`}
            style={{
              display: "flex", gap: 13, background: SURFACE,
              border: `1px solid ${BORDER}`, borderRadius: CARD.radius, padding: CARD.padding,
              boxShadow: CARD_SHADOW,
              opacity: step.supervised ? 0.74 : 1,
            }}
          >
            <span style={{
              flex: "0 0 auto", width: 24, height: 24, borderRadius: "50%",
              border: `1px solid rgba(${SAGE_RGB}, 0.4)`, color: SAGE,
              fontFamily: MONO, fontSize: 10.5,
              display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1,
            }}>
              {i + 1}
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              {/* action → why → evidence. Same three beats, every card. */}
              <span style={{
                display: "block", fontSize: 14, fontWeight: 600, color: TEXT,
                lineHeight: 1.45, marginBottom: 6,
              }}>
                {step.title}
                {step.supervised && (
                  <span style={{ fontWeight: 400, color: AMBER }}> — talk to your doctor first</span>
                )}
              </span>
              <span style={{
                display: "block", fontSize: 12.5, lineHeight: 1.65, color: TEXT_SEC,
                marginBottom: 12,
              }}>
                {step.why}
              </span>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                fontSize: 10.5, color: TEXT_TER,
              }}>
                <b style={{
                  fontFamily: MONO, fontSize: 10, letterSpacing: "0.5px", fontWeight: 600,
                  color: SAGE, background: `rgba(${SAGE_RGB}, 0.12)`,
                  border: `1px solid rgba(${SAGE_RGB}, 0.28)`, borderRadius: 5, padding: "3px 7px",
                }}>
                  {step.grade}
                </b>
                {step.gradeNote}
              </span>
            </span>
            <ChevronRight size={16} strokeWidth={1.7} style={{ color: TEXT_TER, flex: "0 0 auto", alignSelf: "center" }} />
          </button>
        ))}
      </div>

      <SkipTheHypeCard data={condition.skipTheHype} style={{ marginBottom: SP.section }} />

      {/* Funnel hook — quiet by design. Only appears once the book exists. */}
      {condition.bookUrl && condition.bookTitle && (
        <Link
          href={condition.bookUrl}
          style={{
            display: "flex", gap: 12, alignItems: "flex-start", textDecoration: "none",
            background: SURFACE, border: `1px solid rgba(${SAGE_RGB}, 0.3)`,
            borderRadius: CARD.radius, padding: CARD.padding, marginBottom: SP.section,
            boxShadow: CARD_SHADOW,
          }}
        >
          <BookOpen size={17} strokeWidth={1.7} style={{ color: SAGE, flex: "0 0 auto", marginTop: 2 }} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: TEXT, marginBottom: 5 }}>
              Go deeper — the NŪRA guide to {condition.name.toLowerCase()}
            </span>
            <span style={{ display: "block", fontSize: 12.5, lineHeight: 1.7, color: TEXT_SEC }}>
              {condition.bookTitle}
            </span>
          </span>
          <ChevronRight size={16} strokeWidth={1.7} style={{ color: TEXT_TER, flex: "0 0 auto", alignSelf: "center" }} />
        </Link>
      )}

      <button
        onClick={toggle}
        disabled={plan === "busy" || plan === "unknown"}
        aria-pressed={inPlan}
        style={{
          width: "100%", textAlign: "center", borderRadius: 14, padding: "15px 14px",
          fontFamily: SANS, fontSize: 14.5, fontWeight: 600,
          cursor: plan === "busy" || plan === "unknown" ? "default" : "pointer",
          background: inPlan ? `rgba(${SAGE_RGB}, 0.12)` : SAGE,
          color: inPlan ? SAGE : "var(--nura-sage-bg-on)",
          border: inPlan ? `1px solid rgba(${SAGE_RGB}, 0.34)` : "1px solid transparent",
          opacity: plan === "busy" ? 0.7 : 1,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          transition: "background 160ms, color 160ms, border-color 160ms",
        }}
      >
        {inPlan ? (<>In your plan <Check size={16} strokeWidth={2.4} /></>) : "Add protocol to my plan"}
      </button>

      {error && (
        <p style={{ fontSize: 11.5, color: AMBER, textAlign: "center", margin: "12px 0 0" }}>
          {error}
        </p>
      )}

      <Disclaimer />

      {openStep !== null && (
        <StepModal
          condition={condition}
          step={condition.steps[openStep]}
          index={openStep}
          onClose={() => setOpenStep(null)}
        />
      )}
    </>
  );
}
