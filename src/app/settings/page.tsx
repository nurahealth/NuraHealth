"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import NuraPageShell from "@/components/NuraPageShell";
import Avatar from "@/components/Avatar";
import { useThemeStore } from "@/lib/themeStore";
import Cropper, { type Area } from "react-easy-crop";

// ── Tokens ────────────────────────────────────────────────────────────────────
const TEXT = "var(--nura-text-primary)";
const TEXT_SEC = "var(--nura-text-secondary)";
const TEXT_TER = "var(--nura-text-tertiary)";
const BORDER = "var(--nura-border)";
const SURFACE = "var(--nura-surface)";
const SAGE = "var(--nura-sage)";
const SAGE_HOV = "var(--nura-sage-hover)";
const SAGE_ON = "var(--nura-bg)";
const SAGE_RGB = "155,176,165";
const RED = "var(--nura-danger)";
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
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileName, setProfileName] = useState<string>("");
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [subStatus, setSubStatus] = useState<SubStatus | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  if (authLoading) {
    return <NuraPageShell maxWidth={680}><div /></NuraPageShell>;
  }

  const displayName = profileName || user?.user_metadata?.name || user?.email?.split("@")[0] || "Friend";
  const displayEmail = user?.email || "";

  // Subscription state
  const status = subStatus?.status ?? null;
  const isTrial = status === "trialing";
  const isActive = status === "active";
  const isPastDue = status === "past_due";
  const isCanceling = !!subStatus?.cancel_at_period_end;
  const isPro = isTrial || isActive;
  const planBadge = isTrial
    ? "NŪRA Pro · Trial"
    : isActive
    ? "NŪRA Pro · Active"
    : "Free";

  const renewLabel = fmtLongDate(subStatus?.current_period_end ?? null);
  let statusLine: string | null = null;
  let statusLineColor = TEXT_SEC;
  if (isPastDue) {
    statusLine = "Payment required";
    statusLineColor = RED;
  } else if (isCanceling && renewLabel) {
    statusLine = `Ends ${renewLabel}`;
  } else if (isTrial && renewLabel) {
    statusLine = `Trial ends ${renewLabel}`;
  } else if (isActive && renewLabel) {
    statusLine = `Renews ${renewLabel}`;
  }

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
          <Avatar user={user} size={56} />
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
          onClick={() => setEditOpen(true)}
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

      {/* SECURITY CARD */}
      <Card>
        <CardLabel>Security</CardLabel>
        <div style={{ fontFamily: SANS, fontSize: 15, fontWeight: 500, color: TEXT, marginBottom: 4 }}>
          Password &amp; security
        </div>
        <div style={{ fontFamily: SANS, fontSize: 13, color: TEXT_SEC, lineHeight: 1.5, marginBottom: 14 }}>
          Update your password and account security
        </div>
        <button
          onClick={() => setSecurityOpen(true)}
          style={{
            background: "none", border: "none", padding: 0, cursor: "pointer",
            fontFamily: SANS, fontSize: 13, fontWeight: 500, color: SAGE,
            display: "inline-flex", alignItems: "center", gap: 4,
          }}
        >
          Manage password
          <ArrowRight />
        </button>
      </Card>

      {editOpen && user && (
        <EditProfileModal
          user={user}
          onUserChange={setUser}
          initialName={displayName}
          initialEmail={displayEmail}
          onClose={() => setEditOpen(false)}
          onNameSaved={(name) => setProfileName(name)}
        />
      )}

      {securityOpen && user && (
        <SecurityModal user={user} onClose={() => setSecurityOpen(false)} />
      )}

      {/* PAST DUE BANNER */}
      {isPastDue && (
        <div style={{
          background: "rgba(212,87,77,0.08)",
          border: `0.5px solid rgba(212,87,77,0.4)`,
          borderRadius: 14, padding: 14, marginBottom: 14,
          display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
        }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 500, color: TEXT, marginBottom: 2 }}>
              Your last payment failed
            </div>
            <div style={{ fontFamily: SANS, fontSize: 12, color: TEXT_SEC, lineHeight: 1.5 }}>
              Update your payment method to keep your subscription active.
            </div>
          </div>
          <Link
            href="/billing"
            style={{
              padding: "8px 14px", borderRadius: 10, background: SAGE,
              color: SAGE_ON, fontFamily: SANS, fontSize: 12, fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Update payment method
          </Link>
        </div>
      )}

      {/* SUBSCRIPTION CARD */}
      <Card>
        <CardLabel>Subscription</CardLabel>
        <div style={{
          fontFamily: SANS, fontSize: 15, fontWeight: 500, color: TEXT,
          marginBottom: statusLine || !isPro ? 6 : 14,
        }}>
          {planBadge}
        </div>

        {statusLine && (
          <div style={{
            fontFamily: SANS, fontSize: 13, color: statusLineColor,
            marginBottom: 14, lineHeight: 1.5,
          }}>
            {statusLine}
          </div>
        )}

        {!isPro && (
          <div style={{ fontFamily: SANS, fontSize: 13, color: TEXT_SEC, lineHeight: 1.6, margin: "0 0 14px" }}>
            Unlock unlimited NŪRA conversations, bloodwork analysis, and the full knowledge base — $9.99/month.
          </div>
        )}

        {isPro ? (
          <Link
            href="/billing"
            style={{
              background: "none", border: "none", padding: 0,
              fontFamily: SANS, fontSize: 13, fontWeight: 500, color: SAGE,
              display: "inline-flex", alignItems: "center", gap: 4,
              textDecoration: "none",
            }}
          >
            Manage billing
            <ArrowRight />
          </Link>
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
        <div style={{ marginBottom: 8, fontFamily: SANS, fontSize: 13, color: TEXT_SEC }}>
          Theme
        </div>
        <ThemeSegmented value={theme} onChange={setTheme} />
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
          onClick={() => router.push("/onboarding?edit=true")}
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
        background: disabled ? `rgba(var(--nura-sage-rgb),0.4)` : SAGE,
        color: SAGE_ON, fontFamily: SANS, fontSize: 13, fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer", transition: "background 200ms",
      }}
    >
      {label}
    </button>
  );
}

function ThemeSegmented({ value, onChange }: { value: "dark" | "light"; onChange: (t: "dark" | "light") => void }) {
  const options: { id: "dark" | "light"; label: string }[] = [
    { id: "dark", label: "Dark" },
    { id: "light", label: "Light" },
  ];
  const idx = Math.max(0, options.findIndex((o) => o.id === value));
  const pct = (idx / options.length) * 100;
  const w = 100 / options.length;
  return (
    <div style={{
      position: "relative", display: "flex",
      background: SURFACE, border: `1px solid ${BORDER}`,
      borderRadius: 12, overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 3, bottom: 3,
        width: `calc(${w}% - 6px)`,
        left: `calc(${pct}% + 3px)`,
        background: SAGE, borderRadius: 9,
        transition: "left 200ms cubic-bezier(0.4,0,0.2,1)",
        pointerEvents: "none",
      }} />
      {options.map((opt) => (
        <button key={opt.id}
          onClick={() => onChange(opt.id)}
          aria-pressed={value === opt.id}
          style={{
            flex: 1, padding: "11px 4px", background: "none", border: "none",
            color: value === opt.id ? SAGE_ON : TEXT_SEC,
            fontSize: 13, fontFamily: SANS, fontWeight: 500, cursor: "pointer",
            position: "relative", zIndex: 1,
            transition: "color 200ms cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
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

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const AVATAR_OUTPUT_SIZE = 400;
const AVATAR_JPEG_QUALITY = 0.9;

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (err) => reject(err));
    image.src = url;
  });
}

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_OUTPUT_SIZE;
  canvas.height = AVATAR_OUTPUT_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");
  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, AVATAR_OUTPUT_SIZE, AVATAR_OUTPUT_SIZE,
  );
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) { reject(new Error("Could not generate image")); return; }
      resolve(blob);
    }, "image/jpeg", AVATAR_JPEG_QUALITY);
  });
}

function EditProfileModal({
  user, onUserChange, initialName, initialEmail, onClose, onNameSaved,
}: {
  user: User; onUserChange: (u: User) => void;
  initialName: string; initialEmail: string;
  onClose: () => void; onNameSaved: (name: string) => void;
}) {
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hoverAvatar, setHoverAvatar] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [photoSuccess, setPhotoSuccess] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  // Crop mode state
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const inCropMode = imageSrc !== null;

  const avatarUrl = ((user.user_metadata ?? {}) as { avatar_url?: string | null }).avatar_url || null;

  const handleSave = async () => {
    if (saving) return;
    setSaving(true); setError("");
    const { data, error: updateError } = await supabase.auth.updateUser({ data: { full_name: name } });
    if (updateError) {
      setError(updateError.message || "Could not save. Try again.");
      setSaving(false);
      return;
    }
    if (data.user) onUserChange(data.user);
    onNameSaved(name);
    setSuccess(true);
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  const handleFileClick = () => {
    if (uploading) return;
    setPhotoError("");
    console.log("[Avatar] Avatar clicked, photoError cleared");
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError(""); setPhotoSuccess(false);
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) {
      console.log("[Avatar] File change fired but no file present");
      return;
    }
    console.log("[Avatar] File selected:", file.name, file.type, file.size);

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      console.log("[Avatar] Rejected: unsupported type", file.type);
      setPhotoError("Image must be JPG, PNG, or WebP");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      console.log("[Avatar] Rejected: too large", file.size);
      setPhotoError("Image is too large. Maximum 20MB.");
      return;
    }
    console.log("[Avatar] Validation passed for:", file.type);

    // Read file as data URL and enter crop mode
    const reader = new FileReader();
    reader.onload = () => {
      const src = typeof reader.result === "string" ? reader.result : null;
      if (!src) {
        setPhotoError("Could not read image. Try again.");
        return;
      }
      console.log("[Avatar] Entering crop mode");
      setImageSrc(src);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    };
    reader.onerror = () => {
      setPhotoError("Could not read image. Try again.");
    };
    reader.readAsDataURL(file);
  };

  const handleCancelCrop = () => {
    if (uploading) return;
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setPhotoError("");
  };

  const handleSavePhoto = async () => {
    if (!imageSrc || !croppedAreaPixels || uploading) return;
    setUploading(true); setPhotoError("");

    let blob: Blob;
    try {
      blob = await getCroppedImg(imageSrc, croppedAreaPixels);
    } catch {
      setPhotoError("Could not process image. Try again.");
      setUploading(false);
      return;
    }

    const path = `${user.id}/avatar.jpg`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, blob, { upsert: true, contentType: "image/jpeg" });

    if (uploadError) {
      setPhotoError(uploadError.message || "Could not upload. Try again.");
      setUploading(false);
      return;
    }

    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const cacheBustedUrl = `${pub.publicUrl}?t=${Date.now()}`;

    const { data: updated, error: metaError } = await supabase.auth.updateUser({
      data: { ...user.user_metadata, avatar_url: cacheBustedUrl },
    });

    if (metaError) {
      setPhotoError(metaError.message || "Could not save photo. Try again.");
      setUploading(false);
      return;
    }

    if (updated.user) onUserChange(updated.user);
    setUploading(false);
    setPhotoSuccess(true);
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setTimeout(() => setPhotoSuccess(false), 2000);
  };

  const handleRemovePhoto = async () => {
    if (!avatarUrl) return;
    setRemoving(true); setPhotoError(""); setPhotoSuccess(false);

    const tryDelete = async (ext: string) =>
      supabase.storage.from("avatars").remove([`${user.id}/avatar.${ext}`]);
    await Promise.all([tryDelete("jpg"), tryDelete("png"), tryDelete("webp")]);

    const { data: updated, error: metaError } = await supabase.auth.updateUser({
      data: { ...user.user_metadata, avatar_url: null },
    });

    if (metaError) {
      setPhotoError(metaError.message || "Could not remove photo. Try again.");
      setRemoving(false);
      setShowRemoveConfirm(false);
      return;
    }

    if (updated.user) onUserChange(updated.user);
    setRemoving(false);
    setShowRemoveConfirm(false);
  };

  useEffect(() => {
    setPhotoError("");
    setPhotoSuccess(false);
    console.log("[Avatar] Modal opened, photoError cleared");
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (inCropMode) {
        if (!uploading) handleCancelCrop();
      } else {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose, inCropMode, uploading]);

  const overlayVisible = hoverAvatar || uploading;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20, animation: "nura-fade-in 200ms ease",
      }}
    >
      <style>{`@keyframes nura-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes nura-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 460,
          background: "var(--nura-bg)",
          border: `0.5px solid ${BORDER}`,
          borderRadius: 16, padding: 28, position: "relative",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute", top: 14, right: 14,
            width: 32, height: 32, borderRadius: 9,
            background: SURFACE, border: `0.5px solid ${BORDER}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: TEXT_SEC, padding: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>

        <div style={{
          fontFamily: SANS, fontSize: 22, fontWeight: 500, color: TEXT,
          marginBottom: 20, lineHeight: 1.2,
        }}>
          {inCropMode ? "Crop your photo" : "Edit profile"}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />

        {inCropMode && imageSrc && (
          <div>
            <div style={{
              position: "relative", width: "100%", height: 320,
              background: "var(--nura-bg)", border: `0.5px solid ${BORDER}`,
              borderRadius: 12, overflow: "hidden", marginBottom: 16,
            }}>
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
                style={{
                  cropAreaStyle: {
                    border: `2px solid ${SAGE}`,
                    color: "rgba(0,0,0,0.55)",
                  },
                }}
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <div style={{
                fontFamily: SANS, fontSize: 10, fontWeight: 600,
                letterSpacing: "1.5px", textTransform: "uppercase",
                color: TEXT_TER, marginBottom: 8,
              }}>
                Zoom
              </div>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                disabled={uploading}
                aria-label="Zoom"
                style={{
                  width: "100%",
                  accentColor: SAGE,
                  cursor: uploading ? "not-allowed" : "pointer",
                }}
              />
            </div>

            {photoError && (
              <div style={{
                padding: "9px 12px", borderRadius: 9, marginBottom: 14,
                background: "rgba(212,87,77,0.08)", border: `0.5px solid rgba(212,87,77,0.3)`,
                color: RED, fontFamily: SANS, fontSize: 12,
              }}>{photoError}</div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleCancelCrop}
                disabled={uploading}
                style={{
                  flex: 1, padding: "11px 16px", borderRadius: 11,
                  background: "transparent", border: `0.5px solid ${BORDER}`,
                  color: TEXT_SEC, fontFamily: SANS, fontSize: 13, fontWeight: 500,
                  cursor: uploading ? "not-allowed" : "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSavePhoto}
                disabled={uploading || !croppedAreaPixels}
                onMouseEnter={(e) => { if (!uploading && croppedAreaPixels) e.currentTarget.style.background = SAGE_HOV; }}
                onMouseLeave={(e) => { if (!uploading && croppedAreaPixels) e.currentTarget.style.background = SAGE; }}
                style={{
                  flex: 1, padding: "11px 16px", borderRadius: 11, border: "none",
                  background: (uploading || !croppedAreaPixels) ? `rgba(var(--nura-sage-rgb),0.4)` : SAGE,
                  color: SAGE_ON, fontFamily: SANS, fontSize: 13, fontWeight: 500,
                  cursor: (uploading || !croppedAreaPixels) ? "not-allowed" : "pointer",
                  transition: "background 200ms",
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                {uploading && (
                  <span style={{
                    width: 14, height: 14, borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.4)", borderTopColor: SAGE_ON,
                    animation: "nura-spin 0.8s linear infinite",
                    display: "inline-block",
                  }} />
                )}
                {uploading ? "Saving…" : "Save photo"}
              </button>
            </div>
          </div>
        )}

        {!inCropMode && (
        <>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 22 }}>
          <button
            type="button"
            onClick={handleFileClick}
            onMouseEnter={() => setHoverAvatar(true)}
            onMouseLeave={() => setHoverAvatar(false)}
            disabled={uploading}
            aria-label="Upload photo"
            style={{
              position: "relative", width: 80, height: 80, borderRadius: "50%",
              padding: 0, border: "none", background: "transparent",
              cursor: uploading ? "wait" : "pointer", overflow: "hidden",
            }}
          >
            <Avatar user={user} size={80} />
            <div style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              background: "rgba(0,0,0,0.4)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 4, color: "#fff",
              opacity: overlayVisible ? 1 : 0,
              transition: "opacity 180ms ease",
              pointerEvents: "none",
            }}>
              {uploading ? (
                <div style={{
                  width: 22, height: 22, borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,0.35)", borderTopColor: "#fff",
                  animation: "nura-spin 0.8s linear infinite",
                }} />
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l2-3h4l2 3h3a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 500, letterSpacing: "0.3px" }}>
                    Upload photo
                  </span>
                </>
              )}
            </div>
          </button>

          {avatarUrl && !showRemoveConfirm && (
            <button
              type="button"
              onClick={() => setShowRemoveConfirm(true)}
              disabled={uploading || removing}
              style={{
                marginTop: 10, background: "none", border: "none", padding: 0,
                cursor: (uploading || removing) ? "not-allowed" : "pointer",
                fontFamily: SANS, fontSize: 12, color: TEXT_TER,
              }}
            >
              Remove photo
            </button>
          )}

          {avatarUrl && showRemoveConfirm && (
            <div style={{ marginTop: 10, textAlign: "center" }}>
              <div style={{ fontFamily: SANS, fontSize: 12, color: TEXT_SEC, marginBottom: 8 }}>
                Remove your profile photo?
              </div>
              <div style={{ display: "inline-flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  disabled={removing}
                  style={{
                    padding: "6px 12px", borderRadius: 8,
                    background: "rgba(212,87,77,0.12)", border: `0.5px solid rgba(212,87,77,0.4)`,
                    color: RED, fontFamily: SANS, fontSize: 12, fontWeight: 500,
                    cursor: removing ? "not-allowed" : "pointer",
                  }}
                >
                  {removing ? "Removing…" : "Remove"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRemoveConfirm(false)}
                  disabled={removing}
                  style={{
                    padding: "6px 12px", borderRadius: 8,
                    background: "transparent", border: `0.5px solid ${BORDER}`,
                    color: TEXT_SEC, fontFamily: SANS, fontSize: 12, fontWeight: 500,
                    cursor: removing ? "not-allowed" : "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {photoError && (
            <div style={{
              marginTop: 10, fontFamily: SANS, fontSize: 12, color: RED, textAlign: "center",
            }}>
              {photoError}
            </div>
          )}

          {photoSuccess && (
            <div style={{
              marginTop: 10, fontFamily: SANS, fontSize: 12, color: SAGE, textAlign: "center",
            }}>
              Photo updated
            </div>
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{
            display: "block", fontFamily: SANS, fontSize: 10, fontWeight: 600,
            letterSpacing: "1.5px", textTransform: "uppercase", color: TEXT_TER, marginBottom: 6,
          }}>
            Full name
          </label>
          <input
            type="text" value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving || success}
            style={{
              width: "100%", padding: "11px 13px", borderRadius: 10,
              background: SURFACE, border: `0.5px solid ${BORDER}`,
              color: TEXT, fontFamily: SANS, fontSize: 14, outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{
            display: "block", fontFamily: SANS, fontSize: 10, fontWeight: 600,
            letterSpacing: "1.5px", textTransform: "uppercase", color: TEXT_TER, marginBottom: 6,
          }}>
            Email
          </label>
          <input
            type="email" value={initialEmail}
            disabled readOnly
            style={{
              width: "100%", padding: "11px 13px", borderRadius: 10,
              background: SURFACE, border: `0.5px solid ${BORDER}`,
              color: TEXT_TER, fontFamily: SANS, fontSize: 14, outline: "none",
              boxSizing: "border-box", cursor: "not-allowed",
            }}
          />
          <div style={{ fontFamily: SANS, fontSize: 11, color: TEXT_TER, marginTop: 6 }}>
            Contact support to change email
          </div>
        </div>

        {error && (
          <div style={{
            padding: "9px 12px", borderRadius: 9, marginBottom: 14,
            background: "rgba(212,87,77,0.08)", border: `0.5px solid rgba(212,87,77,0.3)`,
            color: RED, fontFamily: SANS, fontSize: 12,
          }}>{error}</div>
        )}

        {success && (
          <div style={{
            padding: "9px 12px", borderRadius: 9, marginBottom: 14,
            background: `rgba(var(--nura-sage-rgb),0.12)`,
            border: `0.5px solid rgba(var(--nura-sage-rgb),0.35)`,
            color: SAGE, fontFamily: SANS, fontSize: 12,
          }}>Profile updated</div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={handleSave}
            disabled={saving || success || !name.trim()}
            onMouseEnter={(e) => { if (!saving && !success && name.trim()) e.currentTarget.style.background = SAGE_HOV; }}
            onMouseLeave={(e) => { if (!saving && !success && name.trim()) e.currentTarget.style.background = SAGE; }}
            style={{
              flex: 1, padding: "11px 16px", borderRadius: 11, border: "none",
              background: (saving || success || !name.trim()) ? `rgba(var(--nura-sage-rgb),0.4)` : SAGE,
              color: SAGE_ON, fontFamily: SANS, fontSize: 13, fontWeight: 500,
              cursor: (saving || success || !name.trim()) ? "not-allowed" : "pointer",
              transition: "background 200ms",
            }}
          >
            {saving ? "Saving…" : success ? "Saved" : "Save"}
          </button>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              flex: 1, padding: "11px 16px", borderRadius: 11,
              background: "transparent", border: `0.5px solid ${BORDER}`,
              color: TEXT_SEC, fontFamily: SANS, fontSize: 13, fontWeight: 500,
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            Cancel
          </button>
        </div>
        </>
        )}
      </div>
    </div>
  );
}

function SecurityModal({ user, onClose }: { user: User; onClose: () => void }) {
  const provider = (() => {
    const appMeta = user.app_metadata as { provider?: string; providers?: string[] } | undefined;
    if (appMeta?.provider) return appMeta.provider;
    const id = user.identities?.[0] as { provider?: string } | undefined;
    return id?.provider ?? "email";
  })();
  const isEmailUser = provider === "email";

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ current?: string; next?: string; confirm?: string; generic?: string }>({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSubmit = async () => {
    if (saving || success) return;
    const errs: typeof errors = {};
    if (!current) errs.current = "Required";
    if (!next) errs.next = "Required";
    if (!confirm) errs.confirm = "Required";
    if (next && next.length < 8) errs.next = "Minimum 8 characters";
    if (next && confirm && next !== confirm) errs.confirm = "Passwords don't match";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});

    setSaving(true);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user.email ?? "",
      password: current,
    });
    if (authError) {
      setErrors({ current: "Current password is incorrect" });
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: next });
    if (updateError) {
      setErrors({ generic: "Could not update password. Please try again." });
      setSaving(false);
      return;
    }

    setSaving(false);
    setSuccess(true);
    setCurrent(""); setNext(""); setConfirm("");
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontFamily: SANS, fontSize: 10, fontWeight: 600,
    letterSpacing: "1.5px", textTransform: "uppercase", color: TEXT_TER, marginBottom: 6,
  };
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "11px 13px", borderRadius: 10,
    background: SURFACE, border: `0.5px solid ${BORDER}`,
    color: TEXT, fontFamily: SANS, fontSize: 14, outline: "none",
    boxSizing: "border-box",
  };
  const errStyle: React.CSSProperties = {
    fontFamily: SANS, fontSize: 12, color: RED, marginTop: 6,
  };
  const helpStyle: React.CSSProperties = {
    fontFamily: SANS, fontSize: 12, color: TEXT_TER, marginTop: 6,
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20, animation: "nura-fade-in 200ms ease",
      }}
    >
      <style>{`@keyframes nura-fade-in { from { opacity: 0; } to { opacity: 1; } }`}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 460,
          background: "var(--nura-bg)",
          border: `0.5px solid ${BORDER}`,
          borderRadius: 16, padding: 28, position: "relative",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute", top: 14, right: 14,
            width: 32, height: 32, borderRadius: 9,
            background: SURFACE, border: `0.5px solid ${BORDER}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: TEXT_SEC, padding: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>

        <div style={{
          fontFamily: SANS, fontSize: 22, fontWeight: 500, color: TEXT,
          marginBottom: 20, lineHeight: 1.2,
        }}>
          Security
        </div>

        {!isEmailUser ? (
          <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 14, color: SAGE }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div style={{ fontFamily: SANS, fontSize: 16, fontWeight: 500, color: TEXT, marginBottom: 8 }}>
              Password managed by {provider.charAt(0).toUpperCase() + provider.slice(1)}
            </div>
            <p style={{
              fontFamily: SANS, fontSize: 13, color: TEXT_SEC, lineHeight: 1.6,
              margin: "0 auto 20px", maxWidth: 340,
            }}>
              You signed in with {provider.charAt(0).toUpperCase() + provider.slice(1)}. To change your password, manage it in your {provider.charAt(0).toUpperCase() + provider.slice(1)} account.
            </p>
            <a
              href="https://myaccount.google.com/security"
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={(e) => { e.currentTarget.style.background = SAGE_HOV; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = SAGE; }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "11px 18px", borderRadius: 11,
                background: SAGE, color: SAGE_ON,
                fontFamily: SANS, fontSize: 13, fontWeight: 500,
                textDecoration: "none", transition: "background 200ms",
                marginBottom: 18,
              }}
            >
              Open Google Account Security
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6"/>
              </svg>
            </a>
            <div>
              <button
                onClick={onClose}
                style={{
                  width: "100%", padding: "11px 16px", borderRadius: 11,
                  background: "transparent", border: `0.5px solid ${BORDER}`,
                  color: TEXT_SEC, fontFamily: SANS, fontSize: 13, fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Current password</label>
              <input
                type="password" value={current}
                onChange={(e) => setCurrent(e.target.value)}
                disabled={saving || success}
                autoComplete="current-password"
                style={inputStyle}
              />
              {errors.current && <div style={errStyle}>{errors.current}</div>}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>New password</label>
              <input
                type="password" value={next}
                onChange={(e) => setNext(e.target.value)}
                disabled={saving || success}
                autoComplete="new-password"
                style={inputStyle}
              />
              {errors.next ? <div style={errStyle}>{errors.next}</div> : <div style={helpStyle}>Minimum 8 characters</div>}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Confirm new password</label>
              <input
                type="password" value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                disabled={saving || success}
                autoComplete="new-password"
                style={inputStyle}
              />
              {errors.confirm && <div style={errStyle}>{errors.confirm}</div>}
            </div>

            {errors.generic && (
              <div style={{
                padding: "9px 12px", borderRadius: 9, marginBottom: 14,
                background: "rgba(212,87,77,0.08)", border: `0.5px solid rgba(212,87,77,0.3)`,
                color: RED, fontFamily: SANS, fontSize: 12,
              }}>{errors.generic}</div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleSubmit}
                disabled={saving || success}
                onMouseEnter={(e) => { if (!saving && !success) e.currentTarget.style.background = SAGE_HOV; }}
                onMouseLeave={(e) => { if (!saving && !success) e.currentTarget.style.background = SAGE; }}
                style={{
                  flex: 1, padding: "11px 16px", borderRadius: 11, border: "none",
                  background: (saving || success) ? `rgba(var(--nura-sage-rgb),0.4)` : SAGE,
                  color: SAGE_ON, fontFamily: SANS, fontSize: 13, fontWeight: 500,
                  cursor: (saving || success) ? "not-allowed" : "pointer",
                  transition: "background 200ms",
                }}
              >
                {saving ? "Updating…" : success ? "Updated" : "Update password"}
              </button>
              <button
                onClick={onClose}
                disabled={saving}
                style={{
                  flex: 1, padding: "11px 16px", borderRadius: 11,
                  background: "transparent", border: `0.5px solid ${BORDER}`,
                  color: TEXT_SEC, fontFamily: SANS, fontSize: 13, fontWeight: 500,
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                Cancel
              </button>
            </div>

            {success && (
              <div style={{
                marginTop: 12, fontFamily: SANS, fontSize: 12, color: SAGE, textAlign: "center",
              }}>
                Password updated
              </div>
            )}
          </>
        )}
      </div>
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
