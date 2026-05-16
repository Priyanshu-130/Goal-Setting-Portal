import { Clock, CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import { mockGoals, GOAL_STATUS } from '../../data/mockGoals';
import { mockUsers } from '../../data/mockUsers';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function PendingApprovalsWidget({ managerId }) {
  const navigate = useNavigate();
  const teamIds = mockUsers.filter((u) => u.managerId === managerId).map((u) => u.id);
  const pending = mockGoals.filter(
    (g) => teamIds.includes(g.employeeId) && g.status === GOAL_STATUS.SUBMITTED
  );

  // Group by employee
  const grouped = {};
  pending.forEach((g) => {
    if (!grouped[g.employeeId]) grouped[g.employeeId] = [];
    grouped[g.employeeId].push(g);
  });

  const entries = Object.entries(grouped);

  return (
    <div className="card h-full flex flex-col p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-[#fbbf24]/5 rounded-full blur-[30px]" />
      <div className="flex items-center justify-between mb-6 relative z-10">
        <h3 className="section-title flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
          Pending Approvals
          {entries.length > 0 && (
            <span className="badge-warning ml-2 shadow-[0_0_10px_rgba(251,191,36,0.2)]">{entries.length}</span>
          )}
        </h3>
        <button
          onClick={() => navigate('/manager/team-goals')}
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 uppercase tracking-widest transition-colors flex items-center gap-1"
        >
          View all <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 py-10 text-center relative z-10">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 border border-emerald-500/20 shadow-[0_0_20px_rgba(52,211,153,0.15)]"
          >
            <CheckCircle className="h-8 w-8 text-emerald-400" />
          </motion.div>
          <p className="text-sm font-medium text-slate-500">All caught up!</p>
          <p className="text-xs text-slate-500 mt-1">No pending approvals required.</p>
        </div>
      ) : (
        <div className="space-y-3 relative z-10">
          {entries.map(([empId, goals], i) => {
            const emp = mockUsers.find((u) => u.id === Number(empId));
            return (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                key={empId}
                className="flex items-center gap-4 p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 cursor-pointer hover:bg-amber-500/10 hover:border-amber-500/30 transition-all duration-300 group"
                onClick={() => navigate('/manager/team-goals')}
              >
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-slate-900 text-xs font-bold flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(251,191,36,0.4)] group-hover:scale-110 transition-transform">
                  {emp?.avatar || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate group-hover:text-amber-400 transition-colors">{emp?.name}</p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{goals.length} {goals.length === 1 ? 'goal' : 'goals'} awaiting review</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-amber-400/20 transition-colors">
                  <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-amber-400 flex-shrink-0 transition-colors" />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
