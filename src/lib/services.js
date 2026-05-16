import { supabase } from './supabase';

// Mock Data for Demo Fallback
const MOCK_GOALS = [
  { id: '1', title: 'Improve System Uptime', status: 'approved', thrust_area: 'Infrastructure', weightage: 30, target: '99.9%', employee_id: 'demo-emp-1' },
  { id: '2', title: 'Reduce Latency by 20%', status: 'submitted', thrust_area: 'Performance', weightage: 40, target: '< 100ms', employee_id: 'demo-emp-1' },
  { id: '3', title: 'Security Audit Compliance', status: 'draft', thrust_area: 'Security', weightage: 30, target: '100% Pass', employee_id: 'demo-emp-1' },
];

const isDemo = () => {
  return !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://your-project-id.supabase.co';
};

/**
 * GOALS SERVICE
 */
export const goalsService = {
  // Fetch all goals for a specific employee
  async getEmployeeGoals(employeeId) {
    if (isDemo()) return MOCK_GOALS.filter(g => g.employee_id === employeeId || employeeId.startsWith('demo-'));
    
    const { data, error } = await supabase
      .from('goals')
      .select('*, check_ins(*)')
      .eq('employee_id', employeeId);

    if (error) throw error;
    return data;
  },

  // Fetch goals for a manager's team
  async getTeamGoals(managerId) {
    if (isDemo()) return MOCK_GOALS;

    // First get team members
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

  // Fetch all goals across the organization (Admin)
  async getAllGoals() {
    if (isDemo()) return MOCK_GOALS;

    const { data, error } = await supabase
      .from('goals')
      .select('*, profiles(name, department), check_ins(*)');

    if (error) throw error;
    return data;
  },

  // Create a new goal
  async createGoal(goalData) {
    if (isDemo()) return { ...goalData, id: Math.random().toString() };

    const { data, error } = await supabase
      .from('goals')
      .insert([goalData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update an existing goal
  async updateGoal(goalId, updates) {
    if (isDemo()) return { id: goalId, ...updates };

    const { data, error } = await supabase
      .from('goals')
      .update(updates)
      .eq('id', goalId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Upsert multiple goals (bulk save/update)
  async upsertGoals(goals) {
    if (isDemo()) return goals;

    const { data, error } = await supabase
      .from('goals')
      .upsert(goals)
      .select();

    if (error) throw error;
    return data;
  },

  // Submit a check-in
  async submitCheckIn(checkInData) {
    if (isDemo()) return checkInData;

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
    if (isDemo()) return { id: userId, name: 'Demo User', role: 'employee' };

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  async getTeam(managerId) {
    if (isDemo()) return [{ id: 'demo-emp-1', name: 'Harshi Sharma', role: 'employee', designation: 'Analyst' }];

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('manager_id', managerId);

    if (error) throw error;
    return data;
  },

  async getAllUsers() {
    if (isDemo()) return [
      { id: '1', name: 'Harshi Sharma', role: 'employee', status: 'active', department: 'Operations' },
      { id: '2', name: 'Janhvi Singh', role: 'manager', status: 'active', department: 'Operations' }
    ];

    const { data, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) throw error;
    return data;
  },

  async createProfile(profileData) {
    if (isDemo()) return profileData;

    const { data, error } = await supabase
      .from('profiles')
      .insert([profileData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateProfile(userId, updates) {
    if (isDemo()) return { id: userId, ...updates };

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
    if (isDemo()) return [{ id: '1', action: 'LOGIN', actor: 'Demo', timestamp: new Date().toISOString() }];

    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async logAction(action, actor, details) {
    if (isDemo()) return { action, actor, details };

    const { data, error } = await supabase
      .from('audit_logs')
      .insert([{ action, actor, details, timestamp: new Date().toISOString() }]);

    if (error) throw error;
    return data;
  }
};

