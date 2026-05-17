import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

const MOCK_PROFILES = {
  'harshi@demo.com': { id: 'demo-emp-1', name: 'Harshi Singh', role: 'employee', designation: 'Senior Analyst', department: 'Operations', avatar: 'HS' },
  'janhvi@demo.com': { id: 'demo-mgr-1', name: 'Janhvi Singh', role: 'manager', designation: 'Operations Manager', department: 'Operations', avatar: 'JS' },
  'anshu@demo.com':  { id: 'demo-adm-1', name: 'Anshu Raj', role: 'admin', designation: 'VP Operations', department: 'Executive', avatar: 'AR' },
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    // Check if there is a saved demo user in localStorage first
    const savedDemoUser = localStorage.getItem('performx_demo_user');
    if (savedDemoUser) {
      try {
        const parsedUser = JSON.parse(savedDemoUser);
        setCurrentUser(parsedUser);
        setIsDemoMode(true);
        setLoading(false);
        return;
      } catch (e) {
        console.error('Failed to parse saved demo user:', e);
      }
    }

    // Check if Supabase is properly configured
    const isSupabaseConfigured = 
      import.meta.env.VITE_SUPABASE_URL && 
      import.meta.env.VITE_SUPABASE_URL !== 'https://your-project-id.supabase.co';

    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured. Running in Demo Mode.');
      setIsDemoMode(true);
      setLoading(false);
      return;
    }

    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await fetchProfile(session.user.id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Supabase session check failed. Falling back to Demo Mode.');
        setIsDemoMode(true);
        setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        await fetchProfile(session.user.id);
      } else {
        // If there's no saved demo user, log out
        if (!localStorage.getItem('performx_demo_user')) {
          setCurrentUser(null);
        }
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setCurrentUser(data);
    } catch (error) {
      console.error('Error fetching profile:', error.message);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const mockUser = MOCK_PROFILES[email];
    if (mockUser && password === 'demo123') {
      setCurrentUser(mockUser);
      localStorage.setItem('performx_demo_user', JSON.stringify(mockUser));
      setIsDemoMode(true);
      return { user: mockUser };
    }

    if (isDemoMode || !supabase) {
      throw new Error('Invalid credentials or Demo Mode error');
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('Supabase auth failed. Attempting Mock Profile fallback:', err.message);
      if (mockUser && password === 'demo123') {
        setCurrentUser(mockUser);
        localStorage.setItem('performx_demo_user', JSON.stringify(mockUser));
        setIsDemoMode(true);
        return { user: mockUser };
      }
      throw err;
    }
  };

  const logout = async () => {
    localStorage.removeItem('performx_demo_user');
    if (!isDemoMode && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error('Supabase signout error:', e);
      }
    }
    setCurrentUser(null);
    setIsDemoMode(false);
  };

  const switchRole = (role) => {
    const roleToEmail = {
      employee: 'harshi@demo.com',
      manager: 'janhvi@demo.com',
      admin: 'anshu@demo.com'
    };
    const email = roleToEmail[role];
    const mockUser = MOCK_PROFILES[email];
    if (mockUser) {
      setCurrentUser(mockUser);
      localStorage.setItem('performx_demo_user', JSON.stringify(mockUser));
      setIsDemoMode(true);
    }
  };

  const value = { 
    currentUser, 
    login, 
    logout, 
    loading, 
    isDemoMode,
    isAuthenticated: !!currentUser,
    userRole: currentUser?.role,
    switchRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

