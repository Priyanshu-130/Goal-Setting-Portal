import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { cn } from '../../lib/utils';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const getBreadcrumb = () => {
    const path = location.pathname.split('/').filter(Boolean).pop();
    if (!path || path === 'employee' || path === 'manager' || path === 'admin') return 'Dashboard';
    return path.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="flex h-screen bg-[#fafafa] text-slate-900 overflow-hidden relative">
      {/* Background ambient glows - Animated */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary-500/5 rounded-full blur-[150px] pointer-events-none animate-pulse-slow" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-orange-400/5 rounded-full blur-[150px] pointer-events-none animate-pulse-slow" style={{ animationDelay: '2s' }} />
      
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      
      <div className={cn('flex-1 flex flex-col relative z-10 transition-all duration-300 ease-in-out', collapsed ? 'ml-[4.5rem]' : 'ml-64')}>
        <Topbar breadcrumb={getBreadcrumb()} />
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 lg:p-8 scroll-smooth relative">
          <div className="max-w-[1400px] mx-auto w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -15, filter: 'blur(8px)' }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="w-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
