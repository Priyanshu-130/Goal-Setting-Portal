-- ====================================================================
-- SUPABASE ROW LEVEL SECURITY (RLS) POLICIES FOR GOAL-SETTING PORTAL
-- ====================================================================
-- This script enables and configures production-ready Row Level Security
-- on all key tables: profiles, goals, check_ins, and audit_logs.
-- Execute this script in your Supabase SQL Editor to enforce secure,
-- role-based data isolation.

-- ────────────────────────────────────────────────────────────────────
-- 1. ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────────────
-- 2. PROFILES TABLE POLICIES
-- ────────────────────────────────────────────────────────────────────
-- Drop existing policies on profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles select policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles insert policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles update policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles delete policy" ON public.profiles;

-- Anyone authenticated can view profiles (needed for directory, department details, and team lists)
CREATE POLICY "Profiles select policy" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Users can insert their own profile during registration, or admins can create profiles
CREATE POLICY "Profiles insert policy" ON public.profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Users can update their own profile, or admins can update any profile
CREATE POLICY "Profiles update policy" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Only admins can delete profiles
CREATE POLICY "Profiles delete policy" ON public.profiles
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ────────────────────────────────────────────────────────────────────
-- 3. GOALS TABLE POLICIES
-- ────────────────────────────────────────────────────────────────────
-- Drop existing policies on goals
DROP POLICY IF EXISTS "Goals are viewable by involved parties" ON public.goals;
DROP POLICY IF EXISTS "Employees can insert own goals" ON public.goals;
DROP POLICY IF EXISTS "Owners and managers can update goals" ON public.goals;
DROP POLICY IF EXISTS "Goals select policy" ON public.goals;
DROP POLICY IF EXISTS "Goals insert policy" ON public.goals;
DROP POLICY IF EXISTS "Goals update policy" ON public.goals;
DROP POLICY IF EXISTS "Goals delete policy" ON public.goals;

-- Select Goals:
-- Employees can view their own goals, managers can view goals of their direct reports, and admins can view all goals.
CREATE POLICY "Goals select policy" ON public.goals
  FOR SELECT USING (
    auth.uid() = employee_id OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = public.goals.employee_id
        AND public.profiles.manager_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = auth.uid()
        AND public.profiles.role = 'admin'
    )
  );

-- Insert Goals:
-- Employees can insert their own goals, managers can insert goals for their direct reports (shared department goals), and admins can insert any.
CREATE POLICY "Goals insert policy" ON public.goals
  FOR INSERT WITH CHECK (
    auth.uid() = employee_id OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = auth.uid()
        AND (
          public.profiles.role = 'admin' OR
          (public.profiles.role = 'manager' AND public.profiles.id = (
            SELECT manager_id FROM public.profiles WHERE id = employee_id
          ))
        )
    )
  );

-- Update Goals:
-- Employees can update their own goals, managers can update goals of their direct reports, and admins can update any.
CREATE POLICY "Goals update policy" ON public.goals
  FOR UPDATE USING (
    auth.uid() = employee_id OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = public.goals.employee_id
        AND public.profiles.manager_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = auth.uid()
        AND public.profiles.role = 'admin'
    )
  );

-- Delete Goals:
-- Employees can delete their own goals, and admins can delete any.
CREATE POLICY "Goals delete policy" ON public.goals
  FOR DELETE USING (
    auth.uid() = employee_id OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = auth.uid()
        AND public.profiles.role = 'admin'
    )
  );


-- ────────────────────────────────────────────────────────────────────
-- 4. CHECK_INS TABLE POLICIES
-- ────────────────────────────────────────────────────────────────────
-- Drop existing policies on check-ins
DROP POLICY IF EXISTS "Check-ins select policy" ON public.check_ins;
DROP POLICY IF EXISTS "Check-ins insert policy" ON public.check_ins;
DROP POLICY IF EXISTS "Check-ins update policy" ON public.check_ins;
DROP POLICY IF EXISTS "Check-ins delete policy" ON public.check_ins;

-- Select Check-ins:
-- Employees can read check-ins for their own goals, managers can read check-ins for their team's goals, and admins can read all.
CREATE POLICY "Check-ins select policy" ON public.check_ins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.goals
      WHERE public.goals.id = public.check_ins.goal_id
        AND public.goals.employee_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.goals
      JOIN public.profiles ON public.profiles.id = public.goals.employee_id
      WHERE public.goals.id = public.check_ins.goal_id
        AND public.profiles.manager_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = auth.uid()
        AND public.profiles.role = 'admin'
    )
  );

-- Insert Check-ins:
-- Bypassed in normal flows by the SECURITY DEFINER DB trigger, but secured for manual/backup inserts.
CREATE POLICY "Check-ins insert policy" ON public.check_ins
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.goals
      WHERE public.goals.id = goal_id
        AND (
          public.goals.employee_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = public.goals.employee_id
              AND public.profiles.manager_id = auth.uid()
          ) OR
          EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid()
              AND public.profiles.role = 'admin'
          )
        )
    )
  );

-- Update Check-ins:
-- Employees can update check-ins of their own goals, managers can update check-ins of direct reports' goals, and admins can update all.
CREATE POLICY "Check-ins update policy" ON public.check_ins
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.goals
      WHERE public.goals.id = public.check_ins.goal_id
        AND public.goals.employee_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.goals
      JOIN public.profiles ON public.profiles.id = public.goals.employee_id
      WHERE public.goals.id = public.check_ins.goal_id
        AND public.profiles.manager_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = auth.uid()
        AND public.profiles.role = 'admin'
    )
  );

-- Delete Check-ins:
-- Only admins can delete.
CREATE POLICY "Check-ins delete policy" ON public.check_ins
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = auth.uid()
        AND public.profiles.role = 'admin'
    )
  );


-- ────────────────────────────────────────────────────────────────────
-- 5. AUDIT_LOGS TABLE POLICIES (IMMUTABLE FOR ENTERPRISE INTEGRITY)
-- ────────────────────────────────────────────────────────────────────
-- Drop existing policies on audit logs
DROP POLICY IF EXISTS "Audit logs are viewable by admins" ON public.audit_logs;
DROP POLICY IF EXISTS "Audit logs can be inserted by authenticated users" ON public.audit_logs;
DROP POLICY IF EXISTS "Audit logs select policy" ON public.audit_logs;
DROP POLICY IF EXISTS "Audit logs insert policy" ON public.audit_logs;

-- All authenticated users can view audit logs (required for the dashboard real-time Activity Intelligence Feed)
CREATE POLICY "Audit logs select policy" ON public.audit_logs
  FOR SELECT USING (auth.role() = 'authenticated');

-- All authenticated users can insert audit logs (when creating/modifying/approving goals)
CREATE POLICY "Audit logs insert policy" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- NO UPDATE OR DELETE policies are created to guarantee that audit logs remain immutable and cannot be tampered with.
