import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { GOAL_STATUS, CHECK_IN_STATUS, computeProgressScore } from '../../lib/constants';
import { goalsService, auditService } from '../../lib/services';
import { cn } from '../../lib/utils';
import {
  CalendarCheck, Save, CheckCircle2,
  Info, Calendar, Lock, Loader2, AlertTriangle,
  XCircle, Check, HelpCircle, FileText, ChevronRight,
  TrendingUp, Sparkles, X, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
const QUARTER_DATES = {
  Q1: 'Jan 1 – Mar 31, 2026',
  Q2: 'Apr 1 – Jun 30, 2026',
  Q3: 'Jul 1 – Sep 30, 2026',
  Q4: 'Oct 1 – Dec 31, 2026',
};

const STATUS_OPTIONS = [
  { value: CHECK_IN_STATUS.NOT_STARTED, label: 'Not Started' },
  { value: CHECK_IN_STATUS.ON_TRACK,    label: 'On Track' },
  { value: CHECK_IN_STATUS.COMPLETED,   label: 'Completed' },
  { value: CHECK_IN_STATUS.AT_RISK,     label: 'At Risk' },
];

const STATUS_COLOR = {
  [CHECK_IN_STATUS.COMPLETED]:   'bg-emerald-500',
  [CHECK_IN_STATUS.ON_TRACK]:    'bg-orange-500',
  [CHECK_IN_STATUS.AT_RISK]:     'bg-rose-500',
  [CHECK_IN_STATUS.NOT_STARTED]: 'bg-slate-200',
};

const STATUS_TEXT = {
  [CHECK_IN_STATUS.COMPLETED]:   'text-emerald-700 bg-emerald-50 border-emerald-200',
  [CHECK_IN_STATUS.ON_TRACK]:    'text-orange-700 bg-orange-50 border-orange-200',
  [CHECK_IN_STATUS.AT_RISK]:     'text-rose-700 bg-rose-50 border-rose-200',
  [CHECK_IN_STATUS.NOT_STARTED]: 'text-slate-500 bg-slate-50 border-slate-200',
};

function progressFromStatus(status) {
  return status === CHECK_IN_STATUS.COMPLETED ? 100 :
         status === CHECK_IN_STATUS.ON_TRACK   ? 60  :
         status === CHECK_IN_STATUS.AT_RISK    ? 30  : 0;
}

const CHECK_IN_WINDOWS = {
  Q1: { month: 'July',    opens: '2026-07-01' },
  Q2: { month: 'October', opens: '2026-10-01' },
  Q3: { month: 'January', opens: '2027-01-01' },
  Q4: { month: 'March',   opens: '2027-03-01' },
};

function isWindowOpen(quarter) {
  const now = new Date();
  const opens = new Date(CHECK_IN_WINDOWS[quarter].opens);
  // Auto-unlock for Q1 and Q2 in developer demo mode always
  return true;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 350, damping: 25 } }
};

export default function QuarterlyCheckIn() {
  const { currentUser } = useAuth();
  const [activeQ, setActiveQ] = useState('Q1');
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkIns, setCheckIns] = useState({});
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (currentUser?.id) {
      loadGoals();
    }
  }, [currentUser]);

  const showToast = (title, desc, type = 'info') => {
    setToast({ title, desc, type });
    const timer = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timer);
  };

  const loadGoals = async () => {
    try {
      setLoading(true);
      const data = await goalsService.getEmployeeGoals(currentUser.id);
      // Filter out only approved goals for quarterly updates to keep sheet consistent
      const approvedOnly = data.filter(g => g.status === 'approved');
      setGoals(approvedOnly);
      
      const state = {};
      approvedOnly.forEach(goal => {
        const qData = {};
        (goal.check_ins || []).forEach(ci => {
          qData[ci.quarter] = {
            id: ci.id,
            status: ci.status || CHECK_IN_STATUS.NOT_STARTED,
            planned: ci.planned_value || '',
            actual: ci.actual_value || '',
            notes: ci.notes || '',
            review_status: ci.review_status || 'draft',
            manager_feedback: ci.manager_feedback || '',
            timestamp: ci.timestamp || null
          };
        });
        state[goal.id] = qData;
      });
      setCheckIns(state);
    } catch (error) {
      console.error('Failed to load goals:', error);
      showToast('Load Error', 'Could not load your performance cycles.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateCheckIn = (goalId, quarter, field, value) => {
    setCheckIns((prev) => ({
      ...prev,
      [goalId]: {
        ...prev[goalId],
        [quarter]: { ...(prev[goalId]?.[quarter] || {}), [field]: value },
      },
    }));
  };

  const handleSave = async (isSubmitAction = false) => {
    if (goals.length === 0) {
      showToast('Operation Blocked', 'You do not have any approved goals to update this quarter.', 'warning');
      return;
    }

    try {
      if (isSubmitAction) setSubmitting(true);
      else setSaving(true);
      
      const updates = [];
      goals.forEach(goal => {
        const ci = checkIns[goal.id]?.[activeQ] || {};
        updates.push({
          id: ci.id,
          goal_id: goal.id,
          employee_id: currentUser.id,
          quarter: activeQ,
          status: ci.status || CHECK_IN_STATUS.NOT_STARTED,
          planned_value: ci.planned || '',
          actual_value: ci.actual || '',
          notes: ci.notes || '',
          review_status: isSubmitAction ? 'pending' : (ci.review_status || 'draft'),
          manager_feedback: ci.manager_feedback || '',
          timestamp: new Date().toISOString()
        });
      });

      for (const update of updates) {
        await goalsService.submitCheckIn(update);
        const goal = goals.find(g => g.id === update.goal_id);
        const goalTitle = goal ? goal.title : 'Goal';
        
        try {
          const actionLabel = isSubmitAction ? 'CHECK_IN_SUBMITTED' : 'CHECK_IN_UPDATED';
          const detailsStr = isSubmitAction 
            ? `Submitted Q${activeQ.charAt(1)} check-in for "${goalTitle}"`
            : `Saved Q${activeQ.charAt(1)} draft check-in for "${goalTitle}"`;
          await auditService.logAction(actionLabel, currentUser.name, detailsStr);
        } catch (e) {
          console.error('Audit log failed:', e);
        }
      }

      showToast(
        isSubmitAction ? 'Cycle Submitted' : 'Draft Saved Successfully',
        isSubmitAction 
          ? `Your ${activeQ} updates have been locked and sent to your manager for review.`
          : 'Your quarterly entries have been safely cached as drafts.',
        isSubmitAction ? 'success' : 'info'
      );

      await loadGoals(); 
    } catch (error) {
      console.error('Failed to update check-ins:', error);
      showToast('Save Error', 'Failed to communicate changes to Supabase.', 'error');
    } finally {
      setSaving(false);
      setSubmitting(false);
    }
  };

  // Quarter summary stats
  const getQStats = (q) => {
    const statuses = goals.map((g) => checkIns[g.id]?.[q]?.status || CHECK_IN_STATUS.NOT_STARTED);
    const reviewStatuses = goals.map((g) => checkIns[g.id]?.[q]?.review_status || 'draft');
    
    // Determine overall quarter review status
    let qReviewStatus = 'draft';
    if (reviewStatuses.some(s => s === 'approved')) qReviewStatus = 'approved';
    else if (reviewStatuses.some(s => s === 'rejected')) qReviewStatus = 'rejected';
    else if (reviewStatuses.some(s => s === 'pending')) qReviewStatus = 'pending';

    return {
      completed:  statuses.filter((s) => s === CHECK_IN_STATUS.COMPLETED).length,
      onTrack:    statuses.filter((s) => s === CHECK_IN_STATUS.ON_TRACK).length,
      atRisk:     statuses.filter((s) => s === CHECK_IN_STATUS.AT_RISK).length,
      notStarted: statuses.filter((s) => s === CHECK_IN_STATUS.NOT_STARTED).length,
      reviewStatus: qReviewStatus
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

  // Determine if the active quarter is locked (i.e., submitted or approved)
  const isQuarterLocked = () => {
    if (goals.length === 0) return true;
    return goals.some(g => {
      const rStatus = checkIns[g.id]?.[activeQ]?.review_status;
      return rStatus === 'pending' || rStatus === 'approved';
    });
  };

  const getActiveQuarterReviewStatus = () => {
    if (goals.length === 0) return 'draft';
    const statuses = goals.map(g => checkIns[g.id]?.[activeQ]?.review_status || 'draft');
    if (statuses.includes('approved')) return 'approved';
    if (statuses.includes('rejected')) return 'rejected';
    if (statuses.includes('pending')) return 'pending';
    return 'draft';
  };

  const activeReviewStatus = getActiveQuarterReviewStatus();
  const isLocked = isQuarterLocked();

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 pb-12 max-w-5xl"
    >
      {/* Toast Notification Panel */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className={cn(
              "fixed top-6 right-6 z-[100] w-96 bg-white border-l-4 rounded-2xl shadow-2xl p-4 flex gap-3.5 backdrop-blur-md border border-slate-100",
              toast.type === 'success' ? 'border-emerald-500' :
              toast.type === 'error' ? 'border-rose-500' :
              toast.type === 'warning' ? 'border-orange-500' :
              'border-blue-500'
            )}
          >
            <div className={cn(
              "p-2 rounded-xl self-start flex-shrink-0",
              toast.type === 'success' ? 'bg-emerald-50/50 text-emerald-600' :
              toast.type === 'error' ? 'bg-rose-50/50 text-rose-600' :
              toast.type === 'warning' ? 'bg-orange-50/50 text-orange-600' :
              'bg-blue-50/50 text-blue-600'
            )}>
              {toast.type === 'success' && <CheckCircle2 className="h-5 w-5" />}
              {toast.type === 'error' && <XCircle className="h-5 w-5" />}
              {toast.type === 'warning' && <AlertTriangle className="h-5 w-5" />}
              {toast.type === 'info' && <Info className="h-5 w-5" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-extrabold text-slate-900">{toast.title}</p>
              <p className="text-xs text-slate-500 font-semibold mt-0.5 leading-relaxed">{toast.desc}</p>
            </div>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 transition-colors self-start p-0.5 rounded-lg hover:bg-slate-50">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-[10px] font-bold text-orange-700 uppercase tracking-widest mb-3 shadow-sm shadow-orange-500/5">
            <CalendarCheck className="h-3.5 w-3.5 text-orange-500 animate-pulse" /> Performance Cycle
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Quarterly Check-In</h1>
          <p className="text-slate-500 font-medium mt-1 text-sm">
            Track planned vs. actual achievements per quarter for <strong className="text-slate-700">FY2026</strong>.
          </p>
        </div>
      </motion.div>

      {/* Corporate Timeline UI */}
      <motion.div variants={itemVariants} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-orange-600 pointer-events-none select-none">
          <Calendar className="w-48 h-48" />
        </div>
        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-orange-500" /> Interactive Performance Timeline
        </h3>
        
        {/* Horizontal Timeline Connector */}
        <div className="relative">
          <div className="absolute top-1/2 left-4 right-4 h-[2px] bg-slate-100 -translate-y-1/2 hidden md:block" />
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
            {QUARTERS.map((q, idx) => {
              const stats = getQStats(q);
              const isCurrent = activeQ === q;
              const hasScore = getWeightedScore(q) !== null;
              
              return (
                <button
                  key={q}
                  onClick={() => setActiveQ(q)}
                  className={cn(
                    "text-left p-4 rounded-2xl border transition-all duration-300 relative group flex flex-col justify-between bg-white hover:shadow-md",
                    isCurrent 
                      ? "border-orange-500 ring-2 ring-orange-500/10 bg-orange-50/5 shadow-sm" 
                      : "border-slate-100 hover:border-slate-200"
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className={cn(
                        "text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md",
                        isCurrent ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200/60"
                      )}>
                        {q} CYCLE
                      </span>
                      <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">{QUARTER_DATES[q].split(',')[0]}</p>
                    </div>
                    
                    <div className="flex-shrink-0">
                      {stats.reviewStatus === 'approved' ? (
                        <div className="p-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100" title="Approved">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      ) : stats.reviewStatus === 'pending' ? (
                        <div className="p-1 rounded-full bg-orange-50 text-orange-600 border border-orange-100 animate-pulse" title="Awaiting Manager Review">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        </div>
                      ) : stats.reviewStatus === 'rejected' ? (
                        <div className="p-1 rounded-full bg-rose-50 text-rose-600 border border-rose-100" title="Rework Requested">
                          <AlertTriangle className="h-3.5 w-3.5" />
                        </div>
                      ) : (
                        <div className="p-1 rounded-full bg-slate-50 text-slate-400 border border-slate-100" title="Draft / In Progress">
                          <FileText className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 mt-4 pt-3 border-t border-slate-50">
                    <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-600">
                      <span>Status</span>
                      <span className={cn(
                        "uppercase tracking-wider text-[10px]",
                        stats.reviewStatus === 'approved' ? 'text-emerald-600' :
                        stats.reviewStatus === 'pending' ? 'text-orange-500' :
                        stats.reviewStatus === 'rejected' ? 'text-rose-500' :
                        'text-slate-400'
                      )}>
                        {stats.reviewStatus === 'rejected' ? 'Rework' : stats.reviewStatus}
                      </span>
                    </div>
                    {hasScore && (
                      <div className="flex items-center justify-between text-[11px] font-extrabold">
                        <span className="text-slate-400">Score</span>
                        <span className="text-orange-600">{getWeightedScore(q)}%</span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Lock Banner / Notification Banner */}
      <AnimatePresence mode="wait">
        {isLocked && activeReviewStatus === 'pending' && (
          <motion.div
            key="lock-pending"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-3xl p-5 flex items-start gap-4 shadow-sm"
          >
            <div className="p-2 rounded-xl bg-orange-100 text-orange-600 flex-shrink-0">
              <Lock className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-orange-950 flex items-center gap-1.5">
                CYCLE LOCKED FOR REVIEW
              </h4>
              <p className="text-xs text-orange-800 font-semibold mt-0.5 leading-relaxed">
                Your manager is currently auditing your {activeQ} achievements. Submissions and changes are disabled until review is completed.
              </p>
            </div>
          </motion.div>
        )}

        {isLocked && activeReviewStatus === 'approved' && (
          <motion.div
            key="lock-approved"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl p-5 flex items-start gap-4 shadow-sm"
          >
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600 flex-shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-emerald-950 flex items-center gap-1.5">
                CYCLE APPROVED & SECURED
              </h4>
              <p className="text-xs text-emerald-800 font-semibold mt-0.5 leading-relaxed">
                Your performance score and check-ins have been approved and signed off by your manager. This cycle is now complete.
              </p>
            </div>
          </motion.div>
        )}

        {!isLocked && activeReviewStatus === 'rejected' && (
          <motion.div
            key="rework-banner"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-r from-rose-50 to-red-50 border border-rose-200 rounded-3xl p-5 flex items-start gap-4 shadow-sm"
          >
            <div className="p-2 rounded-xl bg-rose-100 text-rose-600 flex-shrink-0">
              <AlertTriangle className="h-5 w-5 animate-bounce" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-extrabold text-rose-950 flex items-center gap-1.5">
                ACTION REQUIRED: REWORK REQUESTED
              </h4>
              <p className="text-xs text-rose-800 font-semibold mt-0.5 leading-relaxed">
                Your manager has requested revision of your quarterly targets or achievement calculations. Please update your values and resubmit.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Form Area */}
      <motion.div variants={itemVariants} className="card overflow-hidden border-slate-100 bg-white rounded-3xl shadow-sm">
        {/* Panel Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 bg-slate-50/50 border-b border-slate-100 gap-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
              <span className="text-orange-500">{activeQ} Cycle</span> Details
              {isLocked ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  <Lock className="h-3 w-3" /> Locked
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Editable
                </span>
              )}
            </h3>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">{QUARTER_DATES[activeQ]}</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {getWeightedScore(activeQ) !== null && (
              <div className="text-center px-4 py-1.5 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-3">
                <div>
                  <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest text-left">WEIGHTED SCORE</p>
                  <p className="text-base font-black text-orange-600 text-left">
                    {getWeightedScore(activeQ)}%
                  </p>
                </div>
              </div>
            )}
            
            {!isLocked && goals.length > 0 && (
              <div className="flex items-center gap-2.5">
                <button
                  id="save-checkin-btn"
                  onClick={() => handleSave(false)}
                  disabled={saving || submitting}
                  className="px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 rounded-2xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" /> : <Save className="h-3.5 w-3.5" />}
                  Save Draft
                </button>
                <button
                  id="submit-checkin-btn"
                  onClick={() => handleSave(true)}
                  disabled={saving || submitting}
                  className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-orange-500/10 flex items-center gap-1.5"
                >
                  {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  Submit for Approval
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Goals / Form Lists */}
        {goals.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-4 text-slate-400">
              <Calendar className="w-7 h-7 text-slate-300" />
            </div>
            <h4 className="text-base font-bold text-slate-700">No Approved Goals Found</h4>
            <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
              Before you can submit quarterly progress check-ins, your overall goal sheet must be completed and approved by your manager.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {goals.map((goal, i) => {
              const ci = checkIns[goal.id]?.[activeQ] || {};
              const status = ci.status || CHECK_IN_STATUS.NOT_STARTED;
              const progress = progressFromStatus(status);
              const score = computeProgressScore(goal, ci);
              const feedback = ci.manager_feedback;

              return (
                <div key={goal.id} className="p-6 hover:bg-slate-50/[0.15] transition-colors relative">
                  
                  {/* Goal Header */}
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-5">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">GOAL CARD {i + 1}</span>
                        {goal.is_shared && (
                          <span className="text-[9px] font-extrabold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Shared KPI
                          </span>
                        )}
                        <span className={cn(
                          "text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border tracking-wide",
                          ci.review_status === 'approved' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                          ci.review_status === 'pending' ? 'text-orange-700 bg-orange-50 border-orange-200' :
                          ci.review_status === 'rejected' ? 'text-rose-700 bg-rose-50 border-rose-200' :
                          'text-slate-500 bg-slate-50 border-slate-200'
                        )}>
                          {ci.review_status === 'rejected' ? 'Rework' : ci.review_status || 'draft'}
                        </span>
                      </div>
                      
                      <h4 className="text-base font-bold text-slate-800 tracking-tight">{goal.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{goal.description}</p>
                      
                      <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-400 font-semibold">
                        <span className="uppercase text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">{goal.thrust_area}</span>
                        <span>Target: <strong className="text-slate-700 font-extrabold">{goal.target}</strong></span>
                        <span>Weight: <strong className="text-orange-600 font-extrabold">{goal.weightage}%</strong></span>
                      </div>
                    </div>

                    {/* Status Dropdown */}
                    <div className="w-full md:w-44 flex-shrink-0">
                      <label className="label text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 block">Status</label>
                      <select
                        id={`checkin-status-${goal.id}-${activeQ}`}
                        className="input text-xs py-2 bg-white"
                        value={status}
                        onChange={(e) => updateCheckIn(goal.id, activeQ, 'status', e.target.value)}
                        disabled={isLocked}
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Manager Feedback Section */}
                  {feedback && (
                    <div className="mb-5 bg-orange-50/20 border border-dashed border-orange-200 rounded-2xl p-4 flex gap-3">
                      <div className="p-1 rounded-lg bg-orange-100/60 text-orange-600 flex-shrink-0 self-start">
                        <Info className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-[9px] font-extrabold text-orange-700 uppercase tracking-widest">Manager Feedback</span>
                        <p className="text-xs text-slate-600 font-semibold mt-0.5 italic leading-relaxed">
                          "{feedback}"
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Planned vs Actual Input Card */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                    <div>
                      <label className="label text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Planned Progress Target</label>
                      <input
                        className="input text-xs bg-white"
                        placeholder={`e.g. ${goal.target}`}
                        value={ci.planned || ''}
                        onChange={(e) => updateCheckIn(goal.id, activeQ, 'planned', e.target.value)}
                        disabled={isLocked}
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="label text-[10px] font-black text-slate-400 uppercase tracking-widest block">Actual Achievement</label>
                        {score !== null && (
                          <span className={cn(
                            "text-[9px] font-black px-2 py-0.5 rounded-full border tracking-wide uppercase",
                            score >= 80 ? "text-emerald-700 bg-emerald-50 border-emerald-200" :
                            score >= 50 ? "text-orange-700 bg-orange-50 border-orange-200" :
                            "text-rose-700 bg-rose-50 border-rose-200"
                          )}>
                            Score: {score}%
                          </span>
                        )}
                      </div>
                      <input
                        className="input text-xs bg-white"
                        placeholder="Enter quantitative achievements..."
                        value={ci.actual || ''}
                        onChange={(e) => updateCheckIn(goal.id, activeQ, 'actual', e.target.value)}
                        disabled={isLocked}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="label text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Employee Progress Notes & Blockers</label>
                      <textarea
                        className="input text-xs bg-white resize-none"
                        rows={2}
                        placeholder="Contextualize actual achievements, note blockers, dependency challenges..."
                        value={ci.notes || ''}
                        onChange={(e) => updateCheckIn(goal.id, activeQ, 'notes', e.target.value)}
                        disabled={isLocked}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Progress History Cards */}
      {goals.length > 0 && (
        <motion.div variants={itemVariants} className="space-y-4">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-orange-500" /> Historical Progress Audits
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {QUARTERS.filter(q => q !== activeQ).map(q => {
              const score = getWeightedScore(q);
              const stats = getQStats(q);
              
              if (score === null) return null;
              
              return (
                <div key={q} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{q} RESULTS</span>
                      <h4 className="text-sm font-extrabold text-slate-800 mt-0.5">{QUARTER_DATES[q].split(',')[0]}</h4>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Weighted Score</p>
                      <p className="text-lg font-black text-orange-600">{score}%</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 bg-slate-50/50 p-3 rounded-2xl border border-slate-50 text-center">
                    <div>
                      <p className="text-[9px] font-extrabold text-slate-400 uppercase">Completed</p>
                      <p className="text-xs font-black text-emerald-600 mt-0.5">{stats.completed} goals</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-extrabold text-slate-400 uppercase">On Track</p>
                      <p className="text-xs font-black text-orange-500 mt-0.5">{stats.onTrack} goals</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-extrabold text-slate-400 uppercase">Status</p>
                      <p className="text-[9px] font-black text-slate-600 mt-1 uppercase">{stats.reviewStatus}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
