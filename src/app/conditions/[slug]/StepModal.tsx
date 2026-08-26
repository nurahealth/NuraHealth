"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ChevronRight, X } from "lucide-react";
import type { Condition, ConditionStep } from "../data";
import {
  ALERT, ALERT_RGB, BORDER, CARD, CARD_SHADOW, MONO, SAGE, SAGE_RGB, SANS,
  SERIF, SP, SURFACE, TEXT, TEXT_SEC, TEXT_TER, RichText, Disclaimer,
} from "../ui";

interface Props {
  condition: Condition;
  step: ConditionStep;
  index: number;
  onClose: () => void;
}

/**
 * One labelled card. Every card in the detail sheet is this component, so the
 * label size, the padding and the gap between cards can never drift apart.
 */
function Card({
  label, children, tone = "plain",
}: {
  label: string;
  children: React.ReactNode;
  tone?: "plain" | "lab" | "check";
}) {
  const border =
    tone === "lab" ? `1px solid rgba(${SAGE_RGB}, 0.3)`
    : tone === "check" ? `1px solid rgba(${ALERT_RGB}, 0.45)`
    : `1px solid ${BORDER}`;
  return (
    <div style={{
      background: tone === "check" ? `rgba(${ALERT_RGB}, 0.07)` : SURFACE,
      border, borderRadius: CARD.radius, padding: CARD.padding,
      marginBottom: SP.stack,
      boxShadow: tone === "check" ? "none" : CARD_SHADOW,
    }}>
      <div style={{
        fontFamily: MONO, fontSize: 9.5, letterSpacing: "1.8px", textTransform: "uppercase",
        color: tone === "check" ? ALERT : TEXT_TER, marginBottom: SP.tight,
      }}>
        {label}
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.75, color: TEXT_SEC }}>{children}</div>
    </div>
  );
}

export default function StepModal({ condition, step, index, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);

  // Escape closes, and the page behind stops scrolling while it's open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const howLabel = step.supplement ? "How to take it" : "How to do it";
  // Only ever rendered from a click, so this never runs during SSR — the guard
  // is here so the component stays safe to render from anywhere.
  if (typeof document === "undefined") return null;

  return createPortal(
    // Centered — never a bottom sheet. Locked pattern.
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: "rgba(0,0,0,0.62)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "28px 18px",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={step.detailTitle ?? step.title}
        onClick={(e) => e.stopPropagation()}
        // nura-modal-lift: the light skin swaps --nura-bg for the raised modal
        // surface and casts the shadow. Inert in dark, where the scrim is enough.
        className="nura-modal-lift"
        style={{
          width: "100%", maxWidth: 420, maxHeight: "calc(100dvh - 56px)", overflowY: "auto",
          background: "var(--nura-bg)", border: `1px solid ${BORDER}`,
          borderRadius: 18, padding: "22px 20px 20px",
          fontFamily: SANS,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: SP.block }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{
              fontFamily: SERIF, fontSize: 26, fontWeight: 400, lineHeight: 1.15,
              color: TEXT, margin: "0 0 6px",
            }}>
              {step.detailTitle ?? step.title}
            </h2>
            <p style={{ fontSize: 11.5, color: TEXT_TER, margin: 0 }}>
              {condition.name} · step {index + 1} of {condition.steps.length}
            </p>
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close"
            style={{
              flex: "0 0 auto", width: 32, height: 32, borderRadius: 10,
              background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_SEC,
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}
          >
            <X size={15} strokeWidth={1.8} />
          </button>
        </div>

        {step.supervised && (
          <Card label="Talk to your doctor first" tone="check">
            This step needs medical supervision. Bring it to your doctor before you act on it.
          </Card>
        )}

        <Card label={howLabel}>
          <RichText text={step.how} />
        </Card>

        {step.extra && (
          <Card label={step.extra.label}>
            <RichText text={step.extra.body} />
          </Card>
        )}

        {step.supplement && (
          <Card label="Pick a good one" tone="lab">
            <RichText text={step.labNote ?? ""} />
            {/* Block wrapper: an inline-flex link would otherwise run straight
                on from the last sentence with no break. */}
            <div style={{ marginTop: SP.stack }}>
              <Link
                href="/lab"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  fontSize: 12.5, fontWeight: 500, color: SAGE, textDecoration: "none",
                }}
              >
                Open Lab Reports <ChevronRight size={13} strokeWidth={2} />
              </Link>
            </div>
          </Card>
        )}

        <Card label={`Evidence · ${step.grade}`}>
          <div style={{ color: TEXT_TER, fontSize: 11.5, marginBottom: 4 }}>{step.gradeNote}</div>
          {step.evidence.map((src, i) => (
            <span key={i} style={{
              display: "block", fontSize: 12, lineHeight: 1.7, color: TEXT_SEC,
              paddingLeft: 13, borderLeft: `1px solid ${BORDER}`, marginTop: SP.tight,
            }}>
              {src}
            </span>
          ))}
        </Card>

        <Card label="Check first" tone="check">
          <RichText text={step.checkFirst} />
        </Card>

        <Disclaimer style={{ marginTop: SP.block, paddingTop: 16 }} />
      </div>
    </div>,
    document.body
  );
}
