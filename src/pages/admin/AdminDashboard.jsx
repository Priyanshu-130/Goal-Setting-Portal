import { Users, Target, AlertTriangle, Activity, ArrowUpRight, TrendingUp, ShieldCheck, FileText, CalendarCheck } from 'lucide-react';
import GoalCompletionChart from '../../components/charts/GoalCompletionChart';
import { motion } from 'framer-motion';
import { mockGoals, GOAL_STATUS, teamProgressData } from '../../data/mockGoals';
import { mockUsers } from '../../data/mockUsers';
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

  // Completion Dashboard data
  const completionData = QUARTERS.map(q => {
    const approvedGoals = mockGoals.filter(g => g.status === GOAL_STATUS.APPROVED);
    const completed = approvedGoals.filter(g => g.checkIns?.[q]?.status === 'completed').length;
    return { quarter: q, completed, total: approvedGoals.length, pct: approvedGoals.length > 0 ? Math.round((completed / approvedGoals.length) * 100) : 0 };
  });

  // Employee check-in completion
  const empCompletion = teamProgressData.map(emp => ({
    ...emp,
    user: mockUsers.find(u => u.name === emp.name),
    pct: emp.checkInsCompleted ? Math.round((emp.checkInsCompleted / 8) * 100) : Math.round(emp.completion * 0.8),
  }));

  // Compute dynamic stats
  const approvedGoals = mockGoals.filter(g => g.status === GOAL_STATUS.APPROVED);
  const totalVerifications = approvedGoals.reduce((s, g) => s + Object.values(g.checkIns || {}).filter(ci => ci.status === 'completed').length, 0);
  const pendingApprovals = mockGoals.filter(g => g.status === GOAL_STATUS.SUBMITTED).length;
  const avgCompletion = Math.round(teamProgressData.reduce((s, d) => s + d.completion, 0) / teamProgressData.length);
  const activeEmpCount = mockUsers.filter(u => u.status === 'active').length;

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-12"
    >
      {/* Hero Section */}
      <motion.div variants={itemVariants} className="relative overflow-hidden rounded-3xl bg-slate-500/80 border border-slate-200 p-10 lg:p-14 backdrop-blur-2xl shadow-glass">
        {/* Abstract animated background shapes */}
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
            Enterprise-grade identity verification and performance management platform. Oversee organizational metrics, employee compliance, and team performance in real-time.
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
            <h3 className="text-3xl font-extrabold text-slate-900">{mockUsers.length}</h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-emerald-400">
              <TrendingUp className="h-3 w-3" /> +2 this month
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
              Based on {mockGoals.length} active goals
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
            <GoalCompletionChart />
          </div>
        </div>
        
        <div className="card p-6 lg:p-8 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h2 className="section-title">Live Audit Feed</h2>
            <button className="text-xs font-semibold text-slate-500 hover:text-slate-900 uppercase tracking-widest transition-colors">
              View All
            </button>
          </div>
          <div className="space-y-6 flex-1 overflow-y-auto pr-2">
            {[
              { time: '10 mins ago', title: 'Verification Approved', text: 'Harshi submitted goals for FY2026', type: 'info' },
              { time: '1 hour ago', title: 'System Update', text: 'Janhvi approved 5 compliance records', type: 'success' },
              { time: '2 hours ago', title: 'Config Change', text: 'Cycle config updated by Anshu', type: 'warning' },
              { time: '5 hours ago', title: 'Review Failed', text: 'Deepa goals rejected (weightage)', type: 'danger' },
              { time: '1 day ago', title: 'New Employee', text: 'Priya onboarded successfully', type: 'info' },
            ].map((activity, i) => (
              <div key={i} className="flex gap-4 relative group">
                {i !== 4 && <div className="absolute top-8 left-2 bottom-[-24px] w-[1px] bg-gradient-to-b from-white/10 to-transparent" />}
                <div className={`mt-1 flex-shrink-0 w-4 h-4 rounded-full border border-slate-300 shadow-[0_0_10px_currentColor] z-10 flex items-center justify-center ${
                  activity.type === 'info' ? 'bg-[#00e5ff]/20 text-primary-600' :
                  activity.type === 'success' ? 'bg-emerald-400/20 text-emerald-400' :
                  activity.type === 'warning' ? 'bg-amber-400/20 text-amber-400' :
                  'bg-[#ff4081]/20 text-[#ff4081]'
                }`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-current" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">{activity.title}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{activity.text}</p>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1.5 font-bold">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
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
          {completionData.map(d => (
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
                  {['Employee', 'Dept', 'Goals', 'Approved', 'Q1 Done', 'Completion'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {empCompletion.map(emp => (
                  <tr key={emp.name} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white text-[10px] font-bold flex items-center justify-center">{emp.name.split(' ').map(n=>n[0]).join('')}</div>
                        <span className="text-xs font-semibold text-slate-700">{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">{emp.user?.department || 'Engineering'}</td>
                    <td className="px-5 py-3 text-xs font-bold text-slate-700">{emp.goals}</td>
                    <td className="px-5 py-3 text-xs font-bold text-slate-700">{emp.approved}</td>
                    <td className="px-5 py-3">
                      {emp.checkInsCompleted > 0
                        ? <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">✓ Done</span>
                        : <span className="text-xs text-slate-400">—</span>}
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
