import { AppShell } from '@/components/app-shell';
import { TrustStatusBadge } from '@/components/trust-status-badge';
import Link from 'next/link';

export const metadata = { title: 'Trust editor' };

export default function TrustEditorPage() {
  return (
    <AppShell active="/app/trust-editor">
      <div
        role="alert"
        className="mb-6 rounded-xl border border-amber-400/50 bg-amber-500 px-4 py-3 text-center text-sm font-bold uppercase tracking-wide text-navy shadow-[0_0_40px_rgba(245,158,11,0.35)]"
      >
        Brouillon — non publié · draft ≠ public (RG-07)
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Trust editor</h1>
          <p className="text-sm text-slate-400">
            Ce contenu n&apos;est <span className="font-semibold text-amber-200">pas</span> visible sur
            `/trust/:org` tant qu&apos;il n&apos;est pas publié.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TrustStatusBadge status="draft" />
          <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-[11px] text-slate-400">
            Public : hors ligne
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card-glass rounded-2xl border border-amber-400/25 p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-200">Éditeur (auth)</p>
          <p className="mt-2 text-sm text-slate-300">
            Prévisualiser le brouillon sans l&apos;exposer aux acheteurs.
          </p>
          <Link
            href="/app/trust-editor/preview/demo-draft"
            className="mt-4 inline-flex rounded-full border border-amber-400/40 px-4 py-2 text-sm font-medium text-amber-200"
          >
            Prévisualiser brouillon (auth)
          </Link>
        </div>
        <div className="card-glass rounded-2xl border border-annex-mint/25 p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-annex-mint">Surface publique</p>
          <p className="mt-2 text-sm text-slate-300">
            Uniquement le Trust publié. `/trust/demo-draft` → 404.
          </p>
          <Link
            href="/trust/acme"
            className="mt-4 inline-flex rounded-full bg-annex-deep px-4 py-2 text-sm font-medium"
          >
            Voir Acme (public)
          </Link>
        </div>
      </div>

      <p className="mt-6 text-xs text-slate-500">
        POST /trust/:orgSlug/publish (auth stub) passe draft → published. Les preuves brutes restent
        sur /evidence.
      </p>
    </AppShell>
  );
}
