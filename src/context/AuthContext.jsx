import { createContext, useContext, useState, useEffect } from 'react';
import { mockUsers } from '../data/mockUsers';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('hut_user');
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    } catch {
      localStorage.removeItem('hut_user');
    }
    setLoading(false);
  }, []);

  const login = (email, password) => {
    const user = mockUsers.find(
      (u) => u.email === email && u.password === password
    );
    if (!user) throw new Error('Invalid credentials');

    // Simulate JWT token
    const token = btoa(JSON.stringify({ id: user.id, role: user.role, exp: Date.now() + 86400000 }));
    const userData = { ...user, token };
    delete userData.password;

    setCurrentUser(userData);
    localStorage.setItem('hut_user', JSON.stringify(userData));
    return userData;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('hut_user');
  };

  const value = { currentUser, login, logout, loading, isAuthenticated: !!currentUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
