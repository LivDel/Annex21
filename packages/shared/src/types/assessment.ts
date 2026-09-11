/** Assessment NIS2 guidé — jamais exposé sur /public/trust (RG-07). */

export type AssessmentStatus = 'draft' | 'completed';

export type ScopeStatus = 'in_scope' | 'out_of_scope' | 'unclear';

export type GapSeverity = 'eleve' | 'moyen' | 'faible';

export type Nis2Domain =
  | 'gouvernance'
  | 'risques'
  | 'continuite'
  | 'incidents'
  | 'supply_chain'
  | 'formation';

export interface AssessmentAnswers {
  /** Secteur d'activité (NIS2) */
  sector?: string;
  /** Effectif approximatif */
  headcountBand?: 'lt50' | '50_249' | '250_plus';
  /** Activités numériques essentielles / importantes */
  digitalActivities?: boolean;
  /** Dépendances critiques cloud / IdP / MSP */
  criticalDependencies?: boolean;
  /** Auto-évaluation maturité 0–100 par domaine */
  domainMaturity?: Partial<Record<Nis2Domain, number>>;
}

export interface AssessmentGap {
  id: string;
  domain: Nis2Domain;
  title: string;
  detail: string;
  severity: GapSeverity;
  /** impact × effort simplifié (1–9) pour priorisation */
  priorityScore: number;
  ownerRole?: 'owner' | 'contributor';
  dueHint?: string;
}

export interface Nis2Assessment {
  id: string;
  orgId: string;
  status: AssessmentStatus;
  answers: AssessmentAnswers;
  scopeStatus?: ScopeStatus;
  /** Score global 0–100 */
  maturityScore?: number;
  domainScores?: Partial<Record<Nis2Domain, number>>;
  gaps?: AssessmentGap[];
  disclaimerAck: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export const NIS2_DOMAIN_LABELS: Record<Nis2Domain, string> = {
  gouvernance: 'Gouvernance & politiques',
  risques: 'Gestion des risques',
  continuite: "Continuité d'activité",
  incidents: 'Réponse aux incidents',
  supply_chain: "Chaîne d'approvisionnement",
  formation: 'Formation & sensibilisation',
};

export const ASSESSMENT_DISCLAIMER_FR =
  "Cet assessment n'est pas un avis juridique. Il ne constitue pas une détermination officielle du périmètre NIS2 (RG-02).";
