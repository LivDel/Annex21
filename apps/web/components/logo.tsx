import Link from 'next/link';

/**
 * Logo Annex21 — SVG brand assets (Figma v2).
 * mark = bouclier seul ; full = logo wordmark on-dark.
 */
export function Logo({
  href = '/',
  compact = false,
  mark = false,
}: {
  href?: string;
  compact?: boolean;
  mark?: boolean;
}) {
  const src = mark ? '/brand/annex21-mark.svg' : '/brand/annex21-logo-on-dark.svg';
  const height = mark ? (compact ? 'h-8 w-8' : 'h-9 w-9') : compact ? 'h-8 w-auto' : 'h-9 w-auto';

  return (
    <Link href={href} className="flex items-center gap-2.5" aria-label="Annex21">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className={height} />
      {mark && <span className="text-sm font-semibold tracking-tight text-white">Annex21</span>}
    </Link>
  );
}
