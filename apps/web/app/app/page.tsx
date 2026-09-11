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
          <div className="mb-2 inline-flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-annex-blue/40 bg-annex-deep/30 px-2.5 py-0.5 text-[11px] font-semibold text-annex-blue">
              Étape 2/2
            </span>
            <span className="text-xs text-[#CBD5E1]">Brancher les connecteurs</span>
            <Link
              href="/app/onboarding"
              className="text-xs text-annex-blue hover:underline"
            >
              ← Étape 1/2 organisation
            </Link>
          </div>
          <h1 className="text-2xl font-semibold text-[#F8FAFC]">Onboarding preuves</h1>
          <p className="mt-1 text-sm text-[#CBD5E1]">
            Étape 2 = brancher Entra, Google Workspace ou AWS pour collecter des preuves (EU).
          </p>
        </div>
        <Link
          href="/app/login"
          className="rounded-full border border-white/15 px-4 py-2 text-sm text-[#CBD5E1] hover:bg-white/5"
        >
          Connexion / logout
        </Link>
      </div>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-[#CBD5E1]">
          Organisations
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {ORGS.map((org) => (
            <div
              key={org.id}
              className="card-glass flex items-center justify-between rounded-2xl px-4 py-3"
            >
              <div>
                <p className="font-medium text-[#F8FAFC]">{org.name}</p>
                <p className="text-xs text-[#CBD5E1]">
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
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-[#CBD5E1]">
          Connecteurs
        </h2>
        <ConnectorsGrid orgId="org_acme" />
      </section>
    </AppShell>
  );
}
