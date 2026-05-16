import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/dashboard/StatCard';
import PendingApprovalsWidget from '../../components/dashboard/PendingApprovalsWidget';
import EmployeeProgressChart from '../../components/charts/EmployeeProgressChart';
import { getTeamMembers } from '../../data/mockUsers';
import { mockGoals, GOAL_STATUS, teamProgressData } from '../../data/mockGoals';
import { Users, CheckSquare, Clock, ChevronRight, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

export default function ManagerDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const team = getTeamMembers(currentUser?.id);

  const allTeamGoals = mockGoals.filter((g) => team.map((u) => u.id).includes(g.employeeId));
  const pending   = allTeamGoals.filter((g) => g.status === GOAL_STATUS.SUBMITTED).length;
  const approved  = allTeamGoals.filter((g) => g.status === GOAL_STATUS.APPROVED).length;
  const avgCompletion = teamProgressData.length
    ? Math.round(teamProgressData.reduce((s, t) => s + t.completion, 0) / teamProgressData.length)
    : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-12"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
            <Users className="h-3 w-3 text-[#2979ff]" /> Manager Portal
          </div>
          <h1 className="page-title leading-tight">Team Overview</h1>
          <p className="text-slate-500 font-medium tracking-wide mt-2 text-sm lg:text-base">
            Managing <strong className="text-slate-900">{team.length} direct reports</strong> for FY2026.
          </p>
        </div>
        <button
          onClick={() => navigate('/manager/team-goals')}
          className="btn-primary flex items-center gap-2 group hidden sm:flex"
        >
          <CheckSquare className="h-4 w-4 transition-transform group-hover:scale-110" />
          Review Pending Goals
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Users}      label="Team Members"      value={team.length}       color="primary" />
        <StatCard icon={Clock}      label="Pending Approvals" value={pending}           color="warning" trend={-5} />
        <StatCard icon={CheckSquare} label="Approved Goals"   value={approved}          color="success" trend={12} />
        <StatCard icon={TrendingUp} label="Avg Completion"    value={`${avgCompletion}%`} color="info" trend={8} />
      </div>

      {/* Charts + Pending */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6 lg:col-span-2 flex flex-col">
          <h2 className="section-title mb-6 flex items-center gap-2">
            <div className="glow-dot text-primary-500" /> Team Performance Timeline
          </h2>
          <div className="flex-1 min-h-[300px]">
            <EmployeeProgressChart />
          </div>
        </div>
        <div className="flex flex-col">
          <PendingApprovalsWidget managerId={currentUser?.id} />
        </div>
      </div>

      {/* Team Table */}
      <div className="card">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h3 className="section-title flex items-center gap-2">
            <Users className="h-5 w-5 text-primary-600" />
            Direct Reports
          </h3>
          <button
            onClick={() => navigate('/manager/analytics')}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 uppercase tracking-widest transition-colors flex items-center gap-1"
          >
            Analytics <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header pl-6">Employee</th>
                <th className="table-header px-5">Active Goals</th>
                <th className="table-header px-5 hidden sm:table-cell">Completion %</th>
                <th className="table-header px-5">Current Status</th>
                <th className="table-header pr-6 text-right hidden lg:table-cell">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {team.map((member) => {
                const memberGoals = allTeamGoals.filter((g) => g.employeeId === member.id);
                const prog = teamProgressData.find((t) => t.name === member.name);
                const hasSubmitted = memberGoals.some((g) => g.status === GOAL_STATUS.SUBMITTED);
                return (
                  <tr key={member.id} className="table-row group">
                    <td className="pl-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-slate-900 text-sm font-bold flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(99,102,241,0.3)]">
                          {member.avatar}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{member.name}</p>
                          <p className="text-xs text-slate-500 font-medium">{member.designation}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 table-cell font-medium text-slate-700">{memberGoals.length}</td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <div className="flex items-center gap-3">
                        <div className="progress-bar w-32">
                          <div
                            className={cn(
                              'progress-fill',
                              (prog?.completion || 0) >= 75 ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' :
                              (prog?.completion || 0) >= 50 ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]' : 'bg-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.5)]'
                            )}
                            style={{ width: `${prog?.completion || 0}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-900">{prog?.completion || 0}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {hasSubmitted
                        ? <span className="badge-warning">Pending Review</span>
                        : memberGoals.every((g) => g.status === GOAL_STATUS.APPROVED)
                        ? <span className="badge-success">Approved</span>
                        : memberGoals.every((g) => g.status === GOAL_STATUS.DRAFT)
                        ? <span className="badge bg-slate-500/10 text-slate-500 border-slate-500/20">Draft</span>
                        : <span className="badge-info">In Progress</span>
                      }
                    </td>
                    <td className="pr-6 py-4 text-right hidden lg:table-cell">
                      <button
                        onClick={() => navigate('/manager/team-goals')}
                        className="text-xs font-bold text-primary-600 hover:text-primary-600 uppercase tracking-wider transition-colors"
                      >
                        {hasSubmitted ? 'Review' : 'View'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
