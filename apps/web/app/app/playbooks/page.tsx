import { AppShell } from '@/components/app-shell';
import { PlaybooksPanel } from '@/components/playbooks/playbooks-panel';

export const metadata = { title: 'Playbooks ANSSI' };

export default function PlaybooksPage() {
  return (
    <AppShell active="/app/playbooks">
      <PlaybooksPanel />
    </AppShell>
  );
}
