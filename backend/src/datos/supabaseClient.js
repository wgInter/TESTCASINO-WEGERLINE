const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el archivo .env');
}

// OJO: esta es la service_role key. Tiene permisos totales y salta las
// políticas de RLS. NUNCA debe usarse en el frontend, solo aquí en el backend.
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Cliente que actúa COMO el usuario (con su token), con la publishable key.
// Solo para funciones SQL que identifican al jugador con auth.uid() en vez de
// recibir su id por parámetro (es el caso de ruleta_spin).
function clienteDeUsuario(token) {
  const clavePublica = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!clavePublica) throw new Error('Falta SUPABASE_PUBLISHABLE_KEY en el .env del back');

  return createClient(SUPABASE_URL, clavePublica, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

module.exports = { supabaseAdmin, clienteDeUsuario };
