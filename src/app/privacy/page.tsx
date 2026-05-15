"use client";

import NuraPageShell from "@/components/NuraPageShell";

const TEXT = "var(--nura-text-primary)";
const TEXT_BODY = "rgba(var(--nura-fg-rgb),0.85)";
const TEXT_SEC = "var(--nura-text-secondary)";
const SAGE = "var(--nura-sage)";
const SANS = "'Inter', system-ui, sans-serif";
const SERIF = "'DM Serif Display', Georgia, serif";

type Block =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] };

type Section = { title: string; blocks: Block[] };

const INTRO =
  "NŪRA ('we,' 'us,' or 'our') respects your privacy and is committed to protecting the personal information you share with us. This Privacy Policy explains what information we collect, how we use it, when we share it, and the rights you have over it. By using NŪRA, you consent to the practices described here.";

const SECTIONS: Section[] = [
  {
    title: "1. Information We Collect",
    blocks: [
      {
        type: "p",
        text: "**Account Information:** When you create an account, we collect your email address, name, and password (encrypted). If you sign in via Google or Apple, we receive limited profile information from those providers as you authorize.",
      },
      {
        type: "p",
        text: "**Onboarding Information:** To personalize your wellness experience, we collect goals, current symptoms, lifestyle factors (diet, exercise, sleep, stress), and similar wellness-related data you choose to share.",
      },
      {
        type: "p",
        text: "**Health and Wellness Information:** This includes bloodwork files (PDFs, images), biomarker values extracted from your labs, supplements you log, wellness protocols you save, and chat messages you exchange with NŪRA's AI. We treat this information with heightened care.",
      },
      {
        type: "p",
        text: "**Payment Information:** All payment processing is handled by Stripe, our payment processor. We do not store full credit card numbers. We retain your subscription status, billing history, and the last four digits of your card for account management purposes.",
      },
      {
        type: "p",
        text: "**Usage and Technical Information:** We collect device type, browser, IP address, operating system, pages visited, features used, and timestamps. This helps us improve the Service and diagnose issues.",
      },
      {
        type: "p",
        text: "**Cookies and Similar Technologies:** We use essential cookies for authentication, session management, and core functionality. We may use limited analytics cookies to understand aggregate usage patterns. You can control cookies through your browser settings.",
      },
    ],
  },
  {
    title: "2. How We Use Your Information",
    blocks: [
      { type: "p", text: "We use your information to:" },
      {
        type: "ul",
        items: [
          "Provide, operate, and maintain the Service.",
          "Personalize wellness recommendations and AI responses based on your profile and history.",
          "Process payments and manage your subscription.",
          "Communicate with you about your account, the Service, security alerts, and support requests.",
          "Improve our AI models, content, and Service quality (using aggregated, de-identified data where possible).",
          "Detect, investigate, and prevent fraud, abuse, or violations of our Terms.",
          "Comply with legal obligations and respond to lawful requests.",
        ],
      },
    ],
  },
  {
    title: "3. AI Processing",
    blocks: [
      {
        type: "p",
        text: "When you interact with NŪRA's AI features (chat, bloodwork analysis, recommendations), your inputs and relevant context are sent to AI service providers, including Anthropic. We do not allow these providers to use your information for training their general AI models. Your data is processed solely to generate responses for you and is subject to the providers' own data protection policies and our contractual safeguards.",
      },
    ],
  },
  {
    title: "4. When We Share Information",
    blocks: [
      {
        type: "p",
        text: "We do not sell your personal information. We share information only in these limited circumstances:",
      },
      {
        type: "ul",
        items: [
          "**Service Providers:** We share information with vendors who help us operate the Service, including Supabase (database and authentication), Anthropic (AI processing), Stripe (payment processing), and analytics or email providers. These vendors are contractually bound to protect your information and use it only for the purposes we specify.",
          "**Legal Compliance:** We may disclose information if required by law, subpoena, court order, or to respond to lawful government requests. We will notify you of such requests where legally permitted.",
          "**Safety and Rights:** We may disclose information to protect the rights, property, or safety of NŪRA, our users, or the public, including investigating fraud or violations of our Terms.",
          "**Business Transfers:** If we are involved in a merger, acquisition, financing, or sale of assets, your information may be transferred as part of that transaction, subject to standard confidentiality protections.",
          "**With Your Consent:** We may share information for other purposes with your explicit consent.",
        ],
      },
    ],
  },
  {
    title: "5. Data Security",
    blocks: [
      {
        type: "p",
        text: "We implement industry-standard administrative, technical, and physical safeguards to protect your information, including:",
      },
      {
        type: "ul",
        items: [
          "Encryption of data in transit (TLS) and at rest.",
          "Role-based access controls and authentication for our personnel.",
          "Regular security reviews and vulnerability assessments.",
          "Secure third-party service providers.",
        ],
      },
      {
        type: "p",
        text: "No system is completely secure. In the unlikely event of a breach involving your personal health information, we will notify you and applicable regulators in accordance with the FTC Health Breach Notification Rule and applicable state laws, typically within 60 days of discovery.",
      },
    ],
  },
  {
    title: "6. Data Retention",
    blocks: [
      {
        type: "p",
        text: "We retain your information for as long as your account is active and as needed to provide the Service. After account deletion, we retain certain information:",
      },
      {
        type: "ul",
        items: [
          "**Account and subscription records:** up to 7 years for legal and tax purposes.",
          "**Health and wellness data:** deleted within 30 days of account closure, unless retention is required by law.",
          "**Aggregated, de-identified data:** may be retained indefinitely for analytics and Service improvement.",
        ],
      },
      {
        type: "p",
        text: "You may request earlier deletion by contacting us, subject to legal retention requirements.",
      },
    ],
  },
  {
    title: "7. Your Rights",
    blocks: [
      {
        type: "p",
        text: "Depending on your location, you may have the following rights regarding your personal information:",
      },
      {
        type: "ul",
        items: [
          "**Access:** Request a copy of the information we hold about you.",
          "**Correction:** Request that we correct inaccurate or incomplete information.",
          "**Deletion:** Request that we delete your information, subject to legal retention obligations.",
          "**Portability:** Request your information in a portable, machine-readable format.",
          "**Opt-Out:** Opt out of certain processing activities, including marketing communications and the sale or sharing of your information (we do not sell your data).",
          "**Restriction:** Request that we limit how we use your information.",
          "**Withdraw Consent:** Withdraw consent previously given, where processing is based on consent.",
        ],
      },
      {
        type: "p",
        text: "To exercise these rights, email us at [EMAIL]. We will respond within the timeframes required by applicable law (typically 30–45 days). We may need to verify your identity before processing your request.",
      },
    ],
  },
  {
    title: "8. Children's Privacy",
    blocks: [
      {
        type: "p",
        text: "The Service is intended for adults aged 18 and older. We do not knowingly collect information from individuals under 18. If we learn we have collected information from a minor, we will delete it promptly. If you believe a minor has provided us information, please contact us.",
      },
    ],
  },
  {
    title: "9. California Residents",
    blocks: [
      {
        type: "p",
        text: "California residents have additional rights under the California Consumer Privacy Act (CCPA), including the right to know what information we collect, the right to delete information, the right to opt out of the sale of personal information (we do not sell personal information), and the right to non-discrimination for exercising these rights. To exercise these rights, contact us at [EMAIL].",
      },
    ],
  },
  {
    title: "10. International Users",
    blocks: [
      {
        type: "p",
        text: "NŪRA is operated from the United States. If you access the Service from outside the U.S., you consent to the transfer and processing of your information in the U.S., which may have different data protection laws than your country of residence. For users in the European Economic Area, United Kingdom, or other jurisdictions with comprehensive data protection laws, additional rights may apply under those laws.",
      },
    ],
  },
  {
    title: "11. Third-Party Links",
    blocks: [
      {
        type: "p",
        text: "The Service may contain links to third-party websites or services. We are not responsible for their privacy practices. Please review their privacy policies before sharing information.",
      },
    ],
  },
  {
    title: "12. Changes to This Policy",
    blocks: [
      {
        type: "p",
        text: "We may update this Privacy Policy from time to time. Material changes will be communicated by email or in-app notice. Continued use after changes take effect constitutes acceptance of the updated Policy.",
      },
    ],
  },
  {
    title: "13. Contact Us",
    blocks: [
      {
        type: "p",
        text: "Questions about this Privacy Policy or how we handle your information can be directed to: [EMAIL]",
      },
    ],
  },
];

export default function PrivacyPage() {
  return (
    <NuraPageShell maxWidth={760}>
      <h1
        style={{
          fontFamily: SERIF,
          fontWeight: 500,
          color: TEXT,
          margin: "0 0 6px",
          lineHeight: 1.15,
          letterSpacing: "-0.5px",
          fontSize: "clamp(32px, 5vw, 44px)",
        }}
      >
        Privacy Policy
      </h1>
      <p style={{ fontFamily: SANS, fontSize: 13, color: TEXT_SEC, margin: "0 0 28px" }}>
        Last updated: May 14, 2026
      </p>

      <p style={bodyStyle()}>{INTRO}</p>

      {SECTIONS.map((s) => (
        <Section key={s.title} title={s.title} blocks={s.blocks} />
      ))}
    </NuraPageShell>
  );
}

function Section({ title, blocks }: { title: string; blocks: Block[] }) {
  return (
    <>
      <h2 style={headingStyle()}>{title}</h2>
      {blocks.map((b, i) =>
        b.type === "p" ? (
          <p key={i} style={bodyStyle(i > 0 ? 10 : 0)}>
            {renderInline(b.text)}
          </p>
        ) : (
          <ul key={i} style={{ margin: "10px 0 0", paddingLeft: 22 }}>
            {b.items.map((item, j) => (
              <li
                key={j}
                style={{
                  fontFamily: SANS,
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: TEXT_BODY,
                  margin: "0 0 6px",
                }}
              >
                {renderInline(item)}
              </li>
            ))}
          </ul>
        )
      )}
    </>
  );
}

function headingStyle(): React.CSSProperties {
  return {
    fontFamily: SANS,
    fontSize: 22,
    fontWeight: 500,
    color: SAGE,
    margin: "28px 0 12px",
    letterSpacing: "1px",
    textTransform: "uppercase",
  };
}

function bodyStyle(topMargin = 0): React.CSSProperties {
  return {
    fontFamily: SANS,
    fontSize: 14,
    lineHeight: 1.7,
    color: TEXT_BODY,
    margin: `${topMargin}px 0 0`,
  };
}

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*([^*]+)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    parts.push(
      <strong key={key++} style={{ color: SAGE, fontWeight: 500 }}>
        {match[1]}
      </strong>
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}
