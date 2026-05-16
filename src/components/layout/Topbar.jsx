import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Bell, LogOut, ChevronDown, User, Moon, Sun } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mock notifications
  const notifications = [
    { id: 1, text: 'Your Q2 check-in is due soon', time: '2h ago', unread: true },
    { id: 2, text: 'Manager approved your goal G-003', time: '1d ago', unread: true },
    { id: 3, text: 'New shared KPI assigned to you', time: '2d ago', unread: false },
  ];
  const unreadCount = notifications.filter(n => n.unread).length;

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
                <div className="divide-y divide-slate-50">
                  {notifications.map(n => (
                    <div key={n.id} className={cn(
                      'px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer',
                      n.unread && 'bg-primary-50/40'
                    )}>
                      <div className="flex items-start gap-3">
                        {n.unread && <div className="mt-1.5 h-2 w-2 rounded-full bg-primary-500 flex-shrink-0" />}
                        {!n.unread && <div className="mt-1.5 h-2 w-2 rounded-full bg-transparent flex-shrink-0" />}
                        <div className="flex-1">
                          <p className="text-sm text-slate-700 font-medium leading-snug">{n.text}</p>
                          <p className="text-xs text-slate-400 mt-1">{n.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2.5 border-t border-slate-100 text-center">
                  <button className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors">
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
    </header>
  );
}
