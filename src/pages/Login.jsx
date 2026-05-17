import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, LogIn, ShieldCheck, AlertCircle, Loader2, Database, Globe, UserPlus, Lock, Mail, User, Briefcase, Network } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

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
  const { login, signUp } = useAuth();
  const navigate = useNavigate();
  const [isLoggingIn, setIsLoggingIn] = useState(null); // stores 'Employee', 'Manager', 'Admin', or 'cloud'
  const [error, setError] = useState(null);
  
  // Tab states
  const [activeTab, setActiveTab] = useState('demo'); // 'demo' or 'cloud'
  const [cloudAction, setCloudAction] = useState('login'); // 'login' or 'signup'
  
  // Cloud Login states
  const [cloudEmail, setCloudEmail] = useState('');
  const [cloudPassword, setCloudPassword] = useState('');
  
  // Cloud Signup states
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRole, setSignupRole] = useState('employee');
  const [signupDept, setSignupDept] = useState('');
  const [signupDesig, setSignupDesig] = useState('');

  const handleLogin = async (demo) => {
    try {
      setError(null);
      setIsLoggingIn(demo.role);
      
      await login(demo.email, demo.password);
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

  const handleCloudLogin = async (e) => {
    e.preventDefault();
    if (!cloudEmail || !cloudPassword) return;
    try {
      setError(null);
      setIsLoggingIn('cloud');
      const data = await login(cloudEmail, cloudPassword);
      
      let role = 'employee';
      if (data && data.user && data.user.role) {
        role = data.user.role;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          if (profile) role = profile.role;
        }
      }
      navigate(ROLE_REDIRECT[role.toLowerCase()]);
    } catch (err) {
      console.error('Cloud login failed:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoggingIn(null);
    }
  };

  const handleCloudSignup = async (e) => {
    e.preventDefault();
    if (!signupEmail || !signupPassword || !signupName || !signupDept || !signupDesig) {
      setError('Please fill in all signup fields.');
      return;
    }
    try {
      setError(null);
      setIsLoggingIn('signup');
      await signUp(signupEmail, signupPassword, signupName, signupRole, signupDept, signupDesig);
      // Auto login
      await login(signupEmail, signupPassword);
      navigate(ROLE_REDIRECT[signupRole.toLowerCase()]);
    } catch (err) {
      console.error('Cloud signup failed:', err);
      setError(err.message || 'Signup failed. Please try a different email or password.');
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
          
          {/* Switch Tab Switcher */}
          <div className="flex p-1.5 bg-slate-100 rounded-2xl mb-8 border border-slate-200">
            <button
              onClick={() => { setActiveTab('demo'); setError(null); }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-300",
                activeTab === 'demo'
                  ? "bg-white text-slate-800 shadow-md border border-slate-200/50"
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              <ShieldCheck className="h-4 w-4 text-orange-500" />
              Demo Sandbox
            </button>
            <button
              onClick={() => { setActiveTab('cloud'); setError(null); }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-300",
                activeTab === 'cloud'
                  ? "bg-white text-slate-800 shadow-md border border-slate-200/50"
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              <Globe className="h-4 w-4 text-primary-500" />
              Live Cloud Sync
            </button>
          </div>

          {/* Description header */}
          {activeTab === 'demo' ? (
            <div className="text-center mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-100 text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-2">
                <Database className="h-3 w-3" /> Offline Mode
              </span>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                Isolated sandbox inside this browser's local cache. Use this to quickly demonstrate pre-seeded role views.
              </p>
            </div>
          ) : (
            <div className="text-center mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 border border-primary-100 text-[10px] font-bold text-primary-600 uppercase tracking-wider mb-2">
                <Globe className="h-3 w-3 animate-pulse" /> Supabase Sync
              </span>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                Shared database cloud. Sync profiles, goals, rework approvals, and feeds globally with your team in real-time.
              </p>
            </div>
          )}

          <AnimatePresence mode="wait">
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

          {/* Tab 1: Offline sandbox quick-logins */}
          {activeTab === 'demo' && (
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
          )}

          {/* Tab 2: Live Supabase cloud syncing login & signup */}
          {activeTab === 'cloud' && (
            <div>
              {cloudAction === 'login' ? (
                <form onSubmit={handleCloudLogin} className="space-y-4">
                  <div>
                    <label className="label text-[10px]">Cloud Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        className="input pl-10"
                        placeholder="you@yourdomain.com"
                        value={cloudEmail}
                        onChange={e => setCloudEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label text-[10px]">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="password"
                        required
                        className="input pl-10"
                        placeholder="••••••••"
                        value={cloudPassword}
                        onChange={e => setCloudPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoggingIn === 'cloud'}
                    className="w-full btn-primary py-3 flex items-center justify-center gap-2 mt-6 shadow-[0_0_20px_rgba(99,102,241,0.25)]"
                  >
                    {isLoggingIn === 'cloud' ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <LogIn className="h-5 w-5" />
                        Log In to Cloud Sync
                      </>
                    )}
                  </button>
                  <p className="text-center text-xs text-slate-500 mt-4">
                    New to this team?{' '}
                    <button
                      type="button"
                      onClick={() => { setCloudAction('signup'); setError(null); }}
                      className="text-primary-600 hover:text-primary-700 font-bold underline decoration-2 decoration-primary-200"
                    >
                      Sign Up & Register
                    </button>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleCloudSignup} className="space-y-4">
                  <div>
                    <label className="label text-[10px]">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        className="input pl-10"
                        placeholder="e.g. Sarah Connor"
                        value={signupName}
                        onChange={e => setSignupName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label text-[10px]">Cloud Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        className="input pl-10"
                        placeholder="name@performx.com"
                        value={signupEmail}
                        onChange={e => setSignupEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label text-[10px]">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="password"
                        required
                        className="input pl-10"
                        placeholder="Min. 6 characters"
                        value={signupPassword}
                        onChange={e => setSignupPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label text-[10px]">System Role</label>
                      <select
                        className="input text-xs font-semibold"
                        value={signupRole}
                        onChange={e => setSignupRole(e.target.value)}
                      >
                        <option value="employee">Employee</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="label text-[10px]">Department</label>
                      <div className="relative">
                        <Network className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                          type="text"
                          required
                          className="input pl-8 text-xs font-semibold"
                          placeholder="Engineering"
                          value={signupDept}
                          onChange={e => setSignupDept(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="label text-[10px]">Designation / Title</label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        className="input pl-10"
                        placeholder="e.g. Senior Software Architect"
                        value={signupDesig}
                        onChange={e => setSignupDesig(e.target.value)}
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoggingIn === 'signup'}
                    className="w-full btn-primary py-3 flex items-center justify-center gap-2 mt-6 shadow-[0_0_20px_rgba(99,102,241,0.25)]"
                  >
                    {isLoggingIn === 'signup' ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="h-5 w-5" />
                        Register & Sync
                      </>
                    )}
                  </button>
                  <p className="text-center text-xs text-slate-500 mt-4">
                    Already registered?{' '}
                    <button
                      type="button"
                      onClick={() => { setCloudAction('login'); setError(null); }}
                      className="text-primary-600 hover:text-primary-700 font-bold underline decoration-2 decoration-primary-200"
                    >
                      Log In here
                    </button>
                  </p>
                </form>
              )}
            </div>
          )}

          <div className="mt-10 pt-8 border-t border-slate-100">
            <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
              Authorized Personnel Only
            </p>
          </div>
        </div>
      </motion.div>
      
      <p className="text-center text-xs text-slate-500 mt-8 relative z-10">
        Hackathon Sync Engine · PerformX v1.0 · FY2026
      </p>
    </div>
  );
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

