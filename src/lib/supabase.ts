import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client for the frontend (Browser / Client Components)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper for the server (Admin/Agent) to bypass RLS when publishing
export const getServiceSupabase = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error("Missing Service Role Key");
  return createClient(supabaseUrl, serviceKey);
};
