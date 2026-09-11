import Link from 'next/link';
import { Logo } from '@/components/logo';
import { SlaIncidentBanner } from '@/components/sla-banner';

const NAV: { href: string; label: string; match: string }[] = [
  { href: '/app/assessment', label: 'Assessment', match: '/app/assessment' },
  { href: '/app/controls', label: 'Contrôles', match: '/app/controls' },
  { href: '/app/playbooks', label: 'Playbooks', match: '/app/playbooks' },
  { href: '/app/incidents', label: 'Incidents', match: '/app/incidents' },
  { href: '/app/evidence', label: 'Evidence', match: '/app/evidence' },
  { href: '/app/trust-editor', label: 'Trust editor', match: '/app/trust-editor' },
  { href: '/app/billing', label: 'Facturation', match: '/app/billing' },
  { href: '/app', label: 'Accueil', match: '/app' },
];

export type AppNavActive =
  | '/app'
  | '/app/assessment'
  | '/app/controls'
  | '/app/playbooks'
  | '/app/incidents'
  | '/app/evidence'
  | '/app/trust-editor'
  | '/app/billing';

export function AppShell({
  active,
  children,
  slaLive,
}: {
  active: AppNavActive;
  children: React.ReactNode;
  /** Overlay Figma LUIX : slot bannière SLA live */
  slaLive?: React.ReactNode;
}) {
  return (
    <div className="surface-void-app flex min-h-screen" data-figma-page="14:2" data-figma-file="Azjl81f8lWazR4mbgOovSW">
      <aside
        className="card-glass flex w-56 shrink-0 flex-col rounded-none border-y-0 border-l-0 border-r border-white/10 px-3 py-5"
        data-luix-frame="app-sidebar"
      >
        <div className="mb-6 px-2">
          <Logo href="/app" compact />
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => {
            const activeHere =
              item.match === '/app' ? active === '/app' : item.match === active;
            return (
              <Link
                key={`${item.label}-${item.match}`}
                href={item.href}
                className={`rounded-full px-3 py-2 text-sm ${
                  activeHere
                    ? 'bg-annex-deep/40 font-medium text-white ring-1 ring-annex-blue/40'
                    : 'text-[#CBD5E1] hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <span
                  className={`mr-2 inline-block h-1.5 w-1.5 rounded-full ${
                    activeHere ? 'bg-annex-blue' : 'bg-slate-600'
                  }`}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-annex-deep text-[11px] font-semibold">
            JM
          </div>
          <div>
            <p className="font-medium text-white">J. Martin</p>
            <p className="text-[#CBD5E1]">CISO · Acme</p>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="px-6 pt-4" data-luix-slot="sla-banner">
          {slaLive ?? <SlaIncidentBanner variant="app" />}
        </div>
        <div className="flex-1 px-6 py-6" data-luix-frame="app-main">
          {children}
        </div>
      </div>
    </div>
  );
}
