/**
 * Placeholder bandeau SLA incident (global).
 * En prod : alimenté par le playbook ANSSI actif (24h / 72h / 1 mois).
 */
export function SlaIncidentBanner({
  variant = 'marketing',
}: {
  variant?: 'marketing' | 'app';
}) {
  if (variant === 'marketing') {
    return (
      <div
        role="status"
        className="border-b border-white/10 bg-annex-deep/40 px-4 py-2 text-center text-xs text-slate-300"
      >
        <span className="mr-2 inline-flex items-center rounded bg-rose-500/90 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          SLA
        </span>
        Placeholder bandeau incident — playbooks ANSSI 24h / 72h / 1 mois (aucune donnée live).
      </div>
    );
  }

  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-annex-deep to-blue-800 px-4 py-2.5 text-sm text-white shadow-glow"
    >
      <div className="flex items-center gap-3">
        <span className="rounded bg-rose-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
          Incident · SLA
        </span>
        <span className="text-slate-100">Notification autorités — playbook ANSSI actif</span>
      </div>
      <div className="flex gap-2 text-[11px] font-medium">
        <span className="rounded-md bg-white/15 px-2 py-1">
          24h <span className="text-annex-mint">18h 42m</span>
        </span>
        <span className="rounded-md bg-white/15 px-2 py-1">
          72h <span className="text-slate-200">2j 18h</span>
        </span>
        <span className="rounded-md bg-white/10 px-2 py-1 text-slate-300">1 mois 27j</span>
      </div>
    </div>
  );
}
