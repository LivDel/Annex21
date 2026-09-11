import { AppShell } from '@/components/app-shell';
import { AssessmentPanel } from '@/components/assessment/assessment-panel';
import { RequireOnboarding } from '@/components/require-onboarding';

export const metadata = { title: 'Assessment' };

export default function AssessmentPage() {
  return (
    <RequireOnboarding>
      <AppShell active="/app/assessment">
        <AssessmentPanel />
      </AppShell>
    </RequireOnboarding>
  );
}
