"use client";

import { Menu, Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { FONTS } from "@/lib/theme";

interface TopbarProps {
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const { mode, colors, toggle } = useTheme();

  return (
    <>
      <style>{`
        @keyframes topbar-dot-pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
      `}</style>
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          height: 56,
          background: colors.bgTopbar,
          backdropFilter: "blur(20px)",
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <button
          onClick={onMenuClick}
          style={{
            width: 36,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: colors.textMuted,
            borderRadius: 8,
            padding: 0,
          }}
        >
          <Menu size={20} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontFamily: FONTS.serif,
              fontSize: 22,
              color: colors.text,
              letterSpacing: "0.02em",
            }}
          >
            NŪ
          </span>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <span
              style={{
                fontFamily: FONTS.serif,
                fontSize: 22,
                color: colors.mint,
                letterSpacing: "0.02em",
              }}
            >
              R
            </span>
            <div
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: colors.mint,
                position: "absolute",
                top: 2,
                right: -7,
                animation: "topbar-dot-pulse 2s ease-in-out infinite",
                boxShadow: `0 0 6px ${colors.mint}`,
              }}
            />
          </div>
          <span
            style={{
              fontFamily: FONTS.serif,
              fontSize: 22,
              color: colors.text,
              letterSpacing: "0.02em",
              marginLeft: 4,
            }}
          >
            A
          </span>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          aria-label="Toggle theme"
          style={{
            width: 46,
            height: 24,
            borderRadius: 12,
            background: colors.mintBgMedium,
            border: `1px solid ${colors.mintBorder}`,
            cursor: "pointer",
            position: "relative",
            padding: 0,
            flexShrink: 0,
            transition: "background 0.3s",
          }}
        >
          {/* Icon on the inactive side */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              ...(mode === "dark"
                ? { right: 6, transform: "translateY(-50%)" }
                : { left: 6, transform: "translateY(-50%)" }),
              display: "flex",
              alignItems: "center",
              color: colors.textFaint,
              pointerEvents: "none",
            }}
          >
            {mode === "dark" ? <Sun size={10} /> : <Moon size={10} />}
          </div>
          {/* Sliding knob */}
          <div
            style={{
              position: "absolute",
              top: 3,
              left: mode === "dark" ? 3 : 25,
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${colors.mint}, ${colors.mintDeep})`,
              boxShadow: `0 0 8px ${colors.mint}`,
              transition: "left 0.3s cubic-bezier(0.4,0,0.2,1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            {mode === "dark"
              ? <Moon size={10} color={colors.textOnAccent} />
              : <Sun size={10} color={colors.textOnAccent} />
            }
          </div>
        </button>
      </div>
    </>
  );
}
