"use client";

import { useState } from "react";
import NuraPageShell from "@/components/NuraPageShell";

const TEXT = "#f0ebde";
const TEXT_BODY = "rgba(235,230,216,0.85)";
const TEXT_SEC = "rgba(235,230,216,0.55)";
const RED = "#d4574d";
const SANS = "'Inter', system-ui, sans-serif";
const SERIF = "'DM Serif Display', Georgia, serif";

interface SectionDef { title: string; body: string }
const SECTIONS: SectionDef[] = [
  {
    title: "Not Medical Advice",
    body: "[Placeholder — NŪRA provides wellness information drawn from natural healing protocols, herbal medicine, nutritional therapy, and modern research. The content is not medical advice and is not intended to diagnose, treat, cure, or prevent any disease. This section should be drafted or reviewed by legal counsel and a licensed healthcare professional before launch.]",
  },
  {
    title: "Information for Educational Purposes",
    body: "[Placeholder — all NŪRA content (AI responses, protocols, supplement suggestions, bloodwork insights) is provided for educational and informational purposes only. Users should not act on the information without professional consultation. This section should be drafted or reviewed by legal counsel before launch.]",
  },
  {
    title: "Consult Your Healthcare Provider",
    body: "[Placeholder — users should consult with a licensed physician, naturopath, or other qualified healthcare provider before starting any new wellness regimen, taking any supplement, or making changes to existing medications. This is especially critical for users who are pregnant, nursing, taking prescription medications, or managing chronic conditions. This section should be drafted or reviewed by legal counsel before launch.]",
  },
  {
    title: "Emergency Situations",
    body: "EMERGENCY_CALLOUT",
  },
  {
    title: "Natural Wellness Protocols",
    body: "[Placeholder — protocols suggested by NŪRA are based on traditional and modern wellness research, but individual responses vary. Time-to-effect, dosages, and outcomes are not guaranteed. Users are responsible for monitoring their own response and discontinuing anything that causes adverse reactions. This section should be drafted or reviewed by legal counsel before launch.]",
  },
  {
    title: "Supplement Interactions",
    body: "[Placeholder — supplements can interact with prescription medications, over-the-counter drugs, other supplements, and underlying conditions. NŪRA does not verify medication lists or check for interactions automatically. Users must consult their pharmacist or physician about potential interactions. This section should be drafted or reviewed by legal counsel before launch.]",
  },
  {
    title: "Individual Variation",
    body: "[Placeholder — health is highly individual. Biomarker ranges, supplement responses, and protocol outcomes vary based on genetics, lifestyle, medication, and clinical history. What works for one person may not work for another. NŪRA's outputs are starting points for conversation with a clinician — not prescriptions. This section should be drafted or reviewed by legal counsel before launch.]",
  },
  {
    title: "No Doctor-Patient Relationship",
    body: "[Placeholder — use of NŪRA does not establish a doctor-patient, practitioner-client, or any other professional healthcare relationship between the user and NŪRA, its founders, employees, or contractors. No such relationship is implied by any communication through the platform. This section should be drafted or reviewed by legal counsel before launch.]",
  },
];

export default function MedicalDisclaimerPage() {
  const [today] = useState<string>(() =>
    new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
  );

  return (
    <NuraPageShell maxWidth={720}>
      <h1 style={{
        fontFamily: SERIF, fontWeight: 500, color: TEXT,
        margin: "0 0 6px", lineHeight: 1.15, letterSpacing: "-0.5px",
        fontSize: "clamp(32px, 5vw, 44px)",
      }}>
        Medical Disclaimer
      </h1>
      <p
        suppressHydrationWarning
        style={{ fontFamily: SANS, fontSize: 13, color: TEXT_SEC, margin: "0 0 28px" }}
      >
        Last updated: {today}
      </p>

      {SECTIONS.map((s) => (
        <Section key={s.title} title={s.title} emergency={s.body === "EMERGENCY_CALLOUT"}>
          {s.body === "EMERGENCY_CALLOUT" ? null : s.body}
        </Section>
      ))}
    </NuraPageShell>
  );
}

function Section({ title, children, emergency }: { title: string; children: React.ReactNode; emergency?: boolean }) {
  return (
    <>
      <h2 style={{
        fontFamily: SANS, fontSize: 22, fontWeight: 500, color: TEXT,
        margin: "24px 0 10px", letterSpacing: "-0.2px",
      }}>
        {title}
      </h2>
      {emergency ? (
        <div style={{
          background: "rgba(212,87,77,0.08)",
          border: `1px solid rgba(212,87,77,0.4)`,
          borderLeft: `3px solid ${RED}`,
          borderRadius: 12,
          padding: "16px 18px",
        }}>
          <p style={{
            fontFamily: SANS, fontSize: 15, fontWeight: 600, color: RED, margin: "0 0 6px",
            letterSpacing: "0.1px",
          }}>
            If you are experiencing a medical emergency, call 911 immediately.
          </p>
          <p style={{
            fontFamily: SANS, fontSize: 14, lineHeight: 1.7, color: TEXT_BODY, margin: 0,
          }}>
            Do not use NŪRA in place of emergency medical services. For acute symptoms such as chest pain, difficulty
            breathing, severe bleeding, sudden weakness or numbness, or thoughts of self-harm, call your local
            emergency number, go to the nearest emergency room, or contact your nation&apos;s crisis line.
          </p>
        </div>
      ) : (
        <p style={{
          fontFamily: SANS, fontSize: 14, lineHeight: 1.7, color: TEXT_BODY, margin: 0,
        }}>
          {children}
        </p>
      )}
    </>
  );
}

