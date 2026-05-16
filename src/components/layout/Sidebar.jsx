import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Target, 
  CalendarCheck, 
  Users, 
  BarChart3, 
  Settings, 
  FileText, 
  ShieldCheck,
  Hexagon,
  Menu,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

export default function Sidebar({ collapsed, onToggle }) {
  const { currentUser, logout } = useAuth();

  const NAV_LINKS = {
    employee: [
      { to: '/employee', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/employee/goals', icon: Target, label: 'My Goals' },
      { to: '/employee/checkin', icon: CalendarCheck, label: 'Verification Requests' },
    ],
    manager: [
      { to: '/manager', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/manager/team-goals', icon: Users, label: 'Team Verifications' },
      { to: '/manager/analytics', icon: BarChart3, label: 'Analytics' },
    ],
    admin: [
      { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/admin/cycle', icon: ShieldCheck, label: 'Verification Workflow' },
      { to: '/admin/users', icon: Users, label: 'Employees' },
      { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
      { to: '/admin/reports', icon: FileText, label: 'Reports' },
      { to: '/admin/audit', icon: FileText, label: 'Audit Logs' },
    ]
  };

  const links = currentUser ? NAV_LINKS[currentUser.role] : [];

  return (
    <motion.aside 
      initial={false}
      animate={{ width: collapsed ? '4.5rem' : '16rem' }}
      className="fixed left-0 top-0 bottom-0 z-50 bg-white/95 backdrop-blur-2xl border-r border-slate-200 flex flex-col transition-all duration-300 shadow-[4px_0_24px_rgba(0,0,0,0.02)]"
    >
      {/* Logo */}
      <div className="h-20 flex items-center px-5 border-b border-slate-200 relative">
        <div className="flex items-center gap-3.5 w-full overflow-hidden">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0 shadow-glow-primary relative overflow-hidden group">
            <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-[0%] transition-transform duration-300 ease-in-out" />
            <Hexagon className="h-5 w-5 text-slate-900 relative z-10" />
          </div>
          {!collapsed && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="flex-1 whitespace-nowrap">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">PerformX</h2>
              <p className="text-[10px] text-primary-600 font-semibold tracking-[0.2em] uppercase">Enterprise</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1.5 scrollbar-hide">
        {!collapsed && <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Main Navigation</p>}
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to.split('/').length === 2}
              className={({ isActive }) => cn(
                'sidebar-link group',
                isActive && 'active',
                collapsed && 'justify-center px-0'
              )}
              title={collapsed ? link.label : undefined}
            >
              <Icon className={cn("h-5 w-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110", collapsed && "mx-auto", "text-slate-500 group-hover:text-slate-900 group-[.active]:text-primary-600")} />
              {!collapsed && <span className="truncate font-medium group-[.active]:font-semibold">{link.label}</span>}
            </NavLink>
          );
        })}

        <div className="pt-6 mt-6 border-t border-slate-200">
          {!collapsed && <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">System</p>}
          <div className={cn("sidebar-link group text-slate-500 hover:text-slate-900", collapsed && 'justify-center px-0')} title={collapsed ? "Settings" : undefined}>
            <Settings className="h-5 w-5 flex-shrink-0 transition-transform duration-300 group-hover:rotate-90" />
            {!collapsed && <span>Settings</span>}
          </div>
        </div>
      </nav>

      {/* User Profile Section */}
      <div className="p-3 border-t border-slate-200 bg-gradient-to-t from-slate-50 to-transparent">
        <div className={cn(
          "flex items-center gap-3 p-2 rounded-xl transition-colors duration-300",
          !collapsed && "hover:bg-slate-100 cursor-pointer"
        )}>
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-slate-900 font-bold text-sm flex-shrink-0 shadow-[0_0_15px_rgba(249,115,22,0.2)]">
            {currentUser?.avatar || 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{currentUser?.name}</p>
              <p className="text-[11px] text-slate-500 truncate capitalize">{currentUser?.role}</p>
            </div>
          )}
          {!collapsed && (
            <button onClick={logout} className="p-2 text-slate-500 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-50">
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Collapse Toggle */}
      <button 
        onClick={onToggle}
        className="absolute -right-3.5 top-24 h-7 w-7 bg-white border border-slate-200 shadow-sm rounded-full flex items-center justify-center text-slate-500 hover:text-primary-600 hover:border-primary-200 transition-all duration-300 z-50"
      >
        {collapsed ? <ChevronRight className="h-4 w-4 ml-0.5" /> : <ChevronLeft className="h-4 w-4 mr-0.5" />}
      </button>
    </motion.aside>
  );
}
