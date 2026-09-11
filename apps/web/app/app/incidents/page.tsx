import { AppShell } from '@/components/app-shell';
import Link from 'next/link';

export const metadata = { title: 'Incidents' };

export default function IncidentsPage() {
  return (
    <AppShell active="/app/incidents">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Incidents</h1>
          <p className="mt-1 text-sm text-slate-400">
            Suivi SLA ANSSI 24h / 72h / 1 mois — placeholder MVP.
          </p>
        </div>
        <Link
          href="/app/playbooks"
          className="rounded-full bg-annex-deep px-4 py-2 text-sm font-semibold hover:bg-blue-700"
        >
          Ouvrir le playbook
        </Link>
      </div>

      <div className="card-glass rounded-2xl p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded bg-rose-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            Incident · SLA
          </span>
          <p className="text-sm text-slate-200">Notification autorités — playbook ANSSI actif</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-md bg-white/10 px-2 py-1">
            24h <span className="text-annex-mint">18h 42m</span>
          </span>
          <span className="rounded-md bg-white/10 px-2 py-1">72h 2j 18h</span>
          <span className="rounded-md bg-white/10 px-2 py-1 text-slate-400">1 mois 27j</span>
        </div>
        <p className="mt-6 text-xs text-slate-500">
          Route dédiée <code className="text-annex-mint">/app/incidents</code> — distincte de Contrôles
          / Playbooks.
        </p>
      </div>
    </AppShell>
  );
}
