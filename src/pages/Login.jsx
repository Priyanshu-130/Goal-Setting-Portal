import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, Eye, EyeOff, AlertCircle, LogIn, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    try {
      const user = login(email, password);
      navigate(ROLE_REDIRECT[user.role]);
    } catch (err) {
      setError('Invalid credentials. Please use a demo account.');
    }
  };

  const handleDemoClick = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
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
          
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Email Address
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-primary-500 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 border border-rose-200 p-3 rounded-xl">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <button type="submit" id="login-btn" className="w-full btn-primary flex justify-center items-center py-3">
              <LogIn className="h-5 w-5 mr-2" />
              Secure Sign In
            </button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-slate-50 text-slate-500 uppercase tracking-widest font-semibold rounded-full">
                  Quick Demo Access
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              {DEMO_USERS.map((demo) => (
                <button
                  key={demo.role}
                  onClick={() => handleDemoClick(demo.email, demo.password)}
                  className="flex flex-col items-center gap-2 p-3 border border-slate-200 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group"
                >
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${demo.color} flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform`}>
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">{demo.role}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
      
      <p className="text-center text-xs text-slate-500 mt-8 relative z-10">
        Hackathon Demo · PerformX v1.0 · FY2026
      </p>
    </div>
  );
}
