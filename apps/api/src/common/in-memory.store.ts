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

export const trustCenters: TrustCenterView[] = [
  {
    orgId: 'org_acme',
    org: { slug: 'acme', name: 'Acme SAS', country: 'FR' },
    status: 'draft',
    locale: 'fr',
    disclaimerAck: true,
    unpublishedNotes: 'Finaliser continuité avant go-live.',
    updatedAt: now,
    controls: [
      { id: 'c1', domain: 'Gouvernance & responsabilités', status: 'attested' },
      { id: 'c2', domain: 'Gestion des risques', status: 'in_progress' },
      { id: 'c3', domain: "Continuité d'activité", status: 'preparing' },
      { id: 'c4', domain: "Sécurité de la chaîne d'approvisionnement", status: 'attested' },
    ],
    attestations: [
      {
        id: 'a1',
        title: 'Attestation gouvernance NIS2',
        publishedAt: '2026-03-12T00:00:00.000Z',
      },
      {
        id: 'a2',
        title: "Chaîne d'approvisionnement",
        publishedAt: '2026-02-02T00:00:00.000Z',
      },
    ],
  },
  {
    orgId: 'org_novatech',
    org: { slug: 'novatech', name: 'NovaTech', country: 'FR' },
    status: 'published',
    locale: 'fr',
    disclaimerAck: true,
    updatedAt: now,
    controls: [],
    attestations: [],
  },
  {
    orgId: 'org_draft',
    org: { slug: 'demo-draft', name: 'Nordic MSP (démo brouillon)', country: 'DE' },
    status: 'draft',
    locale: 'fr',
    disclaimerAck: false,
    unpublishedNotes: 'En cours de revue CISO — ne pas exposer aux acheteurs.',
    updatedAt: now,
    controls: [
      { id: 'c1', domain: 'Gouvernance & responsabilités', status: 'in_progress' },
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

/** Contrôles org (statut opérationnel — distinct des TrustControlSummary publics). */
export const controls: Control[] = [
  {
    id: 'ctrl_gov_01',
    orgId: 'org_acme',
    code: 'NIS2-GOV-01',
    domain: 'Gouvernance & politiques',
    title: 'Politique SSI documentée et approuvée',
    status: 'implemented',
    owner: 'J. Martin',
    updatedAt: now,
  },
  {
    id: 'ctrl_risk_01',
    orgId: 'org_acme',
    code: 'NIS2-RISK-01',
    domain: 'Gestion des risques',
    title: 'Registre des risques cyber à jour',
    status: 'in_progress',
    owner: 'Contributor',
    dueAt: '2026-10-01T00:00:00.000Z',
    updatedAt: now,
  },
  {
    id: 'ctrl_bc_01',
    orgId: 'org_acme',
    code: 'NIS2-BC-01',
    domain: "Continuité d'activité",
    title: 'Plan PCA testé annuellement',
    status: 'not_started',
    dueAt: '2026-11-15T00:00:00.000Z',
    updatedAt: now,
  },
  {
    id: 'ctrl_inc_01',
    orgId: 'org_acme',
    code: 'NIS2-INC-01',
    domain: 'Réponse aux incidents',
    title: 'Playbook ANSSI opérationnel',
    status: 'implemented',
    owner: 'J. Martin',
    updatedAt: now,
  },
  {
    id: 'ctrl_sc_01',
    orgId: 'org_acme',
    code: 'NIS2-SC-01',
    domain: "Chaîne d'approvisionnement",
    title: 'Clauses NIS2 fournisseurs critiques',
    status: 'not_started',
    updatedAt: now,
  },
  {
    id: 'ctrl_train_01',
    orgId: 'org_acme',
    code: 'NIS2-TRAIN-01',
    domain: 'Formation & sensibilisation',
    title: 'Campagne phishing annuelle',
    status: 'in_progress',
    owner: 'Contributor',
    updatedAt: now,
  },
];

/** Template FR-ANSSI immutable (24h / 72h / 1 mois). */
export const playbookTemplates: PlaybookTemplate[] = [
  {
    id: 'pb_fr_anssi_v1',
    version: '1.0.0',
    name: 'FR-ANSSI notification incident',
    createdAt: now,
    body: {
      authority: 'ANSSI',
      locale: 'fr',
      label: 'Notification incident — délais ANSSI',
      windows: ['24h', '72h', '1m'],
      steps: [
        {
          id: 's_detect',
          sortOrder: 1,
          window: '24h',
          title: 'Détecter et enregistrer',
          description: 'Ouvrir le ticket, horodater la détection, qualifier le périmètre initial.',
          ownerRole: 'contributor',
          requiresEvidence: false,
        },
        {
          id: 's_qualify',
          sortOrder: 2,
          window: '24h',
          title: 'Qualifier criticité / impact',
          description: 'Évaluer impact métier, données, clients. Joindre fiche de qualification.',
          ownerRole: 'owner',
          requiresEvidence: true,
        },
        {
          id: 's_notify_internal',
          sortOrder: 3,
          window: '24h',
          title: 'Notifier en interne (CISO / DG)',
          description: 'Alerter la chaîne de commandement et activer la cellule de crise si besoin.',
          ownerRole: 'contributor',
          requiresEvidence: false,
        },
        {
          id: 's_notify_anssi',
          sortOrder: 4,
          window: '72h',
          title: 'Notifier ANSSI / autorités',
          description: 'Dépôt notification initiale auprès de l’autorité compétente (preuve = accusé).',
          ownerRole: 'owner',
          requiresEvidence: true,
        },
        {
          id: 's_contain',
          sortOrder: 5,
          window: '72h',
          title: 'Contenir la menace',
          description: 'Actions de confinement, isolation, rotation secrets — preuve des mesures.',
          ownerRole: 'contributor',
          requiresEvidence: true,
        },
        {
          id: 's_report',
          sortOrder: 6,
          window: '1m',
          title: 'Rapport détaillé & leçons apprises',
          description: 'Rapport final, chronologie, mesures correctives, REX.',
          ownerRole: 'owner',
          requiresEvidence: true,
        },
        {
          id: 's_close_pack',
          sortOrder: 7,
          window: '1m',
          title: 'Clôturer le dossier notification',
          description: 'Valider le pack audit-ready (étapes + preuves) avant clôture incident.',
          ownerRole: 'owner',
          requiresEvidence: true,
        },
      ],
    },
  },
];

/** Assessments en mémoire (vide au boot — créés via API). */
export const assessments: Nis2Assessment[] = [];

/** Incidents ouverts / clos. */
export const incidents: Incident[] = [];

/** Audit append-only. */
export const auditEvents: AuditEvent[] = [];
