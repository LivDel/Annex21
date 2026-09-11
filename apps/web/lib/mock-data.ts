import type { PublicTrustCenter, TrustCenterView } from '@annex21/shared';

/**
 * Mocks pour la surface PUBLIQUE uniquement (published).
 * RG-07 : aucun draft ici — `/trust/demo-draft` doit 404 en public.
 */
export const MOCK_PUBLIC_TRUST: Record<string, PublicTrustCenter> = {
  acme: {
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
      { id: 'a1', title: 'Déclaration de conformité', publishedAt: '2026-08-12T00:00:00.000Z' },
      { id: 'a2', title: 'Attestation incident response', publishedAt: '2026-09-03T00:00:00.000Z' },
    ],
  },
};

/** Orgs pré-rendues pour `/trust/[org]` public — published only. */
export const DEMO_ORGS = Object.keys(MOCK_PUBLIC_TRUST);

/**
 * Mocks preview éditeur (auth) — draft autorisé.
 * Uniquement pour `/app/trust-editor/preview/[org]`, jamais `/trust/[org]`.
 */
export const MOCK_TRUST_PREVIEW: Record<string, TrustCenterView> = {
  ...Object.fromEntries(
    Object.entries(MOCK_PUBLIC_TRUST).map(([slug, pub]) => [
      slug,
      { ...pub, status: 'published' as const } satisfies TrustCenterView,
    ]),
  ),
  'demo-draft': {
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
};
