import { AppShell } from '@/components/app-shell';
import { ControlsPanel } from '@/components/controls/controls-panel';

export const metadata = { title: 'Contrôles' };

export default async function ControlsPage({
  searchParams,
}: {
  searchParams?: Promise<{ focus?: string }>;
}) {
  const sp = searchParams ? await searchParams : undefined;
  return (
    <AppShell active="/app/controls">
      <ControlsPanel focusId={sp?.focus} />
    </AppShell>
  );
}
