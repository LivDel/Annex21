/**
 * RG-10 — Data in-EU
 *
 * Postgres, Redis, MinIO, backups et logs applicatifs sensibles doivent
 * rester dans l'Union européenne. Ce fichier documente la contrainte pour
 * les modules qui touchent du stockage tenant.
 *
 * Enforcing draft ≠ public : voir TrustService.getPublicBySlug (404 si draft).
 * Enforcing no raw evidence on public Trust : PublicTrustCenter n'a pas de champ evidence.
 */
export const DATA_RESIDENCY = 'EU' as const;

const US_REGION_RE = /(^|[^a-z])us[-_]/i;
const NON_EU_HINTS = [/united.?states/i, /\bus\b/i, /america/i];

function collectRegionSignals(): { key: string; value: string }[] {
  const keys = [
    'DATA_RESIDENCY',
    'CLOUD_REGION',
    'AWS_REGION',
    'AWS_DEFAULT_REGION',
    'MINIO_REGION',
    'POSTGRES_REGION',
    'FLY_REGION',
  ] as const;
  const out: { key: string; value: string }[] = [];
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) out.push({ key, value });
  }
  return out;
}

function looksNonEu(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  const upper = v.toUpperCase();
  if (upper === 'EU' || upper === 'EEA' || upper === 'EUROPE') return false;
  if (/^eu[-_]/i.test(v) || /^europe/i.test(v)) return false;
  if (US_REGION_RE.test(v)) return true;
  if (upper === 'US' || upper === 'USA') return true;
  return NON_EU_HINTS.some((re) => re.test(v));
}

export type EuResidencyResult = {
  ok: boolean;
  residency: string;
  violations: string[];
};

export function checkEuResidency(): EuResidencyResult {
  const residency = (process.env.DATA_RESIDENCY ?? 'EU').trim() || 'EU';
  const violations: string[] = [];

  if (residency.toUpperCase() !== 'EU' && residency.toUpperCase() !== 'EEA') {
    violations.push(`DATA_RESIDENCY=${residency} (attendu EU)`);
  }

  for (const { key, value } of collectRegionSignals()) {
    if (key === 'DATA_RESIDENCY') continue;
    if (looksNonEu(value)) {
      violations.push(`${key}=${value} (région hors UE / us-*)`);
    }
  }

  return {
    ok: violations.length === 0,
    residency,
    violations,
  };
}

/**
 * Fail-fast si DATA_RESIDENCY ≠ EU, ou si une région cloud us-* / hors UE est détectée.
 * FORCE_EU_RESIDENCY_WARN=1 : override warning UNIQUEMENT hors production.
 * En production : fail closed TOUJOURS — le flag warn est ignoré / interdit.
 */
export function assertEuResidency(): void {
  const result = checkEuResidency();
  if (result.ok) return;

  const detail = result.violations.join('; ');
  const message =
    `Annex21 refuse un déploiement hors UE (RG-10). ${detail}. ` +
    `Postgres / Redis / MinIO / backups doivent rester in-EU.`;

  const isProd = (process.env.NODE_ENV ?? 'development') === 'production';
  const warnFlag = process.env.FORCE_EU_RESIDENCY_WARN === '1';

  // Prod path : NEVER warn-only — even if FORCE_EU_RESIDENCY_WARN is set.
  if (isProd) {
    if (warnFlag) {
      // eslint-disable-next-line no-console
      console.error(
        '⚠️  FORCE_EU_RESIDENCY_WARN ignoré en production — fail closed (RG-10).',
      );
    }
    throw new Error(message);
  }

  if (warnFlag) {
    // eslint-disable-next-line no-console
    console.error(`⚠️  EU RESIDENCY WARNING (dev override): ${message}`);
    return;
  }

  throw new Error(message);
}
