import type { TrustCenterView } from '@annex21/shared';
import { MOCK_TRUST } from './mock-data';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/**
 * Charge un Trust Center pour /trust/[org].
 * - API publique = published only (404 si draft) — RG-07.
 * - Timeout court : `next build` ne doit pas pendre si l'API n'écoute pas.
 * - Fallback mock : /trust/demo-draft affiche l'état BROUILLON (sans evidence).
 * - RG-08 : aucune evidence brute dans ce payload.
 */
export async function loadTrust(orgSlug: string): Promise<TrustCenterView | null> {
  try {
    const res = await fetch(`${API}/public/trust/${orgSlug}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(800),
    });
    if (res.ok) {
      return (await res.json()) as TrustCenterView;
    }
  } catch {
    // API absente / timeout pendant `next build` ou premier boot.
  }
  return MOCK_TRUST[orgSlug] ?? null;
}
