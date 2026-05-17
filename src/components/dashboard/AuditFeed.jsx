import { useState, useEffect } from 'react';
import { auditService } from '../../lib/services';
import {
  Activity, Shield, User, CheckCircle, XCircle, RotateCcw,
  Unlock, CalendarCheck, TrendingUp, PlusCircle, RefreshCw, Loader2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Premium Visual Action Mapping
const ACTION_CONFIG = {
  GOAL_CREATED: {
    icon: PlusCircle,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10 border-orange-500/20',
    badgeText: 'Goal Created'
  },
  GOAL_UPDATED: {
    icon: RefreshCw,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10 border-amber-500/20',
    badgeText: 'Goal Updated'
  },
  GOAL_APPROVED: {
    icon: CheckCircle,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10 border-emerald-500/20',
    badgeText: 'Goal Approved'
  },
  GOAL_REJECTED: {
    icon: XCircle,
    color: 'text-rose-500',
    bgColor: 'bg-rose-500/10 border-rose-500/20',
    badgeText: 'Goal Rejected'
  },
  GOAL_REWORK: {
    icon: RotateCcw,
    color: 'text-amber-600',
    bgColor: 'bg-amber-500/10 border-amber-500/20',
    badgeText: 'Returned Rework'
  },
  SUBMITTED_GOALS: {
    icon: CalendarCheck,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10 border-blue-500/20',
    badgeText: 'Goals Submitted'
  },
  CHECK_IN_SUBMITTED: {
    icon: TrendingUp,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10 border-indigo-500/20',
    badgeText: 'Check-in Submitted'
  },
  GOAL_UNLOCKED: {
    icon: Unlock,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10 border-orange-500/20',
    badgeText: 'Cycle Unlocked'
  },
  SYSTEM_INIT: {
    icon: Shield,
    color: 'text-slate-500',
    bgColor: 'bg-slate-500/10 border-slate-500/20',
    badgeText: 'System Init'
  }
};

function timeAgo(ts) {
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 5) return 'just now';
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// Map known enterprise personas or dynamic fallback
const resolveActorDetails = (actorName) => {
  const name = actorName || 'System';
  const cleanName = name.trim();

  if (cleanName === 'Harshi Singh') {
    return {
      name: 'Harshi Singh',
      avatar: 'HS',
      role: 'Employee',
      roleColor: 'bg-orange-50 border-orange-200 text-orange-700',
      avatarBg: 'bg-gradient-to-br from-orange-400 to-amber-500 text-white'
    };
  }
  if (cleanName === 'Janhvi Singh') {
    return {
      name: 'Janhvi Singh',
      avatar: 'JS',
      role: 'Manager',
      roleColor: 'bg-blue-50 border-blue-200 text-blue-700',
      avatarBg: 'bg-gradient-to-br from-blue-400 to-indigo-500 text-white'
    };
  }
  if (cleanName === 'Anshu Raj') {
    return {
      name: 'Anshu Raj',
      avatar: 'AR',
      role: 'VP Operations',
      roleColor: 'bg-purple-50 border-purple-200 text-purple-700',
      avatarBg: 'bg-gradient-to-br from-purple-400 to-pink-500 text-white'
    };
  }

  // Fallback dynamic generator
  const initials = cleanName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'SYS';

  if (cleanName === 'System') {
    return {
      name: 'System Engine',
      avatar: 'SYS',
      role: 'Core',
      roleColor: 'bg-slate-100 border-slate-300 text-slate-700',
      avatarBg: 'bg-slate-500 text-white'
    };
  }

  return {
    name: cleanName,
    avatar: initials,
    role: 'Employee',
    roleColor: 'bg-orange-50 border-orange-100 text-orange-700',
    avatarBg: 'bg-gradient-to-br from-orange-400 to-amber-500 text-white'
  };
};

export default function AuditFeed({ limit = 6, standalone = false }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      try {
        const data = await auditService.getRecentLogs(limit);
        setLogs(data || []);
      } catch (err) {
        console.error('Failed to load audit logs:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();

    // Small polling intervals or intervals for demo purposes to simulate E2E real-time
    const interval = setInterval(loadLogs, 4000);
    return () => clearInterval(interval);
  }, [limit]);

  const listContainerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -15 },
    show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } }
  };

  const content = (
    <div className="relative">
      {/* Sidebar Timeline Track Line */}
      {logs.length > 1 && (
        <div className="absolute left-[22px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-orange-400/30 via-orange-300/10 to-transparent" />
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="h-7 w-7 text-primary-600 animate-spin" />
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Syncing activity logs...</p>
        </div>
      ) : (
        <motion.div
          variants={listContainerVariants}
          initial="hidden"
          animate="show"
          className="space-y-5"
        >
          {logs.map((log) => {
            const actor = resolveActorDetails(log.actor);
            const cfg = ACTION_CONFIG[log.action] || {
              icon: Activity,
              color: 'text-slate-500',
              bgColor: 'bg-slate-500/10 border-slate-500/20',
              badgeText: log.action ? log.action.replace('_', ' ') : 'Activity'
            };
            const ActionIcon = cfg.icon;

            return (
              <motion.div
                key={log.id}
                variants={itemVariants}
                className="flex gap-4 relative group"
              >
                {/* Node Dot / Action Icon */}
                <div className="relative z-10 flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-2xl bg-white border border-slate-200/80 shadow-md group-hover:shadow-lg group-hover:border-primary-500/30 transition-all duration-300">
                  <div className={cn('p-2 rounded-xl border', cfg.bgColor)}>
                    <ActionIcon className={cn('h-4.5 w-4.5', cfg.color)} />
                  </div>
                </div>

                {/* Timeline Glass Card */}
                <div className="flex-1 card p-4 bg-white/70 border border-slate-200/80 backdrop-blur-md hover:bg-white/90 hover:border-primary-500/20 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 flex flex-col sm:flex-row items-start gap-4">
                  {/* Actor Avatar */}
                  <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs shadow-md border border-white/20 select-none flex-shrink-0', actor.avatarBg)}>
                    {actor.avatar}
                  </div>

                  {/* Log details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-sm font-extrabold text-slate-800 tracking-tight leading-none">
                        {actor.name}
                      </span>
                      <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider', actor.roleColor)}>
                        {actor.role}
                      </span>
                      <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider', cfg.bgColor, cfg.color)}>
                        {cfg.badgeText}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-600 leading-relaxed break-words">
                      {log.details}
                    </p>

                    <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <span>{timeAgo(log.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {logs.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-3xl p-6 bg-slate-50/50">
              <Activity className="h-8 w-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-500">No activity recorded yet.</p>
              <p className="text-xs text-slate-400 mt-1">Actions taken across goals and check-ins will live here.</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );

  if (standalone) {
    return content;
  }

  return (
    <div className="card p-6 bg-white/70 border border-slate-200/80 backdrop-blur-md shadow-2xl">
      <h3 className="section-title flex items-center gap-2 mb-6">
        <div className="glow-dot text-primary-500" />
        Activity Feed
      </h3>
      {content}
    </div>
  );
}
