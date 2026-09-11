import { AppShell } from '@/components/app-shell';
import { AssessmentPanel } from '@/components/assessment/assessment-panel';

export const metadata = { title: 'Assessment' };

export default function AssessmentPage() {
  return (
    <AppShell active="/app/assessment">
      <AssessmentPanel />
    </AppShell>
  );
}
