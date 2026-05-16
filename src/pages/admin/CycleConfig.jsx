import { useState } from 'react';
import { Calendar, Settings, CheckCircle2, Save, Info } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

// Per spec: Q1=July, Q2=October, Q3=January, Q4=March/April
const SCHEDULE_SPEC = [
  { phase: 'Phase 1 — Goal Setting', opens: '1st May', action: 'Goal Creation, Submission & Approval' },
  { phase: 'Q1 Check-in', opens: 'July', action: 'Progress Update — Planned vs. Actual' },
  { phase: 'Q2 Check-in', opens: 'October', action: 'Progress Update — Planned vs. Actual' },
  { phase: 'Q3 Check-in', opens: 'January', action: 'Progress Update — Planned vs. Actual' },
  { phase: 'Q4 / Annual', opens: 'March / April', action: 'Final Achievement Capture' },
];

const defaultConfig = {
  cycleYear: '2026',
  submissionStart: '2026-05-01',
  submissionEnd: '2026-05-31',
  Q1: { start: '2026-07-01', end: '2026-07-31' },
  Q2: { start: '2026-10-01', end: '2026-10-31' },
  Q3: { start: '2027-01-01', end: '2027-01-31' },
  Q4: { start: '2027-03-01', end: '2027-04-30' },
  lockGoalsOnApproval: true,
  allowManagerEdits: true,
  requireManagerComment: false,
  maxGoals: 8,
  minWeightage: 10,
};

const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const itemVariants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } };

export default function CycleConfig() {
  const [config, setConfig] = useState(defaultConfig);
  const [saved, setSaved] = useState(false);

  const update = (key, val) => setConfig(c => ({ ...c, [key]: val }));
  const updateQ = (q, field, val) => setConfig(c => ({ ...c, [q]: { ...c[q], [field]: val } }));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 max-w-3xl pb-12">
      <motion.div variants={itemVariants}>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 border border-primary-200 text-xs font-semibold text-primary-700 uppercase tracking-widest mb-3">
          Configuration
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Cycle Configuration</h1>
        <p className="text-slate-500 text-sm mt-1 font-medium">Configure the FY2026 performance cycle windows and enforcement rules</p>
      </motion.div>

      {/* Spec Schedule Reference */}
      <motion.div variants={itemVariants} className="card p-5 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3 mb-3">
          <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs font-bold text-blue-800 uppercase tracking-widest">Check-In Schedule (System Spec)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-blue-200">
                <th className="text-left py-1.5 pr-4 font-bold text-blue-700">Period</th>
                <th className="text-left py-1.5 pr-4 font-bold text-blue-700">Window Opens</th>
                <th className="text-left py-1.5 font-bold text-blue-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {SCHEDULE_SPEC.map(row => (
                <tr key={row.phase} className="border-b border-blue-100 last:border-0">
                  <td className="py-1.5 pr-4 font-semibold text-blue-800">{row.phase}</td>
                  <td className="py-1.5 pr-4 text-blue-700">{row.opens}</td>
                  <td className="py-1.5 text-blue-600">{row.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Goal Submission Window */}
      <motion.div variants={itemVariants} className="card p-6 space-y-4 border-slate-200">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary-50 text-primary-600"><Calendar className="h-4 w-4" /></div>
          Goal Submission Window (Phase 1)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Cycle Year</label>
            <select className="input" value={config.cycleYear} onChange={e => update('cycleYear', e.target.value)}>
              <option value="2025">FY2025</option>
              <option value="2026">FY2026</option>
              <option value="2027">FY2027</option>
            </select>
          </div>
          <div>
            <label className="label">Start Date</label>
            <input type="date" className="input" value={config.submissionStart} onChange={e => update('submissionStart', e.target.value)} />
          </div>
          <div>
            <label className="label">End Date</label>
            <input type="date" className="input" value={config.submissionEnd} onChange={e => update('submissionEnd', e.target.value)} />
          </div>
        </div>
      </motion.div>

      {/* Quarterly Check-In Windows */}
      <motion.div variants={itemVariants} className="card p-6 space-y-4 border-slate-200">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600"><Calendar className="h-4 w-4" /></div>
          Quarterly Check-In Windows
          <span className="text-xs font-normal text-slate-400 ml-1">(per system schedule above)</span>
        </h3>
        <div className="space-y-3">
          {QUARTERS.map(q => {
            const specMap = { Q1: 'July', Q2: 'October', Q3: 'January', Q4: 'March/April' };
            return (
              <div key={q} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="w-8 text-center">
                  <span className="text-sm font-extrabold text-slate-800">{q}</span>
                  <p className="text-[9px] text-slate-400 whitespace-nowrap">{specMap[q]}</p>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Opens</label>
                    <input type="date" className="input text-sm py-1.5" value={config[q]?.start} onChange={e => updateQ(q, 'start', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Closes</label>
                    <input type="date" className="input text-sm py-1.5" value={config[q]?.end} onChange={e => updateQ(q, 'end', e.target.value)} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Rules & Constraints */}
      <motion.div variants={itemVariants} className="card p-6 space-y-4 border-slate-200">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <div className="p-2 rounded-lg bg-amber-50 text-amber-600"><Settings className="h-4 w-4" /></div>
          Rules & Constraints
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Max Goals per Employee</label>
            <input type="number" min={1} max={10} className="input" value={config.maxGoals} onChange={e => update('maxGoals', Number(e.target.value))} />
            <p className="text-xs text-slate-400 mt-1">Spec: 8</p>
          </div>
          <div>
            <label className="label">Min Weightage per Goal (%)</label>
            <input type="number" min={5} max={50} className="input" value={config.minWeightage} onChange={e => update('minWeightage', Number(e.target.value))} />
            <p className="text-xs text-slate-400 mt-1">Spec: 10%</p>
          </div>
        </div>
        <div className="space-y-3 pt-2">
          {[
            { key: 'lockGoalsOnApproval', label: 'Lock goals after manager approval', desc: 'Employees cannot edit approved goals without admin unlock' },
            { key: 'allowManagerEdits', label: 'Allow managers to edit goals before approval', desc: 'Managers can modify target and weightage inline' },
            { key: 'requireManagerComment', label: 'Require manager comment on approval/rejection', desc: 'Comment is mandatory before approving or rejecting' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
              <button
                id={`toggle-${key}`}
                onClick={() => update(key, !config[key])}
                className={cn('mt-0.5 relative h-5 w-9 rounded-full transition-colors flex-shrink-0', config[key] ? 'bg-primary-600' : 'bg-slate-300')}
              >
                <div className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', config[key] ? 'translate-x-4' : 'translate-x-0.5')} />
              </button>
              <div>
                <p className="text-sm font-semibold text-slate-800">{label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="flex justify-end">
        <button
          id="save-cycle-btn"
          onClick={handleSave}
          className={cn('btn-primary flex items-center gap-2 transition-all', saved && 'bg-emerald-600 hover:bg-emerald-700')}
        >
          {saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? 'Configuration Saved!' : 'Save Configuration'}
        </button>
      </motion.div>
    </motion.div>
  );
}
