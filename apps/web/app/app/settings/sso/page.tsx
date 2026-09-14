import { AppShell } from '@/components/app-shell';
import { RequireOnboarding } from '@/components/require-onboarding';
import { SsoWizard } from '@/components/sso/sso-wizard';

export const metadata = { title: 'Paramètres · SSO' };

export default function SettingsSsoPage() {
  return (
    <RequireOnboarding>
      <AppShell active="/app/settings">
        <SsoWizard />
      </AppShell>
    </RequireOnboarding>
  );
}
