import { mockAuditLogs } from '../../data/mockAuditLogs';
import { Activity, Shield, User, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

const ACTION_ICONS = {
  APPROVED_GOALS:   { icon: CheckCircle, color: 'text-emerald-500' },
  SUBMITTED_GOALS:  { icon: Activity,    color: 'text-blue-500' },
  REJECTED_GOALS:   { icon: XCircle,     color: 'text-rose-500' },
  UNLOCKED_GOALS:   { icon: Shield,      color: 'text-amber-500' },
  CYCLE_CONFIGURED: { icon: Activity,    color: 'text-primary-500' },
  USER_CREATED:     { icon: User,        color: 'text-teal-500' },
  CHECK_IN_SAVED:   { icon: CheckCircle, color: 'text-emerald-500' },
  EXPORTED_REPORT:  { icon: Activity,    color: 'text-purple-500' },
  EDITED_GOAL:      { icon: AlertTriangle, color: 'text-amber-500' },
};

function timeAgo(ts) {
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function AuditFeed({ limit = 6 }) {
  const logs = mockAuditLogs.slice(0, limit);

  return (
    <div className="card p-5">
      <h3 className="section-title flex items-center gap-2 mb-4">
        <Activity className="h-4 w-4 text-primary-500" />
        Recent Activity
      </h3>
      <div className="space-y-1">
        {logs.map((log, i) => {
          const cfg = ACTION_ICONS[log.action] || { icon: Activity, color: 'text-slate-500' };
          const Icon = cfg.icon;
          return (
            <div
              key={log.id}
              className="flex items-start gap-3 py-2.5 border-b border-slate-100 dark:border-dark-700 last:border-0"
            >
              <div className={cn('mt-0.5 flex-shrink-0', cfg.color)}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-800">
                  <span className="font-semibold">{log.actor}</span>{' '}
                  <span className="text-slate-500">{log.details}</span>
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{timeAgo(log.timestamp)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
