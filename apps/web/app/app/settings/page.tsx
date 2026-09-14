import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { RequireOnboarding } from '@/components/require-onboarding';

export const metadata = { title: 'Paramètres' };

export default function SettingsIndexPage() {
  return (
    <RequireOnboarding>
      <AppShell active="/app/settings">
        <h1 className="text-2xl font-semibold text-[#F8FAFC]">Paramètres</h1>
        <p className="mt-1 text-sm text-[#CBD5E1]">
          SSO, utilisateurs et rétention (V1).
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Link
            href="/app/settings/sso"
            className="card-glass rounded-2xl border border-white/10 p-5 hover:border-annex-blue/40"
          >
            <h2 className="font-semibold text-[#F8FAFC]">SSO / IdP</h2>
            <p className="mt-1 text-sm text-[#CBD5E1]">
              Wizard OIDC / SAML · test · révoquer
            </p>
          </Link>
          <Link
            href="/app/settings/users"
            className="card-glass rounded-2xl border border-white/10 p-5 hover:border-annex-blue/40"
          >
            <h2 className="font-semibold text-[#F8FAFC]">Utilisateurs</h2>
            <p className="mt-1 text-sm text-[#CBD5E1]">
              Mapping rôles CDC · nouveaux = member
            </p>
          </Link>
        </div>
      </AppShell>
    </RequireOnboarding>
  );
}
