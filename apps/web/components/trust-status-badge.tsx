import type { TrustStatus } from '@annex21/shared';

/**
 * Badges Trust — Figma 21:2.
 * draft : « Brouillon » ; published : « Publié ».
 * Compléter avec pill « Public hors ligne » / « Lecture seule · Public » côté page.
 */
export function TrustStatusBadge({
  status,
  compact,
}: {
  status: TrustStatus;
  compact?: boolean;
}) {
  if (status === 'draft') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/60 bg-amber-400/10 px-3 py-1 text-xs font-semibold tracking-wide text-amber-200">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        {compact ? 'Brouillon' : 'Brouillon'}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-annex-mint/50 bg-annex-mint/20 px-3 py-1 text-xs font-semibold tracking-wide text-annex-mint">
      <span className="h-1.5 w-1.5 rounded-full bg-annex-mint" />
      Publié
    </span>
  );
}

export function TrustPublicOfflinePill() {
  return (
    <span className="rounded-full border border-[#CBD5E1]/35 px-2.5 py-0.5 text-[11px] text-[#CBD5E1]">
      Public hors ligne
    </span>
  );
}

export function TrustReadOnlyPublicPill() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-annex-mint/60 px-2.5 py-0.5 text-[11px] font-medium text-annex-mint">
      <span className="h-1.5 w-1.5 rounded-full bg-annex-mint" />
      Lecture seule · Public
    </span>
  );
}
