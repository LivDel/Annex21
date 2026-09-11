import { AppShell } from '@/components/app-shell';
import Link from 'next/link';

export const metadata = { title: 'Assessment' };

const GAPS = [
  { domain: 'Gestion des risques', detail: 'Registre des risques incomplet', severity: 'Élevé' },
  { domain: 'Continuité', detail: 'Plan PCA non testé depuis 12 mois', severity: 'Moyen' },
  { domain: 'Fournisseurs', detail: 'Clause NIS2 absente chez 3 vendors', severity: 'Élevé' },
  { domain: 'Formation', detail: 'Campagne phishing non planifiée', severity: 'Faible' },
] as const;

const SEVERITY: Record<string, string> = {
  Élevé: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  Moyen: 'bg-amber-400/15 text-amber-200 border-amber-400/30',
  Faible: 'bg-annex-mint/15 text-annex-mint border-annex-mint/30',
};

export default function AssessmentPage() {
  return (
    <AppShell active="/app/assessment">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Assessment — gaps NIS2</h1>
          <p className="text-sm text-slate-400">4 écarts prioritaires · score de maturité 62%</p>
        </div>
        <Link
          href="/app/playbooks"
          className="rounded-full bg-annex-deep px-4 py-2 text-sm font-semibold hover:bg-blue-700"
        >
          Ouvrir le playbook incident
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[200px_1fr]">
        <div className="card-glass rounded-2xl p-5">
          <p className="text-xs text-slate-400">Maturité NIS2</p>
          <p className="mt-1 text-4xl font-semibold">62%</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[62%] rounded-full bg-gradient-to-r from-annex-deep to-annex-mint" />
          </div>
        </div>

        <ul className="card-glass divide-y divide-white/5 rounded-2xl">
          {GAPS.map((g) => (
            <li key={g.domain} className="flex items-center justify-between px-5 py-3.5">
              <div>
                <p className="text-sm font-medium text-white">{g.domain}</p>
                <p className="text-xs text-slate-400">{g.detail}</p>
              </div>
              <span className={`rounded-full border px-2 py-0.5 text-[11px] ${SEVERITY[g.severity]}`}>
                {g.severity}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <section className="card-glass mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5">
        <div>
          <p className="text-sm font-semibold text-white">Playbook incident · notification 24h</p>
          <p className="text-xs text-slate-400">
            Étapes ANSSI : détecter → qualifier → notifier → contenir.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-annex-deep px-3 py-1.5 text-xs font-semibold">
            1. Qualifier
          </span>
          <Link
            href="/app/playbooks"
            className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5"
          >
            2. Notifier ANSSI
          </Link>
          <Link
            href="/app/playbooks"
            className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5"
          >
            3. Contenir
          </Link>
        </div>
      </section>

      <p className="mt-6 text-xs text-slate-500">
        Disclaimer : cet assessment n&apos;est pas un avis juridique (RG-02). Placeholder MVP.
      </p>
    </AppShell>
  );
}
