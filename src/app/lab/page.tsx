import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import NuraPageShell from "@/components/NuraPageShell";

// ── Design tokens (locked NŪRA system) ────────────────────────────────────────
const TEXT = "var(--nura-text-primary)";
const TEXT_SEC = "var(--nura-text-secondary)";
const BORDER = "var(--nura-border)";
const SURFACE = "var(--nura-surface)";
const SAGE = "var(--nura-sage)";
const SAGE_RGB = "var(--nura-sage-rgb)";
const SANS = "'Inter', system-ui, sans-serif";
const SERIF = "'DM Serif Display', Georgia, serif";

export default async function LabPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/dashboard");

  const { data } = await supabaseAdmin
    .from("profiles")
    .select("catalog_beta_enabled")
    .eq("id", user.id)
    .single();

  const profile = data as { catalog_beta_enabled: boolean } | null;
  if (profile?.catalog_beta_enabled !== true) redirect("/dashboard");

  return (
    <NuraPageShell maxWidth={720}>
      <div style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}>
        <div style={{
          background: SURFACE,
          border: `0.5px solid ${BORDER}`,
          borderRadius: 14,
          padding: "44px 36px",
          maxWidth: 560,
          width: "100%",
        }}>
          <div style={{
            fontFamily: SANS,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: SAGE,
            border: `0.5px solid rgba(${SAGE_RGB},0.5)`,
            borderRadius: 8,
            padding: "4px 10px",
            display: "inline-block",
            marginBottom: 20,
          }}>
            Lab · Preview
          </div>

          <h1 style={{
            fontFamily: SERIF,
            fontWeight: 500,
            color: TEXT,
            margin: "0 0 12px",
            lineHeight: 1.1,
            letterSpacing: "-0.5px",
            fontSize: "clamp(34px, 5vw, 52px)",
          }}>
            Lab
          </h1>

          <p style={{
            fontFamily: SANS,
            fontSize: 14.5,
            color: TEXT_SEC,
            margin: 0,
            lineHeight: 1.6,
          }}>
            Your upcoming product testing experience — where we trial new NŪRA features before they reach the rest of the platform.
          </p>
        </div>
      </div>
    </NuraPageShell>
  );
}
