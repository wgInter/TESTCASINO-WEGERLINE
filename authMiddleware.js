const { supabaseAdmin } = require('./supabaseClient');

// Espera un header: Authorization: Bearer <access_token de Supabase Auth>
// El frontend obtiene ese token al hacer login con supabase.auth.signInWithPassword(...)
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Falta token de autenticación' });
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data?.user) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }

  req.user = data.user; // { id, email, ... }
  next();
}

// Para endpoints de administración (liquidar apuestas, ajustar saldo manualmente)
async function requireAdmin(req, res, next) {
  const { data: usuario, error } = await supabaseAdmin
    .from('usuarios')
    .select('rol')
    .eq('id', req.user.id)
    .single();

  if (error || usuario?.rol !== 'admin') {
    return res.status(403).json({ error: 'Se requieren permisos de administrador' });
  }

  next();
}

module.exports = { requireAuth, requireAdmin };
