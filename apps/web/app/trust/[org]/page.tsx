import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Logo } from '@/components/logo';
import {
  TrustReadOnlyPublicPill,
  TrustStatusBadge,
} from '@/components/trust-status-badge';
import { ControlStatus } from '@/components/control-status';
import { loadTrust } from '@/lib/api';
import { DEMO_ORGS } from '@/lib/mock-data';

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
  };
}

/**
 * Surface PUBLIQUE `/trust/[org]`.
 * RG-07 : published only — draft → 404 (pas de bannière brouillon ici).
 * Preview draft = `/app/trust-editor/preview/[org]` uniquement.
 * Figma 21:18 (contenu) / 21:23 (empty « Profil en préparation »).
 * Void soft, muted #CBD5E1, no circular orbs.
 */
export default async function PublicTrustPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const trust = await loadTrust(org);
  // RG-07 défense en profondeur : jamais afficher un draft sur la route publique.
  if (!trust || trust.status !== 'published') notFound();

  const isEmpty =
    trust.controls.length === 0 && trust.attestations.length === 0;

  if (isEmpty) {
    return (
      <div
        className="surface-void min-h-screen"
        data-luix-frame="05-empty-profil-en-preparation"
        data-figma-node="21:23"
        data-figma-page="21:2"
      >
        <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div className="flex flex-wrap items-center gap-4">
            <Logo href="/" compact />
            <div>
              <p className="text-sm font-semibold text-white">Trust Center</p>
              <p className="text-xs text-[#CBD5E1]">
                {trust.org.name} · /trust/{trust.org.slug}
              </p>
            </div>
            <TrustReadOnlyPublicPill />
          </div>
          <LocaleSwitcher active={trust.locale} />
        </header>

        <main className="mx-auto flex max-w-3xl flex-col items-center px-6 pb-20 pt-10">
          <div className="card-glass flex w-full flex-col items-center rounded-2xl px-8 py-16 text-center">
            <h1 className="text-2xl font-semibold text-white">
              Profil en préparation
            </h1>
            <p className="mt-3 max-w-md text-sm text-[#CBD5E1]">
              Certaines attestations et contrôles ne sont pas encore publiés.
              Aucune preuve brute n&apos;est exposée ici.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              <span className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-white">
                Contrôles à venir
              </span>
              <span className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-white">
                Attestations à venir
              </span>
              <span className="rounded-full border border-annex-mint/50 px-3 py-1.5 text-xs text-annex-mint">
                Zéro evidence brute
              </span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div
      className="surface-void min-h-screen"
      data-luix-frame="04-trust-org-public"
      data-figma-node="21:18"
      data-figma-page="21:2"
    >
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
        <div className="flex flex-wrap items-center gap-4">
          <Logo href="/" compact />
          <div>
            <p className="text-sm font-semibold text-white">Trust Center</p>
            <p className="text-xs text-[#CBD5E1]">
              {trust.org.name} · /trust/{trust.org.slug}
            </p>
          </div>
          <TrustStatusBadge status={trust.status} />
          <TrustReadOnlyPublicPill />
        </div>
        <LocaleSwitcher active={trust.locale} />
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-6 pb-16 md:grid-cols-3">
        <section className="card-glass rounded-2xl p-6 md:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-lg font-semibold">Contrôles NIS2</h1>
            <span className="text-[11px] text-[#CBD5E1]">Sans preuves brutes</span>
          </div>
          <ul className="divide-y divide-white/5">
            {trust.controls.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-3.5">
                <span className="text-sm text-slate-200">{c.domain}</span>
                <ControlStatus status={c.status} />
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[11px] text-[#CBD5E1]">
            Aucune preuve brute · aucun fichier · aucun hash exposé
          </p>
        </section>

        <aside className="space-y-6">
          <section className="card-glass rounded-2xl p-6">
            <h2 className="mb-4 text-sm font-semibold text-slate-200">
              Attestations
            </h2>
            {trust.attestations.length === 0 ? (
              <p className="text-xs text-[#CBD5E1]">Aucune attestation publiée.</p>
            ) : (
              <ul className="space-y-3">
                {trust.attestations.map((a) => (
                  <li key={a.id} className="rounded-lg bg-white/5 px-3 py-2">
                    <p className="text-sm text-white">{a.title}</p>
                    <p className="text-[11px] text-[#CBD5E1]">
                      Publiée · {formatDate(a.publishedAt, trust.locale)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card-glass rounded-2xl border border-annex-mint/50 p-6">
            <h2 className="text-sm font-semibold text-annex-mint">
              Surface publique
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-[#CBD5E1]">
              Lecture seule. draft ≠ public. Aucune evidence brute.
            </p>
          </section>
        </aside>
      </main>
    </div>
  );
}

function LocaleSwitcher({ active }: { active: string }) {
  return (
    <div className="flex overflow-hidden rounded-lg border border-white/10 text-xs font-medium">
      {(['fr', 'en', 'de'] as const).map((l) => (
        <span
          key={l}
          className={
            active === l
              ? 'bg-annex-deep px-3 py-1.5 uppercase'
              : 'px-3 py-1.5 uppercase text-[#CBD5E1]'
          }
        >
          {l}
        </span>
      ))}
    </div>
  );
}

function formatDate(iso: string, locale: string): string {
  const loc = locale === 'en' ? 'en-GB' : locale === 'de' ? 'de-DE' : 'fr-FR';
  return new Date(iso).toLocaleDateString(loc, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
