"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Conditions — "request a condition" modal.
//
// The flow is a 1:1 mirror of RequestExerciseModal (app/fitness): two fields —
// a required name and optional details — one insert, and four states
// (idle / busy / sent / error). The chrome is the Conditions section's, so it
// reads as part of this screen rather than a transplant: same tokens, same
// centred-portal pattern and Escape handling as StepModal.
//
// Centred, never a bottom sheet. Locked pattern.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { submitConditionRequest } from "./requests";
import {
  BORDER, MONO, SAGE, SAGE_RGB, SANS, SERIF, SP, SURFACE, TEXT, TEXT_SEC, TEXT_TER,
} from "./ui";

type State = "idle" | "busy" | "sent" | "error";

const FIELD: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 13px",
  borderRadius: 12,
  fontFamily: SANS,
  fontSize: 13.5,
  lineHeight: 1.5,
  color: TEXT,
  background: SURFACE,
  border: `1px solid ${BORDER}`,
  outline: "none",
};

export default function RequestConditionModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [details, setDetails] = useState("");
  const [state, setState] = useState<State>("idle");
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Escape closes, and the page behind stops scrolling while it's open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    firstFieldRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const send = async () => {
    if (!name.trim() || state === "busy") return;
    setState("busy");
    const res = await submitConditionRequest(name, details);
    if (res.ok) {
      setState("sent");
      setName("");
      setDetails("");
    } else {
      // Includes "table doesn't exist yet" — the user never sees the reason.
      setState("error");
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
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
        aria-label="Request a condition"
        onClick={(e) => e.stopPropagation()}
        className="nura-modal-lift"
        style={{
          width: "100%", maxWidth: 420, maxHeight: "calc(100dvh - 56px)", overflowY: "auto",
          background: "var(--nura-bg)", border: `1px solid ${BORDER}`,
          borderRadius: 18, padding: "22px 20px 20px",
          fontFamily: SANS,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: SP.label }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: MONO, fontSize: 9.5, letterSpacing: "1.8px",
              textTransform: "uppercase", color: TEXT_TER, marginBottom: SP.tight,
            }}>
              Request a condition
            </div>
            <h2 style={{
              fontFamily: SERIF, fontSize: 25, fontWeight: 400, lineHeight: 1.15,
              color: TEXT, margin: 0,
            }}>
              What are you dealing with?
            </h2>
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

        {state === "sent" ? (
          <>
            <p style={{ fontSize: 13.5, lineHeight: 1.7, color: TEXT_SEC, margin: `0 0 ${SP.block}px` }}>
              Sent — thank you. We read every request, and the ones that come up
              most are the ones we research and write next.
            </p>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: "100%", padding: "13px 14px", borderRadius: 12, border: "none",
                background: SAGE, color: "var(--nura-bg)", fontFamily: SANS,
                fontSize: 13.5, fontWeight: 600, cursor: "pointer",
              }}
            >
              Done
            </button>
          </>
        ) : (
          <>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: TEXT_SEC, margin: `0 0 ${SP.label}px` }}>
              Tell us what&rsquo;s missing. We research and write these by hand, so
              the more specific you are, the better the protocol we can build.
            </p>

            <label
              htmlFor="cond-req-name"
              style={{
                display: "block", fontFamily: MONO, fontSize: 9.5, letterSpacing: "1.8px",
                textTransform: "uppercase", color: TEXT_TER, marginBottom: SP.tight,
              }}
            >
              Condition
            </label>
            <input
              id="cond-req-name"
              ref={firstFieldRef}
              value={name}
              onChange={(e) => { setName(e.target.value); if (state === "error") setState("idle"); }}
              placeholder="e.g. Raynaud's, tinnitus, vertigo"
              maxLength={120}
              style={{ ...FIELD, marginBottom: SP.label }}
            />

            <label
              htmlFor="cond-req-details"
              style={{
                display: "block", fontFamily: MONO, fontSize: 9.5, letterSpacing: "1.8px",
                textTransform: "uppercase", color: TEXT_TER, marginBottom: SP.tight,
              }}
            >
              Anything else <span style={{ letterSpacing: 0, textTransform: "none" }}>(optional)</span>
            </label>
            <textarea
              id="cond-req-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="What you’re dealing with, how long, what you’ve already tried…"
              rows={4}
              maxLength={1000}
              style={{ ...FIELD, resize: "vertical" }}
            />

            <p style={{ fontSize: 11.5, lineHeight: 1.6, color: TEXT_TER, margin: `${SP.tight}px 0 0` }}>
              Wellness information only. Please don&rsquo;t send anything you
              wouldn&rsquo;t want stored, and never use this instead of your doctor.
            </p>

            {state === "error" && (
              <div
                role="alert"
                style={{
                  marginTop: SP.label, padding: "11px 13px", borderRadius: 12,
                  border: `1px solid rgba(var(--nura-alert-rgb), 0.45)`,
                  background: `rgba(var(--nura-alert-rgb), 0.07)`,
                  fontSize: 12.5, lineHeight: 1.6, color: TEXT_SEC,
                }}
              >
                Couldn&rsquo;t send that just now — please try again later.
              </div>
            )}

            <div style={{ display: "flex", gap: 9, marginTop: SP.block }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1, padding: "13px 14px", borderRadius: 12,
                  border: `1px solid ${BORDER}`, background: "transparent", color: TEXT,
                  fontFamily: SANS, fontSize: 13.5, fontWeight: 500, cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={send}
                disabled={state === "busy" || !name.trim()}
                style={{
                  flex: 1, padding: "13px 14px", borderRadius: 12, border: "none",
                  background: SAGE, color: "var(--nura-bg)", fontFamily: SANS,
                  fontSize: 13.5, fontWeight: 600,
                  cursor: state === "busy" || !name.trim() ? "default" : "pointer",
                  opacity: state === "busy" || !name.trim() ? 0.5 : 1,
                  boxShadow: `0 6px 18px rgba(${SAGE_RGB}, 0.18)`,
                }}
              >
                {state === "busy" ? "Sending…" : "Send request"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
