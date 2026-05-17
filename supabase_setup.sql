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

CREATE TABLE IF NOT EXISTS public.check_ins (
  goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE PRIMARY KEY,
  q1 JSONB DEFAULT '{"status": "pending", "value": ""}',
  q2 JSONB DEFAULT '{"status": "pending", "value": ""}',
  q3 JSONB DEFAULT '{"status": "pending", "value": ""}',
  q4 JSONB DEFAULT '{"status": "pending", "value": ""}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  actor TEXT NOT NULL,
  details TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles select policy" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Profiles insert policy" ON public.profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Profiles update policy" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Profiles delete policy" ON public.profiles
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

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

CREATE POLICY "Goals delete policy" ON public.goals
  FOR DELETE USING (
    auth.uid() = employee_id OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = auth.uid()
        AND public.profiles.role = 'admin'
    )
  );

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

CREATE POLICY "Check-ins delete policy" ON public.check_ins
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = auth.uid()
        AND public.profiles.role = 'admin'
    )
  );

CREATE POLICY "Audit logs select policy" ON public.audit_logs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Audit logs insert policy" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

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

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER on_goal_updated BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
