import type { BillingStatus } from '@annex21/shared';

/** Figma 31:2 — technical key + AA contrast on void. */
const STYLES: Record<BillingStatus, string> = {
  pending: 'border-amber-400/50 bg-amber-400/10 text-amber-200',
  active: 'border-emerald-400/50 bg-emerald-500/15 text-emerald-300',
  past_due: 'border-red-500/60 bg-red-500/15 text-red-200',
  canceled: 'border-slate-500/50 bg-slate-500/10 text-slate-300',
};

const DOT: Record<BillingStatus, string> = {
  pending: 'bg-amber-400',
  active: 'bg-emerald-400',
  past_due: 'bg-red-400',
  canceled: 'bg-slate-400',
};

export function BillingStatusBadge({
  status,
  /** Show raw Stripe-like key (pending / active / past_due) — Figma badges. */
  technical = true,
}: {
  status: BillingStatus;
  technical?: boolean;
}) {
  const label = technical
    ? status
    : (
        {
          pending: 'En attente',
          active: 'Actif',
          past_due: 'Impayé',
          canceled: 'Annulé',
        } as const
      )[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide ${STYLES[status]}`}
      data-billing-status={status}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[status]}`} />
      {label}
    </span>
  );
}
