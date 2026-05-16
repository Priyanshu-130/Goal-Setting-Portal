import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/dashboard/StatCard';
import GoalCompletionChart from '../../components/charts/GoalCompletionChart';
import QuarterlyTrendChart from '../../components/charts/QuarterlyTrendChart';
import AuditFeed from '../../components/dashboard/AuditFeed';
import StatusBadge from '../../components/shared/StatusBadge';
import { mockGoals, GOAL_STATUS, CHECK_IN_STATUS } from '../../data/mockGoals';
import { Target, CheckCircle, Clock, TrendingUp, ChevronRight, Activity, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function EmployeeDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const myGoals = mockGoals.filter((g) => g.employeeId === currentUser?.id);
  const approved = myGoals.filter((g) => g.status === GOAL_STATUS.APPROVED).length;
  const submitted = myGoals.filter((g) => g.status === GOAL_STATUS.SUBMITTED).length;
  const totalWeightage = myGoals.filter((g) => g.status !== GOAL_STATUS.DRAFT).reduce((s, g) => s + g.weightage, 0);

  const completedCheckins = myGoals.reduce((sum, g) => {
    return sum + ['Q1', 'Q2', 'Q3', 'Q4'].filter(
      (q) => g.checkIns?.[q]?.status === CHECK_IN_STATUS.COMPLETED
    ).length;
  }, 0);
  const totalCheckins = myGoals.length * 4;
  const progressPct = totalCheckins > 0 ? Math.round((completedCheckins / totalCheckins) * 100) : 0;

  const goalStatusData = [
    { name: 'Approved',  value: myGoals.filter(g => g.status === GOAL_STATUS.APPROVED).length },
    { name: 'Submitted', value: submitted },
    { name: 'Draft',     value: myGoals.filter(g => g.status === GOAL_STATUS.DRAFT).length },
  ].filter(d => d.value > 0);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8 pb-12 max-w-7xl">
      {/* Hero Section */}
      <motion.div variants={itemVariants} className="relative overflow-hidden rounded-3xl bg-slate-500/80 border border-slate-200 p-10 lg:p-14 backdrop-blur-2xl shadow-2xl">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-[500px] h-[500px] bg-primary-600/10 rounded-full blur-[100px] animate-pulse-slow pointer-events-none" />
        <div className="absolute bottom-0 left-10 -mb-20 -ml-20 w-[400px] h-[400px] bg-primary-50 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">
              <Zap className="h-3 w-3 text-primary-600" /> Welcome Back
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-3">
              Good morning, {currentUser?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-slate-500 text-lg font-medium tracking-wide">
              <span className="text-primary-600">{currentUser?.designation}</span> <span className="text-slate-600 mx-2">|</span> {currentUser?.department} <span className="text-slate-600 mx-2">|</span> FY2026 Cycle
            </p>
          </div>
          <button
            onClick={() => navigate('/employee/goals')}
            className="btn-primary flex items-center gap-2 group whitespace-nowrap shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all"
          >
            <Target className="h-5 w-5 transition-transform group-hover:scale-110" />
            Manage Goals
          </button>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Target}      label="Total Goals"   value={myGoals.length}  sub="FY2026 cycle"        color="primary" />
        <StatCard icon={CheckCircle} label="Approved"      value={approved}        sub="By your manager"     color="success" trend={approved > 0 ? 15 : undefined} />
        <StatCard icon={Clock}       label="Submitted"     value={submitted}       sub="Awaiting review"     color="warning" />
        <StatCard icon={TrendingUp}  label="Overall Progress" value={`${progressPct}%`} sub="Based on check-ins" color="info"    trend={progressPct > 50 ? 8 : -3} />
      </motion.div>

      {/* Charts */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6 lg:p-8 lg:col-span-2 shadow-2xl border-slate-200 bg-slate-500/80 backdrop-blur-md">
          <h2 className="section-title mb-6 flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-primary-400 shadow-[0_0_10px_rgba(99,102,241,0.8)]" /> Quarterly Performance Trend
          </h2>
          <QuarterlyTrendChart />
        </div>
        <div className="card p-6 lg:p-8 shadow-2xl border-slate-200 bg-slate-500/80 backdrop-blur-md">
           <h2 className="section-title mb-6 flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-[#00e5ff] shadow-[0_0_10px_rgba(0,229,255,0.8)]" /> Goal Status
          </h2>
          <GoalCompletionChart data={goalStatusData.length ? goalStatusData : undefined} />
        </div>
      </motion.div>

      {/* Lists */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6 lg:p-8 flex flex-col shadow-2xl border-slate-200 bg-slate-500/80 backdrop-blur-md">
          <div className="flex items-center justify-between mb-8">
            <h3 className="section-title flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-[#b388ff] shadow-[0_0_10px_rgba(179,136,255,0.8)]" /> My Goals Overview
            </h3>
            <button
              onClick={() => navigate('/employee/goals')}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 uppercase tracking-widest transition-colors flex items-center gap-1"
            >
              View Detailed <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-4 flex-1">
            {myGoals.slice(0, 4).map((goal) => (
              <div key={goal.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-slate-200 hover:bg-white/[0.05] transition-all duration-300 group cursor-pointer hover:border-slate-200 hover:shadow-lg">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors truncate">{goal.title}</p>
                    {goal.isShared && <span className="badge badge-primary text-[10px] uppercase tracking-widest py-0.5 shadow-[0_0_10px_rgba(99,102,241,0.2)]">Shared</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="progress-bar flex-1 h-1.5 bg-slate-50">
                      <div
                        className="progress-fill bg-gradient-to-r from-primary-600 to-primary-400 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                        style={{ width: `${goal.weightage}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-[#b388ff]">{goal.weightage}% wt</span>
                  </div>
                </div>
                <StatusBadge status={goal.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6 lg:p-8 shadow-2xl border-slate-200 bg-slate-500/80 backdrop-blur-md">
           <div className="flex items-center justify-between mb-8">
            <h3 className="section-title flex items-center gap-2.5">
               <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" /> Recent Activity
            </h3>
          </div>
          <AuditFeed limit={5} />
        </div>
      </motion.div>
    </motion.div>
  );
}
