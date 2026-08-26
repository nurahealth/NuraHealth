"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, BookOpen, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { SavedItem } from "@/lib/saved";
import type { Condition } from "../data";
import type { ResolvedSignal } from "../match";
import { formatValue, formatCollected } from "../match";
import { addProtocolToPlan, findSavedProtocol, removeProtocolFromPlan } from "../plan";
import StepModal from "./StepModal";
import {
  AMBER, AMBER_RGB, BORDER, CARD_SHADOW, MONO, SAGE, SAGE_RGB, SANS, SERIF,
  SURFACE, TEXT, TEXT_SEC, TEXT_TER,
  Disclaimer, Eyebrow, GroupLabel, RichText, SampleBanner,
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

export default function ProtocolClient({ condition, signals, collected, matched, isSample }: Props) {
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

  const head = condition.nameEmphasis && condition.name.endsWith(condition.nameEmphasis)
    ? condition.name.slice(0, -condition.nameEmphasis.length)
    : condition.name;
  const tail = condition.nameEmphasis && condition.name.endsWith(condition.nameEmphasis)
    ? condition.nameEmphasis
    : null;

  const inPlan = plan === "in";

  return (
    <>
      <style>{`
        .cond-step { text-align: left; width: 100%; font-family: ${SANS}; cursor: pointer;
                     transition: border-color 160ms, transform 160ms; }
        .cond-step:hover { border-color: rgba(${SAGE_RGB}, 0.3); }
        @media (min-width: 1024px) { .cond-protocol-title { font-size: 46px; } }
      `}</style>

      <Link
        href="/conditions"
        style={{
          display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 18,
          fontSize: 12.5, color: TEXT_SEC, background: SURFACE,
          border: `1px solid ${BORDER}`, borderRadius: 10, padding: "6px 11px 6px 8px",
          textDecoration: "none",
        }}
      >
        <ChevronLeft size={14} strokeWidth={1.8} /> Conditions
      </Link>

      <Eyebrow>Natural protocols</Eyebrow>
      <h1 className="cond-protocol-title" style={{
        fontFamily: SERIF, fontWeight: 400, fontSize: 38, lineHeight: 1.05,
        letterSpacing: "-0.5px", color: TEXT, margin: "0 0 10px",
      }}>
        {head}
        {tail && <em style={{ fontStyle: "italic", color: "var(--nura-accent-text)" }}>{tail}</em>}
      </h1>

      <p style={{ fontSize: 14, lineHeight: 1.72, color: TEXT_SEC, margin: "0 0 22px" }}>
        <RichText text={condition.intro} />
        {matched && condition.matchedIntro && (
          <>
            {" "}
            <RichText text={condition.matchedIntro} />
          </>
        )}
      </p>

      {/* Hidden entirely when the user has no bloodwork — never a row of dashes. */}
      {signals.length > 0 && (
        <>
          <GroupLabel>Your signals</GroupLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 8 }}>
            {signals.map((s) => (
              <span key={s.label} style={{
                fontSize: 11.5, fontVariantNumeric: "tabular-nums",
                borderRadius: 999, padding: "5px 10px", border: "1px solid",
                color: s.flagged ? AMBER : SAGE,
                background: s.flagged ? `rgba(${AMBER_RGB}, 0.13)` : `rgba(${SAGE_RGB}, 0.12)`,
                borderColor: s.flagged ? `rgba(${AMBER_RGB}, 0.3)` : `rgba(${SAGE_RGB}, 0.28)`,
              }}>
                {s.label} {formatValue(s.value)}{s.unit ? ` ${s.unit}` : ""}
              </span>
            ))}
          </div>
          <p style={{ fontSize: 11, color: TEXT_TER, margin: "0 0 12px" }}>
            {isSample
              ? "From the sample panel."
              : collected
                ? `From your bloodwork uploaded ${formatCollected(collected)}.`
                : "From your latest bloodwork."}
          </p>
          {isSample && <SampleBanner style={{ marginBottom: 24 }} />}
        </>
      )}

      {condition.doctorBanner && (
        <div style={{
          display: "flex", gap: 11, alignItems: "flex-start",
          background: `rgba(${AMBER_RGB}, 0.09)`,
          border: `1px solid rgba(${AMBER_RGB}, 0.28)`,
          borderRadius: 13, padding: "13px 14px", marginBottom: 24,
        }}>
          <AlertTriangle size={17} strokeWidth={1.8} style={{ color: AMBER, flex: "0 0 auto", marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 3 }}>
              {condition.doctorBanner.title}
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.6, color: TEXT_SEC }}>
              {condition.doctorBanner.body}
            </div>
          </div>
        </div>
      )}

      <GroupLabel>The protocol</GroupLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 11, marginBottom: 24 }}>
        {condition.steps.map((step, i) => (
          <button
            key={step.id}
            className="cond-step"
            onClick={() => setOpenStep(i)}
            aria-label={`${step.title} — open detail`}
            style={{
              display: "flex", gap: 12, background: SURFACE,
              border: `1px solid ${BORDER}`, borderRadius: 14, padding: 14,
              boxShadow: CARD_SHADOW,
              opacity: step.supervised ? 0.72 : 1,
            }}
          >
            <span style={{
              flex: "0 0 auto", width: 23, height: 23, borderRadius: "50%",
              border: `1px solid rgba(${SAGE_RGB}, 0.4)`, color: SAGE,
              fontFamily: MONO, fontSize: 10.5,
              display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1,
            }}>
              {i + 1}
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{
                display: "block", fontSize: 14, fontWeight: 600, color: TEXT,
                lineHeight: 1.4, marginBottom: 4,
              }}>
                {step.title}
                {step.supervised && (
                  <span style={{ fontWeight: 400, color: AMBER }}> — talk to your doctor first</span>
                )}
              </span>
              <span style={{
                display: "block", fontSize: 12.5, lineHeight: 1.6, color: TEXT_SEC, marginBottom: 9,
              }}>
                {step.why}
              </span>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                fontSize: 10.5, color: TEXT_TER,
              }}>
                <b style={{
                  fontFamily: MONO, fontSize: 10, letterSpacing: "0.5px", fontWeight: 600,
                  color: SAGE, background: `rgba(${SAGE_RGB}, 0.12)`,
                  border: `1px solid rgba(${SAGE_RGB}, 0.28)`, borderRadius: 5, padding: "2px 6px",
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

      {/* Funnel hook — quiet by design. Only appears once the book exists. */}
      {condition.bookUrl && condition.bookTitle && (
        <Link
          href={condition.bookUrl}
          style={{
            display: "flex", gap: 11, alignItems: "flex-start", textDecoration: "none",
            background: SURFACE, border: `1px solid rgba(${SAGE_RGB}, 0.3)`,
            borderRadius: 13, padding: "13px 14px", marginBottom: 24, boxShadow: CARD_SHADOW,
          }}
        >
          <BookOpen size={17} strokeWidth={1.7} style={{ color: SAGE, flex: "0 0 auto", marginTop: 1 }} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 3 }}>
              Go deeper — the NŪRA guide to {condition.name.toLowerCase()}
            </span>
            <span style={{ display: "block", fontSize: 12, lineHeight: 1.6, color: TEXT_SEC }}>
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
          width: "100%", textAlign: "center", borderRadius: 13, padding: 14,
          fontFamily: SANS, fontSize: 14.5, fontWeight: 600,
          cursor: plan === "busy" || plan === "unknown" ? "default" : "pointer",
          background: inPlan ? `rgba(${SAGE_RGB}, 0.12)` : SAGE,
          color: inPlan ? SAGE : "var(--nura-sage-bg-on)",
          border: inPlan ? `1px solid rgba(${SAGE_RGB}, 0.34)` : "1px solid transparent",
          opacity: plan === "busy" ? 0.7 : 1,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
          transition: "background 160ms, color 160ms, border-color 160ms",
        }}
      >
        {inPlan ? (<>In your plan <Check size={16} strokeWidth={2.4} /></>) : "Add protocol to my plan"}
      </button>

      {error && (
        <p style={{ fontSize: 11.5, color: AMBER, textAlign: "center", margin: "10px 0 0" }}>
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
