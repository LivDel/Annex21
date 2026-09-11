'use client';

import { useState } from 'react';
import type { IncidentSlaCountdown } from '@annex21/shared';
import { AppShell } from '@/components/app-shell';
import { SlaIncidentBanner } from '@/components/sla-banner';
import { IncidentsPanel } from '@/components/incidents/incidents-panel';

export default function IncidentsPage() {
  const [live, setLive] = useState<IncidentSlaCountdown | null>(null);

  return (
    <AppShell
      active="/app/incidents"
      slaLive={<SlaIncidentBanner variant="app" live={live} />}
    >
      <IncidentsPanel onSlaChange={setLive} />
    </AppShell>
  );
}
