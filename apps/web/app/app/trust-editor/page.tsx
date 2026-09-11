import { AppShell } from '@/components/app-shell';
import { TrustStatusBadge } from '@/components/trust-status-badge';
import Link from 'next/link';

export const metadata = { title: 'Trust editor' };

export default function TrustEditorPage() {
  return (
    <AppShell active="/app/trust-editor">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Trust editor</h1>
          <p className="text-sm text-slate-400">
            RG-07 : un Trust n&apos;est public qu&apos;après publication explicite.
          </p>
        </div>
        <TrustStatusBadge status="draft" />
      </div>

      <div className="card-glass rounded-2xl p-6">
        <p className="text-sm text-slate-300">
          Placeholder éditeur. Prévisualiser l&apos;état public vs brouillon :
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/trust/acme"
            className="rounded-full bg-annex-deep px-4 py-2 text-sm font-medium"
          >
            Prévisualiser Acme (public)
          </Link>
          <Link
            href="/app/trust-editor/preview/demo-draft"
            className="rounded-full border border-amber-400/40 px-4 py-2 text-sm font-medium text-amber-200"
          >
            Prévisualiser brouillon (auth)
          </Link>
        </div>
        <p className="mt-6 text-xs text-slate-500">
          `/trust/demo-draft` public → 404 (RG-07). Draft uniquement via preview auth.
          POST /trust/:orgSlug/publish (auth stub) passe draft → published.
        </p>
      </div>
    </AppShell>
  );
}
