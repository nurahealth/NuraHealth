"use client";

import { useState } from "react";
import NuraPageShell from "@/components/NuraPageShell";

const TEXT = "#f0ebde";
const TEXT_BODY = "rgba(235,230,216,0.85)";
const TEXT_SEC = "rgba(235,230,216,0.55)";
const SANS = "'Inter', system-ui, sans-serif";
const SERIF = "'DM Serif Display', Georgia, serif";

const SECTIONS: { title: string; body: string }[] = [
  {
    title: "Information We Collect",
    body: "[Placeholder — categories of data collected: account info (email, password hash), profile data (onboarding answers, name), health data (bloodwork PDFs, biomarkers, supplement logs, symptoms), behavioral data (chat history, saved items), and technical data (device, IP, cookies). This section should be drafted or reviewed by legal counsel before launch.]",
  },
  {
    title: "How We Use Your Information",
    body: "[Placeholder — purposes of processing: deliver personalized wellness insights, train and ground AI responses on the user's profile, surface bloodwork patterns, manage subscriptions, send transactional emails. Explicit statement that NŪRA does not sell user data. This section should be drafted or reviewed by legal counsel before launch.]",
  },
  {
    title: "Information Sharing",
    body: "[Placeholder — third parties that process data on NŪRA's behalf (subprocessors): Supabase for storage and auth, Anthropic for AI processing, OpenAI for embeddings, Stripe for billing. Disclosure of legal obligations (subpoena, court order) and aggregated/anonymized analytics. This section should be drafted or reviewed by legal counsel before launch.]",
  },
  {
    title: "Health Data Privacy (HIPAA Considerations)",
    body: "[Placeholder — explanation of whether NŪRA is a HIPAA Covered Entity or Business Associate, and how Protected Health Information is handled. If not subject to HIPAA, explain why and what equivalent protections are in place. This section requires legal review before launch — HIPAA compliance is regulated.]",
  },
  {
    title: "Cookies and Tracking",
    body: "[Placeholder — types of cookies used (functional auth cookies via Supabase), whether third-party analytics are used, opt-out mechanism, and Do Not Track signal handling. This section should be drafted or reviewed by legal counsel before launch.]",
  },
  {
    title: "Data Security",
    body: "[Placeholder — technical and organizational measures: encryption at rest (Supabase), encryption in transit (TLS), row-level security policies, access controls, incident response, and limits on internal access. This section should be drafted or reviewed by legal counsel before launch.]",
  },
  {
    title: "Your Rights",
    body: "[Placeholder — user rights depending on jurisdiction: access, correction, deletion, portability, restriction, objection. Procedures for exercising rights and contact channels. Mention of GDPR (EU), CCPA (California), and other applicable frameworks. This section should be drafted or reviewed by legal counsel before launch.]",
  },
  {
    title: "Children's Privacy",
    body: "[Placeholder — NŪRA is not directed to children under 18 (or 13, depending on jurisdiction). We do not knowingly collect data from minors. Process for parents to request deletion if such data was collected inadvertently. This section should be drafted or reviewed by legal counsel before launch.]",
  },
  {
    title: "Changes to This Policy",
    body: "[Placeholder — how policy updates are communicated (in-app notice, email), effective date of new versions, and whether continued use after change constitutes acceptance. This section should be drafted or reviewed by legal counsel before launch.]",
  },
  {
    title: "Contact Us",
    body: "[Placeholder — privacy inquiries contact (default: privacy@nura.health), data protection officer if applicable, and physical mailing address. This section should be drafted or reviewed by legal counsel before launch.]",
  },
];

export default function PrivacyPage() {
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
        Privacy Policy
      </h1>
      <p
        suppressHydrationWarning
        style={{ fontFamily: SANS, fontSize: 13, color: TEXT_SEC, margin: "0 0 28px" }}
      >
        Last updated: {today}
      </p>

      {SECTIONS.map((s) => (
        <Section key={s.title} title={s.title}>{s.body}</Section>
      ))}
    </NuraPageShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <h2 style={{
        fontFamily: SANS, fontSize: 22, fontWeight: 500, color: TEXT,
        margin: "24px 0 10px", letterSpacing: "-0.2px",
      }}>
        {title}
      </h2>
      <p style={{
        fontFamily: SANS, fontSize: 14, lineHeight: 1.7, color: TEXT_BODY, margin: 0,
      }}>
        {children}
      </p>
    </>
  );
}
