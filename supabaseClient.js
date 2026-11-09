const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️  Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el archivo .env');
}

// OJO: esta es la service_role key. Tiene permisos totales y salta las
// políticas de RLS. NUNCA debe usarse en el frontend, solo aquí en el backend.
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

module.exports = { supabaseAdmin };
