"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/components/ThemeProvider";
import { FONTS } from "@/lib/theme";
import { ArrowRight } from "lucide-react";

interface UpgradeButtonProps {
  variant?: "compact" | "full";
}

export default function UpgradeButton({ variant = "full" }: UpgradeButtonProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Checkout failed");
      window.location.href = data.url;
    } catch {
      setLoading(false);
    }
  };

  if (variant === "compact") {
    return (
      <button
        onClick={handleUpgrade}
        disabled={loading}
        style={{
          padding: "5px 12px",
          background: `linear-gradient(135deg, ${colors.mint}, ${colors.mintDeep})`,
          border: "none",
          borderRadius: 20,
          fontFamily: FONTS.mono,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "1px",
          color: colors.textOnAccent,
          cursor: loading ? "not-allowed" : "pointer",
          whiteSpace: "nowrap",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "..." : "UPGRADE"}
      </button>
    );
  }

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      style={{
        width: "100%",
        padding: "13px 16px",
        background: loading ? colors.mintBgMedium : `linear-gradient(135deg, ${colors.mint}, ${colors.mintDeep})`,
        border: "none",
        borderRadius: 12,
        fontFamily: FONTS.mono,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "1.5px",
        color: loading ? colors.textFaint : colors.textOnAccent,
        cursor: loading ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        transition: "all 0.2s",
      }}
    >
      {loading ? "REDIRECTING..." : "UPGRADE TO PRO — $9.99/MO"}
      {!loading && <ArrowRight size={14} />}
    </button>
  );
}
