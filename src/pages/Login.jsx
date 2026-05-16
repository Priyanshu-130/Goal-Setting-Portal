import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, LogIn, ShieldCheck } from 'lucide-react';
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
  const { login } = useAuth();
  const navigate = useNavigate();

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

          <div className="grid grid-cols-1 gap-4">
            {DEMO_USERS.map((demo) => (
              <button
                key={demo.role}
                onClick={() => {
                  login(demo.email, demo.password);
                  navigate(ROLE_REDIRECT[demo.role.toLowerCase()]);
                }}
                className="flex items-center gap-4 p-4 border border-slate-200 bg-white rounded-2xl hover:bg-primary-50 hover:border-primary-200 transition-all duration-300 group shadow-sm hover:shadow-md"
              >
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${demo.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <span className="block text-sm font-bold text-slate-800 uppercase tracking-wider">{demo.role} Access</span>
                  <span className="text-xs text-slate-500 font-medium">{demo.email}</span>
                </div>
                <LogIn className="h-4 w-4 ml-auto text-slate-300 group-hover:text-primary-500 transition-colors" />
              </button>
            ))}
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
