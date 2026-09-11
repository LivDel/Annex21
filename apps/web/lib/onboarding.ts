/** Flag set when Étape 1/2 (organisation) is completed — gates /app connectors. */
export const ONBOARDING_DONE_KEY = 'annex21_onboarding_done';

export function isOnboardingDone(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (sessionStorage.getItem(ONBOARDING_DONE_KEY) === '1') return true;
  } catch {
    /* ignore */
  }
  try {
    if (localStorage.getItem(ONBOARDING_DONE_KEY) === '1') return true;
  } catch {
    /* ignore */
  }
  return false;
}
