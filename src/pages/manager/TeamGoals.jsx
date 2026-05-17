import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { goalsService, usersService, auditService } from '../../lib/services';
import { GOAL_STATUS, THRUST_AREAS, computeProgressScore } from '../../lib/constants';
import StatusBadge from '../../components/shared/StatusBadge';
import { cn } from '../../lib/utils';
import {
  ChevronDown, ChevronUp, CheckCircle, XCircle, MessageSquare,
  Save, Search, ShieldCheck, RotateCcw, CalendarCheck, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TeamGoals() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState([]);
  const [goals, setGoals] = useState([]);
  const [activeTab, setActiveTab] = useState('approvals');
  const [expanded, setExpanded] = useState(null);
  const [editing, setEditing] = useState({});
  const [comments, setComments] = useState({});
  const [actions, setActions] = useState({});
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [checkinComments, setCheckinComments] = useState({});
  const [activeCheckinQ, setActiveCheckinQ] = useState('Q1');
  const [processingAction, setProcessingAction] = useState(null);

  const [showSharedGoalModal, setShowSharedGoalModal] = useState(false);
  const [sharedGoalForm, setSharedGoalForm] = useState({
    title: '', description: '', thrustArea: 'Financial', target: '', weightage: 10, employeeIds: []
  });

  const loadTeamData = async () => {
    if (!currentUser?.id) return;
    try {
      setLoading(true);
      const [members, teamGoals] = await Promise.all([
        usersService.getTeamMembers(currentUser.id),
        goalsService.getManagerTeamGoals(currentUser.id)
      ]);
      setTeam(members);
      setGoals(teamGoals);

      // Seed manager feedback comments from DB check-ins
      const comments = {};
      teamGoals.forEach(g => {
        (g.check_ins || []).forEach(ci => {
          if (ci.manager_feedback) {
            comments[`${g.id}-${ci.quarter}`] = ci.manager_feedback;
          }
        });
      });
      setCheckinComments(comments);
    } catch (err) {
      console.error('Error loading team goals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeamData();
  }, [currentUser]);

  const handleCheckinAction = async (goal, quarter, action) => {
    const key = `${goal.id}-${quarter}`;
    try {
      setProcessingAction(key);
      const feedback = checkinComments[key] || '';
      
      const cis = goal.check_ins || [];
      const existingCi = cis.find(c => c.quarter === quarter) || {};
      
      const payload = {
        goal_id: goal.id,
        quarter: quarter,
        status: existingCi.status || 'not_started',
        planned_value: existingCi.planned_value || existingCi.planned || '',
        actual_value: existingCi.actual_value || existingCi.actual || '',
        notes: existingCi.notes || '',
        progress_percentage: existingCi.progress_percentage || 0,
        manager_feedback: feedback,
        review_status: action,
        timestamp: new Date().toISOString()
      };
      
      await goalsService.submitCheckIn(payload);
      
      const actionName = action === 'approved' ? 'CHECK_IN_APPROVED' : action === 'rejected' ? 'CHECK_IN_REJECTED' : 'CHECK_IN_UPDATED';
      const detailStr = action === 'approved' 
        ? `Approved ${quarter} check-in update for "${goal.title}"`
        : action === 'rejected'
          ? `Requested rework on ${quarter} check-in update for "${goal.title}"`
          : `Saved manager feedback comment on ${quarter} check-in for "${goal.title}"`;
        
      await auditService.logAction(actionName, currentUser.name, detailStr);
      await loadTeamData();
    } catch (err) {
      console.error('Failed to submit check-in review:', err);
    } finally {
      setProcessingAction(null);
    }
  };

  const employeeGroups = team.map((member) => ({
    member,
    goals: goals.filter((g) => g.employee_id === member.id),
  }));

  const filteredGroups = employeeGroups.map((grp) => ({
    ...grp,
    goals: grp.goals.filter((g) => {
      const matchFilter = filter === 'all' || g.status === filter;
      const matchSearch = (g.title || '').toLowerCase().includes(search.toLowerCase()) ||
        (grp.member.name || '').toLowerCase().includes(search.toLowerCase());
      return matchFilter && matchSearch;
    }),
  })).filter((grp) => grp.goals.length > 0 || (search === '' && filter === 'all'));

  const handlePushSharedGoal = async () => {
    if (!sharedGoalForm.title || sharedGoalForm.employeeIds.length === 0) return;
    
    try {
      setProcessingAction('shared');
      const newGoals = sharedGoalForm.employeeIds.map(empId => ({
        employee_id: empId,
        title: sharedGoalForm.title,
        description: sharedGoalForm.description,
        thrust_area: sharedGoalForm.thrustArea,
        target: sharedGoalForm.target,
        weightage: Number(sharedGoalForm.weightage),
        status: GOAL_STATUS.APPROVED, // Shared goals are auto-approved
        is_shared: true,
        check_ins: []
      }));
      
      const created = await goalsService.upsertGoals(newGoals);
      const recipientNames = team
        .filter(m => sharedGoalForm.employeeIds.includes(m.id))
        .map(m => m.name)
        .join(', ');
      try {
        await auditService.logAction('GOAL_APPROVED', currentUser.name, `Distributed shared KPI "${sharedGoalForm.title}" to [${recipientNames}]`);
      } catch (e) {
        console.error('Audit log failed:', e);
      }
      setGoals(prev => [...prev, ...created]);
      setShowSharedGoalModal(false);
      setSharedGoalForm({ title: '', description: '', thrustArea: 'Financial', target: '', weightage: 10, employeeIds: [] });
    } catch (err) {
      console.error('Push shared goal failed:', err);
    } finally {
      setProcessingAction(null);
    }
  };

  const handleAction = async (goalId, action) => {
    try {
      setProcessingAction(goalId);
      const newStatus = action === 'approve' ? GOAL_STATUS.APPROVED
        : action === 'reject' ? GOAL_STATUS.REJECTED
        : GOAL_STATUS.REWORK;
      
      const managerComment = comments[goalId] || goals.find(g => g.id === goalId)?.manager_comment;
      
      await goalsService.updateGoal(goalId, { 
        status: newStatus, 
        manager_comment: managerComment 
      });

      const goal = goals.find(g => g.id === goalId);
      const goalTitle = goal ? goal.title : 'Goal';
      const employeeName = team.find(m => m.id === goal?.employee_id)?.name || 'Employee';
      
      let actionType = 'GOAL_APPROVED';
      let actionMsg = `Approved goal "${goalTitle}" for ${employeeName}`;
      if (action === 'reject') {
        actionType = 'GOAL_REJECTED';
        actionMsg = `Rejected goal "${goalTitle}" for ${employeeName}`;
      } else if (action === 'rework') {
        actionType = 'GOAL_REWORK';
        actionMsg = `Returned goal "${goalTitle}" for rework for ${employeeName}`;
      }
      
      try {
        await auditService.logAction(actionType, currentUser.name, actionMsg);
      } catch (e) {
        console.error('Audit log failed:', e);
      }

      setGoals((prev) => prev.map((g) =>
        g.id === goalId
          ? { ...g, status: newStatus, manager_comment: managerComment }
          : g
      ));
      setActions((prev) => ({ ...prev, [goalId]: action }));
    } catch (err) {
      console.error('Action failed:', err);
    } finally {
      setProcessingAction(null);
    }
  };

  const handleInlineEdit = (goalId, field, val) => {
    setEditing((prev) => ({ ...prev, [goalId]: { ...(prev[goalId] || {}), [field]: val } }));
  };

  const saveInlineEdit = async (goalId) => {
    const edits = editing[goalId];
    if (!edits) return;
    try {
      setProcessingAction(goalId);
      const dbEdits = {
        target: edits.target,
        weightage: edits.weightage
      };
      await goalsService.updateGoal(goalId, dbEdits);
      setGoals((prev) => prev.map((g) => g.id === goalId ? { ...g, ...dbEdits } : g));
      setEditing((prev) => { const n = { ...prev }; delete n[goalId]; return n; });
    } catch (err) {
      console.error('Inline edit failed:', err);
    } finally {
      setProcessingAction(null);
    }
  };

  const pendingCount = goals.filter((g) => g.status === GOAL_STATUS.SUBMITTED).length;
  const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 text-primary-600 animate-spin" />
        <p className="text-slate-500 font-medium">Syncing with team data...</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-12 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-200 text-[10px] font-bold text-primary-700 uppercase tracking-widest mb-3">
            <ShieldCheck className="h-3 w-3" /> Manager
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Team Goals</h1>
          <p className="text-slate-500 font-medium mt-1 text-sm">Review, edit, and approve your direct reports' submissions.</p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 font-bold text-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            {pendingCount} Awaiting Review
          </div>
        )}
        <button
          onClick={() => setShowSharedGoalModal(true)}
          className="btn-primary flex items-center gap-2 whitespace-nowrap"
        >
          <ShieldCheck className="h-4 w-4" />
          Push Shared Goal
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('approvals')}
          className={cn('px-4 py-2 rounded-lg text-sm font-semibold transition-all', activeTab === 'approvals' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}
        >
          Goal Approvals
        </button>
        <button
          onClick={() => setActiveTab('checkins')}
          className={cn('px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2', activeTab === 'checkins' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}
        >
          <CalendarCheck className="h-4 w-4" /> Check-in Review
        </button>
      </div>

      {/* ── APPROVALS TAB ── */}
      {activeTab === 'approvals' && (
        <>
          {/* Filters */}
          <div className="flex items-center gap-4 flex-wrap bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                className="input pl-10 py-2.5 text-sm w-full"
                placeholder="Search goals or employees..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {['all', GOAL_STATUS.SUBMITTED, GOAL_STATUS.APPROVED, GOAL_STATUS.REJECTED, GOAL_STATUS.REWORK].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all',
                    filter === f ? 'bg-primary-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  )}
                >
                  {f === 'all' ? 'All' : f.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Employee Groups */}
          <div className="space-y-5">
            {filteredGroups.map(({ member, goals: mGoals }) => (
              <div key={member.id} className="card overflow-hidden border-slate-200">
                {/* Employee Header */}
                <div className="flex items-center gap-4 px-6 py-4 bg-slate-50 border-b border-slate-200">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white text-sm font-bold flex items-center justify-center">
                    {member.avatar || member.name[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">{member.name}</p>
                    <p className="text-xs text-slate-500">{member.designation} · {member.department}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200">{mGoals.length} goals</span>
                    <span className={cn(
                      'text-xs font-bold px-2.5 py-1 rounded-full border',
                      mGoals.some(g => g.status === GOAL_STATUS.SUBMITTED) ? 'text-amber-700 bg-amber-50 border-amber-200' :
                      mGoals.every(g => g.status === GOAL_STATUS.APPROVED) ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                      'text-slate-500 bg-slate-50 border-slate-200'
                    )}>
                      {mGoals.some(g => g.status === GOAL_STATUS.SUBMITTED) ? 'Pending Review' :
                       mGoals.every(g => g.status === GOAL_STATUS.APPROVED) ? 'All Approved' : 'Mixed'}
                    </span>
                  </div>
                </div>

                {/* Goals */}
                <div className="divide-y divide-slate-100">
                  {mGoals.map((goal) => {
                    const isExpanded = expanded === goal.id;
                    const editData = editing[goal.id] || {};
                    const action = actions[goal.id];
                    const isProcessing = processingAction === goal.id;

                    return (
                      <div key={goal.id} className="group">
                        <button
                          className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-slate-50 transition-colors"
                          onClick={() => setExpanded(isExpanded ? null : goal.id)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-slate-700 truncate">{goal.title}</p>
                              {goal.is_shared && <span className="text-[9px] font-bold text-primary-700 bg-primary-50 border border-primary-200 px-1.5 py-0.5 rounded-full">Shared</span>}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                              <span>{goal.thrust_area}</span>
                              <span>·</span>
                              <span>Target: <strong className="text-slate-700">{goal.target}</strong></span>
                              <span>·</span>
                              <span className="font-bold text-primary-600">{editData.weightage ?? goal.weightage}%</span>
                            </div>
                          </div>
                          <StatusBadge status={goal.status} />
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="px-6 pb-6 pt-3 space-y-4 bg-slate-50/50">
                                <p className="text-sm text-slate-500 leading-relaxed">{goal.description}</p>

                                {/* Inline Edit (submitted only) */}
                                {goal.status === GOAL_STATUS.SUBMITTED && (
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-slate-200">
                                    <div>
                                      <label className="label">Edit Target</label>
                                      <input className="input" value={editData.target ?? goal.target} onChange={(e) => handleInlineEdit(goal.id, 'target', e.target.value)} />
                                    </div>
                                    <div>
                                      <label className="label">Edit Weightage (%)</label>
                                      <input type="number" min={10} max={100} className="input" value={editData.weightage ?? goal.weightage} onChange={(e) => handleInlineEdit(goal.id, 'weightage', Number(e.target.value))} />
                                    </div>
                                    {editing[goal.id] && (
                                      <div className="flex items-end">
                                        <button 
                                          onClick={() => saveInlineEdit(goal.id)} 
                                          disabled={isProcessing}
                                          className="btn-secondary w-full flex justify-center items-center gap-2"
                                        >
                                          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Edits
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Manager Feedback */}
                                {goal.status === GOAL_STATUS.SUBMITTED && (
                                  <div className="bg-white p-4 rounded-xl border border-primary-100">
                                    <label className="label flex items-center gap-2 text-primary-700">
                                      <MessageSquare className="h-4 w-4" /> Manager Feedback
                                    </label>
                                    <textarea
                                      className="input resize-none"
                                      rows={2}
                                      placeholder="Add feedback or comments..."
                                      value={comments[goal.id] ?? goal.manager_comment}
                                      onChange={(e) => setComments((prev) => ({ ...prev, [goal.id]: e.target.value }))}
                                    />
                                  </div>
                                )}

                                {/* Existing comment */}
                                {goal.manager_comment && goal.status !== GOAL_STATUS.SUBMITTED && (
                                  <div className="p-3 rounded-xl bg-white border border-slate-200">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Manager Comment</p>
                                    <p className="text-sm text-slate-700">{goal.manager_comment}</p>
                                  </div>
                                )}

                                {/* Action Buttons */}
                                {goal.status === GOAL_STATUS.SUBMITTED && (
                                  <div className="flex flex-wrap items-center gap-3">
                                    <button
                                      id={`approve-${goal.id}`}
                                      disabled={isProcessing}
                                      onClick={() => handleAction(goal.id, 'approve')}
                                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-sm font-bold transition-all disabled:opacity-50"
                                    >
                                      {isProcessing && processingAction === goal.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />} Approve
                                    </button>
                                    <button
                                      id={`rework-${goal.id}`}
                                      disabled={isProcessing}
                                      onClick={() => handleAction(goal.id, 'rework')}
                                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-sm font-bold transition-all disabled:opacity-50"
                                    >
                                      {isProcessing && processingAction === goal.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />} Return for Rework
                                    </button>
                                    <button
                                      id={`reject-${goal.id}`}
                                      disabled={isProcessing}
                                      onClick={() => handleAction(goal.id, 'reject')}
                                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-sm font-bold transition-all disabled:opacity-50"
                                    >
                                      {isProcessing && processingAction === goal.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />} Reject
                                    </button>
                                  </div>
                                )}

                                {/* Action Result */}
                                {action && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn(
                                      'flex items-center gap-3 p-3 rounded-xl text-sm font-bold border',
                                      action === 'approve' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                                      action === 'rework'  ? 'bg-amber-50 border-amber-200 text-amber-700' :
                                      'bg-rose-50 border-rose-200 text-rose-700'
                                    )}
                                  >
                                    {action === 'approve' ? <CheckCircle className="h-4 w-4" /> : action === 'rework' ? <RotateCcw className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                    Goal {action === 'approve' ? 'approved' : action === 'rework' ? 'returned for rework' : 'rejected'}.
                                  </motion.div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {filteredGroups.length === 0 && (
              <div className="card p-16 text-center border-dashed border-slate-200">
                <CheckCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="font-bold text-slate-500">No goals match your filters.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── CHECK-IN REVIEW TAB ── */}
      {activeTab === 'checkins' && (
        <div className="space-y-5">
          {/* Quarter selector */}
          <div className="flex gap-2">
            {QUARTERS.map(q => (
              <button
                key={q}
                onClick={() => setActiveCheckinQ(q)}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-bold border transition-all',
                  activeCheckinQ === q ? 'bg-primary-600 text-white border-primary-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                )}
              >
                {q}
              </button>
            ))}
          </div>

          {employeeGroups.map(({ member, goals: mGoals }) => {
            const approvedGoals = mGoals.filter(g => g.status === GOAL_STATUS.APPROVED);
            if (approvedGoals.length === 0) return null;
            return (
              <div key={member.id} className="card overflow-hidden border-slate-200">
                <div className="flex items-center gap-4 px-6 py-4 bg-slate-50 border-b border-slate-200">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white text-sm font-bold flex items-center justify-center">{member.avatar || member.name[0]}</div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">{member.name}</p>
                    <p className="text-xs text-slate-500">{member.designation}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{activeCheckinQ} Progress</p>
                    {(() => {
                      let total = 0, weighted = 0;
                      approvedGoals.forEach(g => {
                        const cis = g.check_ins || [];
                        const ci = Array.isArray(cis) ? cis.find(c => c.quarter === activeCheckinQ) || {} : cis[activeCheckinQ] || {};
                        const score = computeProgressScore(g, ci);
                        if (score !== null) { weighted += score * g.weightage; total += g.weightage; }
                      });
                      if (total === 0) return <p className="text-sm font-bold text-slate-400">No data</p>;
                      const avg = Math.round(weighted / total);
                      return <p className={cn('text-lg font-extrabold', avg >= 80 ? 'text-emerald-600' : avg >= 50 ? 'text-amber-600' : 'text-rose-600')}>{avg}%</p>;
                    })()}
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {approvedGoals.map(goal => {
                    const cis = goal.check_ins || [];
                    const ci = Array.isArray(cis) ? cis.find(c => c.quarter === activeCheckinQ) || {} : cis[activeCheckinQ] || {};
                    const score = computeProgressScore(goal, ci);
                    return (
                      <div key={goal.id} className="p-5">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1">
                            <p className="text-sm font-bold text-slate-800">{goal.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{goal.thrust_area} · <span className="text-primary-600 font-bold">{goal.weightage}% wt</span></p>
                          </div>
                          {score !== null && (
                            <span className={cn('text-sm font-extrabold px-3 py-1 rounded-lg border', score >= 80 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : score >= 50 ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-rose-700 bg-rose-50 border-rose-200')}>
                              {score}%
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 mb-3">
                          <div>
                            <p className="font-bold text-slate-400 uppercase tracking-widest mb-1">Planned</p>
                            <p className="text-slate-700 font-semibold">{ci.planned || '—'}</p>
                          </div>
                          <div>
                            <p className="font-bold text-slate-400 uppercase tracking-widest mb-1">Actual</p>
                            <p className="text-slate-700 font-semibold">{ci.actual || '—'}</p>
                          </div>
                          {ci.notes && (
                            <div className="col-span-2">
                              <p className="font-bold text-slate-400 uppercase tracking-widest mb-1">Employee Notes</p>
                              <p className="text-slate-600">{ci.notes}</p>
                            </div>
                          )}
                        </div>

                        {/* Manager Check-in Comment */}
                        <div className="space-y-3">
                          <div>
                            <label className="label text-xs flex items-center gap-1.5 font-bold text-slate-500">
                              <MessageSquare className="h-3.5 w-3.5 text-orange-500" /> Manager Review Comment & Feedback
                            </label>
                            <textarea
                              className="input text-xs resize-none bg-white border-slate-200 focus:border-orange-500 focus:ring-orange-500/10"
                              rows={2}
                              placeholder="Add guidance, context, or revision instructions..."
                              value={checkinComments[`${goal.id}-${activeCheckinQ}`] || ''}
                              onChange={(e) => setCheckinComments(prev => ({ ...prev, [`${goal.id}-${activeCheckinQ}`]: e.target.value }))}
                            />
                          </div>

                          <div className="flex flex-wrap items-center justify-between border-t border-slate-100 pt-3 gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Review Status:</span>
                              {ci.review_status === 'approved' ? (
                                <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wide">Approved</span>
                              ) : ci.review_status === 'rejected' ? (
                                <span className="text-[9px] font-black text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full uppercase tracking-wide">Rework Requested</span>
                              ) : ci.review_status === 'pending' ? (
                                <span className="text-[9px] font-black text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full uppercase tracking-wide animate-pulse">Awaiting Review</span>
                              ) : (
                                <span className="text-[9px] font-black text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full uppercase tracking-wide">Draft</span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleCheckinAction(goal, activeCheckinQ, ci.review_status || 'draft')}
                                disabled={processingAction === `${goal.id}-${activeCheckinQ}`}
                                className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:text-slate-900 bg-white text-xs font-bold rounded-xl transition-all shadow-sm"
                              >
                                Save Comment
                              </button>
                              <button
                                onClick={() => handleCheckinAction(goal, activeCheckinQ, 'approved')}
                                disabled={processingAction === `${goal.id}-${activeCheckinQ}`}
                                className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1 border-0"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleCheckinAction(goal, activeCheckinQ, 'rejected')}
                                disabled={processingAction === `${goal.id}-${activeCheckinQ}`}
                                className="px-3 py-1.5 bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1 border-0"
                              >
                                Request Rework
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── SHARED GOAL MODAL ── */}
      <AnimatePresence>
        {showSharedGoalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Push Shared Goal</h3>
                  <p className="text-sm text-slate-500 mt-1">Distribute a departmental KPI to multiple team members.</p>
                </div>
                <button
                  onClick={() => setShowSharedGoalModal(false)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <XCircle className="h-5 w-5 text-slate-400" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="label">Goal Title *</label>
                    <input
                      className="input"
                      placeholder="e.g., Q3 Revenue Target"
                      value={sharedGoalForm.title}
                      onChange={e => setSharedGoalForm(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="label">Description</label>
                    <textarea
                      className="input min-h-[80px]"
                      placeholder="Provide details about this shared objective..."
                      value={sharedGoalForm.description}
                      onChange={e => setSharedGoalForm(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="label">Thrust Area</label>
                    <select
                      className="input"
                      value={sharedGoalForm.thrustArea}
                      onChange={e => setSharedGoalForm(prev => ({ ...prev, thrustArea: e.target.value }))}
                    >
                      <option>Financial</option>
                      <option>Customer</option>
                      <option>Internal Process</option>
                      <option>Learning & Growth</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Target Metric</label>
                    <input
                      className="input"
                      placeholder="e.g., $500k MRR"
                      value={sharedGoalForm.target}
                      onChange={e => setSharedGoalForm(prev => ({ ...prev, target: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="label">Weightage (%)</label>
                    <input
                      type="number"
                      className="input"
                      min={1}
                      max={100}
                      value={sharedGoalForm.weightage}
                      onChange={e => setSharedGoalForm(prev => ({ ...prev, weightage: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <label className="label mb-3">Select Team Members</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {team.map(member => (
                      <label
                        key={member.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                          sharedGoalForm.employeeIds.includes(member.id)
                            ? "bg-primary-50 border-primary-200"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        )}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-600"
                          checked={sharedGoalForm.employeeIds.includes(member.id)}
                          onChange={(e) => {
                            setSharedGoalForm(prev => {
                              const ids = e.target.checked
                                ? [...prev.employeeIds, member.id]
                                : prev.employeeIds.filter(id => id !== member.id);
                              return { ...prev, employeeIds: ids };
                            });
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{member.name}</p>
                          <p className="text-xs text-slate-500 truncate">{member.designation}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <button onClick={() => setShowSharedGoalModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button
                  onClick={handlePushSharedGoal}
                  disabled={!sharedGoalForm.title || sharedGoalForm.employeeIds.length === 0 || processingAction === 'shared'}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {processingAction === 'shared' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  Push to Selected Members
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
