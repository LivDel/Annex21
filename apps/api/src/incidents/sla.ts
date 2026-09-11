import type { Incident, IncidentSla, IncidentSlaCountdown, SlaWindow } from '@annex21/shared';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export function buildSla(openedAt: Date): IncidentSla {
  const t = openedAt.getTime();
  return {
    openedAt: openedAt.toISOString(),
    due24hAt: new Date(t + 24 * HOUR).toISOString(),
    due72hAt: new Date(t + 72 * HOUR).toISOString(),
    due1mAt: new Date(t + 30 * DAY).toISOString(),
  };
}

export function countdownFor(incident: Incident, now = Date.now()): IncidentSlaCountdown {
  const remaining24hMs = new Date(incident.sla.due24hAt).getTime() - now;
  const remaining72hMs = new Date(incident.sla.due72hAt).getTime() - now;
  const remaining1mMs = new Date(incident.sla.due1mAt).getTime() - now;

  let nextDeadline: SlaWindow = '1m';
  if (remaining24hMs > 0) nextDeadline = '24h';
  else if (remaining72hMs > 0) nextDeadline = '72h';
  else nextDeadline = '1m';

  return {
    incidentId: incident.id,
    title: incident.title,
    remaining24hMs,
    remaining72hMs,
    remaining1mMs,
    nextDeadline,
  };
}
