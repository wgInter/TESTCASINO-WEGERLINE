const { HTTP } = require('../config/constantes');
const { responderError } = require('../utils/responder');

// Antes esta verificación estaba copiada en 4 rutas /api/cron/*.
// Ahora se escribe una sola vez y se monta como middleware.
function requireCronSecret(req, res, siguiente) {
  const secreto = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization || '';

  if (!secreto || authHeader !== `Bearer ${secreto}`) {
    return responderError(res, HTTP.NO_AUTENTICADO, 'No autorizado');
  }

  siguiente();
}

module.exports = { requireCronSecret };
