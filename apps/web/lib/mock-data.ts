import type { TrustCenterView } from '@annex21/shared';

/**
 * Jeux de démo pour le build Next (pas d'API requise à `next build`).
 * /trust/acme → published ; /trust/demo-draft → draft (bannière brouillon).
 * Aucune evidence brute dans ces payloads (RG-08).
 */
export const MOCK_TRUST: Record<string, TrustCenterView> = {
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

export const DEMO_ORGS = Object.keys(MOCK_TRUST);
