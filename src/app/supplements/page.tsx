"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import NuraPageShell from "@/components/NuraPageShell";
import {
  ALL_DAYS, ALL_MEALS, todayDay, todayISO, logKey,
  isSupplementScheduledFor, isSupplementScheduled, formatScheduleSummary,
  type Day, type Meal, type Schedule, type Supplement, type SupplementLog,
} from "@/lib/supplements";

// ── Tokens ────────────────────────────────────────────────────────────────────
const TEXT = "var(--nura-text-primary)";
const TEXT_SEC = "var(--nura-text-secondary)";
const TEXT_TER = "var(--nura-text-tertiary)";
const BORDER = "var(--nura-border)";
const SURFACE = "var(--nura-surface)";
const SAGE = "var(--nura-sage)";
const SAGE_HOV = "var(--nura-sage-hover)";
const SAGE_ON = "var(--nura-bg)";
const RED = "var(--nura-danger)";
const SANS = "'Inter', system-ui, sans-serif";
const SERIF = "'DM Serif Display', Georgia, serif";

// ── Labels ────────────────────────────────────────────────────────────────────
const DAY_LABEL: Record<Day, string> = {
  mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun",
};
const MEAL_LABEL: Record<Meal, string> = {
  breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", bedtime: "Bedtime",
};

type View = "stack" | "schedule";

// ── Page ──────────────────────────────────────────────────────────────────────
function SupplementsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState<
    | { mode: "closed" }
    | { mode: "add" }
    | { mode: "edit"; supplement: Supplement }
  >({ mode: "closed" });
  const [scheduleFadeKey, setScheduleFadeKey] = useState(0);
  const [viewFadeKey, setViewFadeKey] = useState(0);

  // Per-day check-off state — Set of `${supplementId}|${mealSlot ?? ""}`
  const [logSet, setLogSet] = useState<Set<string>>(new Set());
  // Today's local date (recomputed on focus so the page survives midnight)
  const [today, setToday] = useState<string>(() => todayISO());
  const todayDayId = useMemo<Day>(() => todayDay(new Date(today + "T00:00:00")), [today]);

  // Refresh `today` on tab focus so check-offs reset after midnight.
  useEffect(() => {
    const refresh = () => setToday(todayISO());
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  const viewParam = searchParams.get("view");
  const view: View = viewParam === "schedule" ? "schedule" : "stack";

  const dayParam = searchParams.get("day");
  const selectedDay: Day = (ALL_DAYS as readonly string[]).includes(dayParam ?? "")
    ? (dayParam as Day)
    : todayDay();

  // Fade animations
  useEffect(() => { setViewFadeKey((k) => k + 1); }, [view]);
  useEffect(() => { setScheduleFadeKey((k) => k + 1); }, [selectedDay]);

  const setView = useCallback((next: View) => {
    if (next === "stack") {
      router.replace("/supplements?view=stack", { scroll: false });
    } else {
      router.replace(`/supplements?view=schedule&day=${selectedDay}`, { scroll: false });
    }
  }, [router, selectedDay]);

  const setSelectedDay = useCallback((d: Day) => {
    router.replace(`/supplements?view=schedule&day=${d}`, { scroll: false });
  }, [router]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) { router.push("/auth"); return; }
      setUser(u);
      setAuthLoading(false);
    });
  }, [router]);

  const fetchAll = useCallback(async () => {
    try {
      const res = await fetch("/api/supplements");
      if (!res.ok) throw new Error("Could not load supplements");
      const data = (await res.json()) as { supplements: Supplement[] };
      setSupplements(data.supplements ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLogs = useCallback(async (date: string) => {
    try {
      const res = await fetch(`/api/supplements/logs?date=${date}`);
      if (!res.ok) return;
      const data = (await res.json()) as { logs: SupplementLog[] };
      const next = new Set<string>();
      for (const log of data.logs ?? []) {
        next.add(logKey(log.supplement_id, log.meal_slot));
      }
      setLogSet(next);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    void fetchAll();
  }, [user, fetchAll]);

  useEffect(() => {
    if (!user) return;
    void fetchLogs(today);
  }, [user, today, fetchLogs]);

  const toggleLog = useCallback(async (supplementId: string, mealSlot: Meal | null) => {
    const key = logKey(supplementId, mealSlot);
    const wasChecked = logSet.has(key);

    // Optimistic
    setLogSet((prev) => {
      const next = new Set(prev);
      if (wasChecked) next.delete(key);
      else next.add(key);
      return next;
    });

    try {
      const res = await fetch("/api/supplements/log", {
        method: wasChecked ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplement_id: supplementId,
          log_date: today,
          meal_slot: mealSlot,
        }),
      });
      if (!res.ok) throw new Error("Toggle failed");
    } catch {
      // Rollback on error
      setLogSet((prev) => {
        const next = new Set(prev);
        if (wasChecked) next.add(key);
        else next.delete(key);
        return next;
      });
    }
  }, [logSet, today]);

  if (authLoading) {
    return <NuraPageShell maxWidth={720}><div /></NuraPageShell>;
  }

  const sortedAll = [...supplements].sort((a, b) => a.name.localeCompare(b.name));
  const scheduledAny = supplements.some(isSupplementScheduled);

  const scheduledForToday = supplements.filter((s) =>
    isSupplementScheduled(s) && s.schedule?.days.includes(todayDayId)
  );
  const stackComplete = scheduledForToday.length > 0 && scheduledForToday.every((s) =>
    (s.schedule?.meals ?? []).every((m) => logSet.has(logKey(s.id, m)))
  );

  const isScheduleInteractive = selectedDay === todayDayId;

  return (
    <NuraPageShell maxWidth={720}>
      <style>{`
        @keyframes nura-fade-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes nura-modal-in { from { opacity: 0; } to { opacity: 1; } }
        .nura-day-strip::-webkit-scrollbar { height: 0; width: 0; }
        .nura-day-strip { scrollbar-width: none; }
      `}</style>

      {/* HERO */}
      <div style={{ marginBottom: 22 }}>
        <h1 style={{
          fontFamily: SERIF, fontWeight: 500, color: TEXT,
          margin: "0 0 6px", lineHeight: 1.15, letterSpacing: "-0.5px",
          fontSize: "clamp(32px, 5vw, 44px)",
        }}>
          Supplements
        </h1>
        <p style={{ fontFamily: SANS, fontSize: 13, color: TEXT_SEC, margin: 0 }}>
          Your daily stack — built on what your body needs
        </p>
      </div>

      {/* STACK / SCHEDULE TOGGLE */}
      <div style={{ marginBottom: stackComplete ? 16 : 32 }}>
        <div
          role="tablist"
          style={{
            display: "inline-flex", padding: 3, borderRadius: 9999,
            background: "transparent", border: `0.5px solid ${BORDER}`,
          }}
        >
          <ViewPill label="Stack" active={view === "stack"} onClick={() => setView("stack")} />
          <ViewPill label="Schedule" active={view === "schedule"} onClick={() => setView("schedule")} />
        </div>
      </div>

      {stackComplete && (
        <div style={{ marginBottom: 24 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "6px 12px", borderRadius: 9999,
            background: `rgba(var(--nura-sage-rgb),0.12)`,
            border: `0.5px solid rgba(var(--nura-sage-rgb),0.32)`,
            fontFamily: SANS, fontSize: 13, color: SAGE,
            animation: "nura-fade-in 220ms ease both",
          }}>
            <CheckGlyph size={13} />
            Stack complete for today
          </span>
        </div>
      )}

      {/* CONTENT */}
      {loading ? (
        <Skeleton />
      ) : view === "stack" ? (
        <div key={viewFadeKey} style={{ animation: "nura-fade-in 150ms ease both" }}>
          {sortedAll.length === 0 ? (
            <StackEmpty onAdd={() => setModalState({ mode: "add" })} />
          ) : (
            <StackList
              items={sortedAll}
              logSet={logSet}
              onToggleStack={(suppId) => toggleLog(suppId, null)}
              onEdit={(s) => setModalState({ mode: "edit", supplement: s })}
            />
          )}
        </div>
      ) : (
        <div key={viewFadeKey} style={{ animation: "nura-fade-in 150ms ease both" }}>
          {/* DAY SELECTOR */}
          <div
            className="nura-day-strip"
            style={{ marginBottom: 24, overflowX: "auto", WebkitOverflowScrolling: "touch" }}
          >
            <div
              role="tablist"
              style={{
                display: "inline-flex", padding: 3, borderRadius: 9999,
                background: "transparent", border: `0.5px solid ${BORDER}`,
                whiteSpace: "nowrap",
              }}
            >
              {ALL_DAYS.map((d) => (
                <DayPill
                  key={d}
                  label={DAY_LABEL[d]}
                  active={selectedDay === d}
                  onClick={() => setSelectedDay(d)}
                />
              ))}
            </div>
          </div>

          {scheduledAny ? (
            <div key={scheduleFadeKey} style={{ animation: "nura-fade-in 150ms ease both" }}>
              {ALL_MEALS.map((meal) => {
                const items = supplements.filter((s) =>
                  isSupplementScheduledFor(s, selectedDay, meal)
                );
                return (
                  <MealSection
                    key={meal}
                    meal={meal}
                    items={items}
                    interactive={isScheduleInteractive}
                    logSet={logSet}
                    onToggle={(suppId) => toggleLog(suppId, meal)}
                    onEdit={(s) => setModalState({ mode: "edit", supplement: s })}
                  />
                );
              })}
            </div>
          ) : (
            <ScheduleEmpty
              onGoToStack={() => setView("stack")}
              hasAnySupplements={sortedAll.length > 0}
            />
          )}
        </div>
      )}

      {/* FAB */}
      <button
        type="button"
        aria-label="Add supplement"
        onClick={() => setModalState({ mode: "add" })}
        onMouseEnter={(e) => { e.currentTarget.style.background = SAGE_HOV; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = SAGE; }}
        onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.96)"; }}
        onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        style={{
          position: "fixed",
          right: "max(24px, env(safe-area-inset-right))",
          bottom: "max(24px, env(safe-area-inset-bottom))",
          zIndex: 40,
          width: 56, height: 56, borderRadius: "50%",
          background: SAGE, color: SAGE_ON, border: "none",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", transition: "background 200ms, transform 160ms",
          boxShadow: "0 12px 32px rgba(0,0,0,0.20), 0 4px 8px rgba(0,0,0,0.12)",
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      {/* MODAL */}
      {modalState.mode !== "closed" && user && (
        <SupplementModal
          mode={modalState.mode}
          existing={modalState.mode === "edit" ? modalState.supplement : null}
          onClose={() => setModalState({ mode: "closed" })}
          onSaved={async () => { await fetchAll(); setModalState({ mode: "closed" }); }}
          onDeleted={async () => { await fetchAll(); setModalState({ mode: "closed" }); }}
        />
      )}
    </NuraPageShell>
  );
}

export default function SupplementsPage() {
  return (
    <Suspense fallback={null}>
      <SupplementsPageInner />
    </Suspense>
  );
}

// ── Stack view ────────────────────────────────────────────────────────────────
function StackList({
  items, logSet, onToggleStack, onEdit,
}: {
  items: Supplement[];
  logSet: Set<string>;
  onToggleStack: (suppId: string) => void;
  onEdit: (s: Supplement) => void;
}) {
  return (
    <section>
      <div style={{
        fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "1.5px",
        color: SAGE, textTransform: "uppercase", marginBottom: 6,
      }}>
        All supplements
      </div>
      <div style={{ fontFamily: SANS, fontSize: 13, color: TEXT_TER, marginBottom: 16 }}>
        {items.length} {items.length === 1 ? "supplement" : "supplements"} in your stack
      </div>
      {items.map((s) => {
        const checked = logSet.has(logKey(s.id, null));
        return (
          <StackCard
            key={s.id}
            supplement={s}
            checked={checked}
            onToggle={() => onToggleStack(s.id)}
            onEdit={() => onEdit(s)}
          />
        );
      })}
    </section>
  );
}

function StackCard({
  supplement, checked, onToggle, onEdit,
}: {
  supplement: Supplement;
  checked: boolean;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const nameColor = checked ? TEXT_TER : TEXT;

  return (
    <div
      onClick={onEdit}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = TEXT_TER; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; }}
      style={{
        width: "100%", textAlign: "left",
        background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 14,
        padding: 16, marginBottom: 12, cursor: "pointer",
        display: "flex", alignItems: "flex-start", gap: 12,
        transition: "border-color 160ms",
      }}
    >
      <div style={{ flexShrink: 0, marginTop: 1 }}>
        <LogCircle
          state={checked ? "checked" : "empty"}
          onClick={onToggle}
          ariaLabel={checked ? "Mark untaken" : "Mark as taken"}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: SANS, fontSize: 15, fontWeight: 500, color: nameColor,
          marginBottom: supplement.dose || supplement.notes ? 4 : 0,
          transition: "color 160ms",
        }}>
          {supplement.name}
        </div>
        {supplement.dose && (
          <div style={{ fontFamily: SANS, fontSize: 13, color: TEXT_TER }}>
            {supplement.dose}
          </div>
        )}
        {supplement.notes && (
          <div style={{
            marginTop: 4, fontFamily: SANS, fontSize: 12, color: TEXT_TER,
            fontStyle: "italic", lineHeight: 1.5,
          }}>
            {supplement.notes}
          </div>
        )}
        <div style={{ marginTop: 10 }}>
          <ScheduleTag supplement={supplement} />
        </div>
      </div>
      <span aria-hidden style={{ color: TEXT_TER, flexShrink: 0, marginTop: 1 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      </span>
    </div>
  );
}

function ScheduleTag({ supplement }: { supplement: Supplement }) {
  const scheduled = isSupplementScheduled(supplement);
  const label = scheduled ? formatScheduleSummary(supplement) : "Unscheduled";
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 8px", borderRadius: 9999,
      background: scheduled ? `rgba(var(--nura-sage-rgb),0.10)` : "transparent",
      border: `0.5px solid ${scheduled ? `rgba(var(--nura-sage-rgb),0.30)` : BORDER}`,
      fontFamily: SANS, fontSize: 11,
      color: scheduled ? SAGE : TEXT_TER,
      whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

// ── Schedule view ─────────────────────────────────────────────────────────────
function MealSection({
  meal, items, interactive, logSet, onToggle, onEdit,
}: {
  meal: Meal;
  items: Supplement[];
  interactive: boolean;
  logSet: Set<string>;
  onToggle: (suppId: string) => void;
  onEdit: (s: Supplement) => void;
}) {
  return (
    <section style={{ marginBottom: 24 }}>
      <div style={{
        fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "1.5px",
        color: SAGE, textTransform: "uppercase", marginBottom: 12,
      }}>
        {MEAL_LABEL[meal]}
      </div>
      {items.length === 0 ? (
        <div style={{
          padding: "20px 0", textAlign: "center",
          fontFamily: SANS, fontSize: 13, color: TEXT_TER, fontStyle: "italic",
        }}>
          Nothing scheduled
        </div>
      ) : (
        items.map((s) => {
          const checked = logSet.has(logKey(s.id, meal));
          return (
            <ScheduleCard
              key={s.id}
              supplement={s}
              checked={checked}
              interactive={interactive}
              onToggle={() => onToggle(s.id)}
              onEdit={() => onEdit(s)}
            />
          );
        })
      )}
    </section>
  );
}

function ScheduleCard({
  supplement, checked, interactive, onToggle, onEdit,
}: {
  supplement: Supplement;
  checked: boolean;
  interactive: boolean;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const nameColor = checked ? TEXT_TER : TEXT;
  return (
    <div
      onClick={onEdit}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = TEXT_TER; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; }}
      style={{
        width: "100%", textAlign: "left",
        background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 14,
        padding: 16, marginBottom: 12, cursor: "pointer",
        display: "flex", alignItems: "flex-start", gap: 12,
        transition: "border-color 160ms",
      }}
    >
      <div style={{ flexShrink: 0, marginTop: 1 }}>
        <LogCircle
          state={checked ? "checked" : "empty"}
          onClick={interactive ? onToggle : undefined}
          disabled={!interactive}
          dimmed={!interactive}
          ariaLabel={checked ? "Mark untaken" : "Mark as taken"}
          title={interactive ? undefined : "Tracking available on today only"}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: SANS, fontSize: 15, fontWeight: 500, color: nameColor,
          marginBottom: supplement.dose ? 4 : 0,
          transition: "color 160ms",
        }}>
          {supplement.name}
        </div>
        {supplement.dose && (
          <div style={{ fontFamily: SANS, fontSize: 13, color: TEXT_TER }}>
            {supplement.dose}
          </div>
        )}
      </div>
      <span aria-hidden style={{ color: TEXT_TER, flexShrink: 0, marginTop: 1 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      </span>
    </div>
  );
}

// ── LogCircle ─────────────────────────────────────────────────────────────────
function LogCircle({
  state, partialText, onClick, disabled, dimmed, ariaLabel, title,
}: {
  state: "empty" | "checked" | "partial";
  partialText?: string;
  onClick?: () => void;
  disabled?: boolean;
  dimmed?: boolean;
  ariaLabel?: string;
  title?: string;
}) {
  const interactive = !!onClick && !disabled;
  const checked = state === "checked";
  const partial = state === "partial";

  const baseSize = 22;
  const bg = checked ? SAGE : "transparent";
  const borderColor = checked
    ? "transparent"
    : partial
    ? `rgba(var(--nura-sage-rgb),0.55)`
    : BORDER;
  const opacity = dimmed && !checked && !partial ? 0.55 : 1;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!interactive) return;
    e.currentTarget.dispatchEvent(new Event("nura-tap"));
    onClick?.();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={ariaLabel}
      aria-pressed={checked}
      disabled={disabled}
      title={title}
      onMouseEnter={(e) => { if (interactive) e.currentTarget.style.transform = "scale(1.08)"; }}
      onMouseLeave={(e) => { if (interactive) e.currentTarget.style.transform = "scale(1)"; }}
      onMouseDown={(e) => { if (interactive) e.currentTarget.style.transform = "scale(0.85)"; }}
      onMouseUp={(e) => { if (interactive) e.currentTarget.style.transform = "scale(1)"; }}
      style={{
        // 44×44 minimum tap area, centered around the visible 22px circle
        width: 44, height: 44, padding: 0,
        background: "transparent", border: "none",
        cursor: interactive ? "pointer" : "default",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginLeft: -11, marginRight: -11, marginTop: -11, marginBottom: -11,
        transition: "transform 160ms ease",
        flexShrink: 0,
      }}
    >
      <span style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: baseSize, height: baseSize, borderRadius: "50%",
        background: bg,
        border: checked ? "none" : `1.5px solid ${borderColor}`,
        color: checked ? SAGE_ON : partial ? SAGE : TEXT_TER,
        opacity,
        transition: "background 200ms ease, border-color 200ms ease, opacity 160ms ease",
        fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: 0,
        lineHeight: 1,
      }}>
        {checked ? (
          <CheckGlyph size={12} />
        ) : partial && partialText ? (
          <span style={{ fontSize: 9, fontWeight: 600 }}>{partialText}</span>
        ) : null}
      </span>
    </button>
  );
}

function CheckGlyph({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

// ── Pills ─────────────────────────────────────────────────────────────────────
function ViewPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = TEXT_SEC; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = TEXT_TER; }}
      style={{
        padding: "8px 18px", borderRadius: 9999, border: "none",
        background: active ? SAGE : "transparent",
        color: active ? SAGE_ON : TEXT_TER,
        fontFamily: SANS, fontSize: 13, fontWeight: active ? 500 : 400,
        cursor: "pointer", transition: "background 160ms, color 160ms",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

function DayPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = TEXT_SEC; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = TEXT_TER; }}
      style={{
        padding: "6px 14px", borderRadius: 9999, border: "none",
        background: active ? SAGE : "transparent",
        color: active ? SAGE_ON : TEXT_TER,
        fontFamily: SANS, fontSize: 13, fontWeight: active ? 500 : 400,
        cursor: "pointer", transition: "background 160ms, color 160ms",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

// ── Empty states ──────────────────────────────────────────────────────────────
function StackEmpty({ onAdd }: { onAdd: () => void }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      textAlign: "center", padding: "56px 20px 24px",
    }}>
      <div style={{ color: SAGE, marginBottom: 18 }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.5 20.5a7 7 0 0 1-7-7l0 0a7 7 0 0 1 7-7l3 0a7 7 0 0 1 7 7l0 0a7 7 0 0 1-7 7Z" />
          <path d="M3.5 13.5h17" />
        </svg>
      </div>
      <h2 style={{
        fontFamily: SERIF, fontWeight: 500, color: TEXT,
        fontSize: "clamp(22px, 3.4vw, 28px)", lineHeight: 1.25, letterSpacing: "-0.3px",
        margin: "0 0 12px",
      }}>
        Build your first stack.
      </h2>
      <p style={{
        fontFamily: SANS, fontSize: 14, color: TEXT_SEC, lineHeight: 1.6,
        maxWidth: 360, margin: "0 0 24px",
      }}>
        Tap + to add a supplement.
      </p>
      <button
        type="button"
        onClick={onAdd}
        onMouseEnter={(e) => { e.currentTarget.style.background = SAGE_HOV; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = SAGE; }}
        style={{
          padding: "11px 20px", borderRadius: 11, border: "none",
          background: SAGE, color: SAGE_ON,
          fontFamily: SANS, fontSize: 13, fontWeight: 500, cursor: "pointer",
          transition: "background 200ms",
        }}
      >
        Add supplement
      </button>
    </div>
  );
}

function ScheduleEmpty({
  onGoToStack, hasAnySupplements,
}: { onGoToStack: () => void; hasAnySupplements: boolean }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      textAlign: "center", padding: "40px 20px 24px",
    }}>
      <h2 style={{
        fontFamily: SERIF, fontWeight: 500, color: TEXT,
        fontSize: "clamp(20px, 3vw, 24px)", lineHeight: 1.3, letterSpacing: "-0.2px",
        margin: "0 0 10px",
      }}>
        No scheduled supplements yet.
      </h2>
      <p style={{
        fontFamily: SANS, fontSize: 14, color: TEXT_SEC, lineHeight: 1.6,
        maxWidth: 380, margin: "0 0 22px",
      }}>
        {hasAnySupplements
          ? "Schedule a supplement from Stack, or tap + to add a new one."
          : "Tap + to add a supplement, then schedule it."}
      </p>
      <button
        type="button"
        onClick={onGoToStack}
        onMouseEnter={(e) => { e.currentTarget.style.background = SAGE_HOV; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = SAGE; }}
        style={{
          padding: "10px 18px", borderRadius: 11, border: "none",
          background: SAGE, color: SAGE_ON,
          fontFamily: SANS, fontSize: 13, fontWeight: 500, cursor: "pointer",
          transition: "background 200ms",
          display: "inline-flex", alignItems: "center", gap: 6,
        }}
      >
        Go to Stack →
      </button>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div>
      <style>{`@keyframes nura-sk { 0%{transform:translateX(-100%);} 100%{transform:translateX(200%);} }`}</style>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} style={{
          position: "relative", overflow: "hidden",
          height: 76, borderRadius: 14, background: SURFACE,
          border: `0.5px solid ${BORDER}`, marginBottom: 12,
        }}>
          <div style={{
            position: "absolute", inset: 0,
            background: `linear-gradient(90deg, transparent, rgba(var(--nura-sage-rgb),0.07), transparent)`,
            animation: `nura-sk 1.6s ease ${i * 0.12}s infinite`,
          }} />
        </div>
      ))}
    </div>
  );
}

// ── Add / Edit modal ──────────────────────────────────────────────────────────
function SupplementModal({
  mode, existing, onClose, onSaved, onDeleted,
}: {
  mode: "add" | "edit";
  existing: Supplement | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
  onDeleted: () => void | Promise<void>;
}) {
  const nameRef = useRef<HTMLInputElement>(null);

  const existingScheduled = useMemo(() => {
    if (!existing) return false;
    return isSupplementScheduled(existing);
  }, [existing]);

  const [name, setName] = useState(existing?.name ?? "");
  const [dose, setDose] = useState(existing?.dose ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [schedOn, setSchedOn] = useState(existingScheduled);
  const [days, setDays] = useState<Day[]>(existing?.schedule?.days ?? [...ALL_DAYS]);
  const [meals, setMeals] = useState<Meal[]>(existing?.schedule?.meals ?? []);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const takeDaily = ALL_DAYS.every((d) => days.includes(d));

  useEffect(() => { nameRef.current?.focus(); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting && !deleting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, submitting, deleting]);

  const toggleDay = (d: Day) => {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };
  const toggleMeal = (m: Meal) => {
    setMeals((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  };
  const handleTakeDaily = () => {
    setDays(takeDaily ? [] : [...ALL_DAYS]);
  };
  const handleScheduleToggle = () => {
    setSchedOn((on) => {
      const next = !on;
      // Turning ON for the first time: prefill all days, no meals — user picks meals.
      if (next && days.length === 0 && meals.length === 0) {
        setDays([...ALL_DAYS]);
      }
      return next;
    });
  };

  const nameValid = name.trim().length > 0;
  const doseValid = dose.trim().length > 0;
  const scheduleValid = !schedOn || (days.length > 0 && meals.length > 0);
  const isValid = nameValid && doseValid && scheduleValid;

  const handleSave = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError(null);

    const schedule: Schedule = schedOn
      ? {
          days: ALL_DAYS.filter((d) => days.includes(d)),
          meals: ALL_MEALS.filter((m) => meals.includes(m)),
        }
      : { days: [], meals: [] };

    try {
      const payload = {
        name: name.trim(),
        dose: dose.trim() || (mode === "edit" ? null : undefined),
        notes: notes.trim() || (mode === "edit" ? null : undefined),
        schedule,
      };
      if (mode === "add") {
        const res = await fetch("/api/supplements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({ error: "Could not save" }));
          throw new Error(d.error ?? "Could not save");
        }
      } else if (existing) {
        const res = await fetch(`/api/supplements/${existing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({ error: "Could not save" }));
          throw new Error(d.error ?? "Could not save");
        }
      }
      await onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!existing || deleting) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/supplements/${existing.id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({ error: "Could not delete" }));
        throw new Error(d.error ?? "Could not delete");
      }
      await onDeleted();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete");
      setDeleting(false);
    }
  };

  return (
    <div
      onClick={() => { if (!submitting && !deleting) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: "rgba(0,0,0,0.70)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20, animation: "nura-modal-in 200ms ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{
          width: "100%", maxWidth: 480, maxHeight: "calc(100dvh - 40px)", overflowY: "auto",
          background: "var(--nura-bg)", border: `0.5px solid ${BORDER}`,
          borderRadius: 16, padding: 28, position: "relative",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          disabled={submitting || deleting}
          style={{
            position: "absolute", top: 14, right: 14,
            width: 32, height: 32, borderRadius: 9,
            background: SURFACE, border: `0.5px solid ${BORDER}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: submitting || deleting ? "not-allowed" : "pointer",
            color: TEXT_SEC, padding: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <h2 style={{
          fontFamily: SANS, fontSize: 22, fontWeight: 500, color: TEXT,
          margin: "0 0 22px", lineHeight: 1.2,
        }}>
          {mode === "add" ? "Add supplement" : "Edit supplement"}
        </h2>

        {/* Name */}
        <Field
          label="Name"
          input={
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting || deleting}
              style={inputStyle}
            />
          }
          error={!nameValid && name.length > 0 ? "Name is required" : null}
        />

        {/* Dose */}
        <Field
          label="Dose"
          input={
            <input
              type="text"
              value={dose}
              onChange={(e) => setDose(e.target.value)}
              placeholder="e.g. 400 mg or 1 capsule"
              disabled={submitting || deleting}
              style={inputStyle}
            />
          }
          error={null}
        />

        {/* Notes */}
        <Field
          label="Notes"
          input={
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="When to take, why, etc."
              rows={2}
              disabled={submitting || deleting}
              style={{ ...inputStyle, resize: "vertical", minHeight: 56 }}
            />
          }
          error={null}
          optional
        />

        {/* Add to schedule toggle */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 14px", borderRadius: 12,
          background: SURFACE, border: `0.5px solid ${BORDER}`,
          marginTop: 6, marginBottom: schedOn ? 16 : 0,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 500, color: TEXT }}>
              Add to schedule
            </div>
            <div style={{ fontFamily: SANS, fontSize: 12, color: TEXT_TER, marginTop: 2 }}>
              Show on specific days and meal slots.
            </div>
          </div>
          <Switch on={schedOn} onClick={handleScheduleToggle} disabled={submitting || deleting} />
        </div>

        {schedOn && (
          <>
            <div style={{
              fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "1.5px",
              color: SAGE, textTransform: "uppercase", marginBottom: 12,
            }}>
              When do you take this?
            </div>

            {/* Take daily */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 14px", borderRadius: 12,
              background: SURFACE, border: `0.5px solid ${BORDER}`, marginBottom: 14,
            }}>
              <span style={{ fontFamily: SANS, fontSize: 14, color: TEXT }}>Take daily</span>
              <Switch on={takeDaily} onClick={handleTakeDaily} disabled={submitting || deleting} />
            </div>

            {/* Day chips */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
              {ALL_DAYS.map((d) => (
                <ChipButton key={d} active={days.includes(d)} onClick={() => toggleDay(d)}>
                  {DAY_LABEL[d]}
                </ChipButton>
              ))}
            </div>
            {days.length === 0 && (
              <div style={{ fontFamily: SANS, fontSize: 12, color: RED, marginTop: -8, marginBottom: 12 }}>
                Pick at least one day.
              </div>
            )}

            <div style={{
              fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "1.5px",
              color: SAGE, textTransform: "uppercase", marginBottom: 10,
            }}>
              With which meals?
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
              {ALL_MEALS.map((m) => (
                <ChipButton key={m} active={meals.includes(m)} onClick={() => toggleMeal(m)}>
                  {MEAL_LABEL[m]}
                </ChipButton>
              ))}
            </div>
            {meals.length === 0 && (
              <div style={{ fontFamily: SANS, fontSize: 12, color: RED, marginTop: -8, marginBottom: 12 }}>
                Pick at least one meal slot.
              </div>
            )}
          </>
        )}

        {error && (
          <div style={{
            padding: "9px 12px", borderRadius: 9, marginTop: 6, marginBottom: 14,
            background: `rgba(var(--nura-danger-rgb),0.08)`,
            border: `0.5px solid rgba(var(--nura-danger-rgb),0.3)`,
            color: RED, fontFamily: SANS, fontSize: 12,
          }}>{error}</div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: schedOn ? 6 : 18 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting || deleting}
            style={{
              flex: 1, padding: "11px 16px", borderRadius: 11,
              background: "transparent", border: `0.5px solid ${BORDER}`,
              color: TEXT_SEC, fontFamily: SANS, fontSize: 13, fontWeight: 500,
              cursor: submitting || deleting ? "not-allowed" : "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isValid || submitting || deleting}
            onMouseEnter={(e) => { if (isValid && !submitting && !deleting) e.currentTarget.style.background = SAGE_HOV; }}
            onMouseLeave={(e) => { if (isValid && !submitting && !deleting) e.currentTarget.style.background = SAGE; }}
            style={{
              flex: 1, padding: "11px 16px", borderRadius: 11, border: "none",
              background: (!isValid || submitting || deleting) ? `rgba(var(--nura-sage-rgb),0.4)` : SAGE,
              color: SAGE_ON, fontFamily: SANS, fontSize: 13, fontWeight: 500,
              cursor: (!isValid || submitting || deleting) ? "not-allowed" : "pointer",
              transition: "background 200ms",
            }}
          >
            {submitting ? "Saving…" : mode === "add" ? "Add to stack" : "Save"}
          </button>
        </div>

        {mode === "edit" && existing && (
          <div style={{ marginTop: 22, textAlign: "center" }}>
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                disabled={submitting || deleting}
                style={{
                  background: "none", border: "none", padding: 4,
                  fontFamily: SANS, fontSize: 12, color: RED, cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Delete supplement
              </button>
            ) : (
              <div>
                <div style={{ fontFamily: SANS, fontSize: 13, color: TEXT_SEC, marginBottom: 10 }}>
                  Delete this supplement? This cannot be undone.
                </div>
                <div style={{ display: "inline-flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    disabled={deleting}
                    style={{
                      padding: "7px 14px", borderRadius: 9,
                      background: "transparent", border: `0.5px solid ${BORDER}`,
                      color: TEXT_SEC, fontFamily: SANS, fontSize: 12, fontWeight: 500,
                      cursor: deleting ? "not-allowed" : "pointer",
                    }}
                  >
                    Keep it
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    style={{
                      padding: "7px 14px", borderRadius: 9,
                      background: `rgba(var(--nura-danger-rgb),0.12)`,
                      border: `0.5px solid rgba(var(--nura-danger-rgb),0.4)`,
                      color: RED, fontFamily: SANS, fontSize: 12, fontWeight: 500,
                      cursor: deleting ? "not-allowed" : "pointer",
                    }}
                  >
                    {deleting ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Modal primitives ─────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "11px 13px", borderRadius: 10,
  background: SURFACE, border: `0.5px solid ${BORDER}`,
  color: TEXT, fontFamily: SANS, fontSize: 14, outline: "none",
  boxSizing: "border-box",
};

function Field({
  label, input, error, optional,
}: {
  label: string;
  input: React.ReactNode;
  error: string | null;
  optional?: boolean;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{
        display: "block", fontFamily: SANS, fontSize: 10, fontWeight: 600,
        letterSpacing: "1.5px", textTransform: "uppercase",
        color: TEXT_TER, marginBottom: 6,
      }}>
        {label}
        {optional && (
          <span style={{ marginLeft: 6, letterSpacing: "0.4px", textTransform: "none", color: TEXT_TER }}>
            · optional
          </span>
        )}
      </label>
      {input}
      {error && (
        <div style={{ fontFamily: SANS, fontSize: 12, color: RED, marginTop: 6 }}>
          {error}
        </div>
      )}
    </div>
  );
}

function ChipButton({
  active, onClick, children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = TEXT_SEC; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = TEXT_TER; }}
      style={{
        padding: "8px 14px", borderRadius: 9999, border: `0.5px solid ${active ? "transparent" : BORDER}`,
        background: active ? SAGE : "transparent",
        color: active ? SAGE_ON : TEXT_TER,
        fontFamily: SANS, fontSize: 13, fontWeight: active ? 500 : 400,
        cursor: "pointer", transition: "background 160ms, color 160ms",
      }}
    >
      {children}
    </button>
  );
}

function Switch({
  on, onClick, disabled,
}: {
  on: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 40, height: 24, borderRadius: 9999,
        background: on ? SAGE : "var(--nura-surface-elevated)",
        border: `0.5px solid ${on ? "transparent" : BORDER}`,
        padding: 0, cursor: disabled ? "not-allowed" : "pointer",
        position: "relative", transition: "background 160ms",
        flexShrink: 0,
      }}
    >
      <span style={{
        position: "absolute", top: 2, left: on ? 18 : 2,
        width: 18, height: 18, borderRadius: "50%",
        background: on ? SAGE_ON : TEXT_TER,
        transition: "left 160ms",
      }} />
    </button>
  );
}
