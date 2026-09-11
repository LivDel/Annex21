import Link from 'next/link';
import { Logo } from '@/components/logo';
import { SlaIncidentBanner } from '@/components/sla-banner';

const NAV = [
  { href: '/app/assessment', label: 'Assessment' },
  { href: '/app/playbooks', label: 'Playbooks ANSSI' },
  { href: '/app/evidence', label: 'Evidence' },
  { href: '/app/trust-editor', label: 'Trust editor' },
] as const;

export function AppShell({
  active,
  children,
}: {
  active: (typeof NAV)[number]['href'];
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-navy">
      <aside className="flex w-56 shrink-0 flex-col border-r border-white/10 px-3 py-5">
        <div className="mb-6 px-2">
          <Logo href="/app" compact />
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => {
            const isActive = item.href === active;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm ${
                  isActive
                    ? 'bg-white/10 font-medium text-white'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-annex-mint" />
                )}
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs">
          <p className="font-medium text-white">J. Martin</p>
          <p className="text-slate-400">CISO · Acme</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="px-6 pt-4">
          <SlaIncidentBanner variant="app" />
        </div>
        <div className="flex-1 px-6 py-6">{children}</div>
      </div>
    </div>
  );
}
