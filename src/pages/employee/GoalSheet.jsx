import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { GOAL_STATUS, THRUST_AREAS, UNIT_OPTIONS } from '../../lib/constants';
import { goalsService, auditService } from '../../lib/services';
import StatusBadge from '../../components/shared/StatusBadge';
import {
  Plus, Trash2, Save, Send, Lock, AlertTriangle, CheckCircle2,
  ChevronDown, ChevronUp, Share2, Info, Loader2, Zap
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
  unit: 'numeric',
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
      } finally {
        setLoading(false);
      }
    }
    loadGoals();
  }, [currentUser]);

  // The sheet only stops allowing new goals if the maximum count is reached.
  const isLocked = goals.length >= MAX_GOALS;
  
  // Total weightage tracking
  const totalWeightage = goals.reduce((s, g) => s + Number(g.weightage || 0), 0);
  const remaining = 100 - totalWeightage;

  const validate = () => {
    const errs = {};
    goals.forEach((g, i) => {
      if (!g.title?.trim()) errs[`${i}_title`] = 'Title is required';
      if (!g.thrust_area)   errs[`${i}_thrust`] = 'Thrust area required';
      if (!g.target?.trim()) errs[`${i}_target`] = 'Target is required';
      if (Number(g.weightage) < MIN_WEIGHTAGE) errs[`${i}_weight`] = `Min ${MIN_WEIGHTAGE}%`;
    });
    if (totalWeightage !== 100) errs['total'] = `Total weightage must be 100% (currently ${totalWeightage}%)`;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const updateGoalField = (idx, field, val) => {
    if (isLocked) return;
    setGoals((prev) => prev.map((g, i) => i === idx ? { ...g, [field]: field === 'weightage' ? Number(val) : val } : g));
  };

  const addGoal = () => {
    if (goals.length >= MAX_GOALS || isLocked) return;
    setGoals((prev) => [...prev, emptyGoal(currentUser.id)]);
    setExpanded(goals.length);
  };

  const removeGoal = (idx) => {
    if (isLocked) return;
    setGoals((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      // Check which goals are new vs updated to emit correct audit logs
      for (const goal of goals) {
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
      setTimeout(() => setSaved(false), 2000);
      
      // Refresh goals to get IDs for new ones
      const refreshed = await goalsService.getEmployeeGoals(currentUser.id);
      setGoals(refreshed);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setIsSubmitting(true);
      const goalsToSubmit = goals.map(({ isNew, ...g }) => ({
        ...g,
        status: GOAL_STATUS.SUBMITTED
      }));
      await goalsService.upsertGoals(goalsToSubmit);
      await auditService.logAction('SUBMITTED_GOALS', currentUser.name, `Submitted ${goals.length} goals for approval`);
      
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 2500);
      
      // Refresh UI state
      const refreshed = await goalsService.getEmployeeGoals(currentUser.id);
      setGoals(refreshed);
    } catch (err) {
      console.error('Submit failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        <p className="font-medium">Loading your goal sheet...</p>
      </div>
    );
  }

  const weightColor = totalWeightage === 100
    ? 'text-primary-600'
    : totalWeightage > 100
    ? 'text-[#ff4081]'
    : 'text-amber-400';

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 max-w-4xl pb-12">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">My Goal Sheet</h1>
          <p className="text-slate-500 font-medium">
            FY2026 Performance Cycle <span className="text-slate-600 mx-2">|</span> {goals.length}/{MAX_GOALS} Goals
          </p>
        </div>
        <div className="flex items-center gap-3">
          {(!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('your-project-id')) && (
            <button
              onClick={async () => {
                setGoals(prev => prev.map(g => ({ ...g, status: 'draft' })));
                setErrors({});
                try {
                  await auditService.logAction('GOAL_UNLOCKED', currentUser.name, 'Unlocked goal sheet for FY2026 performance cycle');
                } catch (e) {
                  console.error('Audit log failed:', e);
                }
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 text-sm font-bold hover:bg-amber-500/20 transition-all"
            >
              <Zap className="h-4 w-4" />
              Demo: Unlock Goals
            </button>
          )}
          {goals.length > 0 && goals.every(g => g.status === 'approved') && goals.length >= MAX_GOALS && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold shadow-[0_0_15px_rgba(52,211,153,0.15)]">
              <Lock className="h-4 w-4" />
              Goals Approved & Locked
            </div>
          )}
        </div>
      </motion.div>

      {/* Weightage Counter */}
      <motion.div variants={itemVariants} className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-700 uppercase tracking-widest">Total Weightage</span>
            <div className="group relative">
              <Info className="h-4 w-4 text-slate-500 cursor-help hover:text-slate-900 transition-colors" />
              <div className="absolute left-6 top-0 z-20 hidden group-hover:block w-56 bg-slate-500 border border-slate-200 text-slate-700 text-xs p-3 rounded-xl shadow-glass">
                Must equal 100%. Min 10% per goal. Max 8 goals.
              </div>
            </div>
          </div>
          <span className={cn('text-2xl font-extrabold', weightColor)}>{totalWeightage}%</span>
        </div>
        <div className="progress-bar h-2">
          <div
            className={cn('progress-fill transition-all duration-500', totalWeightage > 100 ? 'bg-[#ff4081] shadow-[0_0_10px_#ff4081]' : totalWeightage === 100 ? 'bg-[#00e5ff] shadow-[0_0_10px_#00e5ff]' : 'bg-primary-500')}
            style={{ width: `${Math.min(totalWeightage, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs font-semibold text-slate-500">
            {totalWeightage < 100 ? `${remaining}% remaining to allocate` : totalWeightage > 100 ? `${Math.abs(remaining)}% over limit` : '✓ Perfectly balanced'}
          </span>
          {errors.total && (
            <span className="text-xs font-bold text-[#ff4081] flex items-center gap-1.5 bg-[#ff4081]/10 px-2.5 py-1 rounded-md">
              <AlertTriangle className="h-3 w-3" /> {errors.total}
            </span>
          )}
        </div>
      </motion.div>

      {/* Goal Cards */}
      <motion.div variants={containerVariants} className="space-y-4">
        {goals.map((goal, idx) => (
          <motion.div
            variants={itemVariants}
            key={goal.id || idx}
            className={cn(
              'card border-l-4 overflow-hidden transition-all duration-300 hover:border-l-[6px]',
              goal.status === GOAL_STATUS.APPROVED ? 'border-l-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.1)]' :
              goal.status === GOAL_STATUS.SUBMITTED ? 'border-l-[#2979ff] hover:shadow-[0_0_20px_rgba(41,121,255,0.1)]' :
              goal.status === GOAL_STATUS.REJECTED  ? 'border-l-[#ff4081] hover:shadow-[0_0_20px_rgba(255,64,129,0.1)]' :
              'border-l-slate-600'
            )}
          >
            {/* Goal Header */}
            <button
              className="w-full flex items-center gap-4 p-5 text-left bg-white/[0.01] hover:bg-white/[0.03] transition-colors"
              onClick={() => setExpanded(expanded === idx ? null : idx)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-base font-bold text-slate-900">
                    Goal {idx + 1}: {goal.title || <span className="text-slate-500 font-normal italic">Untitled goal</span>}
                  </span>
                  {goal.is_shared && (
                    <span className="badge-primary text-[10px] uppercase tracking-widest gap-1 py-0.5"><Share2 className="h-3 w-3" /> Shared KPI</span>
                  )}
                  {goal.status && !goal.isNew && <StatusBadge status={goal.status} />}
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 font-medium">
                  {goal.thrust_area && <span>{goal.thrust_area}</span>}
                  {goal.target && <span>Target: <strong className="text-slate-700">{goal.target}</strong></span>}
                  <span className="font-bold text-primary-600">{goal.weightage}% wt</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {!isLocked && !goal.is_shared && goals.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); removeGoal(idx); }}
                    className="p-2 rounded-xl hover:bg-[#ff4081]/10 text-slate-500 hover:text-[#ff4081] transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                {expanded === idx ? <ChevronUp className="h-5 w-5 text-slate-500" /> : <ChevronDown className="h-5 w-5 text-slate-500" />}
              </div>
            </button>

            {/* Expanded Form */}
            <AnimatePresence>
              {expanded === idx && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-5 pb-5 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-5 border-t border-slate-200 bg-white/[0.01]"
                >
                  {/* Title */}
                  <div className="sm:col-span-2">
                    <label className="label">Goal Title *</label>
                    <input
                      id={`goal-title-${idx}`}
                      className={cn('input', errors[`${idx}_title`] && 'border-[#ff4081] focus:ring-[#ff4081]')}
                      placeholder="e.g. Reduce Bug Count by 40%"
                      value={goal.title}
                      onChange={(e) => updateGoalField(idx, 'title', e.target.value)}
                      disabled={isLocked || (goal.is_shared && !goal.isNew)}
                    />
                    {errors[`${idx}_title`] && <p className="text-xs font-medium text-[#ff4081] mt-1.5">{errors[`${idx}_title`]}</p>}
                  </div>

                  {/* Description */}
                  <div className="sm:col-span-2">
                    <label className="label">Description</label>
                    <textarea
                      id={`goal-desc-${idx}`}
                      className="input resize-none h-24"
                      placeholder="Describe what success looks like..."
                      value={goal.description}
                      onChange={(e) => updateGoalField(idx, 'description', e.target.value)}
                      disabled={isLocked || (goal.is_shared && !goal.isNew)}
                    />
                  </div>

                  {/* Thrust Area */}
                  <div>
                    <label className="label">Thrust Area *</label>
                    <select
                      id={`goal-thrust-${idx}`}
                      className={cn('input', errors[`${idx}_thrust`] && 'border-[#ff4081]')}
                      value={goal.thrust_area}
                      onChange={(e) => updateGoalField(idx, 'thrust_area', e.target.value)}
                      disabled={isLocked || (goal.is_shared && !goal.isNew)}
                    >
                      <option value="">Select thrust area</option>
                      {THRUST_AREAS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {errors[`${idx}_thrust`] && <p className="text-xs font-medium text-[#ff4081] mt-1.5">{errors[`${idx}_thrust`]}</p>}
                  </div>

                  {/* Unit of Measurement */}
                  <div>
                    <label className="label">Unit of Measurement</label>
                    <select
                      id={`goal-unit-${idx}`}
                      className="input"
                      value={goal.unit}
                      onChange={(e) => updateGoalField(idx, 'unit', e.target.value)}
                      disabled={isLocked || (goal.is_shared && !goal.isNew)}
                    >
                      {UNIT_OPTIONS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
                    </select>
                  </div>

                  {/* Target */}
                  <div>
                    <label className="label">Target *</label>
                    <input
                      id={`goal-target-${idx}`}
                      className={cn('input', errors[`${idx}_target`] && 'border-[#ff4081]')}
                      placeholder={UNIT_OPTIONS.find((u) => u.value === goal.unit)?.placeholder}
                      value={goal.target}
                      onChange={(e) => updateGoalField(idx, 'target', e.target.value)}
                      disabled={isLocked || (goal.is_shared && !goal.isNew)}
                    />
                    {errors[`${idx}_target`] && <p className="text-xs font-medium text-[#ff4081] mt-1.5">{errors[`${idx}_target`]}</p>}
                  </div>

                  {/* Weightage */}
                  <div>
                    <label className="label">Weightage (%) *</label>
                    <div className="flex items-center gap-3">
                      <input
                        id={`goal-weight-${idx}`}
                        type="number"
                        min={MIN_WEIGHTAGE}
                        max={100}
                        className={cn('input w-full', errors[`${idx}_weight`] && 'border-[#ff4081]')}
                        value={goal.weightage}
                        onChange={(e) => updateGoalField(idx, 'weightage', e.target.value)}
                        disabled={goal.status === GOAL_STATUS.APPROVED}
                      />
                      <span className="text-base font-extrabold text-primary-600 w-8">%</span>
                    </div>
                    {errors[`${idx}_weight`] && <p className="text-xs font-medium text-[#ff4081] mt-1.5">{errors[`${idx}_weight`]}</p>}
                  </div>

                  {/* Shared KPI notice */}
                  {goal.is_shared && !goal.isNew && (
                    <div className="sm:col-span-2">
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-primary-50 border border-primary-200">
                        <Share2 className="h-4 w-4 text-primary-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-primary-700 uppercase tracking-widest mb-1">Shared KPI</p>
                          <p className="text-xs text-primary-600">This goal was pushed to you by your manager. Goal Title and Target are read-only. You may only adjust the weightage.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Manager Comment */}
                  {goal.managerComment && (
                    <div className="sm:col-span-2 mt-2">
                      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                        <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-2">Manager Comment</p>
                        <p className="text-sm text-amber-800 leading-relaxed">{goal.managerComment}</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </motion.div>

      {/* Add Goal Button */}
      {!isLocked && goals.length < MAX_GOALS && (
        <motion.button
          variants={itemVariants}
          id="add-goal-btn"
          onClick={addGoal}
          className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 hover:border-primary-500/50 hover:text-primary-600 hover:bg-[#00e5ff]/5 transition-all flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-widest"
        >
          <Plus className="h-5 w-5" />
          Add Goal ({goals.length}/{MAX_GOALS})
        </motion.button>
      )}

      {/* Action Buttons */}
      {!isLocked && (
        <motion.div variants={itemVariants} className="flex items-center gap-4 justify-end mt-8">
          <button
            id="save-draft-btn"
            disabled={isSubmitting}
            onClick={handleSave}
            className={cn('btn-secondary flex items-center gap-2 min-w-[140px] justify-center', saved && 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50')}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? 'Saved!' : 'Save Draft'}
          </button>
          <button
            id="submit-goals-btn"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className={cn('btn-primary flex items-center gap-2 min-w-[180px] justify-center', submitted && 'bg-emerald-500 hover:bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.4)] border-emerald-500')}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : submitted ? <CheckCircle2 className="h-4 w-4 text-slate-900" /> : <Send className="h-4 w-4" />}
            {submitted ? 'Submitted!' : 'Submit for Approval'}
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
