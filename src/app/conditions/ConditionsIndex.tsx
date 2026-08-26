"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Search, X } from "lucide-react";
import { CONDITIONS, CATEGORY_LABELS, groupByCategory } from "./data";
import type { Condition } from "./data";
import {
  AMBER, AMBER_RGB, BORDER, CARD, CARD_SHADOW, SANS, MONO, SERIF, SP, SURFACE,
  TEXT, TEXT_SEC, TEXT_TER,
  CategoryLabel, ConditionIconChip, Disclaimer, Eyebrow, GroupLabel, SampleBanner,
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
        display: "flex", alignItems: "center", gap: 13,
        background: SURFACE,
        border: `1px solid ${reason ? `rgba(${AMBER_RGB}, 0.32)` : BORDER}`,
        borderRadius: CARD.radius, padding: CARD.padding, boxShadow: CARD_SHADOW,
        textDecoration: "none", color: "inherit",
      }}
    >
      <ConditionIconChip icon={condition.icon} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {reason && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 6,
            fontFamily: MONO, fontSize: 9, letterSpacing: "1.3px", textTransform: "uppercase",
            color: AMBER, background: `rgba(${AMBER_RGB}, 0.14)`,
            border: `1px solid rgba(${AMBER_RGB}, 0.3)`, borderRadius: 999, padding: "3px 8px",
          }}>
            Your markers
          </div>
        )}
        <div style={{ fontSize: 14.5, fontWeight: 500, color: TEXT, lineHeight: 1.35 }}>
          {condition.name}
        </div>
        <div style={{
          fontSize: 12, color: TEXT_SEC, marginTop: 4, lineHeight: 1.5,
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

  // Matched conditions keep the server's ordering; the rest group by category.
  const matched = useMemo(
    () =>
      matches
        .map((m) => CONDITIONS.find((c) => c.slug === m.slug))
        .filter((c): c is Condition => !!c),
    [matches]
  );
  const groups = useMemo(
    () => groupByCategory(CONDITIONS.filter((c) => !reasonBySlug.has(c.slug)), CATEGORY_LABELS),
    [reasonBySlug]
  );

  const q = query.trim().toLowerCase();
  // Search reaches into step titles too, so "tick" finds alpha-gal and
  // "berberine" finds blood sugar — the protocol is the content, not the name.
  const results = useMemo(() => {
    if (!q) return [];
    return CONDITIONS.filter((c) =>
      [c.name, c.blurb, CATEGORY_LABELS[c.category], ...c.steps.map((s) => s.title)]
        .join(" ").toLowerCase().includes(q)
    );
  }, [q]);
  const resultGroups = useMemo(() => groupByCategory(results, CATEGORY_LABELS), [results]);

  return (
    <>
      {/* Two-up only from lg, and only for the full list — the matched block
          stays one column because it is the thing you're meant to read first. */}
      <style>{`
        .cond-row { transition: border-color 160ms, background 160ms; }
        .cond-rows { display: flex; flex-direction: column; gap: ${SP.stack}px; }
        .cond-search:focus-within { border-color: rgba(var(--nura-sage-rgb), 0.45); }
        @media (min-width: 1024px) {
          .cond-rows.two { display: grid; grid-template-columns: 1fr 1fr; gap: ${SP.stack}px 18px; }
          .cond-title { font-size: 48px; }
        }
      `}</style>

      <Eyebrow>Natural protocols</Eyebrow>
      <h1 className="cond-title" style={{
        fontFamily: SERIF, fontWeight: 400, fontSize: 39, lineHeight: 1.05,
        letterSpacing: "-0.5px", color: TEXT, margin: "0 0 14px",
      }}>
        Conditions
      </h1>
      <p style={{
        fontSize: 14, lineHeight: 1.65, color: TEXT_SEC,
        margin: `0 0 ${SP.header}px`, maxWidth: "52ch",
      }}>
        What you&rsquo;re dealing with — and the evidence-backed natural path through it.
      </p>

      <div className="cond-search" style={{
        display: "flex", alignItems: "center", gap: 11, width: "100%",
        background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 14,
        padding: "15px 16px", marginBottom: SP.section, boxShadow: CARD_SHADOW,
        transition: "border-color 160ms",
      }}>
        <Search size={16} strokeWidth={1.8} style={{ color: TEXT_TER, flex: "0 0 auto" }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${CONDITIONS.length} conditions`}
          aria-label="Search conditions"
          style={{
            flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent",
            fontFamily: SANS, fontSize: 14, color: TEXT, padding: 0,
          }}
        />
        {q && (
          <button
            onClick={() => setQuery("")}
            aria-label="Clear search"
            style={{
              flex: "0 0 auto", width: 22, height: 22, borderRadius: 6, border: "none",
              background: "transparent", color: TEXT_TER, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
            }}
          >
            <X size={14} strokeWidth={2} />
          </button>
        )}
      </div>

      {q ? (
        results.length > 0 ? (
          <>
            <GroupLabel>{results.length} result{results.length === 1 ? "" : "s"}</GroupLabel>
            {resultGroups.map((g, i) => (
              <div key={g.key} style={{ marginTop: i === 0 ? 0 : SP.block }}>
                <CategoryLabel>{g.label}</CategoryLabel>
                <div className="cond-rows two">
                  {g.conditions.map((c) => (
                    <ConditionRow key={c.slug} condition={c} reason={reasonBySlug.get(c.slug)} />
                  ))}
                </div>
              </div>
            ))}
          </>
        ) : (
          <div style={{
            border: `1px dashed ${BORDER}`, borderRadius: CARD.radius, padding: "32px 20px",
            textAlign: "center", color: TEXT_SEC, fontSize: 13.5,
          }}>
            Nothing matches &ldquo;{query.trim()}&rdquo; yet.
            <div style={{ color: TEXT_TER, fontSize: 12.5, marginTop: 7 }}>
              More conditions are on the way.
            </div>
          </div>
        )
      ) : (
        <>
          {matched.length > 0 && (
            <div style={{ marginBottom: SP.section }}>
              <GroupLabel>Matched to your data</GroupLabel>
              {isSample && <SampleBanner />}
              <div className="cond-rows">
                {matched.map((c) => (
                  <ConditionRow key={c.slug} condition={c} reason={reasonBySlug.get(c.slug)} />
                ))}
              </div>
            </div>
          )}

          <GroupLabel>{matched.length > 0 ? "All conditions" : "Conditions"}</GroupLabel>
          {groups.map((g, i) => (
            <div key={g.key} style={{ marginTop: i === 0 ? 0 : SP.block }}>
              <CategoryLabel>{g.label}</CategoryLabel>
              <div className="cond-rows two">
                {g.conditions.map((c) => (
                  <ConditionRow key={c.slug} condition={c} />
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      <Disclaimer />
    </>
  );
}
