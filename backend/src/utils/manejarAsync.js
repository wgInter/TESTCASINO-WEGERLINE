const { HTTP } = require('../config/constantes');
const { responderError } = require('./responder');

// Envuelve un handler async: si algo falla, responde con el error en vez de
// repetir un try/catch idéntico en cada ruta (antes estaba copiado ~12 veces).
// Un error puede traer su propio codigoHttp (por ejemplo 502 si falló The Odds API).
function manejarAsync(handler) {
  return async (req, res, siguiente) => {
    try {
      await handler(req, res, siguiente);
    } catch (error) {
      console.error(error);
      responderError(res, error.codigoHttp || HTTP.ERROR_SERVIDOR, error.message || 'Error interno');
    }
  };
}

module.exports = { manejarAsync };
