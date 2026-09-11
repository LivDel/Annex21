'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchOnboardingStatus } from '@/lib/onboarding';

/**
 * Server gate (client redirect): reads GET /onboarding/status first
 * (orgs.onboarding_completed_at). localStorage = cache only.
 * Incomplete → /app/onboarding (Étape 1/2). API returns 403 ONBOARDING_REQUIRED
 * on connectors / assessments / incidents / trust writes / billing.
 */
export function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [apiNote, setApiNote] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const status = await fetchOnboardingStatus();
        if (cancelled) return;
        if (!status.completed) {
          router.replace('/app/onboarding');
          return;
        }
        setReady(true);
      } catch (err) {
        if (cancelled) return;
        const status = (err as { status?: number })?.status;
        if (status === 401) {
          router.replace('/app/login');
          return;
        }
        // Soft note when Session/API unavailable — then fail closed to onboarding
        setApiNote(
          'Session ou API indisponible — redirection vers l’onboarding.',
        );
        window.setTimeout(() => {
          if (!cancelled) router.replace('/app/onboarding');
        }, 1200);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready) {
    return (
      <div className="surface-void flex min-h-[40vh] flex-col items-center justify-center gap-2 px-4">
        <p className="text-sm text-[#CBD5E1]">Chargement…</p>
        {apiNote ? (
          <p className="max-w-sm text-center text-xs text-[#CBD5E1]/80">
            {apiNote}
          </p>
        ) : null}
      </div>
    );
  }

  return <>{children}</>;
}
