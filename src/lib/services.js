import { supabase } from './supabase';

// --- Mock Database Helper (LocalStorage Persistence) ---
const MOCK_DB_KEY = 'performx_mock_db';

const getMockDb = () => {
  const stored = localStorage.getItem(MOCK_DB_KEY);
  if (stored) return JSON.parse(stored);
  
  // Initial Seed Data
  const initial = {
    goals: [
      { id: '1', title: 'Improve System Uptime', status: 'approved', thrust_area: 'Infrastructure', weightage: 30, target: '99.9%', employee_id: 'demo-emp-1' },
      { id: '2', title: 'Reduce Latency by 20%', status: 'submitted', thrust_area: 'Performance', weightage: 40, target: '< 100ms', employee_id: 'demo-emp-1' },
      { id: '3', title: 'Security Audit Compliance', status: 'draft', thrust_area: 'Security', weightage: 30, target: '100% Pass', employee_id: 'demo-emp-1' },
    ],
    profiles: [
      { id: 'demo-emp-1', name: 'Harshi Sharma', role: 'employee', status: 'active', department: 'Operations' },
      { id: 'demo-mgr-1', name: 'Janhvi Singh', role: 'manager', status: 'active', department: 'Operations' }
    ],
    audit_logs: [
      { id: '1', action: 'SYSTEM_INIT', actor: 'System', timestamp: new Date().toISOString() }
    ],
    check_ins: []
  };
  localStorage.setItem(MOCK_DB_KEY, JSON.stringify(initial));
  return initial;
};

const saveMockDb = (data) => {
  localStorage.setItem(MOCK_DB_KEY, JSON.stringify(data));
};

const isDemo = () => {
  return !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://your-project-id.supabase.co';
};

/**
 * GOALS SERVICE
 */
export const goalsService = {
  async getEmployeeGoals(employeeId) {
    if (isDemo()) {
      const db = getMockDb();
      return db.goals.filter(g => g.employee_id === employeeId || employeeId.startsWith('demo-'));
    }
    
    const { data, error } = await supabase
      .from('goals')
      .select('*, check_ins(*)')
      .eq('employee_id', employeeId);

    if (error) throw error;
    return data;
  },

  async getTeamGoals(managerId) {
    if (isDemo()) return getMockDb().goals;

    const { data: team, error: teamError } = await supabase
      .from('profiles')
      .select('id')
      .eq('manager_id', managerId);

    if (teamError) throw teamError;
    const teamIds = team.map(member => member.id);

    const { data, error } = await supabase
      .from('goals')
      .select('*, profiles(name), check_ins(*)')
      .in('employee_id', teamIds);

    if (error) throw error;
    return data;
  },

  async getAllGoals() {
    if (isDemo()) return getMockDb().goals;

    const { data, error } = await supabase
      .from('goals')
      .select('*, profiles(name, department), check_ins(*)');

    if (error) throw error;
    return data;
  },

  async createGoal(goalData) {
    if (isDemo()) {
      const db = getMockDb();
      const newGoal = { ...goalData, id: Math.random().toString(36).substr(2, 9) };
      db.goals.push(newGoal);
      saveMockDb(db);
      return newGoal;
    }

    const { data, error } = await supabase
      .from('goals')
      .insert([goalData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateGoal(goalId, updates) {
    if (isDemo()) {
      const db = getMockDb();
      const idx = db.goals.findIndex(g => g.id === goalId);
      if (idx !== -1) {
        db.goals[idx] = { ...db.goals[idx], ...updates };
        saveMockDb(db);
        return db.goals[idx];
      }
      return null;
    }

    const { data, error } = await supabase
      .from('goals')
      .update(updates)
      .eq('id', goalId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async upsertGoals(goals) {
    if (isDemo()) {
      const db = getMockDb();
      goals.forEach(g => {
        const idx = db.goals.findIndex(eg => eg.id === g.id);
        if (idx !== -1) db.goals[idx] = { ...db.goals[idx], ...g };
        else db.goals.push({ ...g, id: g.id || Math.random().toString(36).substr(2, 9) });
      });
      saveMockDb(db);
      return goals;
    }

    const { data, error } = await supabase
      .from('goals')
      .upsert(goals)
      .select();

    if (error) throw error;
    return data;
  },

  async submitCheckIn(checkInData) {
    if (isDemo()) {
      const db = getMockDb();
      db.check_ins.push(checkInData);
      saveMockDb(db);
      return checkInData;
    }

    const { data, error } = await supabase
      .from('check_ins')
      .upsert([checkInData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

/**
 * USERS SERVICE
 */
export const usersService = {
  async getProfile(userId) {
    if (isDemo()) {
      const db = getMockDb();
      return db.profiles.find(p => p.id === userId) || { id: userId, name: 'Demo User', role: 'employee' };
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  async getTeam(managerId) {
    if (isDemo()) return getMockDb().profiles.filter(p => p.role === 'employee');

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('manager_id', managerId);

    if (error) throw error;
    return data;
  },

  async getAllUsers() {
    if (isDemo()) return getMockDb().profiles;

    const { data, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) throw error;
    return data;
  },

  async createProfile(profileData) {
    if (isDemo()) {
      const db = getMockDb();
      const newProfile = { ...profileData, id: profileData.id || Math.random().toString(36).substr(2, 9) };
      db.profiles.push(newProfile);
      saveMockDb(db);
      return newProfile;
    }

    const { data, error } = await supabase
      .from('profiles')
      .insert([profileData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateProfile(userId, updates) {
    if (isDemo()) {
      const db = getMockDb();
      const idx = db.profiles.findIndex(p => p.id === userId);
      if (idx !== -1) {
        db.profiles[idx] = { ...db.profiles[idx], ...updates };
        saveMockDb(db);
        return db.profiles[idx];
      }
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

/**
 * AUDIT SERVICE
 */
export const auditService = {
  async getRecentLogs(limit = 10) {
    if (isDemo()) return getMockDb().audit_logs.slice(-limit).reverse();

    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async logAction(action, actor, details) {
    if (isDemo()) {
      const db = getMockDb();
      const log = { id: Math.random().toString(), action, actor, details, timestamp: new Date().toISOString() };
      db.audit_logs.push(log);
      saveMockDb(db);
      return log;
    }

    const { data, error } = await supabase
      .from('audit_logs')
      .insert([{ action, actor, details, timestamp: new Date().toISOString() }]);

    if (error) throw error;
    return data;
  }
};


