import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { mockGoals, GOAL_STATUS, computeProgressScore } from '../../data/mockGoals';
import { getTeamMembers } from '../../data/mockUsers';
import StatusBadge from '../../components/shared/StatusBadge';
import { cn } from '../../lib/utils';
import {
  ChevronDown, ChevronUp, CheckCircle, XCircle, MessageSquare,
  Save, Search, ShieldCheck, RotateCcw, CalendarCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';



export default function TeamGoals() {
  const { currentUser } = useAuth();
  const team = getTeamMembers(currentUser?.id);
  const teamIds = team.map((u) => u.id);

  const [activeTab, setActiveTab] = useState('approvals');
  const [goals, setGoals] = useState(mockGoals.filter((g) => teamIds.includes(g.employeeId)));
  const [expanded, setExpanded] = useState(null);
  const [editing, setEditing] = useState({});
  const [comments, setComments] = useState({});
  const [actions, setActions] = useState({});
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [checkinComments, setCheckinComments] = useState({});
  const [activeCheckinQ, setActiveCheckinQ] = useState('Q1');

  const [showSharedGoalModal, setShowSharedGoalModal] = useState(false);
  const [sharedGoalForm, setSharedGoalForm] = useState({
    title: '', description: '', thrustArea: 'Financial', target: '', weightage: 10, employeeIds: []
  });

  const employeeGroups = team.map((member) => ({
    member,
    goals: goals.filter((g) => g.employeeId === member.id),
  })).filter((grp) => grp.goals.length > 0 || true); // Always show team members in filter for shared goals

  const filteredGroups = employeeGroups.map((grp) => ({
    ...grp,
    goals: grp.goals.filter((g) => {
      const matchFilter = filter === 'all' || g.status === filter;
      const matchSearch = g.title.toLowerCase().includes(search.toLowerCase()) ||
        grp.member.name.toLowerCase().includes(search.toLowerCase());
      return matchFilter && matchSearch;
    }),
  })).filter((grp) => grp.goals.length > 0 || (search === '' && filter === 'all'));

  const handlePushSharedGoal = () => {
    if (!sharedGoalForm.title || sharedGoalForm.employeeIds.length === 0) return;
    
    const newGoals = sharedGoalForm.employeeIds.map(empId => ({
      id: `g-shared-${Date.now()}-${empId}`,
      employeeId: empId,
      title: sharedGoalForm.title,
      description: sharedGoalForm.description,
      thrustArea: sharedGoalForm.thrustArea,
      target: sharedGoalForm.target,
      weightage: Number(sharedGoalForm.weightage),
      status: GOAL_STATUS.APPROVED, // Shared goals are auto-approved
      isShared: true,
      checkIns: {}
    }));
    
    setGoals(prev => [...prev, ...newGoals]);
    setShowSharedGoalModal(false);
    setSharedGoalForm({ title: '', description: '', thrustArea: 'Financial', target: '', weightage: 10, employeeIds: [] });
  };

  const handleAction = (goalId, action) => {
    setActions((prev) => ({ ...prev, [goalId]: action }));
    const newStatus = action === 'approve' ? GOAL_STATUS.APPROVED
      : action === 'reject' ? GOAL_STATUS.REJECTED
      : GOAL_STATUS.REWORK;
    setGoals((prev) => prev.map((g) =>
      g.id === goalId
        ? { ...g, status: newStatus, managerComment: comments[goalId] || g.managerComment }
        : g
    ));
  };

  const handleInlineEdit = (goalId, field, val) => {
    setEditing((prev) => ({ ...prev, [goalId]: { ...(prev[goalId] || {}), [field]: val } }));
  };

  const saveInlineEdit = (goalId) => {
    const edits = editing[goalId];
    if (!edits) return;
    setGoals((prev) => prev.map((g) => g.id === goalId ? { ...g, ...edits } : g));
    setEditing((prev) => { const n = { ...prev }; delete n[goalId]; return n; });
  };

  const pendingCount = goals.filter((g) => g.status === GOAL_STATUS.SUBMITTED).length;
  const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

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
                    {member.avatar}
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
                    return (
                      <div key={goal.id} className="group">
                        <button
                          className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-slate-50 transition-colors"
                          onClick={() => setExpanded(isExpanded ? null : goal.id)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-slate-700 truncate">{goal.title}</p>
                              {goal.isShared && <span className="text-[9px] font-bold text-primary-700 bg-primary-50 border border-primary-200 px-1.5 py-0.5 rounded-full">Shared</span>}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                              <span>{goal.thrustArea}</span>
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
                                        <button onClick={() => saveInlineEdit(goal.id)} className="btn-secondary w-full flex justify-center items-center gap-2">
                                          <Save className="h-4 w-4" /> Save Edits
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
                                      value={comments[goal.id] ?? goal.managerComment}
                                      onChange={(e) => setComments((prev) => ({ ...prev, [goal.id]: e.target.value }))}
                                    />
                                  </div>
                                )}

                                {/* Existing comment */}
                                {goal.managerComment && goal.status !== GOAL_STATUS.SUBMITTED && (
                                  <div className="p-3 rounded-xl bg-white border border-slate-200">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Manager Comment</p>
                                    <p className="text-sm text-slate-700">{goal.managerComment}</p>
                                  </div>
                                )}

                                {/* Action Buttons */}
                                {goal.status === GOAL_STATUS.SUBMITTED && (
                                  <div className="flex flex-wrap items-center gap-3">
                                    <button
                                      id={`approve-${goal.id}`}
                                      onClick={() => handleAction(goal.id, 'approve')}
                                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-sm font-bold transition-all"
                                    >
                                      <CheckCircle className="h-4 w-4" /> Approve
                                    </button>
                                    <button
                                      id={`rework-${goal.id}`}
                                      onClick={() => handleAction(goal.id, 'rework')}
                                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-sm font-bold transition-all"
                                    >
                                      <RotateCcw className="h-4 w-4" /> Return for Rework
                                    </button>
                                    <button
                                      id={`reject-${goal.id}`}
                                      onClick={() => handleAction(goal.id, 'reject')}
                                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-sm font-bold transition-all"
                                    >
                                      <XCircle className="h-4 w-4" /> Reject
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
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white text-sm font-bold flex items-center justify-center">{member.avatar}</div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">{member.name}</p>
                    <p className="text-xs text-slate-500">{member.designation}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{activeCheckinQ} Progress</p>
                    {(() => {
                      let total = 0, weighted = 0;
                      approvedGoals.forEach(g => {
                        const score = computeProgressScore(g, g.checkIns?.[activeCheckinQ] || {});
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
                    const ci = goal.checkIns?.[activeCheckinQ] || {};
                    const score = computeProgressScore(goal, ci);
                    return (
                      <div key={goal.id} className="p-5">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1">
                            <p className="text-sm font-bold text-slate-800">{goal.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{goal.thrustArea} · <span className="text-primary-600 font-bold">{goal.weightage}% wt</span></p>
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
                        <div>
                          <label className="label text-xs flex items-center gap-1.5">
                            <MessageSquare className="h-3 w-3 text-primary-600" /> Manager Check-in Comment
                          </label>
                          <textarea
                            className="input text-sm resize-none"
                            rows={2}
                            placeholder="Document your discussion for this quarter..."
                            value={checkinComments[`${goal.id}-${activeCheckinQ}`] || ''}
                            onChange={(e) => setCheckinComments(prev => ({ ...prev, [`${goal.id}-${activeCheckinQ}`]: e.target.value }))}
                          />
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
                  disabled={!sharedGoalForm.title || sharedGoalForm.employeeIds.length === 0}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
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
