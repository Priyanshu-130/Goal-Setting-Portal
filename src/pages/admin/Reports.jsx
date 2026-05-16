import { useState } from 'react';
import { mockUsers } from '../../data/mockUsers';
import { mockGoals, GOAL_STATUS, teamProgressData, computeProgressScore } from '../../data/mockGoals';
import { cn } from '../../lib/utils';
import { Download, FileText, BarChart3, Users, CheckCircle, TrendingUp, Unlock } from 'lucide-react';
import GoalCompletionChart from '../../components/charts/GoalCompletionChart';
import EmployeeProgressChart from '../../components/charts/EmployeeProgressChart';
import { motion } from 'framer-motion';

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const itemVariants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } };

// ── Real CSV export helpers ──
function buildAchievementCSV() {
  const rows = [['Employee', 'Goal ID', 'Title', 'Thrust Area', 'UoM', 'Target', 'Weightage', 'Q1 Planned', 'Q1 Actual', 'Q1 Score', 'Q2 Planned', 'Q2 Actual', 'Q2 Score', 'Status']];
  mockGoals.forEach(goal => {
    const user = mockUsers.find(u => u.id === goal.employeeId);
    const q1 = goal.checkIns?.Q1 || {};
    const q2 = goal.checkIns?.Q2 || {};
    const q1Score = computeProgressScore(goal, q1);
    const q2Score = computeProgressScore(goal, q2);
    rows.push([
      user?.name || '',
      goal.id,
      `"${goal.title}"`,
      goal.thrustArea,
      goal.unit,
      goal.target,
      `${goal.weightage}%`,
      q1.planned || '',
      q1.actual || '',
      q1Score !== null ? `${q1Score}%` : '',
      q2.planned || '',
      q2.actual || '',
      q2Score !== null ? `${q2Score}%` : '',
      goal.status,
    ]);
  });
  return rows.map(r => r.join(',')).join('\n');
}

function buildCompletionCSV() {
  const rows = [['Employee', 'Department', 'Total Goals', 'Approved', 'Submitted', 'Draft', 'Q1 Done', 'Q2 Done', 'Completion %']];
  teamProgressData.forEach(emp => {
    const user = mockUsers.find(u => u.name === emp.name);
    rows.push([emp.name, user?.department || '', emp.goals, emp.approved, emp.submitted, emp.draft, emp.checkInsCompleted || '', '', `${emp.completion}%`]);
  });
  return rows.map(r => r.join(',')).join('\n');
}

function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const REPORT_TYPES = [
  { id: 'achievement', label: 'Achievement Report', icon: BarChart3, desc: 'Planned Target vs Actual Achievement for all employees' },
  { id: 'completion',  label: 'Completion Dashboard', icon: Users, desc: 'Who completed quarterly check-ins' },
  { id: 'dept_summary', label: 'Department Summary', icon: CheckCircle, desc: 'Aggregated metrics per department' },
  { id: 'quarterly',  label: 'Quarterly Progress', icon: TrendingUp, desc: 'Q1–Q4 performance trend report' },
];

export default function Reports() {
  const [downloading, setDownloading] = useState(null);
  const [unlocking, setUnlocking] = useState(null);
  const [unlockedGoals, setUnlockedGoals] = useState([]);
  const approvedGoals = mockGoals.filter(g => g.status === GOAL_STATUS.APPROVED);

  const handleDownload = (id) => {
    setDownloading(id);
    setTimeout(() => {
      if (id === 'achievement') downloadCSV(buildAchievementCSV(), 'achievement_report_fy2026.csv');
      else if (id === 'completion') downloadCSV(buildCompletionCSV(), 'completion_report_fy2026.csv');
      else downloadCSV(`Report: ${id}\nGenerated: ${new Date().toISOString()}`, `${id}_report.csv`);
      setDownloading(null);
    }, 800);
  };

  const handleUnlock = (goalId) => {
    setUnlocking(goalId);
    setTimeout(() => { setUnlockedGoals(prev => [...prev, goalId]); setUnlocking(null); }, 800);
  };

  // Completion dashboard data
  const completionDashboard = QUARTERS.map(q => {
    const completed = mockGoals.filter(g => g.checkIns?.[q]?.status === 'completed').length;
    const total = mockGoals.filter(g => g.status === GOAL_STATUS.APPROVED).length;
    return { quarter: q, completed, total, pct: total > 0 ? Math.round((completed / total) * 100) : 0 };
  });

  // Planned vs Actual per employee
  const plannedVsActual = mockUsers.filter(u => u.role === 'employee').map(user => {
    const userGoals = mockGoals.filter(g => g.employeeId === user.id && g.status === GOAL_STATUS.APPROVED);
    let totalScore = 0, count = 0;
    userGoals.forEach(g => {
      ['Q1', 'Q2'].forEach(q => {
        const s = computeProgressScore(g, g.checkIns?.[q] || {});
        if (s !== null) { totalScore += s; count++; }
      });
    });
    return { user, goals: userGoals.length, avgScore: count > 0 ? Math.round(totalScore / count) : null };
  }).filter(r => r.goals > 0);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8 pb-12 max-w-7xl">
      <motion.div variants={itemVariants}>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 border border-primary-200 text-xs font-semibold text-primary-700 uppercase tracking-widest mb-3">Exports</div>
        <h1 className="text-2xl font-bold text-slate-900">Reports & Export</h1>
        <p className="text-slate-500 text-sm mt-1 font-medium">Generate and export performance reports for FY2026</p>
      </motion.div>

      {/* Export Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {REPORT_TYPES.map((r) => {
          const Icon = r.icon;
          const isDownloading = downloading === r.id;
          return (
            <div key={r.id} className="card p-5 flex flex-col items-start border-slate-200 relative overflow-hidden group">
              <div className="p-3 rounded-xl bg-primary-50 border border-primary-100 mb-4 group-hover:scale-110 transition-transform">
                <Icon className="h-5 w-5 text-primary-600" />
              </div>
              <p className="text-sm font-bold text-slate-900 mb-1">{r.label}</p>
              <p className="text-xs text-slate-500 font-medium mb-4 flex-1">{r.desc}</p>
              <button
                id={`export-${r.id}-btn`}
                onClick={() => handleDownload(r.id)}
                className={cn(
                  'w-full flex items-center justify-center gap-2 text-xs font-bold px-4 py-2 rounded-lg transition-all border',
                  isDownloading
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-white border-slate-200 hover:bg-primary-600 hover:text-white hover:border-primary-600 text-slate-700'
                )}
              >
                {isDownloading
                  ? <><div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> Generating...</>
                  : <><Download className="h-4 w-4" /> Export CSV</>}
              </button>
            </div>
          );
        })}
      </motion.div>

      {/* Completion Dashboard */}
      <motion.div variants={itemVariants} className="card border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="text-base font-bold text-slate-900">Completion Dashboard</h3>
          <p className="text-xs text-slate-500 mt-0.5">Real-time view of quarterly check-in completion</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 divide-x divide-y lg:divide-y-0 divide-slate-100">
          {completionDashboard.map(d => (
            <div key={d.quarter} className="p-6 text-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{d.quarter} Check-In</p>
              <p className={cn('text-3xl font-extrabold mb-1', d.pct >= 80 ? 'text-emerald-600' : d.pct >= 50 ? 'text-amber-600' : 'text-slate-400')}>{d.pct}%</p>
              <p className="text-xs text-slate-500">{d.completed}/{d.total} goals</p>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
                <div className={cn('h-full rounded-full', d.pct >= 80 ? 'bg-emerald-500' : d.pct >= 50 ? 'bg-amber-500' : 'bg-slate-300')} style={{ width: `${d.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Charts */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GoalCompletionChart />
        <EmployeeProgressChart />
      </motion.div>

      {/* Planned vs Actual Achievement Table */}
      <motion.div variants={itemVariants} className="card border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary-600" /> Achievement Report — Planned vs. Actual
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Progress scores computed by UoM formula</p>
          </div>
          <button onClick={() => handleDownload('achievement')} className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1.5 transition-colors">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                {['Employee', 'Goal', 'UoM', 'Target', 'Q1 Planned', 'Q1 Actual', 'Q1 Score', 'Q2 Score', 'Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {mockGoals.filter(g => g.status === GOAL_STATUS.APPROVED).slice(0, 8).map(goal => {
                const user = mockUsers.find(u => u.id === goal.employeeId);
                const q1 = goal.checkIns?.Q1 || {};
                const q2 = goal.checkIns?.Q2 || {};
                const s1 = computeProgressScore(goal, q1);
                const s2 = computeProgressScore(goal, q2);
                const scoreClass = (s) => s >= 80 ? 'text-emerald-700 bg-emerald-50' : s >= 50 ? 'text-amber-700 bg-amber-50' : 'text-rose-700 bg-rose-50';
                return (
                  <tr key={goal.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white text-[10px] font-bold flex items-center justify-center">{user?.avatar}</div>
                        <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">{user?.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><p className="text-xs text-slate-700 font-medium max-w-[160px] truncate" title={goal.title}>{goal.title}</p></td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{goal.unit}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-700">{goal.target}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{q1.planned || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-700 font-medium">{q1.actual || '—'}</td>
                    <td className="px-4 py-3">{s1 !== null ? <span className={cn('text-xs font-bold px-2 py-0.5 rounded', scoreClass(s1))}>{s1}%</span> : <span className="text-xs text-slate-300">—</span>}</td>
                    <td className="px-4 py-3">{s2 !== null ? <span className={cn('text-xs font-bold px-2 py-0.5 rounded', scoreClass(s2))}>{s2}%</span> : <span className="text-xs text-slate-300">—</span>}</td>
                    <td className="px-4 py-3"><span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase">Approved</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Unlock Approved Goals */}
      <motion.div variants={itemVariants} className="card border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="text-base font-bold text-slate-900">Goal Unlock (Admin)</h3>
          <p className="text-xs text-slate-500 mt-0.5">Allow employees to revise locked/approved goals — captured in audit log</p>
        </div>
        <div className="divide-y divide-slate-50">
          {approvedGoals.slice(0, 5).map((goal) => {
            const emp = mockUsers.find(u => u.id === goal.employeeId);
            const isUnlocked = unlockedGoals.includes(goal.id);
            return (
              <div key={goal.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-700">{goal.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    <span className="text-primary-600 font-medium">{emp?.name}</span> · {goal.thrustArea} · <span className="text-primary-600">{goal.weightage}%</span>
                  </p>
                </div>
                {isUnlocked ? (
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">Unlocked</span>
                ) : (
                  <button
                    id={`unlock-${goal.id}-btn`}
                    onClick={() => handleUnlock(goal.id)}
                    disabled={unlocking === goal.id}
                    className="text-xs font-bold px-4 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Unlock className="h-3 w-3" />
                    {unlocking === goal.id ? 'Unlocking...' : 'Unlock Goal'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
