import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Logo } from '@/components/logo';
import { TrustStatusBadge } from '@/components/trust-status-badge';
import { ControlStatus } from '@/components/control-status';
import { loadTrust } from '@/lib/api';
import { DEMO_ORGS } from '@/lib/mock-data';
import type { TrustCenterView } from '@annex21/shared';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return DEMO_ORGS.map((org) => ({ org }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ org: string }>;
}): Promise<Metadata> {
  const { org } = await params;
  const trust = await loadTrust(org);
  if (!trust) return { title: 'Trust Center' };
  return {
    title: `Trust Center — ${trust.org.name}`,
    robots: trust.status === 'draft' ? { index: false, follow: false } : undefined,
  };
}

export default async function PublicTrustPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const trust = await loadTrust(org);
  if (!trust) notFound();

  const isDraft = trust.status === 'draft';

  return (
    <div className="min-h-screen bg-navy">
      {isDraft && (
        <div
          role="alert"
          className="bg-amber-500 px-4 py-3 text-center text-sm font-bold uppercase tracking-wide text-navy"
        >
          Brouillon — non publié
        </div>
      )}

      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
        <div className="flex items-center gap-4">
          <Logo href="/" compact />
          <div>
            <p className="text-sm font-semibold text-white">Trust Center</p>
            <p className="text-xs text-slate-400">
              {trust.org.name} · /trust/{trust.org.slug}
            </p>
          </div>
          <TrustStatusBadge status={trust.status} />
        </div>
        <div className="flex overflow-hidden rounded-lg border border-white/10 text-xs font-medium">
          <span className="bg-annex-deep px-3 py-1.5">FR</span>
          <span className="px-3 py-1.5 text-slate-400">EN</span>
          <span className="px-3 py-1.5 text-slate-400">DE</span>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-6 pb-16 md:grid-cols-3">
        <section className="card-glass rounded-2xl p-6 md:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-lg font-semibold">Contrôles NIS2</h1>
            <span className="text-[11px] text-slate-500">Sans preuves brutes</span>
          </div>
          <ul className="divide-y divide-white/5">
            {trust.controls.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-3.5">
                <span className="text-sm text-slate-200">{c.domain}</span>
                <ControlStatus status={c.status} />
              </li>
            ))}
          </ul>
        </section>

        <aside className="space-y-6">
          <section className="card-glass rounded-2xl p-6">
            <h2 className="mb-4 text-sm font-semibold text-slate-200">Attestations</h2>
            {trust.attestations.length === 0 ? (
              <p className="text-xs text-slate-500">Aucune attestation publiée.</p>
            ) : (
              <ul className="space-y-3">
                {trust.attestations.map((a) => (
                  <li key={a.id} className="rounded-lg bg-white/5 px-3 py-2">
                    <p className="text-sm text-white">{a.title}</p>
                    <p className="text-[11px] text-slate-400">
                      Publiée · {formatDate(a.publishedAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card-glass flex min-h-[180px] flex-col items-center justify-center rounded-2xl p-6 text-center">
            <div className="mb-3 h-10 w-10 rounded-full bg-annex-deep/80 shadow-glow" />
            <p className="text-sm font-semibold">
              {isDraft ? 'Profil non publié' : 'Profil en préparation'}
            </p>
            <p className="mt-1 max-w-[220px] text-[11px] text-slate-500">
              Certaines attestations et contrôles ne sont pas encore publiés. Aucune preuve
              brute n&apos;est exposée ici.
            </p>
          </section>
        </aside>
      </main>

      <DraftFooter trust={trust} />
    </div>
  );
}

function DraftFooter({ trust }: { trust: TrustCenterView }) {
  if (trust.status !== 'draft') return null;
  return (
    <p className="px-6 pb-8 text-center text-xs text-amber-200/80">
      {trust.unpublishedNotes ?? 'Ce Trust Center est un brouillon — non visible des acheteurs via l’API publique.'}
    </p>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
