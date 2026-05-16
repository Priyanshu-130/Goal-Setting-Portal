import { useAuth } from '../../context/AuthContext';
import EmployeeProgressChart from '../../components/charts/EmployeeProgressChart';
import GoalCompletionChart from '../../components/charts/GoalCompletionChart';
import QuarterlyTrendChart from '../../components/charts/QuarterlyTrendChart';
import StatCard from '../../components/dashboard/StatCard';
import { getTeamMembers } from '../../data/mockUsers';
import { teamProgressData, mockGoals } from '../../data/mockGoals';
import { cn } from '../../lib/utils';
import { TrendingUp, Users, Award, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function PerformanceAnalytics() {
  const { currentUser } = useAuth();
  const team = getTeamMembers(currentUser?.id);
  const teamGoals = mockGoals.filter((g) => team.map((u) => u.id).includes(g.employeeId));

  const avgComp = Math.round(teamProgressData.reduce((s, d) => s + d.completion, 0) / teamProgressData.length);
  const topPerformer = teamProgressData.reduce((a, b) => a.completion > b.completion ? a : b);
  const atRisk = teamProgressData.filter((d) => d.completion < 50).length;

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-12"
    >
      <motion.div variants={itemVariants}>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-slate-200 text-xs font-semibold text-[#b388ff] uppercase tracking-widest mb-3">
          Insights
        </div>
        <h1 className="page-title text-slate-900">Performance Analytics</h1>
        <p className="text-slate-500 text-sm mt-2 font-medium tracking-wide">Team-wide performance insights · FY2026</p>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="Avg Completion"  value={`${avgComp}%`}               color="primary" trend={8} />
        <StatCard icon={Award}      label="Top Performer"   value={topPerformer.name.split(' ')[0]} color="success" />
        <StatCard icon={Users}      label="At Risk"         value={atRisk}                         color="danger" />
        <StatCard icon={BarChart3}  label="Total Goals"     value={teamGoals.length}               color="info" />
      </motion.div>

      {/* Charts */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EmployeeProgressChart />
        <GoalCompletionChart />
      </motion.div>
      <motion.div variants={itemVariants}>
        <QuarterlyTrendChart />
      </motion.div>

      {/* Employee Performance Table */}
      <motion.div variants={itemVariants} className="card shadow-glass border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#b388ff]/5 rounded-full blur-[100px] -mt-40 -mr-40 pointer-events-none" />
        <div className="relative z-10 px-6 py-5 border-b border-slate-200 bg-white/[0.02]">
          <h3 className="section-title">Employee Performance Summary</h3>
        </div>
        <div className="overflow-x-auto relative z-10">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-white/[0.01]">
                <th className="text-left table-header px-6 py-4 text-[10px] uppercase tracking-widest text-slate-500 font-bold">Employee</th>
                <th className="text-left table-header px-6 py-4 text-[10px] uppercase tracking-widest text-slate-500 font-bold">Goals</th>
                <th className="text-left table-header px-6 py-4 text-[10px] uppercase tracking-widest text-slate-500 font-bold">Approved</th>
                <th className="text-left table-header px-6 py-4 text-[10px] uppercase tracking-widest text-slate-500 font-bold">Submitted</th>
                <th className="text-left table-header px-6 py-4 text-[10px] uppercase tracking-widest text-slate-500 font-bold">Completion</th>
                <th className="text-left table-header px-6 py-4 text-[10px] uppercase tracking-widest text-slate-500 font-bold">Rank</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[...teamProgressData]
                .sort((a, b) => b.completion - a.completion)
                .map((emp, rank) => (
                  <tr key={emp.name} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-400 to-[#b388ff] text-slate-900 text-xs font-bold flex items-center justify-center shadow-lg">
                          {emp.name.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <span className="text-sm font-bold text-slate-700">{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-700">{emp.goals}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-700">{emp.approved}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-700">{emp.submitted}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="progress-bar w-24 bg-slate-50 p-0.5">
                          <div
                            className={cn('progress-fill rounded-full', emp.completion >= 75 ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' : emp.completion >= 50 ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]' : 'bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.5)]')}
                            style={{ width: `${emp.completion}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-700">{emp.completion}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        'text-sm font-extrabold px-3 py-1 rounded-full border',
                        rank === 0 ? 'text-amber-400 bg-amber-400/10 border-amber-400/20 shadow-[0_0_10px_rgba(251,191,36,0.2)]' : 
                        rank === 1 ? 'text-slate-700 bg-slate-400/10 border-slate-400/20' : 
                        rank === 2 ? 'text-amber-700 bg-amber-700/10 border-amber-700/20' : 
                        'text-slate-500 border-transparent'
                      )}>
                        #{rank + 1} {rank === 0 ? '🏆' : ''}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
