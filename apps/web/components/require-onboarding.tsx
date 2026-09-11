'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isOnboardingDone } from '@/lib/onboarding';

/**
 * Soft gate: /app (Étape 2/2 connecteurs) requires annex21_onboarding_done.
 * Without the flag → redirect to /app/onboarding (Étape 1/2).
 */
export function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isOnboardingDone()) {
      router.replace('/app/onboarding');
      return;
    }
    setReady(true);
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
