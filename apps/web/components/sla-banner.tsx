'use client';

import type { IncidentSlaCountdown } from '@annex21/shared';
import { formatRemaining } from '@/lib/app-api';

/**
 * Bannière SLA — frame Figma 06 (node 14:223).
 * Void soft, chips 24h/72h/1 mois lisibles (WCAG AA).
 */
export function SlaIncidentBanner({
  variant = 'marketing',
  live,
}: {
  variant?: 'marketing' | 'app';
  live?: IncidentSlaCountdown | null;
}) {
  if (variant === 'marketing') {
    return (
      <div
        role="status"
        className="border-b border-white/10 bg-annex-deep/40 px-4 py-2 text-center text-xs text-[#CBD5E1]"
      >
        <span className="mr-2 inline-flex items-center rounded bg-rose-500/90 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          SLA
        </span>
        Playbooks ANSSI 24h / 72h / 1 mois — bannière marketing.
      </div>
    );
  }

  const title = live
    ? 'Incident ouvert — playbook ANSSI actif · notification autorités'
    : 'Aucun incident ouvert — playbooks ANSSI 24h / 72h / 1 mois';
  const r24 = live ? formatRemaining(live.remaining24hMs) : '—';
  const r72 = live ? formatRemaining(live.remaining72hMs) : '—';
  const r1m = live ? formatRemaining(live.remaining1mMs) : '—';
  const hot24 = live && live.remaining24hMs > 0 && live.nextDeadline === '24h';

  return (
    <div
      role="status"
      data-luix-frame="06-app-shell-sla"
      data-figma-node="14:223"
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-annex-deep to-blue-800 px-4 py-2.5 text-sm text-white shadow-[0_0_48px_rgba(29,78,216,0.18)]"
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded bg-rose-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
          Incident · SLA
        </span>
        <span className="text-slate-100">{title}</span>
      </div>
      <div className="flex gap-2 text-[11px] font-medium">
        <span className="rounded-md bg-white/15 px-2 py-1">
          24h{' '}
          <span
            className={
              live && live.remaining24hMs <= 0
                ? 'text-rose-200'
                : hot24
                  ? 'text-annex-mint'
                  : 'text-annex-mint'
            }
          >
            {r24}
          </span>
        </span>
        <span className="rounded-md bg-white/15 px-2 py-1">
          72h <span className="text-slate-200">{r72}</span>
        </span>
        <span className="rounded-md bg-white/10 px-2 py-1 text-[#CBD5E1]">1 mois {r1m}</span>
      </div>
    </div>
  );
}
