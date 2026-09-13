import Link from "next/link";
import NuraPageShell from "@/components/NuraPageShell";

const TEXT = "var(--nura-text-primary)";
const TEXT_SEC = "var(--nura-text-secondary)";
const TEXT_TER = "var(--nura-text-tertiary)";
const BORDER = "var(--nura-border)";
const SURFACE = "var(--nura-surface)";
const SAGE = "var(--nura-sage)";
const SANS = "var(--font-inter), system-ui, sans-serif";

// This page states the rule the scorer actually applies (src/lib/catalog-scoring.ts).
// If the weights change there, they change here — the two are one method.
const FACTORS: { title: string; max: string; body: string; bands: [string, string][] }[] = [
  {
    title: "Processing level",
    max: "up to −45",
    body: "The NOVA classification, a peer-reviewed system that groups foods by how far they are from their whole-food form. It carries the most weight because it is the single strongest predictor of everything else on the label.",
    bands: [["Unprocessed or minimally processed", "0"], ["Processed culinary ingredient", "−8"], ["Processed food", "−22"], ["Ultra-processed", "−45"]],
  },
  {
    title: "Declared additives",
    max: "up to −20",
    body: "Emulsifiers, preservatives, colours, flavour enhancers and similar additives declared on the ingredient list. Four points each, capped at twenty.",
    bands: [["None", "0"], ["Each additive", "−4"], ["Five or more", "−20"]],
  },
  {
    title: "Sugar",
    max: "up to −20",
    body: "Total sugars per 100 g. Products are compared per 100 g so a large bar and a small one are judged on the same footing; the product page also states the amount in one serving.",
    bands: [["5 g or less", "0"], ["5 to 12 g", "−6"], ["12 to 22 g", "−13"], ["Over 22 g", "−20"]],
  },
  {
    title: "Sodium",
    max: "up to −10",
    body: "Sodium per 100 g.",
    bands: [["120 mg or less", "0"], ["120 to 400 mg", "−4"], ["400 to 800 mg", "−7"], ["Over 800 mg", "−10"]],
  },
  {
    title: "Saturated fat",
    max: "up to −10",
    body: "Saturated fat per 100 g.",
    bands: [["1.5 g or less", "0"], ["1.5 to 5 g", "−4"], ["5 to 10 g", "−7"], ["Over 10 g", "−10"]],
  },
  {
    title: "Certified organic",
    max: "+6",
    body: "A recognised organic certification on the label. A modest credit, not a pass — an ultra-processed organic product is still ultra-processed.",
    bands: [["Certified", "+6"]],
  },
];

export default function HowWeScorePage() {
  return (
    <NuraPageShell maxWidth={860} desktopMaxWidth={880}>
      <Link href="/lab" style={{ fontFamily: SANS, fontSize: 12.5, color: TEXT_SEC, textDecoration: "none" }}>← All products</Link>
      <h1 style={{ fontFamily: SANS, fontSize: "clamp(28px, 4.5vw, 36px)", fontWeight: 600, color: TEXT, margin: "12px 0 10px", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
        How we score
      </h1>
      <p style={{ fontFamily: SANS, fontSize: 15, color: TEXT_SEC, lineHeight: 1.65, margin: "0 0 8px", maxWidth: 640 }}>
        Every product starts at 100 and loses points for what is on its label. The rules are fixed, the same for every product, and listed here in full — the score is not an opinion, it is arithmetic you can check.
      </p>
      <p style={{ fontFamily: SANS, fontSize: 15, color: TEXT_SEC, lineHeight: 1.65, margin: "0 0 30px", maxWidth: 640 }}>
        80 and above is <strong style={{ color: TEXT }}>Excellent</strong>, 60 to 79 <strong style={{ color: TEXT }}>Good</strong>, 40 to 59 <strong style={{ color: TEXT }}>Fair</strong>, below 40 <strong style={{ color: TEXT }}>Poor</strong>. A product with fewer than three of these factors on its label is marked provisional.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {FACTORS.map((f) => (
          <div key={f.title} style={{ background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 16, padding: "18px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
              <div style={{ fontFamily: SANS, fontSize: 16, fontWeight: 600, color: TEXT }}>{f.title}</div>
              <div style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: SAGE, whiteSpace: "nowrap" }}>{f.max}</div>
            </div>
            <p style={{ fontFamily: SANS, fontSize: 13.5, color: TEXT_SEC, lineHeight: 1.6, margin: "8px 0 12px" }}>{f.body}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "6px 20px" }}>
              {f.bands.map(([band, pts]) => (
                <div key={band} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontFamily: SANS, fontSize: 13 }}>
                  <span style={{ color: TEXT_TER }}>{band}</span>
                  <span style={{ color: TEXT, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{pts}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p style={{ fontFamily: SANS, fontSize: 13.5, color: TEXT_TER, lineHeight: 1.65, margin: "28px 0 0", maxWidth: 640 }}>
        Label data comes from the manufacturer's declaration via Open Food Facts and is cited on every product. Where a product also carries independent lab results — contaminants, heavy metals — those appear on the product page against their guideline and are not folded into this score.
      </p>
    </NuraPageShell>
  );
}
