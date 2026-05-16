import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import EmployeeProgressChart from '../../components/charts/EmployeeProgressChart';
import GoalCompletionChart from '../../components/charts/GoalCompletionChart';
import QuarterlyTrendChart from '../../components/charts/QuarterlyTrendChart';
import StatCard from '../../components/dashboard/StatCard';
import { goalsService, usersService } from '../../lib/services';
import { GOAL_STATUS } from '../../lib/constants';
import { cn } from '../../lib/utils';
import { TrendingUp, Users, Award, BarChart3, Loader2 } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    team: [],
    goals: [],
    stats: { avgComp: 0, topPerformer: null, atRiskCount: 0 },
    rankings: []
  });

  useEffect(() => {
    if (currentUser?.id) {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [teamMembers, allTeamGoals] = await Promise.all([
        usersService.getTeam(currentUser.id),
        goalsService.getTeamGoals(currentUser.id)
      ]);

      // Calculate stats per employee
      const rankings = teamMembers.map(member => {
        const memberGoals = allTeamGoals.filter(g => g.employee_id === member.id);
        const approved = memberGoals.filter(g => g.status === GOAL_STATUS.APPROVED).length;
        const submitted = memberGoals.filter(g => g.status === GOAL_STATUS.SUBMITTED).length;
        
        // Simple completion average (mock logic for now as we don't have historical progression yet)
        const completion = memberGoals.length > 0 
          ? Math.round((approved / memberGoals.length) * 100) 
          : 0;

        return {
          id: member.id,
          name: member.name,
          goals: memberGoals.length,
          approved,
          submitted,
          completion
        };
      });

      const avgComp = rankings.length > 0 
        ? Math.round(rankings.reduce((s, d) => s + d.completion, 0) / rankings.length)
        : 0;
      
      const topPerformer = rankings.length > 0 
        ? rankings.reduce((a, b) => a.completion > b.completion ? a : b)
        : null;
      
      const atRiskCount = rankings.filter((d) => d.completion < 50 && d.goals > 0).length;

      setData({
        team: teamMembers,
        goals: allTeamGoals,
        stats: { avgComp, topPerformer, atRiskCount },
        rankings
      });
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
        <p className="text-slate-500 font-medium">Crunching team performance data...</p>
      </div>
    );
  }

  const { stats, rankings } = data;

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
        <StatCard icon={TrendingUp} label="Avg Completion"  value={`${stats.avgComp}%`}               color="primary" trend={8} />
        <StatCard icon={Award}      label="Top Performer"   value={stats.topPerformer ? stats.topPerformer.name.split(' ')[0] : 'N/A'} color="success" />
        <StatCard icon={Users}      label="At Risk"         value={stats.atRiskCount}                         color="danger" />
        <StatCard icon={BarChart3}  label="Total Goals"     value={data.goals.length}               color="info" />
      </motion.div>

      {/* Charts */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EmployeeProgressChart data={rankings} />
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
              {[...rankings]
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
