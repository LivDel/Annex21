/**
 * Client helpers for server-side onboarding gate (Architecte GO).
 * Source of truth = API → orgs.onboarding_completed_at (Postgres) + session mirror.
 * localStorage / sessionStorage = cache only after successful POST.
 */
import type {
  CompleteOnboardingRequest,
  CompleteOnboardingResponse,
  MeResponse,
  OnboardingStatus,
} from '@annex21/shared';

export const ONBOARDING_DONE_KEY = 'annex21_onboarding_done';
export const ONBOARDING_ORG_KEY = 'annex21_onboarding_org';

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

export function fetchOnboardingStatus(): Promise<OnboardingStatus> {
  return api<OnboardingStatus>('/onboarding/status');
}

export function fetchMe(): Promise<MeResponse> {
  return api<MeResponse>('/me');
}

export function completeOnboarding(
  payload: CompleteOnboardingRequest,
): Promise<CompleteOnboardingResponse> {
  return api<CompleteOnboardingResponse>('/onboarding/complete', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** Optimistic local cache after server complete — not authoritative. */
export function markOnboardingDoneLocal(): void {
  try {
    sessionStorage.setItem(ONBOARDING_DONE_KEY, '1');
  } catch {
    /* ignore */
  }
  try {
    localStorage.setItem(ONBOARDING_DONE_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function clearOnboardingDoneLocal(): void {
  try {
    sessionStorage.removeItem(ONBOARDING_DONE_KEY);
  } catch {
    /* ignore */
  }
  try {
    localStorage.removeItem(ONBOARDING_DONE_KEY);
  } catch {
    /* ignore */
  }
}
