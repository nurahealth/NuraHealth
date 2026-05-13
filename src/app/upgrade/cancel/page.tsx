"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { FONTS } from "@/lib/theme";
import { XCircle } from "lucide-react";

export default function UpgradeCancelPage() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <div style={{ minHeight: "100vh", background: colors.bg, fontFamily: FONTS.sans, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", textAlign: "center" }}>
      <style>{`* { box-sizing: border-box; }`}</style>

      <div style={{ maxWidth: 360, width: "100%" }}>
        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, borderRadius: "50%", background: colors.mintBgSubtle, border: `1px solid ${colors.mintBorder}`, marginBottom: 24 }}>
          <XCircle size={28} color={colors.textFaint} />
        </div>

        <h1 style={{ fontFamily: FONTS.serif, fontSize: 26, fontWeight: 400, color: colors.text, margin: "0 0 10px" }}>
          Upgrade cancelled
        </h1>
        <p style={{ fontFamily: FONTS.sans, fontSize: 14, color: colors.textDim, margin: "0 0 36px", lineHeight: 1.6 }}>
          No charges were made. You can upgrade whenever you&apos;re ready.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={() => router.push("/upgrade")}
            style={{
              width: "100%",
              padding: "13px",
              background: `linear-gradient(135deg, ${colors.mint}, ${colors.mintDeep})`,
              border: "none",
              borderRadius: 12,
              fontFamily: FONTS.mono,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "1.5px",
              color: colors.textOnAccent,
              cursor: "pointer",
            }}
          >
            TRY AGAIN
          </button>
          <button
            onClick={() => router.push("/")}
            style={{
              width: "100%",
              padding: "13px",
              background: "transparent",
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
              fontFamily: FONTS.mono,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "1.5px",
              color: colors.textFaint,
              cursor: "pointer",
            }}
          >
            BACK TO HOME
          </button>
        </div>
      </div>
    </div>
  );
}
