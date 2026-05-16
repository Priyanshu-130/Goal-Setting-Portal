import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

const MOCK_PROFILES = {
  'harshi@demo.com': { id: 'demo-emp-1', name: 'Harshi Sharma', role: 'employee', designation: 'Senior Analyst', department: 'Operations', avatar: 'HS' },
  'janhvi@demo.com': { id: 'demo-mgr-1', name: 'Janhvi Singh', role: 'manager', designation: 'Operations Manager', department: 'Operations', avatar: 'JS' },
  'anshu@demo.com':  { id: 'demo-adm-1', name: 'Anshu Kumari', role: 'admin', designation: 'VP Operations', department: 'Executive', avatar: 'AK' },
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
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
        setCurrentUser(null);
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
      // If profile fetch fails but auth succeeded, we might be in an inconsistent state
      // (Auth user exists but profile record doesn't). 
      // In this case, we'll remain logged out or show an error.
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    if (isDemoMode || !supabase) {
      // Mock Login Logic
      const mockUser = MOCK_PROFILES[email];
      if (mockUser && password === 'demo123') {
        setCurrentUser(mockUser);
        return { user: mockUser };
      }
      throw new Error('Invalid credentials or Demo Mode error');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  };

  const logout = async () => {
    if (!isDemoMode && supabase) {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
  };

  const value = { 
    currentUser, 
    login, 
    logout, 
    loading, 
    isDemoMode,
    isAuthenticated: !!currentUser,
    userRole: currentUser?.role 
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

