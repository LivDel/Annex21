import type {
  Evidence,
  Organization,
  TrustCenterView,
} from '@annex21/shared';

/**
 * Store in-memory MVP (remplacé par Postgres in-EU en durcissement).
 * Seed aligné sur les maquettes : Acme Industrie SAS.
 */
const now = '2026-09-11T10:00:00.000Z';

export const organizations: Organization[] = [
  {
    id: 'org_acme',
    slug: 'acme',
    name: 'Acme Industrie SAS',
    country: 'FR',
    createdAt: now,
  },
  {
    id: 'org_draft',
    slug: 'demo-draft',
    name: 'Nordic MSP (démo brouillon)',
    country: 'DE',
    createdAt: now,
  },
];

export const trustCenters: TrustCenterView[] = [
  {
    org: { slug: 'acme', name: 'Acme Industrie SAS', country: 'FR' },
    status: 'published',
    locale: 'fr',
    controls: [
      { id: 'c1', domain: 'Gouvernance & politiques', status: 'attested' },
      { id: 'c2', domain: 'Gestion des risques', status: 'attested' },
      { id: 'c3', domain: "Continuité d'activité", status: 'in_progress' },
      { id: 'c4', domain: 'Réponse aux incidents', status: 'attested' },
      { id: 'c5', domain: "Chaîne d'approvisionnement", status: 'preparing' },
      { id: 'c6', domain: 'Formation & sensibilisation', status: 'attested' },
    ],
    attestations: [
      {
        id: 'a1',
        title: 'Déclaration de conformité',
        publishedAt: '2026-08-12T00:00:00.000Z',
      },
      {
        id: 'a2',
        title: 'Attestation incident response',
        publishedAt: '2026-09-03T00:00:00.000Z',
      },
    ],
  },
  {
    org: { slug: 'demo-draft', name: 'Nordic MSP (démo brouillon)', country: 'DE' },
    status: 'draft',
    locale: 'fr',
    unpublishedNotes: 'En cours de revue CISO — ne pas exposer aux acheteurs.',
    controls: [
      { id: 'c1', domain: 'Gouvernance & politiques', status: 'in_progress' },
      { id: 'c2', domain: 'Gestion des risques', status: 'preparing' },
    ],
    attestations: [],
  },
];

/** Preuves : UNIQUEMENT via routes /evidence. Jamais jointes au Trust public. */
export const evidenceItems: Evidence[] = [
  {
    id: 'ev_1',
    orgId: 'org_acme',
    filename: 'politique-ssi-2026.pdf',
    hash: 'sha256:demo-not-a-real-hash',
    provenance: 'manual',
    collectedAt: '2026-08-01T09:00:00.000Z',
    controlId: 'c1',
    storageKey: 'eu/org_acme/ev_1/politique-ssi-2026.pdf',
  },
  {
    id: 'ev_2',
    orgId: 'org_acme',
    filename: 'idp-mfa-export.json',
    hash: 'sha256:demo-idp-hash',
    provenance: 'connector',
    collectedAt: '2026-09-02T14:30:00.000Z',
    controlId: 'c4',
    storageKey: 'eu/org_acme/ev_2/idp-mfa-export.json',
  },
];
