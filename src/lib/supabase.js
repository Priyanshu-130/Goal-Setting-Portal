import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://your-project-id.supabase.co') {
  console.warn('Supabase credentials missing or using placeholders. Running in Demo Mode.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const isLive = !!supabaseUrl && supabaseUrl !== 'https://your-project-id.supabase.co';
