"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { CONDITIONS } from "./data";
import type { Condition } from "./data";
import {
  AMBER, AMBER_RGB, BORDER, CARD_SHADOW, SANS, MONO, SERIF, SURFACE,
  TEXT, TEXT_SEC, TEXT_TER,
  ConditionIconChip, Disclaimer, Eyebrow, GroupLabel, SampleBanner,
} from "./ui";

/** One row's personalization, computed server-side in page.tsx. */
export interface MatchVM {
  slug: string;
  reason: string;
}

interface Props {
  /** Slugs that matched, in order, with the reason in the user's own numbers. */
  matches: MatchVM[];
  /** True when the matches came from the shared sample panel, not real bloodwork. */
  isSample: boolean;
}

function ConditionRow({ condition, reason }: { condition: Condition; reason?: string }) {
  return (
    <Link
      href={`/conditions/${condition.slug}`}
      className="cond-row"
      style={{
        display: "flex", alignItems: "center", gap: 12,
        background: SURFACE,
        border: `1px solid ${reason ? `rgba(${AMBER_RGB}, 0.32)` : BORDER}`,
        borderRadius: 13, padding: "13px 14px", boxShadow: CARD_SHADOW,
        textDecoration: "none", color: "inherit",
      }}
    >
      <ConditionIconChip icon={condition.icon} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {reason && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 5,
            fontFamily: MONO, fontSize: 9, letterSpacing: "1.3px", textTransform: "uppercase",
            color: AMBER, background: `rgba(${AMBER_RGB}, 0.14)`,
            border: `1px solid rgba(${AMBER_RGB}, 0.3)`, borderRadius: 999, padding: "3px 7px",
          }}>
            Your markers
          </div>
        )}
        <div style={{ fontSize: 14.5, fontWeight: 500, color: TEXT, lineHeight: 1.3 }}>
          {condition.name}
        </div>
        <div style={{
          fontSize: 11.5, color: TEXT_SEC, marginTop: 3, lineHeight: 1.45,
          fontVariantNumeric: "tabular-nums",
        }}>
          {reason ?? condition.blurb}
        </div>
      </div>
      <ChevronRight size={16} strokeWidth={1.7} style={{ color: TEXT_TER, flex: "0 0 auto" }} />
    </Link>
  );
}

export default function ConditionsIndex({ matches, isSample }: Props) {
  const [query, setQuery] = useState("");

  const reasonBySlug = useMemo(
    () => new Map(matches.map((m) => [m.slug, m.reason])),
    [matches]
  );

  // Matched conditions keep the server's ordering; the rest keep data.ts order.
  const matched = useMemo(
    () =>
      matches
        .map((m) => CONDITIONS.find((c) => c.slug === m.slug))
        .filter((c): c is Condition => !!c),
    [matches]
  );
  const rest = useMemo(
    () => CONDITIONS.filter((c) => !reasonBySlug.has(c.slug)),
    [reasonBySlug]
  );

  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!q) return [];
    return CONDITIONS.filter((c) =>
      [c.name, c.blurb, ...c.steps.map((s) => s.title)].join(" ").toLowerCase().includes(q)
    );
  }, [q]);

  return (
    <>
      {/* Two-up only from lg, and only for the full list — the matched block
          stays one column because it is the thing you're meant to read first. */}
      <style>{`
        .cond-row { transition: border-color 160ms, background 160ms; }
        .cond-rows { display: flex; flex-direction: column; gap: 9px; }
        @media (min-width: 1024px) {
          .cond-rows.two { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
          .cond-title { font-size: 46px; }
        }
      `}</style>

      <Eyebrow>Natural protocols</Eyebrow>
      <h1 className="cond-title" style={{
        fontFamily: SERIF, fontWeight: 400, fontSize: 38, lineHeight: 1.05,
        letterSpacing: "-0.5px", color: TEXT, margin: "0 0 10px",
      }}>
        Conditions
      </h1>
      <p style={{
        fontSize: 13.5, lineHeight: 1.6, color: TEXT_SEC, margin: "0 0 22px", maxWidth: "56ch",
      }}>
        What you&rsquo;re dealing with — and the evidence-backed natural path through it.
      </p>

      <div style={{
        display: "flex", alignItems: "center", gap: 9, width: "100%",
        background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12,
        padding: "11px 13px", marginBottom: 26, boxShadow: CARD_SHADOW,
      }}>
        <Search size={15} strokeWidth={1.8} style={{ color: TEXT_TER, flex: "0 0 auto" }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search conditions"
          aria-label="Search conditions"
          style={{
            flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent",
            fontFamily: SANS, fontSize: 13.5, color: TEXT, padding: 0,
          }}
        />
      </div>

      {q ? (
        results.length > 0 ? (
          <>
            <GroupLabel>{results.length} result{results.length === 1 ? "" : "s"}</GroupLabel>
            <div className="cond-rows two" style={{ marginBottom: 26 }}>
              {results.map((c) => (
                <ConditionRow key={c.slug} condition={c} reason={reasonBySlug.get(c.slug)} />
              ))}
            </div>
          </>
        ) : (
          <div style={{
            border: `1px solid ${BORDER}`, borderRadius: 13, padding: "26px 18px",
            textAlign: "center", color: TEXT_SEC, fontSize: 13, marginBottom: 26,
          }}>
            Nothing matches &ldquo;{query.trim()}&rdquo; yet.
            <div style={{ color: TEXT_TER, fontSize: 12, marginTop: 6 }}>
              More conditions are on the way.
            </div>
          </div>
        )
      ) : (
        <>
          {matched.length > 0 && (
            <>
              <GroupLabel>Matched to your data</GroupLabel>
              {isSample && <SampleBanner />}
              <div className="cond-rows" style={{ marginBottom: 26 }}>
                {matched.map((c) => (
                  <ConditionRow key={c.slug} condition={c} reason={reasonBySlug.get(c.slug)} />
                ))}
              </div>
            </>
          )}

          <GroupLabel>{matched.length > 0 ? "All conditions" : "Conditions"}</GroupLabel>
          <div className="cond-rows two" style={{ marginBottom: 26 }}>
            {rest.map((c) => (
              <ConditionRow key={c.slug} condition={c} />
            ))}
          </div>
        </>
      )}

      <Disclaimer />
    </>
  );
}
