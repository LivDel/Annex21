import { notFound } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { TrustStatusBadge } from '@/components/trust-status-badge';
import { ControlStatus } from '@/components/control-status';
import { loadTrustPreview } from '@/lib/api';

/**
 * Preview AUTH — draft autorisé (RG-07).
 * Figma 21:8 — ce n'est PAS l'URL publique /trust/:org.
 */
export default async function TrustPreviewPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const trust = await loadTrustPreview(org);
  if (!trust) notFound();

  const isDraft = trust.status === 'draft';

  return (
    <AppShell active="/app/trust-editor">
      <div
        data-luix-frame="02-preview-auth-draft"
        data-figma-node="21:8"
        data-figma-page="21:2"
      >
        {isDraft && (
          <div
            role="alert"
            className="mb-4 rounded-xl bg-amber-500 px-4 py-3 text-center text-sm font-bold uppercase tracking-wide text-navy"
          >
            Brouillon — non publié (preview auth only)
          </div>
        )}

        <div
          role="note"
          className="mb-6 flex items-start gap-2 rounded-xl border border-annex-blue/30 bg-annex-deep/20 px-4 py-3 text-sm text-[#CBD5E1]"
        >
          <span aria-hidden>⚠️</span>
          <span>
            <strong className="font-semibold text-white">PREVIEW AUTH</strong> — ce
            n&apos;est PAS l&apos;URL publique /trust/:org
          </span>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-[#CBD5E1]">
              Preview éditeur
            </p>
            <h1 className="text-2xl font-semibold">{trust.org.name}</h1>
            <p className="text-sm text-[#CBD5E1]">
              /app/trust-editor/preview/{trust.org.slug} · draft ≠ public
            </p>
          </div>
          <TrustStatusBadge status={trust.status} />
        </div>

        <div className="card-glass rounded-2xl p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200">
              Contrôles (aperçu brouillon)
            </h2>
            <span className="text-[11px] text-[#CBD5E1]">
              Sans preuves brutes — résumés uniquement
            </span>
          </div>
          <ul className="divide-y divide-white/5">
            {trust.controls.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-3">
                <span className="text-sm text-slate-200">{c.domain}</span>
                <ControlStatus status={c.status} />
              </li>
            ))}
            {trust.controls.length === 0 && (
              <li className="py-3 text-sm text-[#CBD5E1]">Aucun contrôle.</li>
            )}
          </ul>
          {isDraft && trust.unpublishedNotes && (
            <p className="mt-4 text-xs text-amber-200/80">
              Notes non publiées : {trust.unpublishedNotes}
            </p>
          )}
        </div>

        <p className="mt-6 text-xs text-annex-cyan">
          Cette page n&apos;est pas la surface publique.{' '}
          <Link href={`/trust/${trust.org.slug}`} className="underline">
            Voir /trust/{trust.org.slug}
          </Link>{' '}
          {isDraft ? '(publié) — draft → 404' : '(publié)'}
        </p>
      </div>
    </AppShell>
  );
}
