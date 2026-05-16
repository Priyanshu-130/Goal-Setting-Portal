-- SUPABASE DATABASE SCHEMA
-- PerformX Performance Portal

-- 1. PROFILES TABLE
-- Stores user information. Linked to Supabase Auth.
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('employee', 'manager', 'admin')),
  designation TEXT,
  department TEXT,
  manager_id UUID REFERENCES public.profiles(id),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. GOALS TABLE
-- Stores performance goals for employees.
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  thrust_area TEXT NOT NULL,
  unit TEXT DEFAULT 'numeric',
  target TEXT NOT NULL,
  weightage INTEGER NOT NULL CHECK (weightage >= 0 AND weightage <= 100),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  is_shared BOOLEAN DEFAULT false,
  manager_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CHECK_INS TABLE
-- Stores quarterly progress for each goal.
CREATE TABLE IF NOT EXISTS public.check_ins (
  goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE PRIMARY KEY,
  q1 JSONB DEFAULT '{"status": "pending", "value": ""}',
  q2 JSONB DEFAULT '{"status": "pending", "value": ""}',
  q3 JSONB DEFAULT '{"status": "pending", "value": ""}',
  q4 JSONB DEFAULT '{"status": "pending", "value": ""}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. AUDIT LOGS TABLE
-- Stores activity history.
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  actor TEXT NOT NULL,
  details TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES

-- Profiles: Users can read their own profile, managers can read team profiles, admins can read all.
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Goals: Employees can view/edit own, managers view team, admins view all.
CREATE POLICY "Goals are viewable by involved parties" ON public.goals
  FOR SELECT USING (
    auth.uid() = employee_id OR 
    auth.uid() IN (SELECT id FROM public.profiles WHERE manager_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Employees can insert own goals" ON public.goals
  FOR INSERT WITH CHECK (auth.uid() = employee_id);

CREATE POLICY "Owners and managers can update goals" ON public.goals
  FOR UPDATE USING (
    auth.uid() = employee_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'manager' OR role = 'admin'))
  );

-- Audit Logs: Viewable by admins, insertable by anyone authenticated.
CREATE POLICY "Audit logs are viewable by admins" ON public.audit_logs
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Audit logs can be inserted by authenticated users" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- FUNCTIONS & TRIGGERS

-- Automatically create a check-in record when a goal is created
CREATE OR REPLACE FUNCTION public.handle_new_goal()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.check_ins (goal_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_goal_created
  AFTER INSERT ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_goal();

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER on_goal_updated BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
