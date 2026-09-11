import Link from 'next/link';

export function Logo({ href = '/', compact = false }: { href?: string; compact?: boolean }) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/annex21-logo-on-dark.svg"
        alt="Annex21"
        className={compact ? 'h-8 w-auto' : 'h-9 w-auto'}
      />
    </Link>
  );
}
