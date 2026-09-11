import { AppShell } from '@/components/app-shell';

export const metadata = { title: 'Playbooks ANSSI' };

const STEPS = [
  { t: '24h', title: 'Détecter → qualifier → notifier', owner: 'Contributor' },
  { t: '72h', title: 'Notifier ANSSI / autorités', owner: 'Owner (CISO)' },
  { t: '1 mois', title: 'Contenir, rapport, leçons apprises', owner: 'Owner + Contributor' },
];

export default function PlaybooksPage() {
  return (
    <AppShell active="/app/playbooks">
      <h1 className="text-2xl font-semibold">Playbooks ANSSI</h1>
      <p className="mt-1 text-sm text-slate-400">
        Timelines canoniques MVP : 24h / 72h / 1 mois (RG-04). Version FR-ANSSI. Placeholder.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {STEPS.map((s) => (
          <article key={s.t} className="card-glass rounded-2xl p-5">
            <span className="text-xs font-semibold text-annex-mint">{s.t}</span>
            <h2 className="mt-2 text-sm font-medium text-white">{s.title}</h2>
            <p className="mt-2 text-xs text-slate-400">Owner : {s.owner}</p>
          </article>
        ))}
      </div>

      <div className="card-glass mt-6 rounded-2xl p-5 text-sm text-slate-300">
        Étapes ANSSI : détecter → qualifier → notifier → contenir. Une étape ne passe{' '}
        <code className="text-annex-mint">done</code> que si owner + preuve minimale (RG-05).
      </div>
    </AppShell>
  );
}
