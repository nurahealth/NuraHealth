"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { FONTS } from "@/lib/theme";
import { ArrowRight } from "lucide-react";

interface UpgradeButtonProps {
  variant?: "compact" | "full";
}

export default function UpgradeButton({ variant = "full" }: UpgradeButtonProps) {
  const router = useRouter();
  const { colors } = useTheme();

  const handleUpgrade = () => router.push("/upgrade/checkout");

  if (variant === "compact") {
    return (
      <button
        onClick={handleUpgrade}
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
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        UPGRADE
      </button>
    );
  }

  return (
    <button
      onClick={handleUpgrade}
      style={{
        width: "100%",
        padding: "13px 16px",
        background: `linear-gradient(135deg, ${colors.mint}, ${colors.mintDeep})`,
        border: "none",
        borderRadius: 12,
        fontFamily: FONTS.mono,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "1.5px",
        color: colors.textOnAccent,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        transition: "all 0.2s",
      }}
    >
      UPGRADE TO PRO — $9.99/MO
      <ArrowRight size={14} />
    </button>
  );
}
