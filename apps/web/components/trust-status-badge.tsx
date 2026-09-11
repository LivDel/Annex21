import type { TrustStatus } from '@annex21/shared';

/** Badge DRAFT vs PUBLIC — volontairement très visible (RG-07). */
export function TrustStatusBadge({ status }: { status: TrustStatus }) {
  if (status === 'draft') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/60 bg-amber-400/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-200">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        Brouillon · non publié
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-annex-mint/50 bg-annex-mint/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-annex-mint">
      <span className="h-1.5 w-1.5 rounded-full bg-annex-mint" />
      Lecture seule · Public
    </span>
  );
}
