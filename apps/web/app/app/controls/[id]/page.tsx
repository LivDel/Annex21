import { AppShell } from '@/components/app-shell';
import { ControlDetailPanel } from '@/components/controls/control-detail-panel';

export const metadata = { title: 'Contrôle' };

export default async function ControlDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolved = await Promise.resolve(params);
  return (
    <AppShell active="/app/controls">
      <ControlDetailPanel id={resolved.id} />
    </AppShell>
  );
}
