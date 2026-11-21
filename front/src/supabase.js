import { createClient } from '@supabase/supabase-js';

// La URL y la anon key son públicas por diseño: la seguridad real la da RLS en Supabase.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
