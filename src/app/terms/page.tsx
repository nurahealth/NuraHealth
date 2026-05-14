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
    title: "Acceptance of Terms",
    body: "[Placeholder — replace with actual Terms of Service language. This section should state that by creating a NŪRA account or using the service, the user agrees to be bound by these terms. This section should be drafted or reviewed by legal counsel before launch.]",
  },
  {
    title: "Description of Service",
    body: "[Placeholder — describe what NŪRA is: a wellness platform offering AI-powered guidance, bloodwork analysis, supplement tracking, and personalized protocols. Clarify that NŪRA is a software service, not a medical service. This section should be drafted or reviewed by legal counsel before launch.]",
  },
  {
    title: "User Accounts",
    body: "[Placeholder — account creation requirements, age restrictions, accuracy of information, responsibility for account credentials, prohibition on sharing accounts, and grounds for suspension or termination. This section should be drafted or reviewed by legal counsel before launch.]",
  },
  {
    title: "Health Information Disclaimer",
    body: "[Placeholder — NŪRA does not provide medical advice, diagnosis, or treatment. All content is for informational and educational purposes only. Users should consult licensed healthcare professionals before making health decisions. This section should be drafted or reviewed by legal counsel before launch.]",
  },
  {
    title: "Subscription and Billing",
    body: "[Placeholder — Pro plan pricing, trial period mechanics, automatic renewal, cancellation policy, refund policy, payment processing through Stripe, and tax handling. This section should be drafted or reviewed by legal counsel before launch.]",
  },
  {
    title: "Privacy",
    body: "[Placeholder — pointer to the full Privacy Policy with a high-level summary: what data we collect, how we use it, and the user's rights. This section should be drafted or reviewed by legal counsel before launch.]",
  },
  {
    title: "Intellectual Property",
    body: "[Placeholder — NŪRA's ownership of the platform, content, branding, and AI outputs. User-generated content licensing back to NŪRA for service operation. This section should be drafted or reviewed by legal counsel before launch.]",
  },
  {
    title: "Limitation of Liability",
    body: "[Placeholder — NŪRA's liability is limited to the maximum extent allowed by law. Service is provided 'as is' without warranties. NŪRA is not liable for indirect, incidental, or consequential damages. This section should be drafted or reviewed by legal counsel before launch.]",
  },
  {
    title: "Termination",
    body: "[Placeholder — how either party may terminate the relationship, what happens to user data on termination, and surviving provisions. This section should be drafted or reviewed by legal counsel before launch.]",
  },
  {
    title: "Governing Law",
    body: "[Placeholder — jurisdiction whose laws govern the agreement, venue for disputes, and dispute resolution mechanism (arbitration, class action waiver, etc.). This section should be drafted or reviewed by legal counsel before launch.]",
  },
  {
    title: "Contact",
    body: "[Placeholder — how users can contact NŪRA with questions about these terms. Default: support@nura.health.]",
  },
];

export default function TermsPage() {
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
        Terms of Service
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
