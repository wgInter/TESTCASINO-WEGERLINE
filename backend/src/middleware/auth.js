const { supabaseAdmin } = require('../datos/supabaseClient');
const { ROLES } = require('../config/constantes');
const { responderError } = require('../utils/responder');
const { HTTP } = require('../config/constantes');

// Espera un header: Authorization: Bearer <access_token de Supabase Auth>
// El frontend obtiene ese token al hacer login con supabase.auth.signInWithPassword(...)
async function requireAuth(req, res, siguiente) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return responderError(res, HTTP.NO_AUTENTICADO, 'Falta token de autenticación');
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data?.user) {
    return responderError(res, HTTP.NO_AUTENTICADO, 'Token inválido o expirado');
  }

  req.user = data.user; // { id, email, ... }
  req.token = token; // lo usan las rutas que llaman a Supabase como el usuario
  siguiente();
}

// Para endpoints de administración (liquidar apuestas, ajustar saldo manualmente)
async function requireAdmin(req, res, siguiente) {
  const { data: usuario, error } = await supabaseAdmin
    .from('usuarios')
    .select('rol')
    .eq('id', req.user.id)
    .single();

  if (error || usuario?.rol !== ROLES.ADMIN) {
    return responderError(res, HTTP.PROHIBIDO, 'Se requieren permisos de administrador');
  }

  siguiente();
}

module.exports = { requireAuth, requireAdmin };
