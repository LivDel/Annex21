/**
 * Client API authentifié (cookie session + Bearer stub en dev).
 * Ne jamais appeler ces helpers depuis /trust/[org] public (RG-07/08).
 */
import type {
  BillingStatusResponse,
  Control,
  CreateCheckoutRequest,
  CreateCheckoutResponse,
  Incident,
  IncidentSlaCountdown,
  MeResponse,
  Nis2Assessment,
  OnboardingStatus,
  CompleteOnboardingRequest,
  CompleteOnboardingResponse,
  PlaybookTemplate,
  AssessmentAnswers,
  TrustCenterView,
  TrustDraftPatch,
  TrustPublishChecklist,
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

/** Trust editor — auth only. Jamais depuis /trust/[org] public (RG-07/08). */
export const DEFAULT_TRUST_SLUG = 'acme';

export function getTrustDraft(orgSlug = DEFAULT_TRUST_SLUG) {
  return api<TrustCenterView>(`/trust/${encodeURIComponent(orgSlug)}`);
}

export function patchTrustDraft(orgSlug: string, patch: TrustDraftPatch) {
  return api<TrustCenterView>(`/trust/${encodeURIComponent(orgSlug)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export function getTrustChecklist(orgSlug = DEFAULT_TRUST_SLUG) {
  return api<TrustPublishChecklist>(
    `/trust/${encodeURIComponent(orgSlug)}/checklist`,
  );
}

export function publishTrust(orgSlug: string) {
  return api<TrustCenterView>(`/trust/${encodeURIComponent(orgSlug)}/publish`, {
    method: 'POST',
    body: JSON.stringify({ disclaimer_ack: true }),
  });
}

export function unpublishTrust(orgSlug: string) {
  return api<TrustCenterView>(
    `/trust/${encodeURIComponent(orgSlug)}/unpublish`,
    { method: 'POST', body: JSON.stringify({}) },
  );
}


/** Onboarding server gate (Étape 1/2) — Redis/Postgres, not browser-only. */
export function getMe() {
  return api<MeResponse>('/me');
}

export function getOnboardingStatus() {
  return api<OnboardingStatus>('/onboarding/status');
}

export function postOnboardingComplete(payload: CompleteOnboardingRequest) {
  return api<CompleteOnboardingResponse>('/onboarding/complete', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function extractApiErrors(err: unknown): string[] {
  if (!err || typeof err !== 'object') return ['Erreur API'];
  const body = (err as { body?: unknown }).body;
  if (!body || typeof body !== 'object') {
    return [(err as Error).message || 'Erreur API'];
  }
  const b = body as { errors?: string[]; message?: string | string[] };
  if (Array.isArray(b.errors) && b.errors.length) return b.errors;
  if (Array.isArray(b.message)) return b.message;
  return [(err as Error).message || 'Erreur API'];
}

/** Billing ACV — auth + onboarding required. Secrets stay on API. */
export function getBillingStatus(orgId = DEFAULT_ORG) {
  return api<BillingStatusResponse>(
    `/billing/status?orgId=${encodeURIComponent(orgId)}`,
  );
}

export function createBillingCheckout(payload: CreateCheckoutRequest) {
  return api<CreateCheckoutResponse>('/billing/checkout', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
