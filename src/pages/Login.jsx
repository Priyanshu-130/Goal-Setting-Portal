import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, LogIn, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DEMO_USERS = [
  { email: 'harshi@demo.com', password: 'demo123', role: 'Employee', color: 'from-primary-400 to-primary-600' },
  { email: 'janhvi@demo.com', password: 'demo123', role: 'Manager',  color: 'from-amber-400 to-orange-600' },
  { email: 'anshu@demo.com',  password: 'demo123', role: 'Admin', color: 'from-rose-400 to-red-600' },
];

const ROLE_REDIRECT = {
  employee: '/employee',
  manager: '/manager',
  admin: '/admin',
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoggingIn, setIsLoggingIn] = useState(null); // stores the role being logged in
  const [error, setError] = useState(null);

  const handleLogin = async (demo) => {
    try {
      setError(null);
      setIsLoggingIn(demo.role);
      
      await login(demo.email, demo.password);
      
      // Navigation is now handled by the AuthContext listener or we can do it here
      // But we must wait a bit for the profile to be fetched by the AuthContext
      // Actually, it's safer to navigate after the login promise resolves 
      // but only if the user is successfully set.
      // For now, let's just navigate.
      navigate(ROLE_REDIRECT[demo.role.toLowerCase()]);
    } catch (err) {
      console.error('Login failed:', err);
      if (err.message === 'Failed to fetch') {
        setError('Connection failed. Please check if Supabase is configured in your .env file.');
      } else {
        setError(err.message || 'Login failed. Please ensure the user exists in Supabase Auth.');
      }
    } finally {
      setIsLoggingIn(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Abstract Glowing Backgrounds */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-[120px] pointer-events-none animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-400/10 rounded-full blur-[120px] pointer-events-none animate-float" style={{ animationDelay: '2s' }} />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sm:mx-auto sm:w-full sm:max-w-md relative z-10"
      >
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
            <Zap className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 tracking-tight">
          Welcome to PerformX
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 font-medium tracking-wide uppercase">
          Identity & Performance Portal
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10"
      >
        <div className="bg-white/80 backdrop-blur-xl py-8 px-4 shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-slate-200 sm:rounded-3xl sm:px-10">
          <div className="text-center mb-8">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Select Login Role</h3>
            <p className="text-xs text-slate-400">Choose your account type to continue to the portal</p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-3"
              >
                <AlertCircle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs font-semibold text-rose-600 leading-relaxed">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 gap-4">
            {DEMO_USERS.map((demo) => {
              const loading = isLoggingIn === demo.role;
              return (
                <button
                  key={demo.role}
                  disabled={isLoggingIn !== null}
                  onClick={() => handleLogin(demo)}
                  className={cn(
                    "flex items-center gap-4 p-4 border border-slate-200 bg-white rounded-2xl hover:bg-primary-50 hover:border-primary-200 transition-all duration-300 group shadow-sm hover:shadow-md relative overflow-hidden",
                    isLoggingIn !== null && isLoggingIn !== demo.role && "opacity-50 grayscale"
                  )}
                >
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${demo.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                    {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <ShieldCheck className="h-6 w-6" />}
                  </div>
                  <div className="text-left">
                    <span className="block text-sm font-bold text-slate-800 uppercase tracking-wider">{demo.role} Access</span>
                    <span className="text-xs text-slate-500 font-medium">{demo.email}</span>
                  </div>
                  {!loading && <LogIn className="h-4 w-4 ml-auto text-slate-300 group-hover:text-primary-500 transition-colors" />}
                </button>
              );
            })}
          </div>

          <div className="mt-10 pt-8 border-t border-slate-100">
            <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
              Authorized Personnel Only
            </p>
          </div>
        </div>
      </motion.div>
      
      <p className="text-center text-xs text-slate-500 mt-8 relative z-10">
        Hackathon Demo · PerformX v1.0 · FY2026
      </p>
    </div>
  );
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

