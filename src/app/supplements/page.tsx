"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Calendar, Camera, Check, Edit3, Flame, ScanLine, Sparkles } from "lucide-react";
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

interface StatsDay {
  date: string;
  day_of_week: string;
  taken: number;
  scheduled: number;
  is_today: boolean;
  is_future: boolean;
}
interface Stats {
  streak: number;
  personal_best: number;
  week_start: string;
  days: StatsDay[];
  compliance_pct: number;
}

interface ScanExtracted {
  name: string;
  dosage: string | null;
  form: string | null;
  brand: string | null;
}

interface BarcodeLookup {
  upc: string;
  brand: string | null;
  name: string;
  size: string | null;
}

type AddFlow =
  | { mode: "closed" }
  | { mode: "choice" }
  | { mode: "barcode-scanning" }
  | { mode: "barcode-permission-denied" }
  | { mode: "barcode-camera-failed" }
  | { mode: "barcode-looking-up"; upc: string; capturedFrame: string | null }
  | { mode: "barcode-match"; lookup: BarcodeLookup; capturedFrame: string | null }
  | { mode: "barcode-not-found"; upc: string; capturedFrame: string | null }
  | { mode: "scanning"; photoDataUrl: string }
  | { mode: "confirm"; photoDataUrl: string; initial: ScanExtracted }
  | { mode: "scan-error"; photoDataUrl: string };

async function compressImage(file: File): Promise<{ dataUrl: string; base64: string }> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Image load failed"));
      i.src = objectUrl;
    });
    const MAX_W = 1200;
    const ratio = Math.min(1, MAX_W / img.width);
    const w = Math.max(1, Math.round(img.width * ratio));
    const h = Math.max(1, Math.round(img.height * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context unavailable");
    ctx.drawImage(img, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    const base64 = dataUrl.split(",")[1] ?? "";
    return { dataUrl, base64 };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function capitalizeWord(s: string): string {
  const t = s.trim();
  if (!t) return "";
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

// ── Page ──────────────────────────────────────────────────────────────────────
function SupplementsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [modalState, setModalState] = useState<
    | { mode: "closed" }
    | { mode: "add" }
    | { mode: "edit"; supplement: Supplement }
  >({ mode: "closed" });
  const [addFlow, setAddFlow] = useState<AddFlow>({ mode: "closed" });
  const photoInputRef = useRef<HTMLInputElement>(null);
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

  const fetchStats = useCallback(async (date: string) => {
    try {
      const res = await fetch(`/api/supplements/stats?today=${date}`);
      if (!res.ok) return;
      const data = (await res.json()) as Stats;
      setStats(data);
    } catch {
      // silent
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
    void fetchStats(today);
  }, [user, today, fetchLogs, fetchStats]);

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
      // Refresh streak/weekly view after a successful toggle.
      void fetchStats(today);
    } catch {
      // Rollback on error
      setLogSet((prev) => {
        const next = new Set(prev);
        if (wasChecked) next.add(key);
        else next.delete(key);
        return next;
      });
    }
  }, [logSet, today, fetchStats]);

  const performImageScan = useCallback(
    async (photoDataUrl: string, base64: string) => {
      setAddFlow({ mode: "scanning", photoDataUrl });
      try {
        const res = await fetch("/api/supplements/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_base64: base64 }),
        });
        if (!res.ok) {
          setAddFlow({ mode: "scan-error", photoDataUrl });
          return;
        }
        const data = (await res.json()) as
          | { success: true; name: string; dosage: string | null; form: string | null; brand: string | null }
          | { success: false; error?: string };
        if (!data.success) {
          setAddFlow({ mode: "scan-error", photoDataUrl });
          return;
        }
        setAddFlow({
          mode: "confirm",
          photoDataUrl,
          initial: {
            name: data.name ?? "",
            dosage: data.dosage,
            form: data.form,
            brand: data.brand,
          },
        });
      } catch {
        setAddFlow({ mode: "scan-error", photoDataUrl });
      }
    },
    []
  );

  const runScan = useCallback(async (file: File) => {
    let compressed: { dataUrl: string; base64: string };
    try {
      compressed = await compressImage(file);
    } catch {
      setAddFlow({ mode: "scan-error", photoDataUrl: "" });
      return;
    }
    await performImageScan(compressed.dataUrl, compressed.base64);
  }, [performImageScan]);

  const scanFrameAsLabel = useCallback(
    async (frameDataUrl: string) => {
      const base64 = frameDataUrl.split(",")[1] ?? "";
      if (!base64) {
        setAddFlow({ mode: "scan-error", photoDataUrl: frameDataUrl });
        return;
      }
      await performImageScan(frameDataUrl, base64);
    },
    [performImageScan]
  );

  const lookupBarcode = useCallback(
    async (upc: string, capturedFrame: string | null) => {
      setAddFlow({ mode: "barcode-looking-up", upc, capturedFrame });
      try {
        const res = await fetch("/api/supplements/barcode-lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ upc }),
        });
        const data = (await res.json().catch(() => null)) as
          | { success: true; upc: string; brand: string | null; name: string; size: string | null }
          | { success: false; upc?: string; error?: string }
          | null;
        if (res.ok && data && data.success) {
          setAddFlow({
            mode: "barcode-match",
            lookup: { upc: data.upc, brand: data.brand, name: data.name, size: data.size },
            capturedFrame,
          });
          return;
        }
        setAddFlow({ mode: "barcode-not-found", upc, capturedFrame });
      } catch {
        setAddFlow({ mode: "barcode-not-found", upc, capturedFrame });
      }
    },
    []
  );

  const startBarcodeScan = useCallback(() => {
    setAddFlow({ mode: "barcode-scanning" });
  }, []);

  const editLookupDetails = useCallback(
    (lookup: BarcodeLookup, capturedFrame: string | null) => {
      setAddFlow({
        mode: "confirm",
        photoDataUrl: capturedFrame ?? "",
        initial: {
          name: lookup.name,
          dosage: lookup.size,
          form: null,
          brand: lookup.brand,
        },
      });
    },
    []
  );

  const confirmLookupAdd = useCallback(
    async (lookup: BarcodeLookup) => {
      const notes = lookup.brand ? lookup.brand : undefined;
      const res = await fetch("/api/supplements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: lookup.name,
          dose: lookup.size || undefined,
          notes,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({ error: "Could not save" }));
        throw new Error(d.error ?? "Could not save");
      }
      await fetchAll();
      setAddFlow({ mode: "closed" });
    },
    [fetchAll]
  );

  const handlePhotoSelected = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      void runScan(file);
    },
    [runScan]
  );

  const openChoice = useCallback(() => setAddFlow({ mode: "choice" }), []);
  const closeFlow = useCallback(() => setAddFlow({ mode: "closed" }), []);
  const triggerPhotoPicker = useCallback(() => {
    photoInputRef.current?.click();
  }, []);
  const chooseManual = useCallback(() => {
    setAddFlow({ mode: "closed" });
    setModalState({ mode: "add" });
  }, []);

  const confirmScannedAdd = useCallback(
    async (fields: { name: string; dosage: string; form: string; brand: string }) => {
      const notesParts: string[] = [];
      if (fields.brand.trim()) notesParts.push(fields.brand.trim());
      if (fields.form.trim()) notesParts.push(capitalizeWord(fields.form));
      const notes = notesParts.length > 0 ? notesParts.join(" · ") : undefined;

      const res = await fetch("/api/supplements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fields.name.trim(),
          dose: fields.dosage.trim() || undefined,
          notes,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({ error: "Could not save" }));
        throw new Error(d.error ?? "Could not save");
      }
      await fetchAll();
      setAddFlow({ mode: "closed" });
    },
    [fetchAll]
  );

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
      <div style={{ marginBottom: 20 }}>
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

      {/* STREAK CARD */}
      <StreakCard stats={stats} />

      {/* WEEKLY COMPLIANCE CARD */}
      <WeeklyComplianceCard stats={stats} />

      {/* STACK / SCHEDULE TOGGLE */}
      <div style={{ marginBottom: stackComplete ? 16 : 32 }}>
        <div
          role="tablist"
          style={{
            display: "inline-flex", padding: 3, borderRadius: 9999,
            background: "transparent", border: `0.5px solid ${BORDER}`,
          }}
        >
          <ViewPill label="My Stack" active={view === "stack"} onClick={() => setView("stack")} />
          <ViewPill label="My Schedule" active={view === "schedule"} onClick={() => setView("schedule")} />
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
            My Stack complete for today
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

      {/* Hidden file input (camera on mobile, file picker on desktop) */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoSelected}
        style={{ display: "none" }}
      />

      {/* FAB */}
      <button
        type="button"
        aria-label="Add supplement"
        onClick={openChoice}
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

      {/* ADD FLOW — choice, barcode scan/match/not-found, photo scan/confirm/error */}
      {addFlow.mode === "choice" && (
        <AddChoiceSheet
          onScanBarcode={startBarcodeScan}
          onTakePhoto={triggerPhotoPicker}
          onAddManual={chooseManual}
          onCancel={closeFlow}
        />
      )}
      {addFlow.mode === "barcode-scanning" && (
        <BarcodeScanScreen
          onBack={openChoice}
          onCancel={closeFlow}
          onDetected={lookupBarcode}
          onPermissionDenied={() => setAddFlow({ mode: "barcode-permission-denied" })}
          onCameraFailed={() => setAddFlow({ mode: "barcode-camera-failed" })}
        />
      )}
      {addFlow.mode === "barcode-looking-up" && (
        <BarcodeLookingUpScreen onCancel={closeFlow} />
      )}
      {addFlow.mode === "barcode-permission-denied" && (
        <BarcodePermissionDeniedScreen
          onUsePhoto={() => { setAddFlow({ mode: "closed" }); triggerPhotoPicker(); }}
          onAddManual={chooseManual}
          onCancel={closeFlow}
        />
      )}
      {addFlow.mode === "barcode-camera-failed" && (
        <BarcodeCameraFailedScreen
          onUsePhoto={() => { setAddFlow({ mode: "closed" }); triggerPhotoPicker(); }}
          onAddManual={chooseManual}
          onCancel={closeFlow}
        />
      )}
      {addFlow.mode === "barcode-match" && (
        <BarcodeMatchScreen
          lookup={addFlow.lookup}
          capturedFrame={addFlow.capturedFrame}
          onBack={openChoice}
          onCancel={closeFlow}
          onConfirm={confirmLookupAdd}
          onEditDetails={() => editLookupDetails(addFlow.lookup, addFlow.capturedFrame)}
        />
      )}
      {addFlow.mode === "barcode-not-found" && (
        <BarcodeNotFoundScreen
          upc={addFlow.upc}
          capturedFrame={addFlow.capturedFrame}
          onBack={openChoice}
          onCancel={closeFlow}
          onReadLabel={() => {
            if (addFlow.mode !== "barcode-not-found") return;
            const frame = addFlow.capturedFrame;
            if (frame) void scanFrameAsLabel(frame);
            else triggerPhotoPicker();
          }}
          onAddManual={chooseManual}
        />
      )}
      {addFlow.mode === "scanning" && (
        <ScanningScreen photoDataUrl={addFlow.photoDataUrl} onCancel={closeFlow} />
      )}
      {addFlow.mode === "confirm" && (
        <ConfirmScanScreen
          photoDataUrl={addFlow.photoDataUrl}
          initial={addFlow.initial}
          onCancel={closeFlow}
          onRetake={triggerPhotoPicker}
          onConfirm={confirmScannedAdd}
        />
      )}
      {addFlow.mode === "scan-error" && (
        <ScanErrorScreen
          photoDataUrl={addFlow.photoDataUrl}
          onRetake={triggerPhotoPicker}
          onAddManual={chooseManual}
          onCancel={closeFlow}
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
          ? "Schedule a supplement from My Stack, or tap + to add a new one."
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
        Go to My Stack →
      </button>
    </div>
  );
}

// ── Streak card ───────────────────────────────────────────────────────────────
const SAGE_BRIGHT = "#7a9a82";
const SAGE_TEXT = "#9bb8a3";

function StreakCard({ stats }: { stats: Stats | null }) {
  if (!stats) {
    return (
      <div style={{
        position: "relative", overflow: "hidden",
        borderRadius: 18,
        background: "linear-gradient(135deg, rgba(122, 154, 130, 0.18) 0%, rgba(122, 154, 130, 0.08) 100%)",
        border: "1px solid rgba(122, 154, 130, 0.25)",
        padding: "18px 20px", marginBottom: 12,
        height: 78, boxSizing: "border-box",
      }}>
        <style>{`@keyframes nura-streak-sk { 0%{transform:translateX(-100%);} 100%{transform:translateX(200%);} }`}</style>
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(90deg, transparent, rgba(122, 154, 130, 0.12), transparent)",
          animation: "nura-streak-sk 1.6s ease infinite",
        }} />
      </div>
    );
  }

  const { streak, personal_best } = stats;
  const subtitle =
    streak === 0
      ? "Take a supplement today to start a streak"
      : streak >= personal_best
      ? "New personal best!"
      : streak === personal_best - 1
      ? "One day to your personal best"
      : "Keep it going";

  return (
    <div style={{
      position: "relative", overflow: "hidden",
      borderRadius: 18,
      background: "linear-gradient(135deg, rgba(122, 154, 130, 0.18) 0%, rgba(122, 154, 130, 0.08) 100%)",
      border: "1px solid rgba(122, 154, 130, 0.25)",
      padding: "18px 20px", marginBottom: 12,
      display: "flex", alignItems: "center", gap: 16,
    }}>
      <div aria-hidden style={{
        position: "absolute", top: -40, right: -40,
        width: 140, height: 140,
        background: "radial-gradient(circle, rgba(122, 154, 130, 0.32) 0%, rgba(122, 154, 130, 0) 70%)",
        pointerEvents: "none",
      }} />
      <div aria-hidden style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, position: "relative",
        color: SAGE_BRIGHT,
      }}>
        <Flame size={28} strokeWidth={1.75} fill={SAGE_BRIGHT} aria-hidden />
      </div>
      <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
        <div style={{
          fontFamily: SANS, fontSize: 22, fontWeight: 600, color: TEXT,
          lineHeight: 1.15, letterSpacing: "-0.2px",
        }}>
          {streak}-day streak
        </div>
        <div style={{
          fontFamily: SANS, fontSize: 12, color: TEXT_SEC,
          marginTop: 4, lineHeight: 1.3,
        }}>
          {subtitle}
        </div>
      </div>
    </div>
  );
}

// ── Weekly compliance card ────────────────────────────────────────────────────
const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"] as const;

function WeeklyComplianceCard({ stats }: { stats: Stats | null }) {
  if (!stats) {
    return (
      <div style={{
        position: "relative", overflow: "hidden",
        borderRadius: 18, background: SURFACE,
        border: `0.5px solid ${BORDER}`,
        padding: "18px 18px 16px", marginBottom: 22,
        height: 108, boxSizing: "border-box",
      }}>
        <style>{`@keyframes nura-week-sk { 0%{transform:translateX(-100%);} 100%{transform:translateX(200%);} }`}</style>
        <div style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(90deg, transparent, rgba(var(--nura-sage-rgb), 0.07), transparent)`,
          animation: "nura-week-sk 1.6s ease infinite",
        }} />
      </div>
    );
  }

  const { compliance_pct, days } = stats;

  return (
    <div style={{
      borderRadius: 18, background: SURFACE,
      border: `0.5px solid ${BORDER}`,
      padding: "18px 18px 16px", marginBottom: 22,
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 14,
      }}>
        <span style={{
          fontFamily: SANS, fontSize: 11, fontWeight: 600,
          letterSpacing: "0.1em", textTransform: "uppercase",
          color: `rgba(var(--nura-fg-rgb), 0.5)`,
        }}>
          This week
        </span>
        <span style={{ fontFamily: SANS, fontSize: 12, color: TEXT_SEC }}>
          <span style={{ color: SAGE_TEXT, fontWeight: 600 }}>{compliance_pct}%</span>{" "}
          compliance
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
        {days.map((d, idx) => (
          <WeeklyDayCell key={d.date} day={d} dayLetter={DAY_LETTERS[idx]} />
        ))}
      </div>
    </div>
  );
}

function WeeklyDayCell({ day, dayLetter }: { day: StatsDay; dayLetter: string }) {
  const { taken, scheduled, is_today, is_future } = day;

  let state: "full" | "partial" | "empty";
  if (is_future) {
    state = "empty";
  } else if (taken === 0) {
    state = "empty";
  } else if (scheduled > 0 && taken < scheduled) {
    state = "partial";
  } else {
    state = "full";
  }

  const pct = scheduled > 0 ? Math.min(100, Math.round((taken / scheduled) * 100)) : 100;
  const CIRCLE = 32;
  const INNER = 24;

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
    }}>
      <div style={{
        fontFamily: SANS, fontSize: 10, fontWeight: 500, letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: is_today ? SAGE_TEXT : TEXT_TER,
      }}>
        {dayLetter}
      </div>

      <div style={{
        width: CIRCLE, height: CIRCLE, borderRadius: "50%",
        background:
          state === "full"
            ? SAGE_BRIGHT
            : state === "partial"
            ? `conic-gradient(${SAGE_BRIGHT} ${pct}%, rgba(var(--nura-fg-rgb), 0.10) 0)`
            : "transparent",
        border: state === "empty" ? `1px solid ${BORDER}` : "none",
        boxShadow: is_today
          ? `0 0 0 2px var(--nura-bg), 0 0 0 3.5px ${SAGE_BRIGHT}`
          : "none",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: state === "full" ? "var(--nura-sage-bg-on)" : TEXT,
        flexShrink: 0,
      }}>
        {state === "full" && <CheckGlyph size={14} />}
        {state === "partial" && (
          <div style={{
            width: INNER, height: INNER, borderRadius: "50%",
            background: "var(--nura-bg)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: SANS, fontSize: 9, fontWeight: 600,
            color: TEXT, lineHeight: 1,
          }}>
            {taken}/{scheduled}
          </div>
        )}
      </div>
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

// ── Add-flow shared primitives ───────────────────────────────────────────────
const SAGE_BORDER_TINT = "rgba(122, 154, 130, 0.3)";
const SAGE_BG_TINT = "rgba(var(--nura-sage-rgb), 0.12)";

function FlowModal({
  children, onClose, ariaLabel,
}: {
  children: React.ReactNode;
  onClose: () => void;
  ariaLabel?: string;
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
        animation: "nura-modal-in 200ms ease-out",
      }}
    >
      <style>{`
        @keyframes nura-modal-card-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .nura-flow-modal-card { width: 100%; max-width: 420px; margin-left: auto; margin-right: auto; }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className="nura-flow-modal-card"
        style={{
          background: "var(--nura-bg)",
          border: `0.5px solid ${BORDER}`,
          borderRadius: 18,
          maxHeight: "calc(100dvh - 32px)",
          overflowY: "auto",
          animation: "nura-modal-card-in 200ms ease-out both",
          boxShadow: "0 24px 60px rgba(0,0,0,0.40)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ── Choice modal ─────────────────────────────────────────────────────────────
function AddChoiceSheet({
  onScanBarcode, onTakePhoto, onAddManual, onCancel,
}: {
  onScanBarcode: () => void;
  onTakePhoto: () => void;
  onAddManual: () => void;
  onCancel: () => void;
}) {
  return (
    <FlowModal onClose={onCancel} ariaLabel="Add a supplement">
      <div style={{ padding: "24px 22px 22px" }}>
        <h2 style={{
          fontFamily: SERIF, fontWeight: 500, color: TEXT,
          margin: "0 0 4px", fontSize: 22, lineHeight: 1.2, letterSpacing: "-0.2px",
        }}>
          Add a supplement
        </h2>
        <p style={{
          fontFamily: SANS, fontSize: 13, color: TEXT_SEC,
          margin: "0 0 18px",
        }}>
          Scan the barcode for fastest entry.
        </p>

        <ChoiceCard
          tier="featured"
          icon={<ScanLine size={22} strokeWidth={2} aria-hidden />}
          title="Scan barcode"
          titleBadge="New"
          subtitle="Fastest. Auto-detects the product."
          onClick={onScanBarcode}
        />
        <ChoiceCard
          tier="secondary"
          icon={<Camera size={22} strokeWidth={2} aria-hidden />}
          title="Take a photo"
          subtitle="We'll read the label for you"
          onClick={onTakePhoto}
        />
        <ChoiceCard
          tier="tertiary"
          icon={<Edit3 size={20} strokeWidth={2} aria-hidden />}
          title="Add manually"
          subtitle="Fill in the details yourself"
          onClick={onAddManual}
        />

        <button
          type="button"
          onClick={onCancel}
          style={{
            display: "block",
            margin: "14px auto 0",
            background: "none", border: "none", padding: 8,
            fontFamily: SANS, fontSize: 13, color: TEXT_SEC,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </FlowModal>
  );
}

function ChoiceCard({
  tier = "secondary", icon, title, titleBadge, subtitle, onClick,
}: {
  tier?: "featured" | "secondary" | "tertiary";
  icon: React.ReactNode;
  title: string;
  titleBadge?: string;
  subtitle: string;
  onClick: () => void;
}) {
  const featured = tier === "featured";
  const tertiary = tier === "tertiary";

  const baseBg = featured ? SAGE : tertiary ? "transparent" : SURFACE;
  const baseBorder = featured ? "0.5px solid transparent" : `0.5px solid ${BORDER}`;
  const baseColor = featured ? SAGE_ON : TEXT;

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = featured ? "transparent" : TEXT_TER;
        if (featured) e.currentTarget.style.background = SAGE_HOV;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = featured ? "transparent" : BORDER;
        if (featured) e.currentTarget.style.background = SAGE;
      }}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 14,
        textAlign: "left", marginBottom: 10,
        padding: tertiary ? "12px 14px" : "14px 16px",
        borderRadius: 14,
        background: baseBg,
        border: baseBorder,
        color: baseColor,
        cursor: "pointer", transition: "background 160ms, border-color 160ms",
      }}
    >
      <span aria-hidden style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, width: tertiary ? 24 : 28, height: tertiary ? 24 : 28,
        color: featured ? SAGE_ON : tertiary ? TEXT_TER : SAGE,
      }}>{icon}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{
          display: "flex", alignItems: "center", gap: 8,
          fontFamily: SANS, fontSize: tertiary ? 14 : 15, fontWeight: 500,
          lineHeight: 1.25,
        }}>
          {title}
          {titleBadge && (
            <span style={{
              display: "inline-flex", alignItems: "center",
              padding: "1px 7px", borderRadius: 9999,
              background: featured ? "rgba(255,255,255,0.22)" : SAGE_BG_TINT,
              border: featured ? "none" : `0.5px solid rgba(var(--nura-sage-rgb), 0.32)`,
              fontFamily: SANS, fontSize: 9, fontWeight: 600,
              letterSpacing: "0.08em", textTransform: "uppercase",
              color: featured ? SAGE_ON : SAGE_TEXT,
            }}>
              {titleBadge}
            </span>
          )}
        </span>
        <span style={{
          display: "block", marginTop: 2,
          fontFamily: SANS, fontSize: 12,
          color: featured ? "rgba(255,255,255,0.85)" : TEXT_TER,
          lineHeight: 1.35,
        }}>
          {subtitle}
        </span>
      </span>
    </button>
  );
}

// ── Scanning modal ───────────────────────────────────────────────────────────
function ScanningScreen({
  photoDataUrl, onCancel,
}: { photoDataUrl: string; onCancel: () => void }) {
  return (
    <FlowModal onClose={onCancel} ariaLabel="Scanning label">
      <FlowHeader title="Scan label" onCancel={onCancel} />
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "8px 22px 24px",
      }}>
        {photoDataUrl && (
          <div style={{
            width: "100%", maxWidth: 280, aspectRatio: "4 / 5",
            borderRadius: 16, overflow: "hidden",
            background: SURFACE, border: `0.5px solid ${BORDER}`,
            marginBottom: 24,
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoDataUrl}
              alt="Label preview"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>
        )}

        <style>{`@keyframes nura-spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          border: `2.5px solid rgba(var(--nura-sage-rgb), 0.25)`,
          borderTopColor: SAGE,
          animation: "nura-spin 800ms linear infinite",
          marginBottom: 14,
        }} />
        <div style={{
          fontFamily: SANS, fontSize: 15, fontWeight: 500, color: TEXT,
          marginBottom: 4,
        }}>
          Reading label…
        </div>
        <div style={{
          fontFamily: SANS, fontSize: 12, color: TEXT_TER,
        }}>
          Usually 2–4 seconds
        </div>
      </div>
    </FlowModal>
  );
}

// ── Confirm screen ───────────────────────────────────────────────────────────
function ConfirmScanScreen({
  photoDataUrl, initial, onCancel, onRetake, onConfirm,
}: {
  photoDataUrl: string;
  initial: ScanExtracted;
  onCancel: () => void;
  onRetake: () => void;
  onConfirm: (fields: { name: string; dosage: string; form: string; brand: string }) => Promise<void>;
}) {
  const [name, setName] = useState(initial.name);
  const [dosage, setDosage] = useState(initial.dosage ?? "");
  const [form, setForm] = useState(initial.form ?? "");
  const [brand, setBrand] = useState(initial.brand ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = name.trim().length > 0;

  const handleSubmit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm({ name, dosage, form, brand });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
      setSubmitting(false);
    }
  };

  return (
    <FlowModal
      onClose={submitting ? () => undefined : onCancel}
      ariaLabel="Confirm scanned details"
    >
      <FlowHeader title="Confirm details" onCancel={submitting ? undefined : onCancel} />

      <div style={{
        padding: "8px 22px 24px",
        width: "100%", boxSizing: "border-box",
      }}>
        {photoDataUrl && (
          <div style={{
            position: "relative",
            width: 96, height: 96, borderRadius: 14, overflow: "hidden",
            background: SURFACE, border: `0.5px solid ${BORDER}`,
            margin: "0 auto 20px",
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoDataUrl}
              alt="Label"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            <span style={{
              position: "absolute", bottom: 6, left: "50%", transform: "translateX(-50%)",
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "2px 8px", borderRadius: 9999,
              background: "rgba(0,0,0,0.65)",
              border: `0.5px solid rgba(var(--nura-sage-rgb), 0.5)`,
              fontFamily: SANS, fontSize: 10, fontWeight: 600, color: SAGE_TEXT,
              whiteSpace: "nowrap",
            }}>
              <Sparkles size={11} strokeWidth={2} aria-hidden />
              Read
            </span>
          </div>
        )}

        <ScannedField
          label="Name"
          value={name}
          onChange={setName}
          fromLabel={initial.name.trim().length > 0}
          required
          showError={!valid && name.length > 0}
          errorText="Name is required"
        />
        <ScannedField
          label="Dosage"
          value={dosage}
          onChange={setDosage}
          fromLabel={(initial.dosage ?? "").trim().length > 0}
          placeholder="e.g. 1000 IU"
        />
        <ScannedField
          label="Form"
          value={form}
          onChange={setForm}
          fromLabel={(initial.form ?? "").trim().length > 0}
          placeholder="capsule, softgel, tablet…"
        />
        <ScannedField
          label="Brand"
          value={brand}
          onChange={setBrand}
          fromLabel={(initial.brand ?? "").trim().length > 0}
          optional
          placeholder="Optional"
        />

        <div style={{
          marginTop: 6, padding: "12px 14px", borderRadius: 12,
          border: `1px dashed ${BORDER}`,
          background: "transparent",
          fontFamily: SANS, fontSize: 12, color: TEXT_SEC, lineHeight: 1.5,
          display: "flex", alignItems: "flex-start", gap: 8,
        }}>
          <Calendar size={14} strokeWidth={2} aria-hidden style={{ flexShrink: 0, marginTop: 1, color: TEXT_TER }} />
          <span>Will be added as Unscheduled. Set the schedule on the next screen or later.</span>
        </div>

        {error && (
          <div style={{
            marginTop: 14, padding: "9px 12px", borderRadius: 9,
            background: `rgba(var(--nura-danger-rgb),0.08)`,
            border: `0.5px solid rgba(var(--nura-danger-rgb),0.3)`,
            color: RED, fontFamily: SANS, fontSize: 12,
          }}>{error}</div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!valid || submitting}
          onMouseEnter={(e) => { if (valid && !submitting) e.currentTarget.style.background = SAGE_HOV; }}
          onMouseLeave={(e) => { if (valid && !submitting) e.currentTarget.style.background = SAGE; }}
          style={{
            display: "block", width: "100%", marginTop: 22,
            padding: "13px 16px", borderRadius: 11, border: "none",
            background: (!valid || submitting) ? `rgba(var(--nura-sage-rgb),0.4)` : SAGE,
            color: SAGE_ON, fontFamily: SANS, fontSize: 14, fontWeight: 500,
            cursor: (!valid || submitting) ? "not-allowed" : "pointer",
            transition: "background 200ms",
          }}
        >
          {submitting ? "Adding…" : "Add to my stack"}
        </button>

        <button
          type="button"
          onClick={onRetake}
          disabled={submitting}
          style={{
            display: "block", margin: "14px auto 0",
            background: "none", border: "none", padding: 6,
            fontFamily: SANS, fontSize: 13, color: SAGE_TEXT,
            cursor: submitting ? "not-allowed" : "pointer",
            textDecoration: "underline",
          }}
        >
          Retake photo
        </button>
      </div>
    </FlowModal>
  );
}

function ScannedField({
  label, value, onChange, fromLabel, required, optional, placeholder, showError, errorText,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  fromLabel: boolean;
  required?: boolean;
  optional?: boolean;
  placeholder?: string;
  showError?: boolean;
  errorText?: string;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8, marginBottom: 6,
      }}>
        <label style={{
          fontFamily: SANS, fontSize: 10, fontWeight: 600,
          letterSpacing: "1.5px", textTransform: "uppercase",
          color: TEXT_TER,
        }}>
          {label}
          {optional && (
            <span style={{ marginLeft: 6, letterSpacing: "0.4px", textTransform: "none", color: TEXT_TER }}>
              · optional
            </span>
          )}
        </label>
        {fromLabel && (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "2px 7px", borderRadius: 9999,
            background: SAGE_BG_TINT,
            border: `0.5px solid rgba(var(--nura-sage-rgb), 0.32)`,
            fontFamily: SANS, fontSize: 9, fontWeight: 600,
            letterSpacing: "0.06em",
            color: SAGE_TEXT, textTransform: "uppercase",
          }}>
            <Sparkles size={10} strokeWidth={2} aria-hidden />
            From label
          </span>
        )}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        style={{
          width: "100%", padding: "11px 13px", borderRadius: 10,
          background: SURFACE,
          border: `1px solid ${fromLabel ? SAGE_BORDER_TINT : BORDER}`,
          color: TEXT, fontFamily: SANS, fontSize: 14, outline: "none",
          boxSizing: "border-box",
        }}
      />
      {showError && errorText && (
        <div style={{ fontFamily: SANS, fontSize: 12, color: RED, marginTop: 6 }}>
          {errorText}
        </div>
      )}
    </div>
  );
}

// ── Scan error modal ─────────────────────────────────────────────────────────
function ScanErrorScreen({
  photoDataUrl, onRetake, onAddManual, onCancel,
}: {
  photoDataUrl: string;
  onRetake: () => void;
  onAddManual: () => void;
  onCancel: () => void;
}) {
  return (
    <FlowModal onClose={onCancel} ariaLabel="Scan failed">
      <FlowHeader title="Scan label" onCancel={onCancel} />

      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "12px 28px 28px",
        textAlign: "center",
      }}>
        {photoDataUrl && (
          <div style={{
            width: 88, height: 88, borderRadius: 14, overflow: "hidden",
            background: SURFACE, border: `0.5px solid ${BORDER}`,
            marginBottom: 22, opacity: 0.6,
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoDataUrl}
              alt="Label preview"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>
        )}

        <h2 style={{
          fontFamily: SERIF, fontWeight: 500, color: TEXT,
          fontSize: "clamp(20px, 3vw, 24px)",
          lineHeight: 1.3, letterSpacing: "-0.2px",
          margin: "0 0 10px",
        }}>
          Couldn&apos;t read this label.
        </h2>
        <p style={{
          fontFamily: SANS, fontSize: 14, color: TEXT_SEC, lineHeight: 1.55,
          maxWidth: 340, margin: "0 0 24px",
        }}>
          Try a clearer picture of the label, or add it manually.
        </p>

        <button
          type="button"
          onClick={onRetake}
          onMouseEnter={(e) => { e.currentTarget.style.background = SAGE_HOV; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = SAGE; }}
          style={{
            width: "100%", maxWidth: 320,
            padding: "12px 16px", borderRadius: 11, border: "none",
            background: SAGE, color: SAGE_ON,
            fontFamily: SANS, fontSize: 14, fontWeight: 500,
            cursor: "pointer", transition: "background 200ms",
            marginBottom: 10,
          }}
        >
          Retake photo
        </button>
        <button
          type="button"
          onClick={onAddManual}
          style={{
            width: "100%", maxWidth: 320,
            padding: "12px 16px", borderRadius: 11,
            background: "transparent",
            border: `0.5px solid ${BORDER}`,
            color: TEXT, fontFamily: SANS, fontSize: 14, fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Add manually
        </button>
      </div>
    </FlowModal>
  );
}

// ── Flow header (Cancel link) ────────────────────────────────────────────────
function FlowHeader({ title, onCancel }: { title: string; onCancel?: () => void }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px 18px 8px",
    }}>
      <div style={{
        fontFamily: SANS, fontSize: 15, fontWeight: 500, color: TEXT,
      }}>
        {title}
      </div>
      {onCancel ? (
        <button
          type="button"
          onClick={onCancel}
          style={{
            background: "none", border: "none", padding: 6,
            fontFamily: SANS, fontSize: 13, color: TEXT_SEC,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      ) : (
        <span style={{ width: 1 }} />
      )}
    </div>
  );
}

// ── Flow header (Back arrow, centered title) ─────────────────────────────────
function FlowHeaderWithBack({
  title, onBack,
}: { title: string; onBack: () => void }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "44px 1fr 44px",
      alignItems: "center", padding: "10px 12px 6px",
    }}>
      <button
        type="button"
        onClick={onBack}
        aria-label="Back"
        style={{
          width: 36, height: 36, padding: 0, borderRadius: 9,
          background: SURFACE, border: `0.5px solid ${BORDER}`,
          color: TEXT_SEC, cursor: "pointer",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <ArrowLeft size={16} strokeWidth={2} aria-hidden />
      </button>
      <div style={{
        fontFamily: SANS, fontSize: 15, fontWeight: 500, color: TEXT,
        textAlign: "center",
      }}>
        {title}
      </div>
      <span aria-hidden />
    </div>
  );
}

// ── Barcode viewfinder overlay (corners + animated scan line) ────────────────
function CornerMarker({
  position,
}: { position: "tl" | "tr" | "bl" | "br" }) {
  const isTop = position === "tl" || position === "tr";
  const isLeft = position === "tl" || position === "bl";
  return (
    <div aria-hidden style={{
      position: "absolute",
      top: isTop ? "38%" : "auto",
      bottom: !isTop ? "38%" : "auto",
      left: isLeft ? "12%" : "auto",
      right: !isLeft ? "12%" : "auto",
      width: 22, height: 22,
      borderTop: isTop ? "3px solid #7a9a82" : "none",
      borderBottom: !isTop ? "3px solid #7a9a82" : "none",
      borderLeft: isLeft ? "3px solid #7a9a82" : "none",
      borderRight: !isLeft ? "3px solid #7a9a82" : "none",
      filter: "drop-shadow(0 0 6px rgba(122, 154, 130, 0.6))",
      pointerEvents: "none",
    }} />
  );
}

function BarcodeViewfinder() {
  return (
    <>
      <style>{`
        @keyframes nura-scan-line {
          0%   { transform: translateY(0); }
          50%  { transform: translateY(calc(100% - 2px)); }
          100% { transform: translateY(0); }
        }
        #nura-barcode-reader video {
          position: absolute !important;
          top: 0 !important; left: 0 !important;
          width: 100% !important; height: 100% !important;
          object-fit: cover !important;
          z-index: 1;
          background: transparent;
        }
        #nura-barcode-reader > div { width: 100% !important; height: 100% !important; padding: 0 !important; }
      `}</style>
      <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 2 }}>
        <CornerMarker position="tl" />
        <CornerMarker position="tr" />
        <CornerMarker position="bl" />
        <CornerMarker position="br" />
        <div style={{
          position: "absolute",
          top: "38%", bottom: "38%", left: "12%", right: "12%",
          overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", left: 0, right: 0, top: 0,
            height: 2,
            background: "linear-gradient(90deg, rgba(122,154,130,0), rgba(122,154,130,0.95), rgba(122,154,130,0))",
            boxShadow: "0 0 12px rgba(122, 154, 130, 0.8)",
            animation: "nura-scan-line 1.8s ease-in-out infinite",
          }} />
        </div>
      </div>
    </>
  );
}

// ── Barcode scan modal (camera + html5-qrcode) ──────────────────────────────
function BarcodeScanScreen({
  onBack, onCancel, onDetected, onPermissionDenied, onCameraFailed,
}: {
  onBack: () => void;
  onCancel: () => void;
  onDetected: (upc: string, capturedFrame: string | null) => void;
  onPermissionDenied: () => void;
  onCameraFailed: () => void;
}) {
  const readerRef = useRef<HTMLDivElement>(null);
  const handledRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let qrInstance: { stop: () => Promise<void>; clear?: () => void } | null = null;
    let observer: MutationObserver | null = null;
    let readyTimer: ReturnType<typeof setTimeout> | null = null;
    let attachedVideo: HTMLVideoElement | null = null;

    const attachIosFixes = (video: HTMLVideoElement) => {
      if (attachedVideo === video) return;
      attachedVideo = video;

      // iOS Safari refuses to render inline video without these. Set BEFORE play().
      video.setAttribute("playsinline", "true");
      video.setAttribute("webkit-playsinline", "true");
      video.setAttribute("autoplay", "true");
      video.setAttribute("muted", "true");
      video.playsInline = true;
      video.muted = true;
      video.autoplay = true;
      video.style.zIndex = "1";
      // Retry play() in case html5-qrcode's initial play was rejected by autoplay policy.
      video.play().catch(() => {});

      const clearReadyTimer = () => {
        if (readyTimer) { clearTimeout(readyTimer); readyTimer = null; }
        video.removeEventListener("loadeddata", clearReadyTimer);
        video.removeEventListener("playing", clearReadyTimer);
      };
      video.addEventListener("loadeddata", clearReadyTimer);
      video.addEventListener("playing", clearReadyTimer);

      readyTimer = setTimeout(() => {
        if (cancelled) return;
        // HAVE_CURRENT_DATA = 2. If we haven't reached that in 5s, the stream isn't rendering.
        if (video.readyState < 2) {
          onCameraFailed();
        }
      }, 5000);
    };

    const watchForVideo = (container: HTMLElement) => {
      const existing = container.querySelector("video");
      if (existing instanceof HTMLVideoElement) {
        attachIosFixes(existing);
        return;
      }
      observer = new MutationObserver(() => {
        const v = container.querySelector("video");
        if (v instanceof HTMLVideoElement) {
          attachIosFixes(v);
          observer?.disconnect();
          observer = null;
        }
      });
      observer.observe(container, { childList: true, subtree: true });
    };

    const start = async () => {
      try {
        const lib = await import("html5-qrcode");
        if (cancelled) return;
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = lib;
        const formats = [
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
        ];
        const instance = new Html5Qrcode("nura-barcode-reader", {
          formatsToSupport: formats,
          verbose: false,
        });
        qrInstance = instance;

        if (readerRef.current) watchForVideo(readerRef.current);

        await instance.start(
          { facingMode: "environment" },
          { fps: 10, aspectRatio: 0.75 },
          (decodedText: string) => {
            if (handledRef.current) return;
            handledRef.current = true;

            let frame: string | null = null;
            const video = readerRef.current?.querySelector("video");
            if (video instanceof HTMLVideoElement && video.videoWidth > 0) {
              try {
                const canvas = document.createElement("canvas");
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                  ctx.drawImage(video, 0, 0);
                  frame = canvas.toDataURL("image/jpeg", 0.85);
                }
              } catch {
                frame = null;
              }
            }

            if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
              try { navigator.vibrate(50); } catch {}
            }

            instance.stop().catch(() => {});
            onDetected(decodedText, frame);
          },
          () => {}
        );

        // start() resolved — html5-qrcode has inserted the video. Re-check in case the
        // observer didn't fire (some browsers batch mutations).
        if (!attachedVideo && readerRef.current) {
          const v = readerRef.current.querySelector("video");
          if (v instanceof HTMLVideoElement) attachIosFixes(v);
        }
      } catch (err) {
        if (cancelled) return;
        console.error("[barcode] start failed:", err);
        onPermissionDenied();
      }
    };

    void start();

    return () => {
      cancelled = true;
      if (readyTimer) clearTimeout(readyTimer);
      if (observer) observer.disconnect();
      if (qrInstance) {
        qrInstance.stop().catch(() => {});
        try { qrInstance.clear?.(); } catch {}
      }
    };
  }, [onDetected, onPermissionDenied, onCameraFailed]);

  return (
    <FlowModal onClose={onCancel} ariaLabel="Scan barcode">
      <FlowHeaderWithBack title="Scan barcode" onBack={onBack} />
      <div style={{ padding: "8px 22px 22px" }}>
        <div style={{
          position: "relative",
          width: "100%", aspectRatio: "3 / 4",
          borderRadius: 16, overflow: "hidden",
          background: "#000", border: `0.5px solid ${BORDER}`,
          marginBottom: 18,
        }}>
          <div id="nura-barcode-reader" ref={readerRef} style={{
            position: "absolute", inset: 0,
          }} />
          <BarcodeViewfinder />
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{
            fontFamily: SANS, fontSize: 14, fontWeight: 600, color: TEXT,
            marginBottom: 4,
          }}>
            Point at the barcode
          </div>
          <div style={{
            fontFamily: SANS, fontSize: 12, color: TEXT,
            opacity: 0.55, lineHeight: 1.4,
          }}>
            Auto-detects in 1–2 seconds. No need to tap anything.
          </div>
        </div>
      </div>
    </FlowModal>
  );
}

// ── Looking-up state (between detection and lookup result) ───────────────────
function BarcodeLookingUpScreen({ onCancel }: { onCancel: () => void }) {
  return (
    <FlowModal onClose={onCancel} ariaLabel="Looking up barcode">
      <div style={{
        padding: "36px 24px 32px",
        display: "flex", flexDirection: "column", alignItems: "center",
        textAlign: "center",
      }}>
        <style>{`@keyframes nura-spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          border: `2.5px solid rgba(var(--nura-sage-rgb), 0.25)`,
          borderTopColor: SAGE,
          animation: "nura-spin 800ms linear infinite",
          marginBottom: 16,
        }} />
        <div style={{
          fontFamily: SANS, fontSize: 15, fontWeight: 500, color: TEXT,
          marginBottom: 4,
        }}>
          Looking up product…
        </div>
        <div style={{ fontFamily: SANS, fontSize: 12, color: TEXT_TER }}>
          Checking the supplement database
        </div>
      </div>
    </FlowModal>
  );
}

// ── Permission denied ────────────────────────────────────────────────────────
function BarcodePermissionDeniedScreen({
  onUsePhoto, onAddManual, onCancel,
}: {
  onUsePhoto: () => void;
  onAddManual: () => void;
  onCancel: () => void;
}) {
  return (
    <FlowModal onClose={onCancel} ariaLabel="Camera blocked">
      <FlowHeader title="Scan barcode" onCancel={onCancel} />
      <div style={{
        padding: "12px 28px 26px",
        display: "flex", flexDirection: "column", alignItems: "center",
        textAlign: "center",
      }}>
        <h2 style={{
          fontFamily: SERIF, fontWeight: 500, color: TEXT,
          fontSize: "clamp(20px, 3vw, 24px)",
          lineHeight: 1.3, letterSpacing: "-0.2px",
          margin: "0 0 8px",
        }}>
          Camera access blocked.
        </h2>
        <p style={{
          fontFamily: SANS, fontSize: 14, color: TEXT_SEC, lineHeight: 1.55,
          maxWidth: 320, margin: "0 0 22px",
        }}>
          Allow camera access in your browser settings, or use one of these instead.
        </p>
        <button
          type="button"
          onClick={onUsePhoto}
          onMouseEnter={(e) => { e.currentTarget.style.background = SAGE_HOV; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = SAGE; }}
          style={{
            width: "100%", maxWidth: 320,
            padding: "12px 16px", borderRadius: 11, border: "none",
            background: SAGE, color: SAGE_ON,
            fontFamily: SANS, fontSize: 14, fontWeight: 500,
            cursor: "pointer", transition: "background 200ms",
            marginBottom: 10,
          }}
        >
          Take a photo instead
        </button>
        <button
          type="button"
          onClick={onAddManual}
          style={{
            width: "100%", maxWidth: 320,
            padding: "12px 16px", borderRadius: 11,
            background: "transparent",
            border: `0.5px solid ${BORDER}`,
            color: TEXT, fontFamily: SANS, fontSize: 14, fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Add manually
        </button>
      </div>
    </FlowModal>
  );
}

// ── Camera failed to render (iOS playback failure, etc.) ─────────────────────
function BarcodeCameraFailedScreen({
  onUsePhoto, onAddManual, onCancel,
}: {
  onUsePhoto: () => void;
  onAddManual: () => void;
  onCancel: () => void;
}) {
  return (
    <FlowModal onClose={onCancel} ariaLabel="Camera couldn't start">
      <FlowHeader title="Scan barcode" onCancel={onCancel} />
      <div style={{
        padding: "12px 28px 26px",
        display: "flex", flexDirection: "column", alignItems: "center",
        textAlign: "center",
      }}>
        <h2 style={{
          fontFamily: SERIF, fontWeight: 500, color: TEXT,
          fontSize: "clamp(20px, 3vw, 24px)",
          lineHeight: 1.3, letterSpacing: "-0.2px",
          margin: "0 0 8px",
        }}>
          Camera couldn&apos;t start.
        </h2>
        <p style={{
          fontFamily: SANS, fontSize: 14, color: TEXT_SEC, lineHeight: 1.55,
          maxWidth: 320, margin: "0 0 22px",
        }}>
          Try refreshing, or use Take a photo / Add manually.
        </p>
        <button
          type="button"
          onClick={onUsePhoto}
          onMouseEnter={(e) => { e.currentTarget.style.background = SAGE_HOV; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = SAGE; }}
          style={{
            width: "100%", maxWidth: 320,
            padding: "12px 16px", borderRadius: 11, border: "none",
            background: SAGE, color: SAGE_ON,
            fontFamily: SANS, fontSize: 14, fontWeight: 500,
            cursor: "pointer", transition: "background 200ms",
            marginBottom: 10,
          }}
        >
          Take a photo instead
        </button>
        <button
          type="button"
          onClick={onAddManual}
          style={{
            width: "100%", maxWidth: 320,
            padding: "12px 16px", borderRadius: 11,
            background: "transparent",
            border: `0.5px solid ${BORDER}`,
            color: TEXT, fontFamily: SANS, fontSize: 14, fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Add manually
        </button>
      </div>
    </FlowModal>
  );
}

// ── Match found ──────────────────────────────────────────────────────────────
function formatUpc(upc: string): string {
  if (upc.length === 12) {
    return `${upc[0]}-${upc.slice(1, 6)}-${upc.slice(6, 11)}-${upc[11]}`;
  }
  if (upc.length === 13) {
    return `${upc[0]}-${upc.slice(1, 7)}-${upc.slice(7, 13)}`;
  }
  return upc;
}

function BarcodeMatchScreen({
  lookup, capturedFrame, onBack, onCancel, onConfirm, onEditDetails,
}: {
  lookup: BarcodeLookup;
  capturedFrame: string | null;
  onBack: () => void;
  onCancel: () => void;
  onConfirm: (lookup: BarcodeLookup) => Promise<void>;
  onEditDetails: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  void capturedFrame;

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(lookup);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
      setSubmitting(false);
    }
  };

  return (
    <FlowModal
      onClose={submitting ? () => undefined : onCancel}
      ariaLabel="Confirm matched product"
    >
      <FlowHeaderWithBack title="Confirm details" onBack={submitting ? () => undefined : onBack} />
      <div style={{ padding: "8px 22px 22px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 14px", marginBottom: 16,
          borderRadius: 12,
          background: SAGE_BG_TINT,
          border: `0.5px solid rgba(var(--nura-sage-rgb), 0.3)`,
        }}>
          <span aria-hidden style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 22, height: 22, borderRadius: "50%",
            background: SAGE_BRIGHT, color: SAGE_ON,
            flexShrink: 0,
          }}>
            <Check size={14} strokeWidth={3} aria-hidden />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: SANS, fontSize: 13, fontWeight: 600, color: TEXT,
              lineHeight: 1.2,
            }}>
              Product found
            </div>
            <div style={{
              fontFamily: SANS, fontSize: 11, color: TEXT_SEC,
              marginTop: 1, lineHeight: 1.3,
            }}>
              Matched in supplement database
            </div>
          </div>
        </div>

        <div style={{
          padding: "16px 16px 14px",
          borderRadius: 14,
          background: "linear-gradient(180deg, rgba(122,154,130,0.1) 0%, transparent 100%)",
          border: `0.5px solid ${BORDER}`,
          marginBottom: 14,
        }}>
          {lookup.brand && (
            <div style={{
              fontFamily: SANS, fontSize: 11, fontWeight: 600,
              letterSpacing: "0.12em", textTransform: "uppercase",
              color: `rgba(var(--nura-fg-rgb), 0.5)`,
              marginBottom: 4,
            }}>
              {lookup.brand}
            </div>
          )}
          <div style={{
            fontFamily: SANS, fontSize: 17, fontWeight: 600, color: TEXT,
            lineHeight: 1.25,
          }}>
            {lookup.name}
          </div>
          {lookup.size && (
            <div style={{
              fontFamily: SANS, fontSize: 13,
              color: `rgba(var(--nura-fg-rgb), 0.7)`,
              marginTop: 4, lineHeight: 1.4,
            }}>
              {lookup.size}
            </div>
          )}
          <div style={{
            height: 1, background: BORDER,
            margin: "12px 0 10px",
          }} />
          <div style={{
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
            fontSize: 11,
            color: `rgba(var(--nura-fg-rgb), 0.4)`,
            letterSpacing: "0.02em",
          }}>
            UPC: {formatUpc(lookup.upc)}
          </div>
        </div>

        <div style={{
          padding: "12px 14px", borderRadius: 12,
          border: `1px dashed ${BORDER}`,
          background: "transparent",
          fontFamily: SANS, fontSize: 12, color: TEXT_SEC, lineHeight: 1.5,
          display: "flex", alignItems: "flex-start", gap: 8,
          marginBottom: 4,
        }}>
          <Calendar size={14} strokeWidth={2} aria-hidden style={{ flexShrink: 0, marginTop: 1, color: TEXT_TER }} />
          <span>Will be added as Unscheduled. Set the schedule later.</span>
        </div>

        {error && (
          <div style={{
            marginTop: 12, padding: "9px 12px", borderRadius: 9,
            background: `rgba(var(--nura-danger-rgb),0.08)`,
            border: `0.5px solid rgba(var(--nura-danger-rgb),0.3)`,
            color: RED, fontFamily: SANS, fontSize: 12,
          }}>{error}</div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.background = SAGE_HOV; }}
          onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.background = SAGE; }}
          style={{
            display: "block", width: "100%", marginTop: 18,
            padding: "13px 16px", borderRadius: 11, border: "none",
            background: submitting ? `rgba(var(--nura-sage-rgb),0.4)` : SAGE,
            color: SAGE_ON, fontFamily: SANS, fontSize: 14, fontWeight: 500,
            cursor: submitting ? "not-allowed" : "pointer",
            transition: "background 200ms",
          }}
        >
          {submitting ? "Adding…" : "Add to my stack"}
        </button>

        <button
          type="button"
          onClick={onEditDetails}
          disabled={submitting}
          style={{
            display: "block", margin: "14px auto 0",
            background: "none", border: "none", padding: 6,
            fontFamily: SANS, fontSize: 13, color: SAGE_TEXT,
            cursor: submitting ? "not-allowed" : "pointer",
            textDecoration: "underline",
          }}
        >
          Edit details before saving
        </button>
      </div>
    </FlowModal>
  );
}

// ── Not found / fallback ─────────────────────────────────────────────────────
function BarcodeNotFoundScreen({
  upc, capturedFrame, onBack, onCancel, onReadLabel, onAddManual,
}: {
  upc: string;
  capturedFrame: string | null;
  onBack: () => void;
  onCancel: () => void;
  onReadLabel: () => void;
  onAddManual: () => void;
}) {
  void capturedFrame;
  return (
    <FlowModal onClose={onCancel} ariaLabel="Product not found">
      <FlowHeaderWithBack title="Not found" onBack={onBack} />
      <div style={{ padding: "8px 22px 24px" }}>
        <div style={{
          padding: "18px 16px 16px",
          borderRadius: 14,
          background: SURFACE,
          border: `0.5px solid ${BORDER}`,
          marginBottom: 18,
        }}>
          <div style={{
            fontFamily: SERIF, fontWeight: 500, color: TEXT,
            fontSize: 20, lineHeight: 1.25, letterSpacing: "-0.2px",
            marginBottom: 6,
          }}>
            Couldn&apos;t find this product.
          </div>
          <p style={{
            fontFamily: SANS, fontSize: 13, color: TEXT_SEC, lineHeight: 1.55,
            margin: "0 0 12px",
          }}>
            We didn&apos;t find this barcode in our supplement database, but we can read the label instead.
          </p>
          <div style={{
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
            fontSize: 11,
            color: `rgba(var(--nura-fg-rgb), 0.45)`,
            letterSpacing: "0.02em",
          }}>
            UPC: {formatUpc(upc)}
          </div>
        </div>

        <button
          type="button"
          onClick={onReadLabel}
          onMouseEnter={(e) => { e.currentTarget.style.background = SAGE_HOV; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = SAGE; }}
          style={{
            display: "block", width: "100%",
            padding: "13px 16px", borderRadius: 11, border: "none",
            background: SAGE, color: SAGE_ON,
            fontFamily: SANS, fontSize: 14, fontWeight: 500,
            cursor: "pointer", transition: "background 200ms",
          }}
        >
          Read the label
        </button>

        <button
          type="button"
          onClick={onAddManual}
          style={{
            display: "block", margin: "14px auto 0",
            background: "none", border: "none", padding: 6,
            fontFamily: SANS, fontSize: 13, color: TEXT_SEC,
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          Add manually
        </button>
      </div>
    </FlowModal>
  );
}
