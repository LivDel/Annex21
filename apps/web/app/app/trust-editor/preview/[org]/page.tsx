import { notFound } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { TrustStatusBadge } from '@/components/trust-status-badge';
import { ControlStatus } from '@/components/control-status';
import { loadTrustPreview } from '@/lib/api';

/**
 * Preview AUTH — draft autorisé (RG-07).
 * Ne pas confondre avec `/trust/[org]` public.
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
      {isDraft && (
        <div
          role="alert"
          className="mb-6 rounded-xl bg-amber-500 px-4 py-3 text-center text-sm font-bold uppercase tracking-wide text-navy"
        >
          Brouillon — non publié (preview auth only)
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Preview éditeur</p>
          <h1 className="text-2xl font-semibold">{trust.org.name}</h1>
          <p className="text-sm text-slate-400">/app/trust-editor/preview/{trust.org.slug}</p>
        </div>
        <TrustStatusBadge status={trust.status} />
      </div>

      <div className="card-glass rounded-2xl p-6">
        <ul className="divide-y divide-white/5">
          {trust.controls.map((c) => (
            <li key={c.id} className="flex items-center justify-between py-3">
              <span className="text-sm text-slate-200">{c.domain}</span>
              <ControlStatus status={c.status} />
            </li>
          ))}
        </ul>
        {isDraft && trust.unpublishedNotes && (
          <p className="mt-4 text-xs text-amber-200/80">{trust.unpublishedNotes}</p>
        )}
      </div>

      <p className="mt-6 text-xs text-slate-500">
        Cette page n&apos;est pas la surface publique.{' '}
        <Link href="/trust/acme" className="text-annex-cyan underline">
          Voir un Trust publié
        </Link>
      </p>
    </AppShell>
  );
}
