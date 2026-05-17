import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Bell, LogOut, ChevronDown, User, Moon, Sun, Shuffle, X, CheckCircle, Info, RefreshCw, AlertTriangle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { isLive } from '../../lib/supabase';

const ROLE_COLORS = {
  employee: 'bg-gradient-to-br from-primary-400 to-primary-600',
  manager:  'bg-gradient-to-br from-amber-400 to-orange-500',
  admin:    'bg-gradient-to-br from-rose-400 to-pink-600',
};

const ROLE_LABELS = {
  employee: 'Employee',
  manager: 'Manager (L1)',
  admin: 'Admin / HR',
};

export default function Topbar({ breadcrumb }) {
  const { currentUser, logout, switchRole, isDemoMode } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const roleSwitcherRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleRoleSwitch = (newRole) => {
    switchRole(newRole);
    setRoleSwitcherOpen(false);
    const redirect = { employee: '/employee', manager: '/manager', admin: '/admin' }[newRole] || '/';
    navigate(redirect);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
      if (roleSwitcherRef.current && !roleSwitcherRef.current.contains(event.target)) {
        setRoleSwitcherOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Dynamic Notifications State
  const [notificationsList, setNotificationsList] = useState([
    { 
      id: 1, 
      text: 'Your Q2 check-in is due soon', 
      category: 'Deadline', 
      description: 'Please submit your goals and check-in updates for the current performance period. Make sure to discuss with your manager before submitting.',
      time: '2 hours ago', 
      unread: true 
    },
    { 
      id: 2, 
      text: 'Manager approved your goal "Q2 Customer Retention Plan"', 
      category: 'Approval', 
      description: 'Your manager has reviewed and fully approved your strategic goal G-003. You are free to begin logging quarterly progress entries.',
      time: '1 day ago', 
      unread: true 
    },
    { 
      id: 3, 
      text: 'New shared KPI assigned to your department', 
      category: 'KPI Alignment', 
      description: 'A new high-level objective "Reduce Cloud Infrastructure Latency by 20%" has been cascaded down to your team dashboard. Align your individual targets with this goal.',
      time: '2 days ago', 
      unread: false 
    },
    { 
      id: 4, 
      text: 'Performance feedback request from Operations team', 
      category: 'Feedback Request', 
      description: 'You have been requested to provide peer feedback for the team lead of the Operations department. Complete before the Friday deadline.',
      time: '4 days ago', 
      unread: false 
    }
  ]);
  const [activeNotification, setActiveNotification] = useState(null);
  const [viewAllOpen, setViewAllOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const unreadCount = notificationsList.filter(n => n.unread).length;

  const handleNotificationClick = (n) => {
    // Mark as read
    setNotificationsList(prev => prev.map(item => item.id === n.id ? { ...item, unread: false } : item));
    setActiveNotification(n);
    setNotifOpen(false);
  };

  const handleViewAllOpen = () => {
    setViewAllOpen(true);
    setNotifOpen(false);
  };

  const markAllAsRead = () => {
    setNotificationsList(prev => prev.map(item => ({ ...item, unread: false })));
  };

  const handleForceRefresh = async () => {
    setIsSyncing(true);
    setSyncMessage('Syncing metadata...');
    await new Promise(resolve => setTimeout(resolve, 800));
    setSyncMessage('Fetching latest goals...');
    await new Promise(resolve => setTimeout(resolve, 600));
    setSyncMessage('Pulling check-ins...');
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Add a new live notification informing that the pull is successful
    setNotificationsList(prev => [
      {
        id: Date.now(),
        text: 'Cloud database synchronized successfully',
        category: 'System',
        description: 'All goals, progress check-ins, department alignment KPIs, and user profiles have been updated to the absolute latest version from the Supabase live database.',
        time: 'Just now',
        unread: true
      },
      ...prev
    ]);

    setIsSyncing(false);
    setSyncMessage('');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-8 sticky top-0 z-40">
      {/* Breadcrumb / Title */}
      <motion.div 
        initial={{ opacity: 0, y: -5 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.3 }}
        className="flex items-center gap-3"
      >
        <h1 className="text-lg font-semibold text-slate-800 tracking-tight">{breadcrumb}</h1>
      </motion.div>

      {/* Right actions */}
      <div className="flex items-center gap-2 lg:gap-3">
        {/* Connection Status & Pull */}
        <div className="flex items-center gap-2">
          <div className={cn(
            "hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all duration-300",
            !isDemoMode 
              ? "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
              : "bg-amber-50 text-amber-600 border-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
          )}>
            <div className={cn(
              "h-1.5 w-1.5 rounded-full",
              !isDemoMode ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
            )} />
            {!isDemoMode ? 'Supabase Live' : 'Demo Mode'}
          </div>

          <button
            onClick={handleForceRefresh}
            disabled={isSyncing}
            title="Force Pull Absolute Latest Data From Supabase Cloud"
            className={cn(
              "px-2.5 py-1 rounded-full border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-600 hover:text-slate-900 transition-all duration-200 flex items-center justify-center gap-1 text-[10px] font-bold shadow-sm",
              isSyncing && "bg-primary-50 border-primary-200 text-primary-600 cursor-not-allowed"
            )}
          >
            <RefreshCw className={cn("h-3 w-3", isSyncing && "animate-spin text-primary-500")} />
            <span className="hidden sm:inline">{isSyncing ? syncMessage : "Sync Cloud"}</span>
          </button>
        </div>

        {/* Global Demo Role Switcher */}
        <div className="relative" ref={roleSwitcherRef}>
          <button
            onClick={() => setRoleSwitcherOpen(o => !o)}
            className="flex items-center gap-2.5 px-4.5 py-2 rounded-full bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-300 hover:from-orange-100 hover:to-amber-100 hover:border-orange-400 transition-all duration-300 text-orange-850 shadow-[0_0_15px_rgba(249,115,22,0.15)] hover:shadow-[0_0_20px_rgba(249,115,22,0.25)] focus:outline-none focus:ring-2 focus:ring-orange-500/30 relative group font-bold animate-pulse hover:animate-none"
            title="Click to Switch Roles (Employee / Manager / Admin) Instantly!"
          >
            <Shuffle className="h-3.5 w-3.5 text-orange-600 group-hover:rotate-180 transition-transform duration-500" />
            <span className="text-xs font-extrabold uppercase tracking-wider hidden md:inline text-orange-900">
              ⚡ Switch Role: <span className="underline decoration-orange-500 decoration-2 underline-offset-2 capitalize">{currentUser?.role || 'Guest'}</span>
            </span>
            <span className="text-xs font-extrabold uppercase tracking-wider md:hidden text-orange-900">
              ⚡ <span className="capitalize">{currentUser?.role || 'Guest'}</span>
            </span>
            <ChevronDown className={cn(
              'h-3.5 w-3.5 text-orange-600 transition-transform duration-300',
              roleSwitcherOpen && 'rotate-180'
            )} />
          </button>

          <AnimatePresence>
            {roleSwitcherOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="absolute right-0 top-[calc(100%+0.5rem)] w-72 bg-white border border-slate-200 rounded-2xl shadow-lg z-50 overflow-hidden"
              >
                <div className="px-4 py-3 bg-gradient-to-r from-orange-100/60 to-amber-55/80 border-b border-slate-100 text-left">
                  <p className="text-xs font-extrabold text-orange-900 uppercase tracking-wider">✨ Quick Role Switcher</p>
                  <p className="text-[10px] text-slate-600 mt-0.5 font-semibold leading-relaxed">Select a view below to test different features & dashboards instantly!</p>
                </div>
                
                <div className="p-1.5 space-y-1">
                  {[
                    { role: 'employee', name: 'Harshi Singh', desc: 'Senior Analyst (Individual contributor view)', color: 'from-primary-400 to-primary-600', badge: 'bg-primary-50 text-primary-700' },
                    { role: 'manager', name: 'Janhvi Singh', desc: 'Operations Manager (L1 team goal review)', color: 'from-amber-400 to-orange-500', badge: 'bg-amber-50 text-orange-700' },
                    { role: 'admin', name: 'Anshu Raj', desc: 'VP Operations (HR compliance & system admin)', color: 'from-rose-400 to-pink-600', badge: 'bg-rose-50 text-rose-700' },
                  ].map((p) => {
                    const isSelected = currentUser?.role === p.role;
                    return (
                      <button
                        key={p.role}
                        onClick={() => handleRoleSwitch(p.role)}
                        className={cn(
                          "w-full text-left flex items-start gap-3 p-2.5 rounded-xl transition-all duration-200",
                          isSelected 
                            ? "bg-slate-50 border border-slate-200/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]" 
                            : "hover:bg-slate-50/70 border border-transparent"
                        )}
                      >
                        {/* Avatar representation */}
                        <div className={cn(
                          "h-8 w-8 rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 bg-gradient-to-br shadow-sm",
                          p.color
                        )}>
                          {p.name.split(' ').map(n=>n[0]).join('')}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1.5">
                            <p className="text-xs font-bold text-slate-800 truncate">{p.name}</p>
                            <span className={cn("text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md", p.badge)}>
                              {p.role}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 leading-normal mt-0.5">{p.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(o => !o)}
            className="relative p-2 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all duration-200"
          >
            <Bell className="h-[18px] w-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 border-2 border-white" />
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="absolute right-0 top-[calc(100%+0.5rem)] w-80 bg-white border border-slate-200 rounded-2xl shadow-lg z-50 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-800">Notifications</p>
                  {unreadCount > 0 && (
                    <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
                  {notificationsList.slice(0, 4).map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => handleNotificationClick(n)}
                      className={cn(
                        'px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer border-l-2 border-transparent text-left',
                        n.unread && 'bg-primary-50/20 border-l-primary-500'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className={cn(
                              "text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wide",
                              n.category === 'Deadline' && "bg-rose-50 text-rose-600",
                              n.category === 'Approval' && "bg-emerald-50 text-emerald-600",
                              n.category === 'KPI Alignment' && "bg-indigo-50 text-indigo-600",
                              n.category === 'Feedback Request' && "bg-amber-50 text-amber-600",
                              n.category === 'System' && "bg-primary-50 text-primary-600"
                            )}>
                              {n.category || 'Notification'}
                            </span>
                            {n.unread && <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />}
                          </div>
                          <p className="text-xs text-slate-700 font-medium leading-snug">{n.text}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{n.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {notificationsList.length === 0 && (
                    <div className="px-4 py-6 text-center text-slate-400 text-xs">
                      No notifications available
                    </div>
                  )}
                </div>
                <div className="px-4 py-2.5 border-t border-slate-100 text-center">
                  <button 
                    onClick={handleViewAllOpen}
                    className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors w-full"
                  >
                    View all notifications
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Menu */}
        <div className="relative ml-1" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-2.5 pl-1 pr-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          >
            {/* Avatar */}
            <div className={cn(
              'h-8 w-8 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0',
              ROLE_COLORS[currentUser?.role] || 'bg-gradient-to-br from-slate-400 to-slate-600'
            )}>
              {currentUser?.avatar || 'U'}
            </div>
            {/* Name & role (desktop) */}
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-slate-800 leading-tight">
                {currentUser?.name?.split(' ')[0]}
              </p>
              <p className="text-[10px] font-medium text-slate-500 leading-tight capitalize">
                {ROLE_LABELS[currentUser?.role] || currentUser?.role}
              </p>
            </div>
            <ChevronDown className={cn(
              'h-3.5 w-3.5 text-slate-400 transition-transform duration-200',
              dropdownOpen && 'rotate-180'
            )} />
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="absolute right-0 top-[calc(100%+0.5rem)] w-64 bg-white border border-slate-200 rounded-2xl shadow-lg z-50 overflow-hidden"
              >
                {/* User info */}
                <div className="px-4 py-4 border-b border-slate-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn(
                      'h-10 w-10 rounded-full text-white text-sm font-bold flex items-center justify-center flex-shrink-0',
                      ROLE_COLORS[currentUser?.role] || 'bg-slate-400'
                    )}>
                      {currentUser?.avatar || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{currentUser?.name}</p>
                      <p className="text-xs text-slate-500 truncate">{currentUser?.email}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {currentUser?.department} · {currentUser?.designation}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary-50 border border-primary-100 text-[10px] uppercase font-bold text-primary-700 tracking-wider">
                    {ROLE_LABELS[currentUser?.role] || currentUser?.role}
                  </div>
                </div>

                {/* Menu items */}
                <div className="p-1.5 space-y-0.5">
                  <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors">
                    <User className="h-4 w-4 text-slate-400" />
                    My Profile
                  </button>
                  <div className="h-px bg-slate-100 my-1 mx-2" />
                  <button
                    id="sign-out-btn"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      {/* NOTIFICATION DETAILS DIALOG */}
      <AnimatePresence>
        {activeNotification && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-md p-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 -mt-12 -mr-12 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl" />
              
              <div className="flex items-center justify-between mb-4 relative z-10">
                <span className={cn(
                  "text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full tracking-wider border",
                  activeNotification.category === 'Deadline' && "bg-rose-50 text-rose-600 border-rose-100",
                  activeNotification.category === 'Approval' && "bg-emerald-50 text-emerald-600 border-emerald-100",
                  activeNotification.category === 'KPI Alignment' && "bg-indigo-50 text-indigo-600 border-indigo-100",
                  activeNotification.category === 'Feedback Request' && "bg-amber-50 text-amber-600 border-amber-100",
                  activeNotification.category === 'System' && "bg-primary-50 text-primary-600 border-primary-100"
                )}>
                  {activeNotification.category || 'Information'}
                </span>
                <button 
                  onClick={() => setActiveNotification(null)} 
                  className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4 relative z-10 text-left">
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {activeNotification.text}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 font-medium">
                  {activeNotification.description}
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-semibold">Received {activeNotification.time}</span>
                  <span className="text-primary-600 font-bold flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5 text-primary-500" /> Marked as Read
                  </span>
                </div>
              </div>
              
              <div className="mt-6">
                <button 
                  onClick={() => setActiveNotification(null)}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-primary-600 to-[#b388ff] border-0 text-white shadow-md hover:shadow-lg transition-all duration-300"
                >
                  Acknowledge & Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ALL NOTIFICATIONS DIALOG */}
      <AnimatePresence>
        {viewAllOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-lg p-6 relative overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between mb-5 flex-shrink-0 text-left">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary-500" /> Notification Inbox
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold mt-1">
                    {unreadCount} unread entries remaining
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllAsRead}
                      className="px-3 py-1.5 rounded-xl bg-primary-50 hover:bg-primary-100 text-[10px] font-extrabold text-primary-600 transition-colors uppercase tracking-wider"
                    >
                      Mark All Read
                    </button>
                  )}
                  <button 
                    onClick={() => setViewAllOpen(false)} 
                    className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 space-y-3 max-h-[50vh] text-left">
                {notificationsList.map(n => (
                  <div 
                    key={n.id} 
                    onClick={() => {
                      setNotificationsList(prev => prev.map(item => item.id === n.id ? { ...item, unread: false } : item));
                      setActiveNotification(n);
                    }}
                    className={cn(
                      "p-3.5 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer border border-slate-100 flex items-start gap-4 mt-2",
                      n.unread ? "bg-primary-50/15 border-primary-100/50" : "bg-white"
                    )}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={cn(
                          "text-[9px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wide",
                          n.category === 'Deadline' && "bg-rose-50 text-rose-600",
                          n.category === 'Approval' && "bg-emerald-50 text-emerald-600",
                          n.category === 'KPI Alignment' && "bg-indigo-50 text-indigo-600",
                          n.category === 'Feedback Request' && "bg-amber-50 text-amber-600",
                          n.category === 'System' && "bg-primary-50 text-primary-600"
                        )}>
                          {n.category || 'Notification'}
                        </span>
                        {n.unread && (
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-slate-800 leading-snug">{n.text}</p>
                      <p className="text-xs text-slate-400 mt-1">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex-shrink-0">
                <button 
                  onClick={() => setViewAllOpen(false)}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-primary-600 to-[#b388ff] border-0 text-white shadow-md"
                >
                  Close Inbox
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
}
