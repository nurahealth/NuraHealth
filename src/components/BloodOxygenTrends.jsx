import React from "react";

const SANS = "var(--font-inter), system-ui, sans-serif";
// Ice / platinum identity — crisp on the dark bg, cool-blue lean.
const OX = "var(--nura-ice-hi)"; // line / markers
const OX_RGB = "var(--nura-ice-rgb)"; // fills / band / glow
const CREAM = "var(--nura-text-primary)";
const FAINT = "var(--nura-ink-a45)";
const BAND = `rgba(${OX_RGB},0.1)`;

const yFor = (v) => 48 + (100 - v) * 12;
const xFor = (i, n) => (n <= 1 ? 182 : 68 + ((296 - 68) * i) / (n - 1));

function smoothPath(pts) {
  if (pts.length < 2) return "";
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2[0]} ${p2[1]}`;
  }
  return d;
}

function Frame({ children, guides }) {
  return (
    <svg viewBox="0 0 340 216" style={{ display: "block", width: "100%", shapeRendering: "geometricPrecision", fontFamily: SANS }}>
      <rect x="44" y={yFor(100)} width="276" height={yFor(95) - yFor(100)} fill={BAND} />
      <g stroke="rgba(var(--nura-fg-rgb),0.045)">
        {guides.map((gx, i) => (<line key={i} x1={gx} y1="48" x2={gx} y2="190" />))}
      </g>
      <line x1="44" y1={yFor(95)} x2="320" y2={yFor(95)} stroke="rgba(var(--nura-fg-rgb),0.28)" strokeWidth="1" strokeDasharray="2 4" />
      <line x1="44" y1={yFor(100)} x2="320" y2={yFor(100)} stroke="rgba(var(--nura-fg-rgb),0.04)" />
      <line x1="44" y1={yFor(90)} x2="320" y2={yFor(90)} stroke="rgba(var(--nura-fg-rgb),0.04)" />
      <text x="38" y={yFor(100) + 4} textAnchor="end" fontSize="9.5" fill="var(--nura-ink-a40)">100</text>
      <text x="38" y={yFor(95) + 4} textAnchor="end" fontSize="9.5" fill="var(--nura-ink-a40)">95</text>
      <text x="38" y={yFor(90) + 4} textAnchor="end" fontSize="9.5" fill="var(--nura-ink-a40)">90</text>
      {children}
      <line x1="44" y1="190" x2="320" y2="190" stroke="rgba(var(--nura-fg-rgb),0.1)" />
    </svg>
  );
}

function Legend({ lineLabel }) {
  return (
    <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginTop: 12, fontSize: 11, color: FAINT }}>
      <span><i style={{ display: "inline-block", verticalAlign: "middle", marginRight: 5, width: 14, height: 2, borderRadius: 2, background: OX }} />{lineLabel}</span>
      <span><i style={{ display: "inline-block", verticalAlign: "middle", marginRight: 5, width: 12, height: 9, borderRadius: 2, background: "rgba(var(--nura-ice-rgb),0.16)", border: "0.5px solid rgba(var(--nura-ice-rgb),0.4)" }} />normal range (≥95%)</span>
    </div>
  );
}

function SectionHead({ label, note, avg }) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", margin: "0 2px 3px" }}>
        <p style={{ fontSize: 15, fontWeight: 500, margin: 0 }}>{label}</p>
        <span style={{ fontSize: 13, color: "var(--nura-ink-a62)" }}>avg <b style={{ color: CREAM, fontWeight: 600 }}>{avg}%</b></span>
      </div>
      <p style={{ fontSize: 12, color: FAINT, margin: "0 2px 12px", lineHeight: 1.4 }}>{note}</p>
    </>
  );
}

export default function BloodOxygenTrends({
  lastNight = [97, 97, 96, 95, 96, 97, 97],
  sevenNights = [
    { day: "Mon", v: 97 }, { day: "Tue", v: 96 }, { day: "Wed", v: 97 },
    { day: "Thu", v: 98 }, { day: "Fri", v: 97 }, { day: "Sat", v: 96 }, { day: "Sun", v: 97 },
  ],
  nightAvg = 97,
  weekAvg = 97,
}) {
  const n1 = lastNight.map((v, i) => [xFor(i, lastNight.length), yFor(v)]);
  const n1path = smoothPath(n1);
  const n1area = `${n1path} L ${n1[n1.length - 1][0]} ${yFor(90)} L ${n1[0][0]} ${yFor(90)} Z`;
  const lowIdx = lastNight.indexOf(Math.min(...lastNight));
  const times = ["11 PM", "1 AM", "3 AM", "5 AM", "7 AM"];
  const timeX = [68, 125, 182, 239, 296];
  const n7 = sevenNights.map((d, i) => [xFor(i, sevenNights.length), yFor(d.v)]);
  const n7path = smoothPath(n7);
  const n7area = `${n7path} L ${n7[n7.length - 1][0]} ${yFor(90)} L ${n7[0][0]} ${yFor(90)} Z`;

  return (
    <div style={{ fontFamily: SANS, color: CREAM }}>
      <div style={{ marginBottom: 30 }}>
        <SectionHead label="Last night" note="SpO₂ through the night — normal is 95% and up" avg={nightAvg} />
        <Frame guides={timeX}>
          <defs>
            <linearGradient id="oxfillA" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="rgba(var(--nura-ice-rgb),0.28)" />
              <stop offset="1" stopColor="rgba(var(--nura-ice-rgb),0)" />
            </linearGradient>
          </defs>
          <path d={n1area} fill="url(#oxfillA)" />
          <path d={n1path} fill="none" stroke={OX} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={n1[0][0]} cy={n1[0][1]} r="3" fill={OX} />
          <text x={n1[0][0]} y={n1[0][1] - 12} textAnchor="middle" fontSize="10" fontWeight="600" fill={CREAM}>{lastNight[0]}%</text>
          <circle cx={n1[lowIdx][0]} cy={n1[lowIdx][1]} r="3.5" fill={CREAM} stroke="var(--nura-bg)" strokeWidth="1.5" />
          <text x={n1[lowIdx][0]} y={n1[lowIdx][1] + 16} textAnchor="middle" fontSize="10" fontWeight="600" fill={CREAM}>{lastNight[lowIdx]}%</text>
          <text x={n1[lowIdx][0]} y={n1[lowIdx][1] + 28} textAnchor="middle" fontSize="9" fill="var(--nura-ink-a50)">low</text>
          <circle cx={n1[n1.length - 1][0]} cy={n1[n1.length - 1][1]} r="8" fill="rgba(var(--nura-ice-rgb),0.2)" />
          <circle cx={n1[n1.length - 1][0]} cy={n1[n1.length - 1][1]} r="4.5" fill={OX} stroke="var(--nura-bg)" strokeWidth="1.8" />
          <text x={n1[n1.length - 1][0]} y={n1[n1.length - 1][1] - 12} textAnchor="middle" fontSize="10" fontWeight="600" fill={CREAM}>{lastNight[lastNight.length - 1]}%</text>
          {times.map((t, i) => (<text key={i} x={timeX[i]} y="207" textAnchor="middle" fontSize="10" fill={FAINT}>{t}</text>))}
        </Frame>
        <Legend lineLabel="SpO₂" />
      </div>

      <div style={{ marginBottom: 30 }}>
        <SectionHead label="Last 7 nights" note="Every night's average — all in the normal range" avg={weekAvg} />
        <Frame guides={n7.map((p) => p[0])}>
          <defs>
            <linearGradient id="oxfillB" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="rgba(var(--nura-ice-rgb),0.28)" />
              <stop offset="1" stopColor="rgba(var(--nura-ice-rgb),0)" />
            </linearGradient>
          </defs>
          <path d={n7area} fill="url(#oxfillB)" />
          <path d={n7path} fill="none" stroke={OX} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          {n7.map((p, i) => {
            const isLast = i === n7.length - 1;
            return (
              <g key={i}>
                {isLast ? (
                  <>
                    <circle cx={p[0]} cy={p[1]} r="8" fill="rgba(var(--nura-ice-rgb),0.2)" />
                    <circle cx={p[0]} cy={p[1]} r="4.5" fill={OX} stroke="var(--nura-bg)" strokeWidth="1.8" />
                    <text x={p[0]} y={p[1] - 13} textAnchor="middle" fontSize="10.5" fontWeight="600" fill={CREAM}>{sevenNights[i].v}</text>
                  </>
                ) : (
                  <>
                    <circle cx={p[0]} cy={p[1]} r="2.4" fill={OX} />
                    <text x={p[0]} y={p[1] - 12} textAnchor="middle" fontSize="9" fill="rgba(var(--nura-ice-hi-rgb),0.85)">{sevenNights[i].v}</text>
                  </>
                )}
                <text x={p[0]} y="207" textAnchor="middle" fontSize="10" fill={FAINT}>{sevenNights[i].day}</text>
              </g>
            );
          })}
        </Frame>
        <Legend lineLabel="nightly avg" />
      </div>
    </div>
  );
}
