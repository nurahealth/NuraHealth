"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import NuraPageShell from "@/components/NuraPageShell";
import { useDarkMode } from "@/lib/sidebarStore";

// ── Tokens ────────────────────────────────────────────────────────────────────
const TEXT = "#f0ebde";
const TEXT_SEC = "rgba(235,230,216,0.55)";
const TEXT_TER = "rgba(235,230,216,0.4)";
const BORDER = "rgba(235,230,216,0.09)";
const SURFACE = "rgba(235,230,216,0.04)";
const SAGE = "#9bb0a5";
const SAGE_HOV = "#abc0b5";
const SAGE_ON = "#0d0d0e";
const SAGE_RGB = "155,176,165";
const RED = "#d4574d";
const SANS = "'Inter', system-ui, sans-serif";
const SERIF = "'DM Serif Display', Georgia, serif";

// ── Types ─────────────────────────────────────────────────────────────────────
interface SubStatus {
  isPro: boolean;
  status: string | null;
  plan: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

interface OnboardingData {
  name?: string;
  goals?: string[];
  symptom_chips?: string[];
  symptoms_text?: string;
  diet?: string;
  exercise?: string;
  sleep?: string;
  stress?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtLongDate = (iso: string | null) => {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  } catch { return null; }
};

// Goal id → human label (mirrors onboarding catalog)
const GOAL_LABELS: Record<string, string> = {
  energy: "Energy & fatigue",
  sleep: "Sleep quality",
  stress: "Stress & anxiety",
  hormones: "Hormone balance",
  gut: "Gut health",
  detox: "Detox & cleanse",
  immune: "Immune support",
  mental: "Mental clarity",
  skin: "Skin & hair",
  perform: "Performance",
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const router = useRouter();
  const darkOn = useDarkMode((s) => s.enabled);
  const toggleDark = useDarkMode((s) => s.toggle);

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileName, setProfileName] = useState<string>("");
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [subStatus, setSubStatus] = useState<SubStatus | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push("/auth"); return; }
      setUser(user);
      setAuthLoading(false);

      // Profile name + onboarding data
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, onboarding_data")
        .eq("id", user.id)
        .maybeSingle();
      const fn = (profile?.full_name as string | null | undefined) ?? "";
      if (fn) setProfileName(fn);
      const od = (profile?.onboarding_data ?? null) as OnboardingData | null;
      setOnboardingData(od);

      // Subscription status
      fetch(`/api/subscription/status?userId=${user.id}`)
        .then((r) => r.json())
        .then((d: SubStatus) => setSubStatus(d))
        .catch(() => {});
    });
  }, [router]);

  const handlePortal = async () => {
    if (!user) return;
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = (await res.json()) as { url?: string };
      if (data.url) window.location.href = data.url;
    } catch {
      // silent
    } finally {
      setPortalLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  if (authLoading) {
    return <NuraPageShell maxWidth={680}><div /></NuraPageShell>;
  }

  const displayName = profileName || user?.user_metadata?.name || user?.email?.split("@")[0] || "Friend";
  const displayEmail = user?.email || "";
  const initial = displayName.trim().charAt(0).toUpperCase();

  // Subscription badge
  const status = subStatus?.status ?? null;
  const isTrial = status === "trialing";
  const isActive = status === "active";
  const isPro = isTrial || isActive;
  const planBadge = isTrial ? "PRO · TRIAL" : isActive ? "PRO" : "FREE";

  const renewLabel = fmtLongDate(subStatus?.current_period_end ?? null);
  const renewPrefix = isTrial ? "Trial ends" : isActive ? "Renews on" : null;

  return (
    <NuraPageShell maxWidth={680}>
      {/* HERO */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontFamily: SERIF, fontWeight: 500, color: TEXT,
          margin: "0 0 6px", lineHeight: 1.15, letterSpacing: "-0.5px",
          fontSize: "clamp(32px, 5vw, 44px)",
        }}>
          Settings
        </h1>
        <p style={{ fontFamily: SANS, fontSize: 13, color: TEXT_SEC, margin: 0 }}>
          Manage your account.
        </p>
      </div>

      {/* PROFILE CARD */}
      <Card>
        <CardLabel>Profile</CardLabel>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%", flexShrink: 0,
            background: `rgba(${SAGE_RGB},0.18)`, border: `0.5px solid rgba(${SAGE_RGB},0.4)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: SANS, fontSize: 18, fontWeight: 500, color: SAGE,
          }}>
            {initial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: SANS, fontSize: 15, fontWeight: 500, color: TEXT, marginBottom: 2 }}>
              {displayName}
            </div>
            <div style={{ fontFamily: SANS, fontSize: 12, color: TEXT_SEC, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {displayEmail}
            </div>
          </div>
        </div>
        <button
          onClick={() => router.push("/onboarding")}
          style={{
            background: "none", border: "none", padding: 0, cursor: "pointer",
            fontFamily: SANS, fontSize: 13, fontWeight: 500, color: SAGE,
            display: "inline-flex", alignItems: "center", gap: 4,
          }}
        >
          Edit profile
          <ArrowRight />
        </button>
      </Card>

      {/* SUBSCRIPTION CARD */}
      <Card>
        <CardLabel>Subscription</CardLabel>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{
            padding: "3px 9px", borderRadius: 5,
            background: isPro ? `rgba(${SAGE_RGB},0.16)` : "rgba(235,230,216,0.06)",
            border: `0.5px solid ${isPro ? `rgba(${SAGE_RGB},0.4)` : BORDER}`,
            fontFamily: SANS, fontSize: 10, fontWeight: 700, letterSpacing: "0.8px",
            color: isPro ? SAGE : TEXT_TER, textTransform: "uppercase",
          }}>
            {planBadge}
          </span>
        </div>

        {isPro && renewLabel && renewPrefix && (
          <div style={{
            fontFamily: SANS, fontSize: 13, color: TEXT_SEC,
            marginBottom: subStatus?.cancel_at_period_end ? 6 : 16, lineHeight: 1.5,
          }}>
            {renewPrefix} {renewLabel}
          </div>
        )}
        {subStatus?.cancel_at_period_end && (
          <div style={{ fontFamily: SANS, fontSize: 13, color: "#d4a574", marginBottom: 16, lineHeight: 1.5 }}>
            Cancels at end of billing period
          </div>
        )}
        {!isPro && (
          <div style={{ fontFamily: SANS, fontSize: 13, color: TEXT_SEC, lineHeight: 1.6, margin: "0 0 16px" }}>
            Unlock unlimited NŪRA conversations, bloodwork analysis, and the full knowledge base — $9.99/month.
          </div>
        )}

        {isPro ? (
          <SageButton
            label={portalLoading ? "Loading…" : "Manage subscription"}
            onClick={handlePortal}
            disabled={portalLoading}
          />
        ) : (
          <SageButton
            label="Upgrade to Pro"
            onClick={() => router.push("/upgrade")}
          />
        )}
      </Card>

      {/* APPEARANCE CARD */}
      <Card>
        <CardLabel>Appearance</CardLabel>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <span style={{ color: TEXT_SEC, display: "flex", lineHeight: 0 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>
              </svg>
            </span>
            <span style={{ fontFamily: SANS, fontSize: 14, color: TEXT }}>Dark mode</span>
          </div>
          <Toggle on={darkOn} onClick={toggleDark} />
        </div>
      </Card>

      {/* PROFILE DATA CARD */}
      <Card>
        <CardLabel>Profile data</CardLabel>
        {onboardingData && hasAnyOnboarding(onboardingData) ? (
          <ProfileDataDisplay data={onboardingData} />
        ) : (
          <div style={{ fontFamily: SANS, fontSize: 13, color: TEXT_SEC, margin: "0 0 14px" }}>
            Not yet completed.
          </div>
        )}
        <button
          onClick={() => router.push("/onboarding")}
          style={{
            background: "none", border: "none", padding: 0, cursor: "pointer",
            fontFamily: SANS, fontSize: 13, fontWeight: 500, color: SAGE,
            display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4,
          }}
        >
          Update onboarding
          <ArrowRight />
        </button>
      </Card>

      {/* ACCOUNT CARD */}
      <Card>
        <CardLabel>Account</CardLabel>
        <button
          onClick={handleLogout}
          style={{
            padding: "10px 16px", borderRadius: 9,
            background: "transparent", border: `0.5px solid ${RED}`,
            color: RED, fontFamily: SANS, fontSize: 13, fontWeight: 500, cursor: "pointer",
            transition: "background 160ms",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(212,87,77,0.08)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          Sign out
        </button>
      </Card>
    </NuraPageShell>
  );
}

// ── Components ────────────────────────────────────────────────────────────────
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 14,
      padding: 20, marginBottom: 14,
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

function ArrowRight() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6"/>
    </svg>
  );
}

function SageButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = SAGE_HOV; }}
      onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.background = SAGE; }}
      style={{
        padding: "10px 18px", borderRadius: 11, border: "none",
        background: disabled ? `rgba(${SAGE_RGB},0.4)` : SAGE,
        color: SAGE_ON, fontFamily: SANS, fontSize: 13, fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer", transition: "background 200ms",
      }}
    >
      {label}
    </button>
  );
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      style={{
        width: 36, height: 20, borderRadius: 10, padding: 0, border: "none",
        background: on ? SAGE : "rgba(235,230,216,0.12)",
        position: "relative", flexShrink: 0, cursor: "pointer",
        transition: "background 200ms",
      }}
    >
      <span style={{
        position: "absolute", top: 2, left: on ? 18 : 2,
        width: 16, height: 16, borderRadius: "50%", background: "#fff",
        transition: "left 200ms cubic-bezier(0.4,0,0.2,1)",
      }} />
    </button>
  );
}

function hasAnyOnboarding(d: OnboardingData): boolean {
  return !!(
    (d.goals && d.goals.length) ||
    (d.symptom_chips && d.symptom_chips.length) ||
    d.symptoms_text ||
    d.diet || d.exercise || d.sleep || d.stress
  );
}

function ProfileDataDisplay({ data }: { data: OnboardingData }) {
  const goals = (data.goals ?? []).map((g) => GOAL_LABELS[g] ?? g).filter(Boolean);
  const symptoms = (data.symptom_chips ?? []).filter(Boolean);
  const lifestyle: { label: string; value: string }[] = [];
  if (data.diet) lifestyle.push({ label: "Diet", value: data.diet });
  if (data.exercise) lifestyle.push({ label: "Exercise", value: data.exercise });
  if (data.sleep) lifestyle.push({ label: "Sleep", value: data.sleep });
  if (data.stress) lifestyle.push({ label: "Stress", value: data.stress });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
      {goals.length > 0 && (
        <Row label="Goals" value={goals.join(", ")} />
      )}
      {symptoms.length > 0 && (
        <Row label="Symptoms" value={symptoms.join(", ")} />
      )}
      {data.symptoms_text && (
        <Row label="Notes" value={data.symptoms_text} />
      )}
      {lifestyle.length > 0 && (
        <Row label="Lifestyle" value={lifestyle.map((l) => `${l.label}: ${l.value}`).join(" · ")} />
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{
        fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "1.5px",
        color: TEXT_TER, textTransform: "uppercase", marginBottom: 4,
      }}>
        {label}
      </div>
      <div style={{ fontFamily: SANS, fontSize: 13, color: TEXT, lineHeight: 1.5 }}>
        {value}
      </div>
    </div>
  );
}
