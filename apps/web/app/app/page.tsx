import { AppShell } from '@/components/app-shell';
import { ConnectorsGrid } from '@/components/connectors-grid';
import Link from 'next/link';

export const metadata = { title: 'Espace CISO' };

const ORGS = [
  { id: 'org_acme', slug: 'acme', name: 'Acme Industrie SAS', country: 'FR' },
  { id: 'org_draft', slug: 'demo-draft', name: 'Nordic MSP (démo)', country: 'DE' },
];

export default function AppHomePage() {
  return (
    <AppShell active="/app">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Espace authentifié</h1>
          <p className="text-sm text-slate-400">
            Sélectionnez une organisation, puis connectez vos sources de preuves.
          </p>
        </div>
        <Link
          href="/app/login"
          className="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
        >
          Connexion / logout
        </Link>
      </div>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-400">
          Organisations
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {ORGS.map((org) => (
            <div
              key={org.id}
              className="card-glass flex items-center justify-between rounded-2xl px-4 py-3"
            >
              <div>
                <p className="font-medium text-white">{org.name}</p>
                <p className="text-xs text-slate-400">
                  {org.country} · {org.slug}
                </p>
              </div>
              <span className="rounded-full bg-annex-deep/40 px-2.5 py-1 text-[11px] text-annex-blue ring-1 ring-annex-blue/30">
                Active (stub)
              </span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-400">
          Connecteurs
        </h2>
        <ConnectorsGrid orgId="org_acme" />
      </section>
    </AppShell>
  );
}
