"use client";

import { useTheme } from "@/components/ThemeProvider";
import { FONTS } from "@/lib/theme";

interface LogoProps {
  size?: number;
}

export default function Logo({ size = 36 }: LogoProps) {
  const { mode, colors } = useTheme();
  const radius = size * 0.25;
  const bgGradient = mode === "dark"
    ? `linear-gradient(135deg, ${colors.mint}, ${colors.mintDeep})`
    : "linear-gradient(135deg, #000000, #2A2A2A)";
  return (
    <>
      <style>{`
        @keyframes nura-breathe {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.06); opacity: 1; }
        }
      `}</style>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          background: bgGradient,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          animation: "nura-breathe 3s ease-in-out infinite",
          boxShadow: `0 0 ${size * 0.4}px ${colors.mintGlow}`,
        }}
      >
        <span
          style={{
            fontFamily: FONTS.serif,
            fontSize: size * 0.52,
            color: mode === "dark" ? "#000814" : "#FFFFFF",
            lineHeight: 1,
            marginTop: size * 0.04,
            fontWeight: 400,
          }}
        >
          N
        </span>
      </div>
    </>
  );
}
