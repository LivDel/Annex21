import { Suspense } from 'react';
import { AppShell } from '@/components/app-shell';
import { BillingPanel } from '@/components/billing/billing-panel';
import { BillingCheckoutToast } from '@/components/billing/billing-checkout-toast';
import { RequireOnboarding } from '@/components/require-onboarding';

export const metadata = { title: 'Facturation' };

export default function BillingPage() {
  return (
    <RequireOnboarding>
      <AppShell active="/app/billing">
        <Suspense fallback={null}>
          <BillingCheckoutToast />
        </Suspense>
        <BillingPanel />
      </AppShell>
    </RequireOnboarding>
  );
}
