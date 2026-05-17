import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { GOAL_STATUS, THRUST_AREAS, UNIT_OPTIONS } from '../../lib/constants';
import { goalsService, auditService } from '../../lib/services';
import StatusBadge from '../../components/shared/StatusBadge';
import {
  Plus, Trash2, Save, Send, Lock, AlertTriangle, CheckCircle2,
  ChevronDown, ChevronUp, Share2, Info, Loader2, Zap, Sparkles, X, XCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const MAX_GOALS = 8;
const MIN_WEIGHTAGE = 10;

const emptyGoal = (employeeId) => ({
  employee_id: employeeId,
  title: '',
  description: '',
  thrust_area: '',
  unit: 'percentage',
  target: '',
  weightage: 10,
  is_shared: false,
  status: 'draft',
  isNew: true, // Internal UI flag
});

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function GoalSheet() {
  const { currentUser } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [saved, setSaved] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [showAllErrors, setShowAllErrors] = useState(false);
  const [touchedFields, setTouchedFields] = useState({});

  // Floating Toast utility
  const showToast = (title, desc, type = 'info') => {
    setToast({ title, desc, type });
    // Auto-clear after 4 seconds
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  };

  useEffect(() => {
    async function loadGoals() {
      if (!currentUser?.id) return;
      try {
        setLoading(true);
        const data = await goalsService.getEmployeeGoals(currentUser.id);
        if (data && data.length > 0) {
          setGoals(data);
        } else {
          setGoals([emptyGoal(currentUser.id)]);
        }
      } catch (err) {
        console.error('Error loading goals:', err);
        showToast('System Error', 'Failed to retrieve goals from Supabase core.', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadGoals();
  }, [currentUser]);

  // Goal capacity & sheet lock check states
  const isGoalLimitReached = goals.length >= MAX_GOALS;
  const isSheetLocked = goals.length > 0 && goals.every(g => g.status === GOAL_STATUS.SUBMITTED || g.status === GOAL_STATUS.APPROVED);
  
  // Total weightage tracking
  const totalWeightage = goals.reduce((s, g) => s + Number(g.weightage || 0), 0);
  const remaining = 100 - totalWeightage;

  const isGoalLocked = (goal) => {
    return goal.status === GOAL_STATUS.SUBMITTED || goal.status === GOAL_STATUS.APPROVED;
  };

  const canEditGoal = (goal) => {
    return !goal.status || goal.status === 'draft' || goal.status === 'rejected' || goal.status === 'rework';
  };

  // Touch handlers
  const markTouched = (fieldKey) => {
    setTouchedFields(prev => ({ ...prev, [fieldKey]: true }));
  };

  // Main real-time validation engine
  const validate = (triggerToasts = true) => {
    const errs = {};
    
    // Count titles to catch duplicates
    const titleCounts = {};
    goals.forEach(g => {
      const title = g.title?.trim().toLowerCase();
      if (title) {
        titleCounts[title] = (titleCounts[title] || 0) + 1;
      }
    });

    goals.forEach((g, i) => {
      // Goal Title
      if (!g.title?.trim()) {
        errs[`${i}_title`] = 'Goal title is required';
      } else if (titleCounts[g.title.trim().toLowerCase()] > 1) {
        errs[`${i}_title`] = 'Duplicate goal title detected. Goal titles must be unique.';
      }

      // Thrust Area
      if (!g.thrust_area) {
        errs[`${i}_thrust`] = 'Thrust area is required';
      }

      // Target
      if (!g.target?.trim()) {
        errs[`${i}_target`] = 'Target description is required';
      }

      // Weightage
      const w = Number(g.weightage);
      if (isNaN(w) || w === 0) {
        errs[`${i}_weight`] = 'Weightage is required';
      } else if (w < MIN_WEIGHTAGE) {
        errs[`${i}_weight`] = `Minimum weightage per goal is ${MIN_WEIGHTAGE}%`;
      } else if (w > 100) {
        errs[`${i}_weight`] = 'Weightage cannot exceed 100%';
      }
    });

    // Total weightage check
    if (totalWeightage !== 100) {
      errs['total'] = `Total weightage must equal exactly 100% (currently ${totalWeightage}%)`;
    }

    // Capacity limit check
    if (goals.length > MAX_GOALS) {
      errs['goal_count'] = `Maximum of ${MAX_GOALS} goals allowed per employee (currently ${goals.length})`;
    }

    setErrors(errs);

    if (triggerToasts && Object.keys(errs).length > 0) {
      let desc = 'Please review and fix all highlighted issues in your goal sheet.';
      if (errs['total']) {
        desc = errs['total'];
      } else if (Object.values(errs).some(m => m.includes('Duplicate'))) {
        desc = 'Duplicate goal titles detected. Goal titles must be unique.';
      }
      showToast('Validation Alert', desc, 'warning');
    }

    return Object.keys(errs).length === 0;
  };

  // Run silent validation whenever goals change to give flawless real-time visual feedback
  useEffect(() => {
    if (goals.length > 0) {
      validate(false);
    }
  }, [goals]);

  // Decides whether to render inline error
  const getFieldError = (key) => {
    if (!errors[key]) return null;
    if (showAllErrors || touchedFields[key] || errors[key].includes('duplicate') || errors[key].includes('weightage') || errors[key].includes('Limit') || errors[key].includes('Min') || errors[key].includes('exceed')) {
      return errors[key];
    }
    return null;
  };

  const updateGoalField = (idx, field, val) => {
    const goal = goals[idx];
    if (isSheetLocked || !canEditGoal(goal)) {
      showToast('Action Blocked', 'This goal card is locked and cannot be edited.', 'error');
      return;
    }
    setGoals((prev) => prev.map((g, i) => {
      if (i === idx) {
        let parsedVal = val;
        if (field === 'weightage') {
          parsedVal = val === '' ? '' : Number(val);
        }
        return { ...g, [field]: parsedVal };
      }
      return g;
    }));
  };

  const addGoal = () => {
    if (goals.length >= MAX_GOALS) {
      showToast('Limit Reached', `Maximum capacity of ${MAX_GOALS} goals reached.`, 'warning');
      return;
    }
    if (isSheetLocked) {
      showToast('Action Blocked', 'Your goal sheet is submitted or approved and cannot be modified.', 'error');
      return;
    }
    setGoals((prev) => [...prev, emptyGoal(currentUser.id)]);
    setExpanded(goals.length);
    showToast('Goal Added', 'New draft goal card has been initialized.', 'success');
  };

  const removeGoal = (idx) => {
    const goal = goals[idx];
    if (isSheetLocked || !canEditGoal(goal)) {
      showToast('Action Blocked', 'This goal card is locked and cannot be deleted.', 'error');
      return;
    }
    setGoals((prev) => prev.filter((_, i) => i !== idx));
    showToast('Goal Removed', 'Goal card was successfully removed.', 'info');
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      
      // Prevent saving if title duplicates exist (case-insensitive check)
      const duplicateFound = goals.some((g, i) => {
        const t = g.title?.trim().toLowerCase();
        return t && goals.some((og, oi) => oi !== i && og.title?.trim().toLowerCase() === t);
      });

      if (duplicateFound) {
        showToast('Save Blocked', 'Duplicate goal titles detected. Goal titles must be unique.', 'error');
        setIsSubmitting(false);
        return;
      }

      // Check which goals are new vs updated to emit correct audit logs
      for (const goal of goals) {
        if (!canEditGoal(goal)) continue;
        if (goal.isNew || !goal.id) {
          await auditService.logAction('GOAL_CREATED', currentUser.name, `Created goal "${goal.title || 'Untitled Goal'}" as draft`);
        } else {
          await auditService.logAction('GOAL_UPDATED', currentUser.name, `Updated goal "${goal.title || 'Untitled Goal'}"`);
        }
      }

      // Clean internal flags before saving
      const goalsToSave = goals.map(({ isNew, ...g }) => g);
      await goalsService.upsertGoals(goalsToSave);
      
      setSaved(true);
      showToast('Draft Saved', 'Your progress has been securely cached.', 'success');
      setTimeout(() => setSaved(false), 2000);
      
      // Refresh goals to get IDs for new ones
      const refreshed = await goalsService.getEmployeeGoals(currentUser.id);
      setGoals(refreshed);
    } catch (err) {
      console.error('Save failed:', err);
      showToast('Save Failed', 'Could not record changes to the server database.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    setShowAllErrors(true);
    if (!validate(true)) return;
    
    try {
      setIsSubmitting(true);
      const goalsToSubmit = goals.map(({ isNew, ...g }) => ({
        ...g,
        status: GOAL_STATUS.SUBMITTED
      }));
      await goalsService.upsertGoals(goalsToSubmit);
      await auditService.logAction('SUBMITTED_GOALS', currentUser.name, `Submitted ${goals.length} goals for manager approval`);
      
      setSubmitted(true);
      showToast('Sheet Submitted', 'Your goals have been locked and dispatched to review.', 'success');
      setTimeout(() => setSubmitted(false), 2500);
      
      // Refresh UI state
      const refreshed = await goalsService.getEmployeeGoals(currentUser.id);
      setGoals(refreshed);
    } catch (err) {
      console.error('Submit failed:', err);
      showToast('Submission Failed', 'Failed to update goal states on Supabase.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <p className="font-medium text-slate-500">Retrieving secure goal profiles...</p>
      </div>
    );
  }

  // Weightage card styles
  const weightColor = totalWeightage === 100
    ? 'text-orange-600'
    : totalWeightage > 100
    ? 'text-red-500 font-bold'
    : 'text-amber-500';

  const barFillClass = totalWeightage === 100
    ? 'bg-gradient-to-r from-orange-500 to-amber-500 shadow-[0_0_12px_rgba(249,115,22,0.4)]'
    : totalWeightage > 100
    ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]'
    : 'bg-amber-400';

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 max-w-4xl pb-12">
      
      {/* Toast Notification Panel */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            className={cn(
              "fixed top-6 right-6 z-[100] w-96 bg-white border-l-4 rounded-2xl shadow-2xl p-4 flex gap-3.5 backdrop-blur-md border border-slate-100",
              toast.type === 'success' ? 'border-emerald-500' :
              toast.type === 'error' ? 'border-red-500' :
              toast.type === 'warning' ? 'border-orange-500' :
              'border-blue-500'
            )}
          >
            <div className={cn(
              "p-2 rounded-xl self-start flex-shrink-0",
              toast.type === 'success' ? 'bg-emerald-50/50 text-emerald-600' :
              toast.type === 'error' ? 'bg-red-50/50 text-red-600' :
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
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">Goal Alignment Sheets</h1>
          <p className="text-slate-500 font-semibold text-xs tracking-wide">
            FY2026 PERFORMANCE TIMELINE <span className="text-slate-300 mx-2">|</span> {goals.length} OF {MAX_GOALS} ACTIVE GOALS
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {(!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('your-project-id')) && (
            <button
              onClick={async () => {
                setGoals(prev => prev.map(g => ({ ...g, status: 'draft' })));
                setErrors({});
                setTouchedFields({});
                setShowAllErrors(false);
                try {
                  await auditService.logAction('GOAL_UNLOCKED', currentUser.name, 'Unlocked goal sheet for FY2026 performance cycle');
                  showToast('Demo Unlocked', 'Goal sheet statuses reverted to Draft for editing.', 'success');
                } catch (e) {
                  console.error('Audit log failed:', e);
                }
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 text-xs font-bold hover:bg-orange-100 transition-all"
            >
              <Zap className="h-3.5 w-3.5 animate-pulse" />
              Demo: Unlock Goals
            </button>
          )}
          {isSheetLocked && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold shadow-sm">
              <Lock className="h-3.5 w-3.5" />
              Goals Locked & Read-only
            </div>
          )}
        </div>
      </motion.div>

      {/* Global Validation Alert Banner */}
      {hasErrors && showAllErrors && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-orange-50 border border-orange-200 rounded-2xl flex items-start gap-3.5"
        >
          <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-xs font-bold text-orange-950 uppercase tracking-wider">Goal Sheet Validation Engine</h4>
            <p className="text-xs text-orange-700 font-medium mt-1 leading-relaxed">
              {errors['total'] || 'Please resolve the highlighted issues in your goal cards below before submitting.'}
            </p>
            {Object.keys(errors).some(k => k.endsWith('_title') && errors[k].includes('duplicate')) && (
              <p className="text-xs text-orange-600 font-semibold mt-1">
                • Title Conflict: Duplicate titles detected. Every goal title must be unique.
              </p>
            )}
            {goals.length > MAX_GOALS && (
              <p className="text-xs text-orange-600 font-semibold mt-1">
                • Over Capacity: Maximum goal limit is {MAX_GOALS}. Currently tracking {goals.length} goals.
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* Weightage & Goal Allocation Engine Card */}
      <motion.div variants={itemVariants} className="card p-6 bg-white border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-24 h-24 bg-orange-50/50 rounded-full blur-2xl -z-10" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Weightage Allocation */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Weightage Allocation</span>
                <div className="group relative">
                  <Info className="h-3.5 w-3.5 text-slate-400 cursor-help hover:text-slate-600 transition-colors" />
                  <div className="absolute left-6 top-0 z-20 hidden group-hover:block w-64 bg-slate-850 text-white border border-slate-700 text-[10px] leading-relaxed p-3 rounded-xl shadow-xl font-medium">
                    • Total weightage must equal exactly 100%.<br />
                    • Each individual goal weightage must be at least 10%.<br />
                    • Maximum of 8 goals allowed.
                  </div>
                </div>
              </div>
              <span className={cn('text-2xl font-black transition-colors', weightColor)}>{totalWeightage}% / 100%</span>
            </div>
            
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner">
              <motion.div
                className={cn('h-full rounded-full transition-all duration-500', barFillClass)}
                style={{ width: `${Math.min(totalWeightage, 100)}%` }}
                layoutId="progressFill"
              />
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-500 flex items-center gap-1.5">
                {totalWeightage < 100 ? (
                  <>
                    <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                    {remaining}% remaining to distribute
                  </>
                ) : totalWeightage > 100 ? (
                  <>
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    {Math.abs(remaining)}% over allocation limit
                  </>
                ) : (
                  <>
                    <span className="h-2 w-2 rounded-full bg-orange-500" />
                    Allocation perfectly balanced
                  </>
                )}
              </span>
              
              {errors.total && (
                <span className="text-[11px] font-bold text-red-600 flex items-center gap-1 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                  <AlertTriangle className="h-3 w-3" /> Allocation Error
                </span>
              )}
            </div>
          </div>

          {/* Right Column: Goal Capacity & Real-time Status */}
          <div className="flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Goal Sheet Capacity</span>
              <span className={cn(
                "text-xs font-black px-2.5 py-0.5 rounded-full",
                goals.length === MAX_GOALS ? "bg-orange-50 text-orange-600" :
                goals.length > MAX_GOALS ? "bg-red-50 text-red-600" :
                "bg-slate-50 text-slate-600"
              )}>
                {goals.length} of {MAX_GOALS} Goals Used
              </span>
            </div>
            
            <div className="grid grid-cols-4 gap-1.5 h-2.5 mb-4">
              {Array.from({ length: MAX_GOALS }).map((_, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "rounded-full transition-all duration-300",
                    i < goals.length 
                      ? (goals.length > MAX_GOALS ? "bg-red-500" : "bg-gradient-to-r from-orange-500 to-amber-500") 
                      : "bg-slate-100"
                  )} 
                />
              ))}
            </div>

            <div className="flex items-center justify-between text-xs mt-auto">
              <span className="font-semibold text-slate-500">
                {goals.length < MAX_GOALS ? `Can add ${MAX_GOALS - goals.length} more goal(s)` : `Capacity fully occupied`}
              </span>
              {errors.goal_count && (
                <span className="text-[11px] font-bold text-red-600 flex items-center gap-1 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                  <AlertTriangle className="h-3 w-3" /> Count Over Limit
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Goal Cards */}
      <motion.div variants={containerVariants} className="space-y-4">
        {goals.map((goal, idx) => {
          const lockedGoal = isSheetLocked || isGoalLocked(goal);
          const hasTitleError = getFieldError(`${idx}_title`);
          const hasThrustError = getFieldError(`${idx}_thrust`);
          const hasTargetError = getFieldError(`${idx}_target`);
          const hasWeightError = getFieldError(`${idx}_weight`);

          return (
            <motion.div
              variants={itemVariants}
              key={goal.id || idx}
              className={cn(
                'card border-l-4 overflow-hidden transition-all duration-300 hover:border-l-[6px] bg-white shadow-sm border border-slate-100',
                goal.status === GOAL_STATUS.APPROVED ? 'border-l-emerald-500 hover:shadow-md' :
                goal.status === GOAL_STATUS.SUBMITTED ? 'border-l-orange-500 hover:shadow-md' :
                goal.status === GOAL_STATUS.REJECTED  ? 'border-l-red-500 hover:shadow-md' :
                'border-l-slate-600 hover:shadow-md'
              )}
            >
              {/* Goal Header */}
              <button
                className="w-full flex items-center gap-4 p-5 text-left bg-slate-50/10 hover:bg-slate-50/50 transition-colors"
                onClick={() => setExpanded(expanded === idx ? null : idx)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-base font-bold text-slate-900">
                      Goal {idx + 1}: {goal.title || <span className="text-slate-400 font-normal italic">New Untitled Goal</span>}
                    </span>
                    {goal.is_shared && (
                      <span className="badge bg-orange-50 border border-orange-200 text-orange-600 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest gap-1 py-0.5 inline-flex items-center font-bold">
                        <Share2 className="h-3 w-3" /> Shared KPI
                      </span>
                    )}
                    {goal.status && !goal.isNew && <StatusBadge status={goal.status} />}
                    {(hasTitleError || hasThrustError || hasTargetError || hasWeightError) && (
                      <span className="text-[10px] font-bold text-red-600 flex items-center gap-1 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                        <AlertTriangle className="h-3 w-3" /> Validation Errors
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 font-semibold">
                    {goal.thrust_area && <span>Thrust: <strong className="text-slate-700">{goal.thrust_area}</strong></span>}
                    {goal.target && <span>Target: <strong className="text-slate-700">{goal.target}</strong></span>}
                    <span className="font-bold text-orange-600">Weightage: {goal.weightage || 0}%</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {!lockedGoal && !goal.is_shared && goals.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); removeGoal(idx); }}
                      className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                  {expanded === idx ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                </div>
              </button>

              {/* Expanded Form */}
              <AnimatePresence>
                {expanded === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-5 pb-5 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-5 border-t border-slate-100 bg-white"
                  >
                    {/* Title */}
                    <div className="sm:col-span-2">
                      <label className="label text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Goal Title *</label>
                      <input
                        id={`goal-title-${idx}`}
                        className={cn(
                          'input text-slate-800 text-sm focus:ring-orange-500 focus:border-orange-500 bg-slate-50/50 border border-slate-200 rounded-xl p-3.5', 
                          hasTitleError && 'border-red-400 focus:ring-red-400 focus:border-red-400 bg-red-50/10'
                        )}
                        placeholder="e.g. Reduce Bug Count by 40%"
                        value={goal.title}
                        onChange={(e) => updateGoalField(idx, 'title', e.target.value)}
                        onBlur={() => markTouched(`${idx}_title`)}
                        disabled={lockedGoal || (goal.is_shared && !goal.isNew)}
                      />
                      {hasTitleError && (
                        <p className="text-xs font-bold text-red-500 mt-1.5 flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" /> {hasTitleError}
                        </p>
                      )}
                    </div>

                    {/* Description */}
                    <div className="sm:col-span-2">
                      <label className="label text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Description</label>
                      <textarea
                        id={`goal-desc-${idx}`}
                        className="input text-slate-800 text-sm resize-none h-24 focus:ring-orange-500 focus:border-orange-500 bg-slate-50/50 border border-slate-200 rounded-xl p-3.5"
                        placeholder="Describe what success looks like..."
                        value={goal.description}
                        onChange={(e) => updateGoalField(idx, 'description', e.target.value)}
                        disabled={lockedGoal || (goal.is_shared && !goal.isNew)}
                      />
                    </div>

                    {/* Thrust Area */}
                    <div>
                      <label className="label text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Thrust Area *</label>
                      <select
                        id={`goal-thrust-${idx}`}
                        className={cn(
                          'input text-slate-800 text-sm focus:ring-orange-500 focus:border-orange-500 bg-slate-50/50 border border-slate-200 rounded-xl p-3.5', 
                          hasThrustError && 'border-red-400 focus:ring-red-400 focus:border-red-400 bg-red-50/10'
                        )}
                        value={goal.thrust_area}
                        onChange={(e) => updateGoalField(idx, 'thrust_area', e.target.value)}
                        onBlur={() => markTouched(`${idx}_thrust`)}
                        disabled={lockedGoal || (goal.is_shared && !goal.isNew)}
                      >
                        <option value="">Select thrust area</option>
                        {THRUST_AREAS.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      {hasThrustError && (
                        <p className="text-xs font-bold text-red-500 mt-1.5 flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" /> {hasThrustError}
                        </p>
                      )}
                    </div>

                    {/* Unit of Measurement */}
                    <div>
                      <label className="label text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Unit of Measurement</label>
                      <select
                        id={`goal-unit-${idx}`}
                        className="input text-slate-800 text-sm focus:ring-orange-500 focus:border-orange-500 bg-slate-50/50 border border-slate-200 rounded-xl p-3.5"
                        value={goal.unit}
                        onChange={(e) => updateGoalField(idx, 'unit', e.target.value)}
                        disabled={lockedGoal || (goal.is_shared && !goal.isNew)}
                      >
                        {UNIT_OPTIONS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
                      </select>
                    </div>

                    {/* Target */}
                    <div>
                      <label className="label text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Target *</label>
                      <input
                        id={`goal-target-${idx}`}
                        className={cn(
                          'input text-slate-800 text-sm focus:ring-orange-500 focus:border-orange-500 bg-slate-50/50 border border-slate-200 rounded-xl p-3.5', 
                          hasTargetError && 'border-red-400 focus:ring-red-400 focus:border-red-400 bg-red-50/10'
                        )}
                        placeholder={UNIT_OPTIONS.find((u) => u.value === goal.unit)?.placeholder || 'e.g. 100'}
                        value={goal.target}
                        onChange={(e) => updateGoalField(idx, 'target', e.target.value)}
                        onBlur={() => markTouched(`${idx}_target`)}
                        disabled={lockedGoal || (goal.is_shared && !goal.isNew)}
                      />
                      {hasTargetError && (
                        <p className="text-xs font-bold text-red-500 mt-1.5 flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" /> {hasTargetError}
                        </p>
                      )}
                    </div>

                    {/* Weightage */}
                    <div>
                      <label className="label text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Weightage (%) *</label>
                      <div className="flex items-center gap-3">
                        <input
                          id={`goal-weight-${idx}`}
                          type="number"
                          min={MIN_WEIGHTAGE}
                          max={100}
                          className={cn(
                            'input text-slate-800 text-sm focus:ring-orange-500 focus:border-orange-500 bg-slate-50/50 border border-slate-200 rounded-xl p-3.5 w-full', 
                            hasWeightError && 'border-red-400 focus:ring-red-400 focus:border-red-400 bg-red-50/10'
                          )}
                          value={goal.weightage}
                          onChange={(e) => updateGoalField(idx, 'weightage', e.target.value)}
                          onBlur={() => markTouched(`${idx}_weight`)}
                          disabled={lockedGoal}
                        />
                        <span className="text-base font-extrabold text-orange-600 w-8">%</span>
                      </div>
                      {hasWeightError && (
                        <p className="text-xs font-bold text-red-500 mt-1.5 flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" /> {hasWeightError}
                        </p>
                      )}
                    </div>

                    {/* Shared KPI notice */}
                    {goal.is_shared && !goal.isNew && (
                      <div className="sm:col-span-2">
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-orange-50/50 border border-orange-100">
                          <Share2 className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-orange-850 uppercase tracking-widest mb-1">Corporate Distributed KPI</p>
                            <p className="text-xs text-orange-700 leading-relaxed font-semibold">This goal has been allocated by management. Title, Description and Target details are read-only. You may customize weightage allocations to align with your cycle requirements.</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Manager Comment */}
                    {goal.managerComment && (
                      <div className="sm:col-span-2 mt-2">
                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex gap-2">
                          <Info className="h-4.5 w-4.5 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-1">Manager Direct Feedback</p>
                            <p className="text-sm text-amber-800 leading-relaxed font-semibold">{goal.managerComment}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Add Goal Button */}
      {!isSheetLocked && !isGoalLimitReached && (
        <motion.button
          variants={itemVariants}
          id="add-goal-btn"
          onClick={addGoal}
          className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 hover:border-orange-500/50 hover:text-orange-600 hover:bg-orange-50/10 transition-all flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest bg-white"
        >
          <Plus className="h-5 w-5" />
          Add Goal Card ({goals.length} of {MAX_GOALS})
        </motion.button>
      )}

      {/* Action Buttons */}
      {!isSheetLocked && (
        <motion.div variants={itemVariants} className="flex items-center gap-4 justify-end mt-8">
          <button
            id="save-draft-btn"
            disabled={isSubmitting}
            onClick={handleSave}
            className={cn(
              'btn-secondary flex items-center gap-2 min-w-[140px] justify-center hover:text-orange-600 hover:border-orange-500/40 bg-white border border-slate-200 py-3 rounded-2xl text-xs font-extrabold transition-all duration-200 shadow-sm', 
              saved && 'bg-emerald-500/10 text-emerald-600 border-emerald-500/50 hover:text-emerald-600 shadow-none'
            )}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? 'Saved!' : 'Save Draft'}
          </button>
          
          <button
            id="submit-goals-btn"
            disabled={isSubmitting || hasErrors}
            onClick={handleSubmit}
            className={cn(
              'btn-primary flex items-center gap-2 min-w-[190px] justify-center py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold rounded-2xl text-xs transition-all duration-300 shadow-md shadow-orange-500/10 border-0', 
              submitted && 'bg-emerald-500 hover:bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.4)] border-emerald-500',
              hasErrors && 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200 shadow-none hover:from-slate-100 hover:to-slate-100 bg-none'
            )}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : submitted ? <CheckCircle2 className="h-4 w-4 text-white" /> : <Send className="h-4 w-4" />}
            {submitted ? 'Submitted!' : 'Submit for Approval'}
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
