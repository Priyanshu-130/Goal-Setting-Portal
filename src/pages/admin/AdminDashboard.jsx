import { useState, useEffect } from 'react';
import { Users, Target, AlertTriangle, Activity, ArrowUpRight, TrendingUp, ShieldCheck, FileText, CalendarCheck, Loader2 } from 'lucide-react';
import GoalCompletionChart from '../../components/charts/GoalCompletionChart';
import AuditFeed from '../../components/dashboard/AuditFeed';
import { motion } from 'framer-motion';
import { goalsService, usersService } from '../../lib/services';
import { GOAL_STATUS } from '../../lib/constants';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState({
    goals: [],
    users: [],
    completionStats: [],
    empCompletion: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdminData() {
      try {
        setLoading(true);
        const [allGoals, allUsers] = await Promise.all([
          goalsService.getAllGoals(),
          usersService.getAllUsers()
        ]);

        const approvedGoals = allGoals.filter(g => g.status === GOAL_STATUS.APPROVED);

        // Completion Dashboard data
        const completionStats = QUARTERS.map(q => {
          const completed = approvedGoals.filter(g => {
            const checkIns = g.check_ins || [];
            // Handle if check_ins is array or object mapping
            if (Array.isArray(checkIns)) {
              return checkIns.some(ci => ci.quarter === q && ci.status === 'completed');
            }
            return checkIns[q]?.status === 'completed';
          }).length;
          
          return { 
            quarter: q, 
            completed, 
            total: approvedGoals.length, 
            pct: approvedGoals.length > 0 ? Math.round((completed / approvedGoals.length) * 100) : 0 
          };
        });

        // Employee check-in completion (Aggregate by user)
        const empCompletion = allUsers.map(user => {
          const userGoals = allGoals.filter(g => g.employee_id === user.id);
          const approved = userGoals.filter(g => g.status === GOAL_STATUS.APPROVED);
          
          // Count total completed check-ins across all quarters
          const completedCIs = userGoals.reduce((sum, g) => {
             const cis = g.check_ins || [];
             if (Array.isArray(cis)) return sum + cis.filter(ci => ci.status === 'completed').length;
             return sum + Object.values(cis).filter(ci => ci.status === 'completed').length;
          }, 0);

          const completionPct = approved.length > 0 ? Math.round((completedCIs / (approved.length * 4)) * 100) : 0;

          return {
            name: user.name,
            department: user.department,
            goals: userGoals.length,
            approved: approved.length,
            checkInsCompleted: completedCIs,
            completion: completionPct,
            avatar: user.avatar
          };
        });

        setData({
          goals: allGoals,
          users: allUsers,
          completionStats,
          empCompletion
        });
      } catch (err) {
        console.error('Admin Data Load Error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAdminData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 text-primary-600 animate-spin" />
        <p className="text-slate-500 font-medium">Loading organization oversight...</p>
      </div>
    );
  }

  const { goals, users, completionStats, empCompletion } = data;
  const approvedGoals = goals.filter(g => g.status === GOAL_STATUS.APPROVED);
  const pendingApprovals = goals.filter(g => g.status === GOAL_STATUS.SUBMITTED).length;
  const avgCompletion = empCompletion.length > 0 
    ? Math.round(empCompletion.reduce((s, d) => s + d.completion, 0) / empCompletion.length)
    : 0;
  const activeEmpCount = users.filter(u => u.status === 'active').length;

  const statusDistribution = [
    { name: 'Approved', value: goals.filter(g => g.status === GOAL_STATUS.APPROVED).length },
    { name: 'Submitted', value: goals.filter(g => g.status === GOAL_STATUS.SUBMITTED).length },
    { name: 'Draft', value: goals.filter(g => g.status === GOAL_STATUS.DRAFT).length },
    { name: 'Rejected', value: goals.filter(g => g.status === GOAL_STATUS.REJECTED).length },
  ].filter(d => d.value > 0);

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-12"
    >
      {/* Hero Section */}
      <motion.div variants={itemVariants} className="relative overflow-hidden rounded-3xl bg-white/70 border border-slate-200 p-10 lg:p-14 backdrop-blur-2xl shadow-2xl">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-[500px] h-[500px] bg-primary-600/10 rounded-full blur-[100px] animate-pulse-slow pointer-events-none" />
        <div className="absolute bottom-0 left-10 -mb-20 -ml-20 w-[400px] h-[400px] bg-primary-50 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-slate-200 text-xs font-semibold text-primary-600 uppercase tracking-widest mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00e5ff] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00e5ff]"></span>
            </span>
            System Live
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
            Next Generation <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00e5ff] to-primary-400">Goal & Verification</span> Portal
          </h1>
          <p className="text-slate-500 text-lg lg:text-xl font-medium tracking-wide mb-10 max-w-2xl leading-relaxed">
            Enterprise-grade performance management platform. Oversee organizational metrics, employee compliance, and team performance in real-time.
          </p>
          <div className="flex flex-wrap gap-4">
            <button onClick={() => navigate('/admin/analytics')} className="btn-primary flex items-center gap-2 group">
              <Activity className="h-4 w-4 transition-transform group-hover:scale-110" /> View Live Analytics
            </button>
            <button onClick={() => navigate('/admin/reports')} className="btn-secondary flex items-center gap-2 group">
              <FileText className="h-4 w-4 text-slate-500 group-hover:text-slate-900 transition-colors" /> Generate Reports
            </button>
          </div>
        </div>
      </motion.div>

      {/* KPI Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card group cursor-pointer" onClick={() => navigate('/admin/users')}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-[#2979ff]/10 text-[#2979ff] shadow-[0_0_15px_rgba(41,121,255,0.2)] border border-[#2979ff]/20 group-hover:scale-110 transition-transform">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <span className="badge-primary">{activeEmpCount} Active</span>
          </div>
          <div className="flex flex-col">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Employees</p>
            <h3 className="text-3xl font-extrabold text-slate-900">{users.length}</h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-emerald-400">
              <TrendingUp className="h-3 w-3" /> Syncing with DB
            </div>
          </div>
        </div>

        <div className="stat-card group cursor-pointer" onClick={() => navigate('/admin/analytics')}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.2)] border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <Target className="h-6 w-6" />
            </div>
            <span className="badge-success">Avg Perf</span>
          </div>
          <div className="flex flex-col">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Avg Performance Score</p>
            <h3 className="text-3xl font-extrabold text-slate-900">{(avgCompletion/20).toFixed(1)}<span className="text-lg text-slate-500 font-medium">/5.0</span></h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-slate-500">
              Based on {goals.length} active goals
            </div>
          </div>
        </div>

        <div className="stat-card group cursor-pointer border-amber-500/20 shadow-[0_0_20px_rgba(251,191,36,0.05)] hover:border-amber-500/40" onClick={() => navigate('/admin/cycle')}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(251,191,36,0.2)]">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <span className="badge-warning">Action Req</span>
          </div>
          <div className="flex flex-col">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Pending Approvals</p>
            <h3 className="text-3xl font-extrabold text-slate-900">{pendingApprovals}</h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-amber-400">
              Requires manager sign-off
            </div>
          </div>
        </div>

        <div className="stat-card group cursor-pointer" onClick={() => navigate('/admin/reports')}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-[#b388ff]/10 text-[#b388ff] shadow-[0_0_15px_rgba(179,136,255,0.2)] border border-[#b388ff]/20 group-hover:scale-110 transition-transform">
              <Users className="h-6 w-6" />
            </div>
          </div>
          <div className="flex flex-col">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Quarterly Progress</p>
            <h3 className="text-3xl font-extrabold text-slate-900">{avgCompletion}%</h3>
            <div className="mt-3 progress-bar">
              <div className="progress-fill bg-[#b388ff]" style={{ width: `${avgCompletion}%` }} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6 lg:p-8 lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h2 className="section-title flex items-center gap-2.5">
              <div className="glow-dot text-primary-600" /> Organization Growth Analytics
            </h2>
            <button className="text-xs font-semibold text-slate-500 hover:text-slate-900 uppercase tracking-widest transition-colors flex items-center gap-1">
              Detailed View <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
          <div className="flex-1 min-h-[350px]">
            <GoalCompletionChart data={statusDistribution} />
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <AuditFeed limit={5} />
        </div>
      </motion.div>

      {/* Completion Dashboard */}
      <motion.div variants={itemVariants} className="card border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-primary-600" />
            <h3 className="text-base font-bold text-slate-900">Completion Dashboard</h3>
          </div>
          <button onClick={() => navigate('/admin/reports')} className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors flex items-center gap-1">
            Full Report <ArrowUpRight className="h-3 w-3" />
          </button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 divide-x divide-y lg:divide-y-0 divide-slate-100">
          {completionStats.map(d => (
            <div key={d.quarter} className="p-5 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{d.quarter} Check-In</p>
              <p className={cn('text-2xl font-extrabold mb-1', d.pct >= 80 ? 'text-emerald-600' : d.pct >= 50 ? 'text-amber-600' : 'text-slate-400')}>{d.pct}%</p>
              <p className="text-xs text-slate-400">{d.completed}/{d.total} goals</p>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div className={cn('h-full rounded-full transition-all', d.pct >= 80 ? 'bg-emerald-500' : d.pct >= 50 ? 'bg-amber-500' : 'bg-slate-300')} style={{ width: `${d.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50/50">
                  {['Employee', 'Dept', 'Goals', 'Approved', 'Check-ins', 'Completion'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {empCompletion.map(emp => (
                  <tr key={emp.name} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white text-[10px] font-bold flex items-center justify-center">{emp.avatar || emp.name.split(' ').map(n=>n[0]).join('')}</div>
                        <span className="text-xs font-semibold text-slate-700">{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">{emp.department}</td>
                    <td className="px-5 py-3 text-xs font-bold text-slate-700">{emp.goals}</td>
                    <td className="px-5 py-3 text-xs font-bold text-slate-700">{emp.approved}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs font-bold text-slate-500">{emp.checkInsCompleted} recorded</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div className={cn('h-full rounded-full', emp.completion >= 75 ? 'bg-emerald-500' : emp.completion >= 50 ? 'bg-amber-500' : 'bg-rose-400')} style={{ width: `${emp.completion}%` }} />
                        </div>
                        <span className="text-xs font-bold text-slate-700">{emp.completion}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
