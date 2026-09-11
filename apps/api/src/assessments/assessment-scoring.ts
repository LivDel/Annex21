import type {
  AssessmentAnswers,
  AssessmentGap,
  Nis2Domain,
  ScopeStatus,
} from '@annex21/shared';

const DOMAINS: Nis2Domain[] = [
  'gouvernance',
  'risques',
  'continuite',
  'incidents',
  'supply_chain',
  'formation',
];

/**
 * Scoring simplifié MVP — non juridique.
 * Scope heuristique + maturité moyenne + gaps prioritaires.
 */
export function computeScope(answers: AssessmentAnswers): ScopeStatus {
  const { sector, headcountBand, digitalActivities, criticalDependencies } = answers;
  if (!sector && headcountBand === undefined && digitalActivities === undefined) {
    return 'unclear';
  }
  const sizable = headcountBand === '50_249' || headcountBand === '250_plus';
  const digital = digitalActivities === true || criticalDependencies === true;
  if (sizable && digital) return 'in_scope';
  if (headcountBand === 'lt50' && digitalActivities === false) return 'out_of_scope';
  if (sizable || digital) return 'unclear';
  return 'unclear';
}

export function computeDomainScores(
  answers: AssessmentAnswers,
): Record<Nis2Domain, number> {
  const out = {} as Record<Nis2Domain, number>;
  for (const d of DOMAINS) {
    const v = answers.domainMaturity?.[d];
    out[d] = typeof v === 'number' ? Math.max(0, Math.min(100, Math.round(v))) : 50;
  }
  return out;
}

export function computeMaturity(domainScores: Record<Nis2Domain, number>): number {
  const vals = Object.values(domainScores);
  if (!vals.length) return 0;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

const GAP_CATALOG: Array<{
  domain: Nis2Domain;
  title: string;
  detail: string;
  threshold: number;
  impact: number;
  effort: number;
  ownerRole: 'owner' | 'contributor';
  dueHint: string;
}> = [
  {
    domain: 'risques',
    title: 'Registre des risques incomplet',
    detail: 'Cartographie risques cyber partielle — prioriser actifs critiques.',
    threshold: 70,
    impact: 3,
    effort: 2,
    ownerRole: 'contributor',
    dueHint: '30 jours',
  },
  {
    domain: 'continuite',
    title: 'Plan PCA non testé',
    detail: 'Exercice de continuité absent ou > 12 mois.',
    threshold: 65,
    impact: 3,
    effort: 3,
    ownerRole: 'owner',
    dueHint: '60 jours',
  },
  {
    domain: 'supply_chain',
    title: 'Clauses NIS2 fournisseurs manquantes',
    detail: 'Vendors critiques sans clause notification / audit.',
    threshold: 70,
    impact: 3,
    effort: 2,
    ownerRole: 'owner',
    dueHint: '45 jours',
  },
  {
    domain: 'formation',
    title: 'Campagne sensibilisation non planifiée',
    detail: 'Phishing simulé / formation annuelle absente.',
    threshold: 75,
    impact: 2,
    effort: 1,
    ownerRole: 'contributor',
    dueHint: '90 jours',
  },
  {
    domain: 'incidents',
    title: 'Playbook ANSSI non exercé',
    detail: 'Checklist 24h/72h/1 mois non déroulée en tabletop.',
    threshold: 70,
    impact: 3,
    effort: 2,
    ownerRole: 'owner',
    dueHint: '30 jours',
  },
  {
    domain: 'gouvernance',
    title: 'Politique SSI à rafraîchir',
    detail: 'Approbation direction > 12 mois ou incomplete.',
    threshold: 60,
    impact: 2,
    effort: 2,
    ownerRole: 'owner',
    dueHint: '60 jours',
  },
];

function severityFromPriority(score: number): AssessmentGap['severity'] {
  if (score >= 6) return 'eleve';
  if (score >= 4) return 'moyen';
  return 'faible';
}

export function computeGaps(
  domainScores: Record<Nis2Domain, number>,
): AssessmentGap[] {
  const gaps: AssessmentGap[] = [];
  for (const g of GAP_CATALOG) {
    const score = domainScores[g.domain] ?? 50;
    if (score < g.threshold) {
      const priorityScore = g.impact * g.effort;
      gaps.push({
        id: `gap_${g.domain}`,
        domain: g.domain,
        title: g.title,
        detail: g.detail,
        severity: severityFromPriority(priorityScore),
        priorityScore,
        ownerRole: g.ownerRole,
        dueHint: g.dueHint,
      });
    }
  }
  return gaps.sort((a, b) => b.priorityScore - a.priorityScore);
}
