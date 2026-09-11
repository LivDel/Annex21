import type { PublicTrustCenter, TrustCenterView } from '@annex21/shared';
import { MOCK_PUBLIC_TRUST, MOCK_TRUST_PREVIEW } from './mock-data';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const AUTH_STUB = process.env.NEXT_PUBLIC_AUTH_STUB_TOKEN ?? 'annex21-dev-stub';

/**
 * Charge un Trust Center pour la surface PUBLIQUE `/trust/[org]`.
 * RG-07 : published only — jamais de fallback draft (même en mock / hors-ligne).
 * RG-08 : aucune evidence brute dans ce payload.
 */
export async function loadTrust(orgSlug: string): Promise<PublicTrustCenter | null> {
  try {
    const res = await fetch(`${API}/public/trust/${orgSlug}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(800),
    });
    if (res.ok) {
      const data = (await res.json()) as PublicTrustCenter;
      // Défense en profondeur : refuse tout statut non published.
      if (data.status !== 'published') return null;
      return data;
    }
    // 404 (draft ou inconnu) → pas de fallback draft.
  } catch {
    // API absente / timeout pendant `next build` ou premier boot.
  }

  const mock = MOCK_PUBLIC_TRUST[orgSlug];
  return mock?.status === 'published' ? mock : null;
}

/**
 * Preview authentifiée (éditeur) — draft autorisé.
 * Header aligné sur AuthStubGuard : Authorization: Bearer <token>.
 * Ne doit JAMAIS être utilisé par `/trust/[org]` public.
 */
export async function loadTrustPreview(orgSlug: string): Promise<TrustCenterView | null> {
  try {
    const res = await fetch(`${API}/trust/${orgSlug}`, {
      cache: 'no-store',
      credentials: 'include',
      headers: { Authorization: `Bearer ${AUTH_STUB}` },
      signal: AbortSignal.timeout(800),
    });
    if (res.ok) {
      return (await res.json()) as TrustCenterView;
    }
  } catch {
    // API absente.
  }
  return MOCK_TRUST_PREVIEW[orgSlug] ?? null;
}
