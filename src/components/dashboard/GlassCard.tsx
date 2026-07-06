import type { CSSProperties, KeyboardEventHandler, ReactNode } from "react";

// Frosted-glass surface used across metric detail pages: backdrop blur, hairline
// border, inset top highlight + soft drop shadow. Override anything via `style`.
// Optional interaction props let a card act as a tappable link.

export default function GlassCard({
  children,
  style,
  className,
  onClick,
  onKeyDown,
  role,
  tabIndex,
  ariaLabel,
}: {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  onClick?: () => void;
  onKeyDown?: KeyboardEventHandler<HTMLDivElement>;
  role?: string;
  tabIndex?: number;
  ariaLabel?: string;
}) {
  return (
    <div
      className={className}
      onClick={onClick}
      onKeyDown={onKeyDown}
      role={role}
      tabIndex={tabIndex}
      aria-label={ariaLabel}
      style={{
        background: "var(--nura-glass)",
        backdropFilter: "blur(24px) saturate(1.2)",
        WebkitBackdropFilter: "blur(24px) saturate(1.2)",
        border: "1px solid var(--nura-glass-line)",
        borderRadius: 22,
        padding: 18,
        boxShadow: "inset 0 1px 0 rgba(235,230,216,0.10), 0 18px 50px rgba(0,0,0,0.35)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
