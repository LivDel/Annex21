import type { TrustControlStatus } from '@annex21/shared';

const LABELS: Record<TrustControlStatus, { label: string; className: string }> = {
  attested: { label: 'Attesté', className: 'status-attested' },
  in_progress: { label: 'En cours', className: 'status-progress' },
  preparing: { label: 'En préparation', className: 'status-preparing' },
};

export function ControlStatus({ status }: { status: TrustControlStatus }) {
  const { label, className } = LABELS[status];
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${className}`}>
      {label}
    </span>
  );
}
