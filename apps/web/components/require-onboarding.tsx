'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchOnboardingStatus } from '@/lib/onboarding';

/**
 * Server gate (client redirect): reads GET /onboarding/status first
 * (orgs.onboarding_completed_at). localStorage = cache only.
 * Incomplete → /app/onboarding (Étape 1/2). API returns 403 ONBOARDING_REQUIRED
 * on connectors / assessments / incidents / trust writes.
 */
export function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

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
        // API down / other — fail closed to onboarding (Étape 1/2)
        router.replace('/app/onboarding');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready) {
    return (
      <div className="surface-void flex min-h-[40vh] items-center justify-center px-4">
        <p className="text-sm text-[#CBD5E1]">Chargement…</p>
      </div>
    );
  }

  return <>{children}</>;
}
