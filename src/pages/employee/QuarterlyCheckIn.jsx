import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { mockGoals, CHECK_IN_STATUS, computeProgressScore } from '../../data/mockGoals';
import { cn } from '../../lib/utils';
import {
  CalendarCheck, Save, CheckCircle2,
  Info, Calendar, Lock,
} from 'lucide-react';
import { motion } from 'framer-motion';

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
const QUARTER_DATES = {
  Q1: 'Jan – Mar 2026',
  Q2: 'Apr – Jun 2026',
  Q3: 'Jul – Sep 2026',
  Q4: 'Oct – Dec 2026',
};

const STATUS_OPTIONS = [
  { value: CHECK_IN_STATUS.NOT_STARTED, label: 'Not Started' },
  { value: CHECK_IN_STATUS.ON_TRACK,    label: 'On Track' },
  { value: CHECK_IN_STATUS.COMPLETED,   label: 'Completed' },
  { value: CHECK_IN_STATUS.AT_RISK,     label: 'At Risk' },
];

const STATUS_COLOR = {
  [CHECK_IN_STATUS.COMPLETED]:   'bg-emerald-500',
  [CHECK_IN_STATUS.ON_TRACK]:    'bg-blue-500',
  [CHECK_IN_STATUS.AT_RISK]:     'bg-rose-500',
  [CHECK_IN_STATUS.NOT_STARTED]: 'bg-slate-200',
};

const STATUS_TEXT = {
  [CHECK_IN_STATUS.COMPLETED]:   'text-emerald-700 bg-emerald-50 border-emerald-200',
  [CHECK_IN_STATUS.ON_TRACK]:    'text-blue-700 bg-blue-50 border-blue-200',
  [CHECK_IN_STATUS.AT_RISK]:     'text-rose-700 bg-rose-50 border-rose-200',
  [CHECK_IN_STATUS.NOT_STARTED]: 'text-slate-500 bg-slate-50 border-slate-200',
};

function progressFromStatus(status) {
  return status === CHECK_IN_STATUS.COMPLETED ? 100 :
         status === CHECK_IN_STATUS.ON_TRACK   ? 60  :
         status === CHECK_IN_STATUS.AT_RISK    ? 30  : 0;
}

// Check-in schedule windows (from spec)
const CHECK_IN_WINDOWS = {
  Q1: { month: 'July',    opens: '2026-07-01' },
  Q2: { month: 'October', opens: '2026-10-01' },
  Q3: { month: 'January', opens: '2027-01-01' },
  Q4: { month: 'March',   opens: '2027-03-01' },
};

function isWindowOpen(quarter) {
  const now = new Date();
  const opens = new Date(CHECK_IN_WINDOWS[quarter].opens);
  return now >= opens;
}

export default function QuarterlyCheckIn() {
  const { currentUser } = useAuth();
  const [activeQ, setActiveQ] = useState('Q1');
  const [checkIns, setCheckIns] = useState(() => {
    const goals = mockGoals.filter((g) => g.employeeId === currentUser?.id);
    const state = {};
    goals.forEach((g) => { state[g.id] = { ...g.checkIns }; });
    return state;
  });
  const [saved, setSaved] = useState(false);

  const goals = mockGoals.filter((g) => g.employeeId === currentUser?.id);
  const windowOpen = isWindowOpen(activeQ);

  const updateCheckIn = (goalId, quarter, field, value) => {
    setCheckIns((prev) => ({
      ...prev,
      [goalId]: {
        ...prev[goalId],
        [quarter]: { ...(prev[goalId]?.[quarter] || {}), [field]: value },
      },
    }));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Quarter summary stats
  const getQStats = (q) => {
    const statuses = goals.map((g) => checkIns[g.id]?.[q]?.status || CHECK_IN_STATUS.NOT_STARTED);
    return {
      completed:  statuses.filter((s) => s === CHECK_IN_STATUS.COMPLETED).length,
      onTrack:    statuses.filter((s) => s === CHECK_IN_STATUS.ON_TRACK).length,
      atRisk:     statuses.filter((s) => s === CHECK_IN_STATUS.AT_RISK).length,
      notStarted: statuses.filter((s) => s === CHECK_IN_STATUS.NOT_STARTED).length,
    };
  };

  // Compute weighted average progress score for a quarter
  const getWeightedScore = (q) => {
    let totalWeight = 0;
    let weightedScore = 0;
    goals.forEach((goal) => {
      const ci = checkIns[goal.id]?.[q] || {};
      const score = computeProgressScore(goal, ci);
      if (score !== null) {
        weightedScore += score * goal.weightage;
        totalWeight += goal.weightage;
      }
    });
    if (totalWeight === 0) return null;
    return Math.round(weightedScore / totalWeight);
  };

  const UOM_FORMULA_LABELS = {
    numeric_min:    'Achievement ÷ Target',
    numeric_max:    'Target ÷ Achievement',
    percentage_min: 'Achievement ÷ Target',
    percentage_max: 'Target ÷ Achievement',
    timeline:       'Completion Date vs Deadline',
    zero_based:     'If 0 → 100%, else 0%',
    numeric:        'Achievement ÷ Target',
    percentage:     'Achievement ÷ Target',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-12 max-w-5xl"
    >
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-200 text-[10px] font-bold text-primary-700 uppercase tracking-widest mb-3">
          <CalendarCheck className="h-3 w-3" /> Check-Ins
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quarterly Check-In</h1>
        <p className="text-slate-500 font-medium mt-1 text-sm">
          Track planned vs. actual achievements per quarter for <strong className="text-slate-700">FY2026</strong>.
        </p>
      </div>

      {/* Check-In Schedule */}
      <div className="card p-4 bg-amber-50 border-amber-200">
        <div className="flex items-start gap-3">
          <Calendar className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-amber-800 uppercase tracking-widest mb-2">Check-In Schedule (FY2026)</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {QUARTERS.map(q => (
                <div key={q} className="text-xs text-amber-700">
                  <span className="font-bold">{q}:</span> Opens {CHECK_IN_WINDOWS[q].month}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quarter Selector Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {QUARTERS.map((q) => {
          const stats = getQStats(q);
          const pct = goals.length ? Math.round((stats.completed / goals.length) * 100) : 0;
          const score = getWeightedScore(q);
          const open = isWindowOpen(q);
          return (
            <button
              key={q}
              id={`quarter-${q}-btn`}
              onClick={() => setActiveQ(q)}
              className={cn(
                'card p-4 text-left transition-all duration-200 border-2 relative',
                activeQ === q
                  ? 'border-primary-500 bg-primary-50 shadow-md'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={cn('text-lg font-extrabold', activeQ === q ? 'text-primary-700' : 'text-slate-700')}>{q}</span>
                {open
                  ? <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full uppercase">Open</span>
                  : <Lock className="h-3.5 w-3.5 text-slate-400" />
                }
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{QUARTER_DATES[q]}</p>
              <div className="w-full bg-slate-200 rounded-full h-1.5 mb-2 overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', pct === 100 ? 'bg-emerald-500' : 'bg-primary-500')}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className={activeQ === q ? 'text-primary-600' : 'text-slate-500'}>{pct}% done</span>
                {score !== null && (
                  <span className="text-slate-600">{score}% score</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Quarter Panel */}
      <div className="card overflow-hidden border-slate-200">
        {/* Panel Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200 gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span className="text-primary-600">{activeQ}</span> Check-In
              {!windowOpen && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  <Lock className="h-3 w-3" /> Opens {CHECK_IN_WINDOWS[activeQ].month}
                </span>
              )}
            </h3>
            <p className="text-xs font-medium text-slate-500 mt-0.5">{QUARTER_DATES[activeQ]}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Weighted Score */}
            {(() => {
              const score = getWeightedScore(activeQ);
              return score !== null ? (
                <div className="text-center px-4 py-2 rounded-xl bg-white border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Weighted Score</p>
                  <p className={cn('text-xl font-extrabold', score >= 80 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-rose-600')}>
                    {score}%
                  </p>
                </div>
              ) : null;
            })()}
            <button
              id="save-checkin-btn"
              onClick={handleSave}
              disabled={!windowOpen}
              className={cn(
                'btn-primary flex items-center gap-2 text-sm transition-all',
                saved && 'bg-emerald-600 hover:bg-emerald-700',
                !windowOpen && 'opacity-50 cursor-not-allowed'
              )}
            >
              {saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {saved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Goals */}
        <div className="divide-y divide-slate-100">
          {goals.map((goal, i) => {
            const ci = checkIns[goal.id]?.[activeQ] || {};
            const status = ci.status || CHECK_IN_STATUS.NOT_STARTED;
            const progress = progressFromStatus(status);
            const score = computeProgressScore(goal, ci);
            const formula = UOM_FORMULA_LABELS[goal.unit] || 'Achievement ÷ Target';

            return (
              <div key={goal.id} className="p-6 hover:bg-slate-50/50 transition-colors">
                {/* Goal Meta */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Goal {i + 1}</span>
                      {goal.isShared && (
                        <span className="text-[9px] font-bold text-primary-700 bg-primary-50 border border-primary-200 px-1.5 py-0.5 rounded-full uppercase tracking-widest">
                          Shared KPI
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">{goal.title}</h4>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
                      <span className="uppercase tracking-wider font-medium">{goal.thrustArea}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span>Target: <strong className="text-slate-700">{goal.target}</strong></span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span className="font-bold text-primary-600">{goal.weightage}% wt</span>
                    </div>
                    {/* UoM formula hint */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <Info className="h-3 w-3 text-slate-400" />
                      <span className="text-[10px] text-slate-400 font-medium">
                        Progress formula: <span className="font-semibold text-slate-600">{formula}</span>
                      </span>
                    </div>
                  </div>
                  <div className="w-full md:w-44 flex-shrink-0">
                    <label className="label text-[10px]">Status</label>
                    <select
                      id={`checkin-status-${goal.id}-${activeQ}`}
                      className="input text-sm py-2"
                      value={status}
                      onChange={(e) => updateCheckIn(goal.id, activeQ, 'status', e.target.value)}
                      disabled={!windowOpen}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={cn(
                      'inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-widest',
                      STATUS_TEXT[status]
                    )}>{status.replace('_', ' ')}</span>
                    <span className="text-xs font-bold text-slate-700">{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', STATUS_COLOR[status])}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Planned vs Actual */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <label className="label text-xs">Planned Achievement</label>
                    <input
                      className="input text-sm"
                      placeholder={`e.g. ${goal.target}`}
                      value={ci.planned || ''}
                      onChange={(e) => updateCheckIn(goal.id, activeQ, 'planned', e.target.value)}
                      disabled={!windowOpen}
                    />
                  </div>
                  <div>
                    <label className="label text-xs flex items-center gap-2">
                      Actual Achievement
                      {score !== null && (
                        <span className={cn(
                          'text-[10px] font-bold px-1.5 py-0.5 rounded border',
                          score >= 80 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                          score >= 50 ? 'text-amber-700 bg-amber-50 border-amber-200' :
                          'text-rose-700 bg-rose-50 border-rose-200'
                        )}>
                          Score: {score}%
                        </span>
                      )}
                    </label>
                    <input
                      className="input text-sm"
                      placeholder="What you actually achieved..."
                      value={ci.actual || ''}
                      onChange={(e) => updateCheckIn(goal.id, activeQ, 'actual', e.target.value)}
                      disabled={!windowOpen}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label text-xs">Notes / Comments</label>
                    <textarea
                      className="input text-sm resize-none"
                      rows={2}
                      placeholder="Any blockers, context, or updates..."
                      value={ci.notes || ''}
                      onChange={(e) => updateCheckIn(goal.id, activeQ, 'notes', e.target.value)}
                      disabled={!windowOpen}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
