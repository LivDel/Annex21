/** Session opaque stockée Redis (RG-10 : Redis in-EU). */
export interface SessionUser {
  id: string;
  email: string;
  role: 'owner' | 'contributor' | 'viewer';
}

/** Org saisie à l'Étape 1/2 onboarding (mirror of orgs row fields). */
export interface OnboardingOrg {
  id?: string;
  name: string;
  nis2Sector: string;
  /** Rôle métier onboarding (CISO / contributor / viewer). */
  cisoRole: 'ciso' | 'contributor' | 'viewer';
}

export interface SessionRecord {
  id: string;
  user: SessionUser;
  createdAt: string;
  /** ISO — aligné TTL cookie 7 jours */
  expiresAt: string;
  /** Active org after onboarding (orgs.id) */
  orgId?: string | null;
  /** ISO — mirror of orgs.onboarding_completed_at (cache; Postgres orgs = SoT) */
  onboardingCompletedAt?: string | null;
  org?: OnboardingOrg | null;
}

export interface OnboardingStatus {
  completed: boolean;
  completedAt: string | null;
  org: OnboardingOrg | null;
  orgId?: string | null;
}

export interface MeResponse {
  user: SessionUser;
  onboarding: OnboardingStatus;
}

export interface CompleteOnboardingRequest {
  orgName: string;
  nis2Sector: string;
  cisoRole: 'ciso' | 'contributor' | 'viewer';
}

export interface CompleteOnboardingResponse {
  ok: true;
  onboarding: OnboardingStatus;
}
