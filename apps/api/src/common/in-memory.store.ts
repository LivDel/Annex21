import type {
  AuditEvent,
  Control,
  Evidence,
  Incident,
  Nis2Assessment,
  Organization,
  PlaybookTemplate,
  TrustCenterView,
} from '@annex21/shared';

/**
 * Seed + fallback in-memory (dev). Postgres via DomainStore quand DATABASE_URL/POSTGRES_* OK.
 * Seed aligné sur les maquettes : Acme SAS.
 * Assessment / incidents / evidence : jamais montés sur /public/trust (RG-07/08).
 */
const now = '2026-09-11T10:00:00.000Z';

export const organizations: Organization[] = [
  {
    id: 'org_acme',
    slug: 'acme',
    name: 'Acme SAS',
    country: 'FR',
    createdAt: now,
    nis2Sector: null,
    cisoRole: null,
    onboardingCompletedAt: null,
  },
  {
    id: 'org_draft',
    slug: 'demo-draft',
    name: 'Nordic MSP (démo brouillon)',
    country: 'DE',
    createdAt: now,
    nis2Sector: null,
    cisoRole: null,
    onboardingCompletedAt: null,
  },
  {
    id: 'org_novatech',
    slug: 'novatech',
    name: 'NovaTech',
    country: 'FR',
    createdAt: now,
    nis2Sector: null,
    cisoRole: null,
    onboardingCompletedAt: null,
  },
];
