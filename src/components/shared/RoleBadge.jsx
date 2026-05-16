import { cn } from '../../lib/utils';

const ROLE_CONFIG = {
  employee: { label: 'Employee', className: 'badge-info' },
  manager:  { label: 'Manager',  className: 'badge-warning' },
  admin:    { label: 'Admin',    className: 'badge-primary' },
};

export default function RoleBadge({ role, className }) {
  const config = ROLE_CONFIG[role] || { label: role, className: 'badge-neutral' };
  return (
    <span className={cn(config.className, className)}>
      {config.label}
    </span>
  );
}
