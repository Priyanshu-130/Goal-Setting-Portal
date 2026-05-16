import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

export default function StatCard({ icon: Icon, label, value, sub, color = 'primary', trend }) {
  const colorMap = {
    primary:  { bg: 'bg-primary-50 border-primary-200 shadow-sm',  text: 'text-primary-600',  icon: 'text-primary-600' },
    success:  { bg: 'bg-emerald-50 border-emerald-200 shadow-sm', text: 'text-emerald-600', icon: 'text-emerald-600' },
    warning:  { bg: 'bg-amber-50 border-amber-200 shadow-sm',    text: 'text-amber-600',    icon: 'text-amber-600' },
    danger:   { bg: 'bg-rose-50 border-rose-200 shadow-sm',     text: 'text-rose-600',     icon: 'text-rose-600' },
    info:     { bg: 'bg-blue-50 border-blue-200 shadow-sm',     text: 'text-blue-600',     icon: 'text-blue-600' },
  };

  const c = colorMap[color] || colorMap.primary;

  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="stat-card group cursor-pointer relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-24 h-24 bg-primary-50 rounded-full blur-[20px] group-hover:bg-primary-100 transition-colors duration-500" />
      <div className="flex items-start justify-between relative z-10">
        <div className={cn('p-3 rounded-xl border transition-transform duration-500 group-hover:scale-110', c.bg)}>
          {Icon && <Icon className={cn('h-6 w-6', c.icon)} />}
        </div>
        {trend !== undefined && (
          <span className={cn(
            'text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border backdrop-blur-md',
            trend >= 0
              ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
              : 'bg-rose-50 text-rose-600 border-rose-200'
          )}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="mt-4 relative z-10 flex flex-col">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-3xl font-extrabold text-slate-900 leading-none">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-2 font-medium">{sub}</p>}
      </div>
    </motion.div>
  );
}
