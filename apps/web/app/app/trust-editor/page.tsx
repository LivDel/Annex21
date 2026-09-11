import { AppShell } from '@/components/app-shell';
import { TrustEditorPanel } from '@/components/trust/trust-editor-panel';

export const metadata = { title: 'Trust editor' };

/**
 * Trust editor V1 — Figma page 21:2 / frame 21:3.
 * Screenshots : screenshots/trust-editor/
 */
export default function TrustEditorPage() {
  return (
    <AppShell active="/app/trust-editor">
      <div data-figma-page="21:2" data-figma-file="Azjl81f8lWazR4mbgOovSW">
        <TrustEditorPanel />
      </div>
    </AppShell>
  );
}
