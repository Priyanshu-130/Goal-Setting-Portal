import { cn } from '../../lib/utils';

const STATUS_CONFIG = {
  approved:    { label: 'Approved',    className: 'badge-success' },
  submitted:   { label: 'Submitted',   className: 'badge-info' },
  draft:       { label: 'Draft',       className: 'badge-neutral' },
  rejected:    { label: 'Rejected',    className: 'badge-danger' },
  not_started: { label: 'Not Started', className: 'badge-neutral' },
  on_track:    { label: 'On Track',    className: 'badge-success' },
  completed:   { label: 'Completed',   className: 'badge-primary' },
  at_risk:     { label: 'At Risk',     className: 'badge-danger' },
  active:      { label: 'Active',      className: 'badge-success' },
  inactive:    { label: 'Inactive',    className: 'badge-neutral' },
};

export default function StatusBadge({ status, className }) {
  const config = STATUS_CONFIG[status] || { label: status, className: 'badge-neutral' };
  return (
    <span className={cn(config.className, className)}>
      {config.label}
    </span>
  );
}
