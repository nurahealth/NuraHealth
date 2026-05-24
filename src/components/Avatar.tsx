"use client";

import type { User } from "@supabase/supabase-js";

const SAGE = "var(--nura-sage)";
const SANS = "'Inter', system-ui, sans-serif";

interface Props {
  user: User | null;
  size?: number;
  className?: string;
}

function getInitial(user: User | null): string {
  if (!user) return "?";
  const meta = (user.user_metadata ?? {}) as { full_name?: string; name?: string };
  const fromMeta = (meta.full_name || meta.name || "").trim();
  if (fromMeta) return fromMeta.charAt(0).toUpperCase();
  if (user.email) return user.email.trim().charAt(0).toUpperCase();
  return "?";
}

function getAvatarUrl(user: User | null): string | null {
  if (!user) return null;
  const meta = (user.user_metadata ?? {}) as { avatar_url?: string | null };
  return meta.avatar_url || null;
}

export default function Avatar({ user, size = 40, className }: Props) {
  const avatarUrl = getAvatarUrl(user);
  const initial = getInitial(user);
  const fontSize = Math.max(12, Math.round(size * 0.36));

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className={className}
        style={{
          width: size, height: size, borderRadius: "50%",
          objectFit: "cover", flexShrink: 0, display: "block",
        }}
      />
    );
  }

  return (
    <div
      className={className}
      style={{
        width: size, height: size, borderRadius: "50%", flexShrink: 0,
        background: `rgba(var(--nura-sage-rgb),0.18)`,
        border: `0.5px solid rgba(var(--nura-sage-rgb),0.4)`,
        color: SAGE, fontFamily: SANS, fontSize, fontWeight: 500,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      {initial}
    </div>
  );
}
