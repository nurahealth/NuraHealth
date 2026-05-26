"use client";

import { useState } from "react";

// ── Tokens ────────────────────────────────────────────────────────────────────
const TEXT = "var(--nura-text-primary)";
const TEXT_SEC = "var(--nura-text-secondary)";
const TEXT_TER = "var(--nura-text-tertiary)";
const BORDER = "var(--nura-border)";
const SURFACE = "var(--nura-surface)";
const SAGE = "var(--nura-sage)";
const SAGE_HOV = "var(--nura-sage-hover)";
const SAGE_ON = "var(--nura-bg)";
const AMBER = "var(--nura-watch)";
const RED = "var(--nura-danger)";
const SANS = "'Inter', system-ui, sans-serif";
const SERIF = "'DM Serif Display', Georgia, serif";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface MarkerStory {
  marker: string;
  value: number | string;
  unit: string;
  range: string;
  status: string;
  whatItMeans: string;
  whyItsHappening: string;
  whatToDo: string;
}

export interface SupplementRecommendation {
  name: string;
  dose: string;
  timing: string;
  rationale: string;
}

export interface LifestyleShift {
  category: string;
  action: string;
  why: string;
}

export interface Narrative {
  headlineInsight: string;
  whyThisMatters: string;
  markerStories: MarkerStory[];
  supplementRecommendations: SupplementRecommendation[];
  lifestyleShifts: LifestyleShift[];
  retestSchedule: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (d: string | null | undefined) => {
  if (!d) return null;
  try {
    return new Date(d + (d.includes("T") ? "" : "T00:00:00")).toLocaleDateString(
      "en-US",
      { month: "long", day: "numeric", year: "numeric" }
    );
  } catch { return d; }
};

function statusChipColors(status: string): { bg: string; border: string; color: string } {
  const s = status.toLowerCase();
  if (s === "high" || s === "critical") {
    return {
      bg: `rgba(212,165,116,0.14)`,
      border: `rgba(212,165,116,0.42)`,
      color: AMBER,
    };
  }
  if (s === "low") {
    return {
      bg: `rgba(91,126,184,0.14)`,
      border: `rgba(91,126,184,0.42)`,
      color: "#7da6d4",
    };
  }
  if (s === "watch") {
    return {
      bg: `rgba(var(--nura-sage-rgb),0.14)`,
      border: `rgba(var(--nura-sage-rgb),0.4)`,
      color: SAGE,
    };
  }
  // optimal / unknown
  return {
    bg: `rgba(var(--nura-sage-rgb),0.10)`,
    border: `rgba(var(--nura-sage-rgb),0.3)`,
    color: SAGE,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────
interface Props {
  narrative: Narrative;
  narrativeId: string;
  panelDate: string | null;
  onRegenerate: () => Promise<void>;
  regenerating: boolean;
}

export default function StoryMode({
  narrative, narrativeId, panelDate, onRegenerate, regenerating,
}: Props) {
  const [addedIdx, setAddedIdx] = useState<Set<number>>(new Set());
  const [addingIdx, setAddingIdx] = useState<number | null>(null);
  const [addError, setAddError] = useState<string>("");
  const [confirmRegen, setConfirmRegen] = useState(false);

  const handleAdd = async (idx: number, supp: SupplementRecommendation) => {
    if (addedIdx.has(idx) || addingIdx !== null) return;
    setAddingIdx(idx);
    setAddError("");
    try {
      const res = await fetch("/api/supplements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: supp.name,
          dose: supp.dose,
          timing: supp.timing,
          frequency: "daily",
          rationale: supp.rationale,
          source: "bloodwork_recommendation",
          source_narrative_id: narrativeId,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({ error: "Could not add" }));
        throw new Error(d.error ?? "Could not add");
      }
      setAddedIdx((prev) => {
        const next = new Set(prev);
        next.add(idx);
        return next;
      });
    } catch (e) {
      setAddError(e instanceof Error ? e.message : "Could not add supplement");
    } finally {
      setAddingIdx(null);
    }
  };

  const handleConfirmRegen = async () => {
    setConfirmRegen(false);
    await onRegenerate();
  };

  const formattedDate = fmtDate(panelDate);

  return (
    <>
      {/* SECTION 1 — HEADLINE INSIGHT */}
      <div style={{ margin: "40px 0 24px" }}>
        <div style={{
          fontFamily: SERIF, fontWeight: 500, color: TEXT,
          fontSize: "clamp(24px, 4vw, 32px)", lineHeight: 1.25, letterSpacing: "-0.3px",
        }}>
          {narrative.headlineInsight}
        </div>
        {formattedDate && (
          <div style={{
            marginTop: 10, fontFamily: SANS, fontSize: 12, color: TEXT_TER,
          }}>
            Based on your bloodwork from {formattedDate}
          </div>
        )}
      </div>

      {/* SECTION 2 — WHY THIS MATTERS */}
      {narrative.whyThisMatters && (
        <Card>
          <CardLabel>Why this matters</CardLabel>
          <p style={{
            margin: 0, fontFamily: SANS, fontSize: 16, color: TEXT_SEC,
            lineHeight: 1.7,
          }}>
            {narrative.whyThisMatters}
          </p>
        </Card>
      )}

      {/* SECTION 3 — PER-MARKER STORIES */}
      {narrative.markerStories.length > 0 && (
        <>
          <SectionLabel>Your markers</SectionLabel>
          {narrative.markerStories.map((m, i) => {
            const colors = statusChipColors(m.status);
            return (
              <Card key={`${m.marker}-${i}`}>
                <div style={{
                  display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                  gap: 12, marginBottom: 6, flexWrap: "wrap",
                }}>
                  <div style={{ minWidth: 0, flex: "1 1 auto" }}>
                    <div style={{
                      fontFamily: SANS, fontSize: 15, fontWeight: 500, color: TEXT,
                    }}>
                      {m.marker}
                    </div>
                    {m.range && (
                      <div style={{
                        marginTop: 4, fontFamily: SANS, fontSize: 12, color: TEXT_TER,
                      }}>
                        Normal range: {m.range}
                      </div>
                    )}
                  </div>
                  <span style={{
                    padding: "5px 10px", borderRadius: 7,
                    background: colors.bg, border: `0.5px solid ${colors.border}`,
                    fontFamily: SANS, fontSize: 12, fontWeight: 600, color: colors.color,
                    whiteSpace: "nowrap",
                  }}>
                    {String(m.value)}{m.unit ? ` ${m.unit}` : ""}
                  </span>
                </div>

                <div style={{
                  height: 1, background: BORDER, margin: "14px 0",
                  border: "none",
                }} />

                <MarkerBody label="What this means" body={m.whatItMeans} />
                <MarkerBody label="Why it's happening" body={m.whyItsHappening} />
                <MarkerBody label="What to do" body={m.whatToDo} last />
              </Card>
            );
          })}
        </>
      )}

      {/* SECTION 4 — YOUR PROTOCOL */}
      {(narrative.supplementRecommendations.length > 0 ||
        narrative.lifestyleShifts.length > 0 ||
        narrative.retestSchedule) && (
        <>
          <SectionLabel>Your protocol</SectionLabel>

          {narrative.supplementRecommendations.length > 0 && (
            <>
              <SubLabel>Supplements</SubLabel>
              {narrative.supplementRecommendations.map((s, i) => {
                const isAdded = addedIdx.has(i);
                const isAdding = addingIdx === i;
                return (
                  <Card key={`${s.name}-${i}`}>
                    <div style={{
                      fontFamily: SANS, fontSize: 15, fontWeight: 500, color: TEXT,
                      marginBottom: 4,
                    }}>
                      {s.name}
                    </div>
                    <div style={{
                      fontFamily: SANS, fontSize: 13, color: TEXT_SEC, marginBottom: 10,
                    }}>
                      {[s.dose, s.timing].filter(Boolean).join(" · ")}
                    </div>
                    {s.rationale && (
                      <p style={{
                        margin: "0 0 14px", fontFamily: SANS, fontSize: 13,
                        color: TEXT_SEC, lineHeight: 1.6,
                      }}>
                        {s.rationale}
                      </p>
                    )}
                    <button
                      onClick={() => handleAdd(i, s)}
                      disabled={isAdded || isAdding}
                      onMouseEnter={(e) => {
                        if (!isAdded && !isAdding) e.currentTarget.style.background = SAGE_HOV;
                      }}
                      onMouseLeave={(e) => {
                        if (!isAdded && !isAdding) e.currentTarget.style.background = SAGE;
                      }}
                      style={{
                        width: "100%", padding: "10px 16px", borderRadius: 11, border: "none",
                        background: isAdded
                          ? `rgba(var(--nura-sage-rgb),0.18)`
                          : isAdding
                          ? `rgba(var(--nura-sage-rgb),0.4)`
                          : SAGE,
                        color: isAdded ? SAGE : SAGE_ON,
                        fontFamily: SANS, fontSize: 13, fontWeight: 500,
                        cursor: isAdded || isAdding ? "default" : "pointer",
                        transition: "background 200ms",
                        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                      }}
                    >
                      {isAdded ? "✓ Added to your stack" : isAdding ? "Adding…" : "+ Add to my stack"}
                    </button>
                  </Card>
                );
              })}
              {addError && (
                <div style={{
                  marginTop: -4, marginBottom: 14, padding: "9px 12px", borderRadius: 9,
                  background: "rgba(212,87,77,0.08)", border: `0.5px solid rgba(212,87,77,0.3)`,
                  color: RED, fontFamily: SANS, fontSize: 12,
                }}>
                  {addError}
                </div>
              )}
            </>
          )}

          {narrative.lifestyleShifts.length > 0 && (
            <>
              <SubLabel>Lifestyle shifts</SubLabel>
              {narrative.lifestyleShifts.map((l, i) => (
                <div key={`${l.category}-${i}`} style={{
                  background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 14,
                  padding: 16, marginBottom: 10,
                }}>
                  <div style={{
                    fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "1.2px",
                    color: SAGE, textTransform: "uppercase", marginBottom: 6,
                  }}>
                    {l.category}
                  </div>
                  <div style={{
                    fontFamily: SANS, fontSize: 14, fontWeight: 500, color: TEXT,
                    marginBottom: 6,
                  }}>
                    {l.action}
                  </div>
                  {l.why && (
                    <p style={{
                      margin: 0, fontFamily: SANS, fontSize: 12, color: TEXT_SEC,
                      lineHeight: 1.6,
                    }}>
                      {l.why}
                    </p>
                  )}
                </div>
              ))}
            </>
          )}

          {narrative.retestSchedule && (
            <>
              <SubLabel>Re-test schedule</SubLabel>
              <div style={{
                background: `rgba(var(--nura-sage-rgb),0.06)`,
                border: `0.5px solid rgba(var(--nura-sage-rgb),0.28)`,
                borderRadius: 14, padding: 16, marginBottom: 14,
                fontFamily: SANS, fontSize: 14, color: TEXT, lineHeight: 1.6,
              }}>
                {narrative.retestSchedule}
              </div>
            </>
          )}
        </>
      )}

      {/* SECTION 5 — REGENERATE */}
      <div style={{ textAlign: "right", margin: "8px 0 16px" }}>
        <button
          onClick={() => setConfirmRegen(true)}
          disabled={regenerating}
          style={{
            background: "none", border: "none", padding: 0,
            cursor: regenerating ? "not-allowed" : "pointer",
            fontFamily: SANS, fontSize: 13, fontWeight: 500, color: SAGE,
            display: "inline-flex", alignItems: "center", gap: 6,
            opacity: regenerating ? 0.55 : 1,
          }}
        >
          {regenerating && (
            <span style={{
              width: 13, height: 13, borderRadius: "50%",
              border: `2px solid rgba(var(--nura-sage-rgb),0.3)`, borderTopColor: SAGE,
              animation: "spin 0.8s linear infinite", display: "inline-block",
            }} />
          )}
          {regenerating ? "Regenerating report…" : "Regenerate report →"}
        </button>
      </div>

      {confirmRegen && (
        <div
          onClick={() => setConfirmRegen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
            animation: "nura-fade-in 200ms ease",
          }}
        >
          <style>{`@keyframes nura-fade-in { from { opacity: 0; } to { opacity: 1; } }`}</style>
          <div onClick={(e) => e.stopPropagation()} style={{
            width: "100%", maxWidth: 420,
            background: "var(--nura-bg)", border: `0.5px solid ${BORDER}`,
            borderRadius: 16, padding: 24,
          }}>
            <h3 style={{
              fontFamily: SERIF, fontSize: 22, fontWeight: 500, color: TEXT,
              margin: "0 0 10px",
            }}>
              Regenerate report?
            </h3>
            <p style={{
              fontFamily: SANS, fontSize: 13, color: TEXT_SEC, lineHeight: 1.6,
              margin: "0 0 20px",
            }}>
              This will generate a new report. The current one will remain in your history. Continue?
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setConfirmRegen(false)}
                style={{
                  flex: 1, padding: "11px 16px", borderRadius: 11,
                  background: "transparent", border: `0.5px solid ${BORDER}`,
                  color: TEXT_SEC, fontFamily: SANS, fontSize: 13, fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRegen}
                onMouseEnter={(e) => { e.currentTarget.style.background = SAGE_HOV; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = SAGE; }}
                style={{
                  flex: 1, padding: "11px 16px", borderRadius: 11, border: "none",
                  background: SAGE, color: SAGE_ON,
                  fontFamily: SANS, fontSize: 13, fontWeight: 500, cursor: "pointer",
                  transition: "background 200ms",
                }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Primitives ────────────────────────────────────────────────────────────────
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: SURFACE, border: `0.5px solid ${BORDER}`,
      borderRadius: 14, padding: 20, marginBottom: 14,
    }}>
      {children}
    </div>
  );
}

function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "1.5px",
      color: SAGE, textTransform: "uppercase", marginBottom: 14,
    }}>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "1.5px",
      color: SAGE, textTransform: "uppercase", margin: "10px 0 12px",
    }}>
      {children}
    </div>
  );
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: SANS, fontSize: 12, fontWeight: 500, letterSpacing: "0.5px",
      color: TEXT_TER, textTransform: "uppercase", margin: "8px 0 8px",
    }}>
      {children}
    </div>
  );
}

function MarkerBody({ label, body, last }: { label: string; body: string; last?: boolean }) {
  if (!body) return null;
  return (
    <div style={{ marginBottom: last ? 0 : 12 }}>
      <div style={{
        fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "1.2px",
        color: SAGE, textTransform: "uppercase", marginBottom: 5,
      }}>
        {label}
      </div>
      <p style={{
        margin: 0, fontFamily: SANS, fontSize: 13.5, color: TEXT_SEC, lineHeight: 1.65,
      }}>
        {body}
      </p>
    </div>
  );
}

export function StoryModeSkeleton() {
  return (
    <div>
      <style>{`@keyframes nura-sk { 0%{transform:translateX(-100%);} 100%{transform:translateX(200%);} }`}</style>
      <div style={{ margin: "40px 0 24px" }}>
        <SkeletonBar height={32} width="92%" />
        <div style={{ height: 12 }} />
        <SkeletonBar height={32} width="68%" />
        <div style={{ height: 14 }} />
        <SkeletonBar height={10} width="40%" />
      </div>
      <SkeletonCard lines={3} />
      <SkeletonCard lines={4} />
      <SkeletonCard lines={4} />
    </div>
  );
}

function SkeletonBar({ height, width }: { height: number; width: string | number }) {
  return (
    <div style={{
      height, width, borderRadius: 6, overflow: "hidden", position: "relative",
      background: `rgba(var(--nura-sage-rgb),0.08)`,
    }}>
      <div style={{
        position: "absolute", inset: 0,
        background: `linear-gradient(90deg, transparent, rgba(var(--nura-sage-rgb),0.08), transparent)`,
        animation: `nura-sk 1.6s ease infinite`,
      }} />
    </div>
  );
}

function SkeletonCard({ lines }: { lines: number }) {
  return (
    <div style={{
      background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 14,
      padding: 20, marginBottom: 14,
    }}>
      <SkeletonBar height={10} width={80} />
      <div style={{ height: 14 }} />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} style={{ marginBottom: 10 }}>
          <SkeletonBar height={12} width={i === lines - 1 ? "60%" : "100%"} />
        </div>
      ))}
    </div>
  );
}
