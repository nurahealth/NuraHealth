"use client";

import { useEffect, useState, useCallback, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { supabase } from "@/lib/supabase";
import NuraPageShell from "@/components/NuraPageShell";
import { useThemeStore, type Theme } from "@/lib/themeStore";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// ── Tokens ────────────────────────────────────────────────────────────────────
const TEXT = "var(--nura-text-primary)";
const TEXT_SEC = "var(--nura-text-secondary)";
const TEXT_TER = "var(--nura-text-tertiary)";
const BORDER = "var(--nura-border)";
const SURFACE = "var(--nura-surface)";
const SAGE = "var(--nura-sage)";
const SAGE_HOV = "var(--nura-sage-hover)";
const SAGE_ON = "var(--nura-bg)";
const RED = "var(--nura-danger)";
const WATCH = "var(--nura-watch)";
const SANS = "'Inter', system-ui, sans-serif";
const SERIF = "'DM Serif Display', Georgia, serif";

// ── Types ─────────────────────────────────────────────────────────────────────
interface PaymentMethod {
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
}

interface BillingSubscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: string | null;
  plan: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
  cancel_at: string | null;
  trial_end: string | null;
}

interface Invoice {
  id: string;
  number: string | null;
  amount_paid: number;
  currency: string;
  status: string | null;
  created: number;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
  period_start: number;
  period_end: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (iso: string | null | undefined) => {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch { return null; }
};

const fmtMonthYear = (iso: string | null | undefined) => {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  } catch { return null; }
};

const fmtUnixDate = (ts: number) => {
  try {
    return new Date(ts * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch { return ""; }
};

const fmtAmount = (cents: number, currency: string) => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency", currency: currency.toUpperCase(),
    }).format(cents / 100);
  } catch {
    return `$${(cents / 100).toFixed(2)}`;
  }
};

const daysUntil = (iso: string | null | undefined): number | null => {
  if (!iso) return null;
  try {
    const ms = new Date(iso).getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  } catch { return null; }
};

const brandLabel = (brand: string) => {
  const map: Record<string, string> = {
    visa: "Visa", mastercard: "Mastercard", amex: "American Express",
    discover: "Discover", diners: "Diners Club", jcb: "JCB", unionpay: "UnionPay",
  };
  return map[brand?.toLowerCase()] ?? (brand?.charAt(0).toUpperCase() + brand?.slice(1));
};

// Stripe appearance per theme
function buildAppearance(theme: Theme): StripeElementsOptions["appearance"] {
  const isLight = theme === "light";
  const sage = isLight ? "#7d9385" : "#9bb0a5";
  const surface = isLight ? "#ecead8" : "#111214";
  const text = isLight ? "#1a1f1a" : "#f0ebde";
  return {
    theme: isLight ? "stripe" : "night",
    variables: {
      colorPrimary: sage,
      colorBackground: surface,
      colorText: text,
      colorDanger: "#e76f51",
      fontFamily: SANS,
      borderRadius: "12px",
    },
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function BillingPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [subscription, setSubscription] = useState<BillingSubscription | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatePmOpen, setUpdatePmOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [pmUpdatedSuccess, setPmUpdatedSuccess] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [actionError, setActionError] = useState("");

  const fetchAll = useCallback(async () => {
    try {
      const [subRes, invRes] = await Promise.all([
        fetch("/api/billing/subscription"),
        fetch("/api/billing/invoices"),
      ]);
      const subData = (await subRes.json()) as {
        subscription: BillingSubscription | null;
        paymentMethod: PaymentMethod | null;
      };
      const invData = (await invRes.json()) as { invoices?: Invoice[] };
      setSubscription(subData.subscription);
      setPaymentMethod(subData.paymentMethod);
      setInvoices(invData.invoices ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/auth");
        return;
      }
      setAuthChecked(true);
      void fetchAll();
    });
  }, [router, fetchAll]);

  const handleReactivate = async () => {
    if (reactivating) return;
    setReactivating(true);
    setActionError("");
    try {
      const res = await fetch("/api/billing/reactivate", { method: "POST" });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? "Could not reactivate");
      }
      await fetchAll();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Could not reactivate");
    } finally {
      setReactivating(false);
    }
  };

  if (!authChecked) {
    return <NuraPageShell maxWidth={680}><div /></NuraPageShell>;
  }

  const isCanceling = !!subscription?.cancel_at_period_end;
  const isTrialing = subscription?.status === "trialing";
  const isPastDue = subscription?.status === "past_due";
  const isEnded = subscription?.status === "canceled" || subscription?.status === "incomplete_expired";
  const cancelDate = fmtDate(subscription?.cancel_at ?? subscription?.current_period_end ?? null);
  const periodEndDate = fmtDate(subscription?.current_period_end ?? null);
  const trialDays = isTrialing ? daysUntil(subscription?.trial_end ?? null) : null;
  const showTrialBanner = isTrialing && trialDays !== null && trialDays <= 3;

  return (
    <NuraPageShell maxWidth={680}>
      {/* HERO */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontFamily: SERIF, fontWeight: 500, color: TEXT,
          margin: "0 0 6px", lineHeight: 1.15, letterSpacing: "-0.5px",
          fontSize: "clamp(32px, 5vw, 44px)",
        }}>
          Billing
        </h1>
        <p style={{ fontFamily: SANS, fontSize: 13, color: TEXT_SEC, margin: 0 }}>
          Manage your subscription and payment.
        </p>
      </div>

      {/* PAST DUE BANNER */}
      {isPastDue && (
        <PastDueBanner onUpdate={() => setUpdatePmOpen(true)} />
      )}

      {/* TRIAL ENDING BANNER */}
      {showTrialBanner && trialDays !== null && (
        <TrialBanner days={trialDays} endDate={fmtDate(subscription?.trial_end ?? null)} />
      )}

      {loading ? (
        <>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </>
      ) : !subscription ? (
        <EmptyState onUpgrade={() => router.push("/upgrade")} />
      ) : (
        <>
          {/* CARD 1 — STATUS */}
          <Card>
            <CardLabel>Subscription</CardLabel>
            <div style={{
              display: "flex", alignItems: "flex-start", justifyContent: "space-between",
              gap: 12, flexWrap: "wrap", marginBottom: 12,
            }}>
              <div>
                <div style={{
                  fontFamily: SANS, fontSize: 22, fontWeight: 500, color: TEXT,
                  marginBottom: 4, lineHeight: 1.2,
                }}>
                  NŪRA Pro
                </div>
                <div style={{ fontFamily: SANS, fontSize: 14, color: TEXT_SEC }}>
                  $9.99 / month
                </div>
              </div>
              <StatusBadge
                status={subscription.status}
                cancelAtPeriodEnd={subscription.cancel_at_period_end}
                trialEnd={subscription.trial_end}
                cancelDate={cancelDate}
              />
            </div>

            {subscription.created_at && (
              <div style={{ fontFamily: SANS, fontSize: 12, color: TEXT_TER }}>
                Member since {fmtMonthYear(subscription.created_at)}
              </div>
            )}

            {isTrialing && trialDays !== null && (
              <div style={{
                marginTop: 14, padding: "10px 12px", borderRadius: 10,
                background: `rgba(var(--nura-sage-rgb),0.08)`,
                border: `0.5px solid rgba(var(--nura-sage-rgb),0.22)`,
                fontFamily: SANS, fontSize: 13, color: TEXT, lineHeight: 1.5,
              }}>
                Your trial ends in {trialDays} {trialDays === 1 ? "day" : "days"}
                {subscription.trial_end ? ` · ${fmtDate(subscription.trial_end)}` : ""}.
              </div>
            )}
          </Card>

          {/* CARD 2 — PAYMENT METHOD */}
          <Card>
            <CardLabel>Payment method</CardLabel>
            {paymentMethod ? (
              <div style={{
                display: "flex", alignItems: "center", gap: 12, marginBottom: 14,
              }}>
                <CardBrandIcon />
                <div>
                  <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 500, color: TEXT, marginBottom: 2 }}>
                    {brandLabel(paymentMethod.brand)} •••• {paymentMethod.last4}
                  </div>
                  <div style={{ fontFamily: SANS, fontSize: 12, color: TEXT_SEC }}>
                    Expires {String(paymentMethod.exp_month).padStart(2, "0")}/{paymentMethod.exp_year}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                fontFamily: SANS, fontSize: 13, color: TEXT_SEC, lineHeight: 1.5, marginBottom: 14,
              }}>
                No payment method on file.
              </div>
            )}
            <button
              onClick={() => setUpdatePmOpen(true)}
              style={{
                background: "none", border: "none", padding: 0, cursor: "pointer",
                fontFamily: SANS, fontSize: 13, fontWeight: 500, color: SAGE,
                display: "inline-flex", alignItems: "center", gap: 4,
              }}
            >
              {paymentMethod ? "Update payment method" : "Add payment method"}
              <ArrowRight />
            </button>
            {pmUpdatedSuccess && (
              <div style={{
                marginTop: 12, fontFamily: SANS, fontSize: 12, color: SAGE,
              }}>
                Payment method updated
              </div>
            )}
          </Card>

          {/* CARD 3 — MANAGE */}
          <Card highlight={isPastDue ? "danger" : undefined}>
            <CardLabel>Manage</CardLabel>

            {isPastDue && (
              <div style={{
                fontFamily: SANS, fontSize: 13, color: TEXT_SEC,
                lineHeight: 1.5, marginBottom: 14,
              }}>
                Payment failed. Please update your payment method to keep your subscription active.
              </div>
            )}

            {isCanceling ? (
              <>
                <div style={{
                  fontFamily: SANS, fontSize: 13, color: TEXT_SEC,
                  lineHeight: 1.5, marginBottom: 14,
                }}>
                  Your subscription will end on {cancelDate}. Access continues until then.
                </div>
                <SageButton
                  label={reactivating ? "Reactivating…" : "Reactivate subscription"}
                  onClick={handleReactivate}
                  disabled={reactivating}
                />
                {actionError && (
                  <div style={{
                    marginTop: 12, fontFamily: SANS, fontSize: 12, color: RED,
                  }}>{actionError}</div>
                )}
              </>
            ) : isEnded ? (
              <div style={{ fontFamily: SANS, fontSize: 13, color: TEXT_SEC, lineHeight: 1.5 }}>
                This subscription has ended.
              </div>
            ) : (
              <>
                <button
                  onClick={() => setCancelOpen(true)}
                  style={{
                    background: "none", border: "none", padding: 0, cursor: "pointer",
                    fontFamily: SANS, fontSize: 13, fontWeight: 400, color: TEXT_TER,
                    display: "inline-flex", alignItems: "center", gap: 4,
                  }}
                >
                  Cancel subscription
                  <ArrowRight />
                </button>
                {cancelSuccess && (
                  <div style={{
                    marginTop: 12, fontFamily: SANS, fontSize: 12, color: SAGE,
                  }}>
                    Subscription canceled
                  </div>
                )}
              </>
            )}
          </Card>

          {/* CARD 4 — INVOICES */}
          <Card>
            <CardLabel>Invoices</CardLabel>
            {invoices.length === 0 ? (
              <div style={{ fontFamily: SANS, fontSize: 13, color: TEXT_SEC }}>
                No invoices yet.
              </div>
            ) : (
              <InvoiceList invoices={invoices.slice(0, 12)} />
            )}
            {invoices.length > 12 && (
              <div style={{ marginTop: 14 }}>
                <span style={{ fontFamily: SANS, fontSize: 12, color: TEXT_TER }}>
                  Showing 12 of {invoices.length}.
                </span>
              </div>
            )}
          </Card>
        </>
      )}

      {updatePmOpen && (
        <UpdatePaymentMethodModal
          onClose={() => setUpdatePmOpen(false)}
          onSuccess={async () => {
            setPmUpdatedSuccess(true);
            await fetchAll();
            setTimeout(() => setPmUpdatedSuccess(false), 4000);
          }}
        />
      )}

      {cancelOpen && subscription && (
        <CancelSubscriptionModal
          periodEnd={periodEndDate}
          onClose={() => setCancelOpen(false)}
          onSuccess={async () => {
            setCancelSuccess(true);
            setCancelOpen(false);
            await fetchAll();
            setTimeout(() => setCancelSuccess(false), 4000);
          }}
        />
      )}
    </NuraPageShell>
  );
}

// ── Card primitives ───────────────────────────────────────────────────────────
function Card({ children, highlight }: { children: React.ReactNode; highlight?: "danger" }) {
  const borderColor = highlight === "danger" ? `rgba(212,87,77,0.5)` : BORDER;
  return (
    <div style={{
      background: SURFACE, border: `0.5px solid ${borderColor}`, borderRadius: 14,
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

function CardSkeleton() {
  return (
    <div style={{
      background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 14,
      padding: 20, marginBottom: 14, position: "relative", overflow: "hidden",
    }}>
      <style>{`@keyframes nura-sk { 0%{transform:translateX(-100%);} 100%{transform:translateX(200%);} }`}</style>
      <div style={{ height: 12, width: 90, background: "rgba(var(--nura-sage-rgb),0.10)", borderRadius: 6, marginBottom: 16 }} />
      <div style={{ height: 22, width: "55%", background: "rgba(var(--nura-sage-rgb),0.08)", borderRadius: 6, marginBottom: 10 }} />
      <div style={{ height: 14, width: "40%", background: "rgba(var(--nura-sage-rgb),0.07)", borderRadius: 6 }} />
      <div style={{
        position: "absolute", inset: 0,
        background: `linear-gradient(90deg, transparent, rgba(var(--nura-sage-rgb),0.07), transparent)`,
        animation: `nura-sk 1.6s ease infinite`,
      }} />
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

function CardBrandIcon() {
  return (
    <div style={{
      width: 36, height: 24, borderRadius: 5,
      background: `rgba(var(--nura-sage-rgb),0.12)`,
      border: `0.5px solid rgba(var(--nura-sage-rgb),0.25)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: SAGE,
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2"/>
        <path d="M2 10h20"/>
      </svg>
    </div>
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
        display: "inline-flex", alignItems: "center", gap: 8,
      }}
    >
      {label}
    </button>
  );
}

function StatusBadge({
  status, cancelAtPeriodEnd, trialEnd, cancelDate,
}: {
  status: string | null;
  cancelAtPeriodEnd: boolean;
  trialEnd: string | null;
  cancelDate: string | null;
}) {
  let bg = `rgba(var(--nura-sage-rgb),0.16)`;
  let border = `rgba(var(--nura-sage-rgb),0.4)`;
  let color = SAGE;
  let label = "Active";

  if (cancelAtPeriodEnd) {
    bg = "var(--nura-surface-elevated)";
    border = BORDER;
    color = TEXT_TER;
    label = cancelDate ? `Canceling on ${cancelDate}` : "Canceling";
  } else if (status === "trialing") {
    const end = fmtDate(trialEnd);
    label = end ? `Trial · ends ${end}` : "Trial";
  } else if (status === "active") {
    label = "Active";
  } else if (status === "past_due") {
    bg = "rgba(212,165,116,0.16)";
    border = "rgba(212,165,116,0.4)";
    color = WATCH;
    label = "Payment required";
  } else if (status === "canceled") {
    bg = "var(--nura-surface-elevated)";
    border = BORDER;
    color = TEXT_TER;
    label = "Canceled";
  }

  return (
    <span style={{
      padding: "5px 10px", borderRadius: 7, background: bg,
      border: `0.5px solid ${border}`,
      fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: "0.3px",
      color, whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

function PastDueBanner({ onUpdate }: { onUpdate: () => void }) {
  return (
    <div style={{
      background: "rgba(212,87,77,0.08)",
      border: `0.5px solid rgba(212,87,77,0.4)`,
      borderRadius: 14, padding: 16, marginBottom: 14,
      display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
    }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 500, color: TEXT, marginBottom: 4 }}>
          Your last payment failed
        </div>
        <div style={{ fontFamily: SANS, fontSize: 12, color: TEXT_SEC, lineHeight: 1.5 }}>
          Update your payment method to keep your subscription active.
        </div>
      </div>
      <button
        onClick={onUpdate}
        onMouseEnter={(e) => { e.currentTarget.style.background = SAGE_HOV; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = SAGE; }}
        style={{
          padding: "9px 14px", borderRadius: 10, border: "none", background: SAGE,
          color: SAGE_ON, fontFamily: SANS, fontSize: 12, fontWeight: 500, cursor: "pointer",
          transition: "background 200ms",
        }}
      >
        Update payment method
      </button>
    </div>
  );
}

function TrialBanner({ days, endDate }: { days: number; endDate: string | null }) {
  return (
    <div style={{
      background: `rgba(var(--nura-sage-rgb),0.08)`,
      border: `0.5px solid rgba(var(--nura-sage-rgb),0.3)`,
      borderRadius: 14, padding: 14, marginBottom: 14,
    }}>
      <div style={{ fontFamily: SANS, fontSize: 13, color: TEXT, lineHeight: 1.5 }}>
        Your trial ends in {days} {days === 1 ? "day" : "days"}
        {endDate ? ` · ${endDate}` : ""}. Add a payment method to continue using Pro.
      </div>
    </div>
  );
}

function EmptyState({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div style={{
      background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 14,
      padding: 40, textAlign: "center",
    }}>
      <div style={{ fontFamily: SANS, fontSize: 16, fontWeight: 500, color: TEXT, marginBottom: 8 }}>
        You don&apos;t have an active subscription.
      </div>
      <div style={{ fontFamily: SANS, fontSize: 13, color: TEXT_SEC, lineHeight: 1.5, marginBottom: 20 }}>
        Upgrade to unlock unlimited NŪRA conversations, bloodwork analysis, and the full knowledge base.
      </div>
      <button
        onClick={onUpgrade}
        onMouseEnter={(e) => { e.currentTarget.style.background = SAGE_HOV; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = SAGE; }}
        style={{
          padding: "11px 20px", borderRadius: 11, border: "none", background: SAGE,
          color: SAGE_ON, fontFamily: SANS, fontSize: 13, fontWeight: 500, cursor: "pointer",
          display: "inline-flex", alignItems: "center", gap: 8, transition: "background 200ms",
        }}
      >
        Upgrade to Pro
        <ArrowRight />
      </button>
    </div>
  );
}

// ── Invoice list ──────────────────────────────────────────────────────────────
function InvoiceList({ invoices }: { invoices: Invoice[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{
        display: "grid", gridTemplateColumns: "1.2fr 1fr 0.9fr 0.6fr",
        gap: 12, padding: "0 0 10px",
        fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "1px",
        color: TEXT_TER, textTransform: "uppercase",
        borderBottom: `0.5px solid ${BORDER}`,
      }}>
        <div>Date</div>
        <div>Amount</div>
        <div>Status</div>
        <div style={{ textAlign: "right" }}>PDF</div>
      </div>
      {invoices.map((inv) => (
        <div key={inv.id} style={{
          display: "grid", gridTemplateColumns: "1.2fr 1fr 0.9fr 0.6fr",
          gap: 12, padding: "12px 0", alignItems: "center",
          borderBottom: `0.5px solid ${BORDER}`,
          fontFamily: SANS, fontSize: 13,
        }}>
          <div style={{ color: TEXT }}>{fmtUnixDate(inv.created)}</div>
          <div style={{ color: TEXT }}>{fmtAmount(inv.amount_paid, inv.currency)}</div>
          <div>
            <InvoiceStatusBadge status={inv.status} />
          </div>
          <div style={{ textAlign: "right" }}>
            {inv.invoice_pdf ? (
              <a
                href={inv.invoice_pdf}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: SANS, fontSize: 12, color: SAGE,
                  textDecoration: "none", fontWeight: 500,
                }}
              >
                PDF ↗
              </a>
            ) : (
              <span style={{ fontFamily: SANS, fontSize: 12, color: TEXT_TER }}>—</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function InvoiceStatusBadge({ status }: { status: string | null }) {
  const s = (status ?? "").toLowerCase();
  let label = "—";
  let color = TEXT_TER;
  let bg = "var(--nura-surface-elevated)";
  let border = BORDER;
  if (s === "paid") {
    label = "Paid"; color = SAGE;
    bg = `rgba(var(--nura-sage-rgb),0.12)`;
    border = `rgba(var(--nura-sage-rgb),0.3)`;
  } else if (s === "open") {
    label = "Open"; color = WATCH;
    bg = "rgba(212,165,116,0.10)";
    border = "rgba(212,165,116,0.3)";
  } else if (s === "void" || s === "uncollectible") {
    label = s === "void" ? "Void" : "Uncollectible";
  } else if (s === "draft") {
    label = "Draft";
  } else if (s) {
    label = s.charAt(0).toUpperCase() + s.slice(1);
  }
  return (
    <span style={{
      display: "inline-block", padding: "3px 8px", borderRadius: 6,
      background: bg, border: `0.5px solid ${border}`,
      fontFamily: SANS, fontSize: 11, fontWeight: 500, color,
    }}>
      {label}
    </span>
  );
}

// ── Cancel Subscription Modal ─────────────────────────────────────────────────
function CancelSubscriptionModal({
  periodEnd, onClose, onSuccess,
}: {
  periodEnd: string | null;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !submitting) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, submitting]);

  const handleCancel = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? "Could not cancel");
      }
      await onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not cancel");
      setSubmitting(false);
    }
  };

  return (
    <ModalShell onClose={() => { if (!submitting) onClose(); }} title="Cancel your subscription?">
      <p style={{
        fontFamily: SANS, fontSize: 14, color: TEXT_SEC, lineHeight: 1.6, margin: "0 0 22px",
      }}>
        Your access continues until {periodEnd ?? "the end of your billing period"}. After that,
        you&apos;ll lose access to Pro features. You can reactivate any time before then.
      </p>

      {error && (
        <div style={{
          padding: "9px 12px", borderRadius: 9, marginBottom: 14,
          background: "rgba(212,87,77,0.08)", border: `0.5px solid rgba(212,87,77,0.3)`,
          color: RED, fontFamily: SANS, fontSize: 12,
        }}>{error}</div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          onClick={onClose}
          disabled={submitting}
          onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.background = SAGE_HOV; }}
          onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.background = SAGE; }}
          style={{
            width: "100%", padding: "11px 16px", borderRadius: 11, border: "none",
            background: submitting ? `rgba(var(--nura-sage-rgb),0.4)` : SAGE,
            color: SAGE_ON, fontFamily: SANS, fontSize: 13, fontWeight: 500,
            cursor: submitting ? "not-allowed" : "pointer",
            transition: "background 200ms",
          }}
        >
          Keep subscription
        </button>
        <button
          onClick={handleCancel}
          disabled={submitting}
          style={{
            width: "100%", padding: "11px 16px", borderRadius: 11,
            background: "transparent", border: `0.5px solid ${BORDER}`,
            color: TEXT_TER, fontFamily: SANS, fontSize: 13, fontWeight: 500,
            cursor: submitting ? "not-allowed" : "pointer",
          }}
        >
          {submitting ? "Canceling…" : "Cancel subscription"}
        </button>
      </div>
    </ModalShell>
  );
}

// ── Update Payment Method Modal ───────────────────────────────────────────────
function UpdatePaymentMethodModal({
  onClose, onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
}) {
  const theme = useThemeStore((s) => s.theme);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/billing/setup-intent", { method: "POST" });
        const data = (await res.json()) as { client_secret?: string; error?: string };
        if (!res.ok || !data.client_secret) throw new Error(data.error ?? "Could not start setup");
        if (!cancelled) setClientSecret(data.client_secret);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not start setup");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const options: StripeElementsOptions = clientSecret
    ? { clientSecret, appearance: buildAppearance(theme) }
    : {};

  return (
    <ModalShell onClose={onClose} title="Update payment method">
      {error && (
        <div style={{
          padding: "9px 12px", borderRadius: 9, marginBottom: 14,
          background: "rgba(212,87,77,0.08)", border: `0.5px solid rgba(212,87,77,0.3)`,
          color: RED, fontFamily: SANS, fontSize: 12,
        }}>{error}</div>
      )}

      {clientSecret ? (
        <Elements stripe={stripePromise} options={options}>
          <UpdatePaymentForm onClose={onClose} onSuccess={onSuccess} />
        </Elements>
      ) : !error ? (
        <div style={{ height: 220, position: "relative", overflow: "hidden", borderRadius: 12, background: SURFACE }}>
          <style>{`@keyframes nura-sk2 { 0%{transform:translateX(-100%);} 100%{transform:translateX(200%);} }`}</style>
          <div style={{
            position: "absolute", inset: 0,
            background: `linear-gradient(90deg, transparent, rgba(var(--nura-sage-rgb),0.08), transparent)`,
            animation: `nura-sk2 1.5s ease infinite`,
          }} />
        </div>
      ) : null}
    </ModalShell>
  );
}

function UpdatePaymentForm({
  onClose, onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || submitting) return;
    setSubmitting(true);
    setError("");

    const { error: stripeError, setupIntent } = await stripe.confirmSetup({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: "if_required",
    });

    if (stripeError) {
      setError(stripeError.message ?? "Could not save payment method.");
      setSubmitting(false);
      return;
    }

    const paymentMethodId = typeof setupIntent?.payment_method === "string"
      ? setupIntent.payment_method
      : setupIntent?.payment_method?.id;

    if (!paymentMethodId) {
      setError("Could not save payment method.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/billing/set-default-payment-method", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_method_id: paymentMethodId }),
      });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? "Could not save payment method");
      }
      setSuccess(true);
      await onSuccess();
      setTimeout(() => onClose(), 2000);
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : "Could not save payment method");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <div style={{ minHeight: ready ? "auto" : 220, transition: "min-height 300ms ease" }}>
        <PaymentElement
          onReady={() => setReady(true)}
          options={{ layout: "tabs" }}
        />
      </div>

      {error && (
        <div style={{
          marginTop: 14, padding: "11px 14px",
          background: "rgba(212,87,77,0.08)", border: `0.5px solid rgba(212,87,77,0.3)`,
          borderRadius: 10, fontFamily: SANS, fontSize: 12, color: RED, lineHeight: 1.5,
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          marginTop: 14, padding: "11px 14px",
          background: `rgba(var(--nura-sage-rgb),0.10)`,
          border: `0.5px solid rgba(var(--nura-sage-rgb),0.3)`,
          borderRadius: 10, fontFamily: SANS, fontSize: 12, color: SAGE,
        }}>
          Payment method updated
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
        <button
          type="submit"
          disabled={!stripe || submitting || success || !ready}
          onMouseEnter={(e) => { if (stripe && !submitting && !success && ready) e.currentTarget.style.background = SAGE_HOV; }}
          onMouseLeave={(e) => { if (stripe && !submitting && !success && ready) e.currentTarget.style.background = SAGE; }}
          style={{
            flex: 1, padding: "11px 16px", borderRadius: 11, border: "none",
            background: (!stripe || submitting || success || !ready) ? `rgba(var(--nura-sage-rgb),0.4)` : SAGE,
            color: SAGE_ON, fontFamily: SANS, fontSize: 13, fontWeight: 500,
            cursor: (!stripe || submitting || success || !ready) ? "not-allowed" : "pointer",
            transition: "background 200ms",
          }}
        >
          {submitting ? "Saving…" : success ? "Saved" : "Save payment method"}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          style={{
            flex: 1, padding: "11px 16px", borderRadius: 11,
            background: "transparent", border: `0.5px solid ${BORDER}`,
            color: TEXT_SEC, fontFamily: SANS, fontSize: 13, fontWeight: 500,
            cursor: submitting ? "not-allowed" : "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Modal shell (matches EditProfileModal pattern) ────────────────────────────
function ModalShell({
  onClose, title, children,
}: {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
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
          {title}
        </div>

        {children}
      </div>
    </div>
  );
}

