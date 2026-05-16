import { useState } from 'react';
import { mockAuditLogs } from '../../data/mockAuditLogs';
import { cn } from '../../lib/utils';
import { Activity, Search, Filter, AlertCircle, CheckCircle, AlertTriangle, XCircle, Shield, User, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

const SEVERITY_CONFIG = {
  info:    { label: 'Info',    className: 'badge-info',    icon: CheckCircle,    dot: 'bg-[#00e5ff]' },
  warning: { label: 'Warning', className: 'badge-warning', icon: AlertTriangle,  dot: 'bg-amber-400' },
  danger:  { label: 'Critical',className: 'badge-danger',  icon: XCircle,        dot: 'bg-[#ff4081]' },
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function AuditLogs() {
  const [search, setSearch] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [page, setPage] = useState(1);
  const PER_PAGE = 8;

  const filtered = mockAuditLogs.filter((log) => {
    const matchSearch = log.actor.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase());
    const matchSev = filterSeverity === 'all' || log.severity === filterSeverity;
    const matchRole = filterRole === 'all' || log.actorRole === filterRole;
    return matchSearch && matchSev && matchRole;
  });

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const formatDate = (ts) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' · ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 pb-12 max-w-6xl">
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
            <Activity className="h-3 w-3 text-primary-600" /> System Monitor
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Audit Logs</h1>
          <p className="text-slate-500 font-medium">{mockAuditLogs.length} total entries <span className="mx-2 text-slate-600">|</span> FY2026</p>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants} className="flex items-center gap-4 flex-wrap bg-slate-500/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-2xl">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input 
            className="input pl-10 py-2.5 text-sm bg-slate-50 border-slate-200 focus:border-[#00e5ff] w-full" 
            placeholder="Search logs by actor, action, or details..." 
            value={search} 
            onChange={e => { setSearch(e.target.value); setPage(1); }} 
          />
        </div>
        <div className="flex items-center gap-2">
          {['all', 'info', 'warning', 'danger'].map(s => (
            <button key={s} onClick={() => { setFilterSeverity(s); setPage(1); }} className={cn(
              'px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors',
              filterSeverity === s ? 'bg-gradient-to-r from-primary-500 to-[#b388ff] text-white shadow-[0_0_15px_rgba(179,136,255,0.4)] border border-transparent' : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
            )}>{s === 'all' ? 'All' : SEVERITY_CONFIG[s]?.label}</button>
          ))}
        </div>
        <select
          className="input py-2.5 text-sm w-40 bg-slate-50 border-slate-200 focus:border-[#00e5ff]"
          value={filterRole}
          onChange={e => { setFilterRole(e.target.value); setPage(1); }}
        >
          <option value="all">All Roles</option>
          <option value="employee">Employee</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
      </motion.div>

      {/* Log Table */}
      <motion.div variants={itemVariants} className="card overflow-hidden border-slate-200 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-500/80 backdrop-blur-md">
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest w-48">Timestamp</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Actor</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest hidden md:table-cell">Action</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest hidden lg:table-cell">Details</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest w-36">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginated.map((log) => {
                const sev = SEVERITY_CONFIG[log.severity] || SEVERITY_CONFIG.info;
                return (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-500 font-mono whitespace-nowrap group-hover:text-slate-900 transition-colors">{formatDate(log.timestamp)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#00e5ff] to-primary-500 text-slate-900 text-xs font-bold flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(0,229,255,0.3)]">
                          {log.actor.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-700 whitespace-nowrap group-hover:text-slate-900 transition-colors">{log.actor}</p>
                          <p className="text-xs text-slate-500 capitalize tracking-wide mt-0.5">{log.actorRole}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-xs font-mono font-semibold bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md text-slate-500 whitespace-nowrap group-hover:border-slate-300 transition-colors">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <p className="text-sm font-medium text-slate-500 max-w-xs truncate group-hover:text-slate-700 transition-colors" title={log.details}>{log.details}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={cn('h-2 w-2 rounded-full shadow-[0_0_10px_currentColor]', sev.dot)} />
                        <span className={cn(sev.className, "font-bold text-xs uppercase tracking-widest")}>{sev.label}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {paginated.length === 0 && (
            <div className="p-12 text-center text-slate-500 font-medium">
              No audit logs match your filters.
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-500/50 backdrop-blur-md">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-xl border border-slate-200 text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >Prev</button>
              <span className="text-xs font-bold text-slate-500">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-xl border border-slate-200 text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >Next</button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
