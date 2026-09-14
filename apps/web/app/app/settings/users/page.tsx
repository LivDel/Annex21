import { AppShell } from '@/components/app-shell';
import { RequireOnboarding } from '@/components/require-onboarding';
import { UsersMapping } from '@/components/sso/users-mapping';

export const metadata = { title: 'Utilisateurs · SSO' };

export default function SettingsUsersPage() {
  return (
    <RequireOnboarding>
      <AppShell active="/app/settings">
        <UsersMapping />
      </AppShell>
    </RequireOnboarding>
  );
}
