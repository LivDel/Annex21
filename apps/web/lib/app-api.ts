/**
 * Client API authentifié (cookie session + Bearer stub en dev).
 * Ne jamais appeler ces helpers depuis /trust/[org] public (RG-07/08).
 */
import type {
  Control,
  Incident,
  IncidentSlaCountdown,
  Nis2Assessment,
  PlaybookTemplate,
  AssessmentAnswers,
} from '@annex21/shared';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const AUTH_STUB = process.env.NEXT_PUBLIC_AUTH_STUB_TOKEN ?? 'annex21-dev-stub';

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AUTH_STUB}`,
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = await res.text();
    }
    const err = new Error(`API ${res.status}`) as Error & {
      status: number;
      body: unknown;
    };
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return (await res.json()) as T;
}

export const DEFAULT_ORG = 'org_acme';

export function listAssessments(orgId = DEFAULT_ORG) {
  return api<Nis2Assessment[]>(`/assessments?orgId=${encodeURIComponent(orgId)}`);
}

export function createAssessment(orgId = DEFAULT_ORG, answers?: AssessmentAnswers) {
  return api<Nis2Assessment>('/assessments', {
    method: 'POST',
    body: JSON.stringify({ orgId, answers }),
  });
}

export function updateAssessment(id: string, answers: AssessmentAnswers) {
  return api<Nis2Assessment>(`/assessments/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ answers }),
  });
}

export function completeAssessment(id: string) {
  return api<Nis2Assessment>(`/assessments/${id}/complete`, {
    method: 'POST',
    body: JSON.stringify({ disclaimer_ack: true }),
  });
}

export function listControls(orgId = DEFAULT_ORG) {
  return api<Control[]>(`/controls?orgId=${encodeURIComponent(orgId)}`);
}

export function getControl(id: string) {
  return api<Control>(`/controls/${encodeURIComponent(id)}`);
}

export function updateControl(
  id: string,
  patch: { status?: Control['status']; owner?: string; dueAt?: string },
) {
  return api<Control>(`/controls/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export function listPlaybookTemplates() {
  return api<PlaybookTemplate[]>('/playbooks/templates');
}

export function listIncidents(orgId = DEFAULT_ORG) {
  return api<Incident[]>(`/incidents?orgId=${encodeURIComponent(orgId)}`);
}

export function listIncidentSla(orgId = DEFAULT_ORG) {
  return api<IncidentSlaCountdown[]>(`/incidents/sla?orgId=${encodeURIComponent(orgId)}`);
}

export function openIncident(input: {
  orgId?: string;
  playbookTemplateId: string;
  title: string;
}) {
  return api<Incident>('/incidents', {
    method: 'POST',
    body: JSON.stringify({
      orgId: input.orgId ?? DEFAULT_ORG,
      playbookTemplateId: input.playbookTemplateId,
      title: input.title,
    }),
  });
}

export function linkStepEvidence(incidentId: string, stepId: string, evidenceId: string) {
  return api(`/incidents/${incidentId}/steps/${stepId}/evidence`, {
    method: 'POST',
    body: JSON.stringify({ evidenceId }),
  });
}

export function completeStep(
  incidentId: string,
  stepId: string,
  evidenceIds?: string[],
) {
  return api(`/incidents/${incidentId}/steps/${stepId}/complete`, {
    method: 'POST',
    body: JSON.stringify({ evidenceIds }),
  });
}

export function closeIncident(incidentId: string) {
  return api<Incident>(`/incidents/${incidentId}/close`, { method: 'POST' });
}

export function formatRemaining(ms: number): string {
  if (ms <= 0) return 'dépassé';
  const totalMin = Math.floor(ms / 60000);
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  const mins = totalMin % 60;
  if (days > 0) return `${days}j ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}
