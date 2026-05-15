"use client";

import NuraPageShell from "@/components/NuraPageShell";

const TEXT = "#f0ebde";
const TEXT_BODY = "rgba(235,230,216,0.85)";
const TEXT_SEC = "rgba(235,230,216,0.55)";
const SAGE = "#9bb0a5";
const SANS = "'Inter', system-ui, sans-serif";
const SERIF = "'DM Serif Display', Georgia, serif";

type Block =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] };

type Section = { title: string; blocks: Block[] };

const INTRO =
  "Welcome to NŪRA. These Terms of Service ('Terms') govern your access to and use of the NŪRA platform, mobile application, website, and related services (collectively, the 'Service') operated by [COMPANY] ('NŪRA,' 'we,' 'us,' or 'our'). By creating an account or using the Service, you agree to be bound by these Terms. If you do not agree to these Terms, do not use the Service.";

const SECTIONS: Section[] = [
  {
    title: "1. Acceptance of Terms",
    blocks: [
      {
        type: "p",
        text: "By accessing or using the Service, you confirm that you are at least 18 years of age, have the legal capacity to enter into a binding agreement, and agree to comply with these Terms and all applicable laws. If you are accessing the Service on behalf of a business or other entity, you represent that you have the authority to bind that entity to these Terms. We may update these Terms from time to time. Continued use of the Service after changes are posted constitutes acceptance of the updated Terms.",
      },
    ],
  },
  {
    title: "2. Description of Service",
    blocks: [
      {
        type: "p",
        text: "NŪRA is a general wellness platform that provides educational information, AI-powered conversational guidance, bloodwork analysis, supplement tracking, and natural wellness protocols based on herbal medicine, nutritional therapy, and holistic healing approaches. The Service is intended solely to support general wellness goals and is not designed, intended, or authorized to: diagnose, treat, cure, mitigate, or prevent any disease or medical condition; replace consultation with licensed healthcare providers; or substitute for professional medical advice, diagnosis, or treatment. All information, recommendations, and content provided through the Service are for informational and educational purposes only.",
      },
    ],
  },
  {
    title: "3. User Accounts",
    blocks: [
      {
        type: "p",
        text: "To access most features, you must create an account by providing accurate, current, and complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You agree to notify us immediately of any unauthorized use of your account. We reserve the right to suspend or terminate accounts that violate these Terms, are inactive for extended periods, or are used in a manner that we determine, in our sole discretion, to be harmful to the Service or other users. You may not create accounts using automated means or false information, share your account with others, or transfer your account to another person without our written consent.",
      },
    ],
  },
  {
    title: "4. Subscription and Billing",
    blocks: [
      {
        type: "p",
        text: "NŪRA offers a subscription-based service. By starting a subscription, you authorize us to charge your designated payment method (processed securely through our payment provider, Stripe) on a recurring basis according to the plan you select. Subscription details:",
      },
      {
        type: "ul",
        items: [
          "**Free Trial:** New subscribers receive a 3-day free trial. Your payment method will be authorized at signup but not charged until the trial period ends. You may cancel at any time during the trial without charge.",
          "**Monthly Subscription:** $9.99 per month, automatically renewing each billing period unless cancelled.",
          "**Cancellation:** You may cancel your subscription at any time through your account settings or by contacting us. Cancellations take effect at the end of the current billing period; you will retain access through the paid period.",
          "**Refunds:** Subscription fees are non-refundable except where required by law or at our sole discretion in cases of extraordinary circumstances.",
          "**Price Changes:** We reserve the right to modify subscription pricing with at least 30 days' notice. Continued use after the price change takes effect constitutes acceptance of the new price.",
          "**Failed Payments:** If a payment fails, we may suspend Service access until payment is resolved.",
        ],
      },
    ],
  },
  {
    title: "5. User Content and Data",
    blocks: [
      {
        type: "p",
        text: "You retain ownership of all content you submit to the Service, including bloodwork files, chat messages, profile information, and other data ('User Content'). By submitting User Content, you grant NŪRA a worldwide, non-exclusive, royalty-free license to use, store, process, analyze, and display your User Content solely for the purpose of providing and improving the Service to you. This license terminates when you delete the User Content or your account, except where retention is required for legal compliance, safety, or where the content has been aggregated and anonymized for analytics and research purposes.",
      },
      {
        type: "p",
        text: "You represent and warrant that you own or have necessary rights to all User Content you submit, and that your User Content does not violate any laws, third-party rights, or these Terms.",
      },
    ],
  },
  {
    title: "6. AI-Generated Content",
    blocks: [
      {
        type: "p",
        text: "NŪRA uses artificial intelligence to generate responses, recommendations, and analyses. AI-generated content has inherent limitations and may contain inaccuracies, omissions, or outdated information. You acknowledge and agree that:",
      },
      {
        type: "ul",
        items: [
          "AI-generated responses are not professional medical, legal, financial, or other expert advice.",
          "You should independently verify any information before acting on it.",
          "NŪRA makes no guarantees about the accuracy, completeness, or appropriateness of AI-generated content for your specific situation.",
          "You are solely responsible for decisions made based on information from the Service.",
        ],
      },
    ],
  },
  {
    title: "7. Acceptable Use",
    blocks: [
      { type: "p", text: "You agree not to:" },
      {
        type: "ul",
        items: [
          "Use the Service for any illegal purpose or in violation of any laws or regulations.",
          "Use the Service to diagnose, treat, or manage medical conditions in lieu of consulting healthcare professionals.",
          "Use the Service to provide medical advice to third parties or in any clinical or healthcare provider capacity.",
          "Attempt to reverse engineer, decompile, scrape, or extract source code or proprietary data from the Service.",
          "Use the Service to harass, abuse, or harm others.",
          "Submit false, misleading, or fraudulent information.",
          "Attempt to gain unauthorized access to other accounts, our systems, or related networks.",
          "Interfere with or disrupt the Service or servers.",
          "Resell, sublicense, or commercially exploit the Service without express written permission.",
          "Use the Service to develop a competing product or service.",
        ],
      },
    ],
  },
  {
    title: "8. Intellectual Property",
    blocks: [
      {
        type: "p",
        text: "The Service, including all software, content, designs, text, graphics, AI models, and underlying technology, is the exclusive property of NŪRA and its licensors and is protected by copyright, trademark, and other intellectual property laws. We grant you a limited, non-exclusive, non-transferable license to access and use the Service for personal, non-commercial wellness purposes during your subscription. All rights not expressly granted are reserved.",
      },
    ],
  },
  {
    title: "9. Disclaimers",
    blocks: [
      {
        type: "p",
        text: "THE SERVICE IS PROVIDED 'AS IS' AND 'AS AVAILABLE' WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR ACCURACY. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.",
      },
      {
        type: "p",
        text: "NŪRA IS NOT A LICENSED MEDICAL PROVIDER. THE SERVICE DOES NOT PROVIDE MEDICAL ADVICE. NOTHING IN THE SERVICE CONSTITUTES A DIAGNOSIS, TREATMENT, OR CURE FOR ANY MEDICAL CONDITION. ALWAYS CONSULT A QUALIFIED HEALTHCARE PROVIDER BEFORE MAKING ANY DECISIONS RELATED TO YOUR HEALTH.",
      },
    ],
  },
  {
    title: "10. Limitation of Liability",
    blocks: [
      {
        type: "p",
        text: "TO THE MAXIMUM EXTENT PERMITTED BY LAW, NŪRA, ITS AFFILIATES, OFFICERS, EMPLOYEES, AGENTS, AND LICENSORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO DAMAGES FOR PERSONAL INJURY, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, ARISING FROM OR RELATED TO YOUR USE OF OR INABILITY TO USE THE SERVICE.",
      },
      {
        type: "p",
        text: "IN NO EVENT SHALL OUR TOTAL LIABILITY EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE EVENT GIVING RISE TO LIABILITY, OR (B) ONE HUNDRED DOLLARS ($100).",
      },
      {
        type: "p",
        text: "Some jurisdictions do not allow the exclusion of certain warranties or the limitation of liability for certain damages, so some of the above limitations may not apply to you.",
      },
    ],
  },
  {
    title: "11. Indemnification",
    blocks: [
      {
        type: "p",
        text: "You agree to indemnify, defend, and hold harmless NŪRA, its affiliates, officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, costs, or expenses (including reasonable attorneys' fees) arising from or related to: your use of the Service; your violation of these Terms; your violation of any rights of a third party; your User Content; or any decision or action you take based on information from the Service.",
      },
    ],
  },
  {
    title: "12. Termination",
    blocks: [
      {
        type: "p",
        text: "We may suspend or terminate your access to the Service at any time, with or without notice, for any reason, including violation of these Terms. You may terminate your account at any time by following the cancellation procedures in your account settings. Upon termination, your right to use the Service immediately ceases. Provisions of these Terms that by their nature should survive termination shall survive, including ownership, warranty disclaimers, indemnity, and limitations of liability.",
      },
    ],
  },
  {
    title: "13. Governing Law and Dispute Resolution",
    blocks: [
      {
        type: "p",
        text: "These Terms are governed by the laws of the State of Florida, USA, without regard to conflict of law principles. Any dispute arising out of or relating to these Terms or the Service shall first be addressed through good-faith negotiation. If unresolved within 30 days, disputes shall be resolved through binding arbitration administered by the American Arbitration Association under its Consumer Arbitration Rules, in Jacksonville, Florida. You waive any right to a jury trial or to participate in a class action. This arbitration provision does not preclude you from seeking small claims court remedies for qualifying disputes.",
      },
    ],
  },
  {
    title: "14. Changes to These Terms",
    blocks: [
      {
        type: "p",
        text: "We may modify these Terms at any time by posting the revised Terms on the Service and updating the 'Last updated' date. Material changes will be communicated by email or in-app notice at least 30 days before taking effect. Continued use after changes take effect constitutes acceptance.",
      },
    ],
  },
  {
    title: "15. Contact",
    blocks: [
      {
        type: "p",
        text: "Questions about these Terms can be directed to [EMAIL].",
      },
    ],
  },
];

export default function TermsPage() {
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
        Terms of Service
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
