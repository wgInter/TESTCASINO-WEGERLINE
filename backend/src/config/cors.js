const cors = require('cors');

// CORS restringido: en la entrega SOLO puede consumir la API el front
// publicado en S3. El origen se lee de CORS_ORIGIN (.env), no se escribe aquí.
// Si hay varios (por ejemplo S3 + localhost en desarrollo), se separan con comas.
function crearCors() {
  const origenes = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  if (origenes.length === 0) {
    console.warn('Falta CORS_ORIGIN en .env: el navegador bloqueará las peticiones del front');
    return cors({ origin: false });
  }

  return cors({ origin: origenes });
}

module.exports = { crearCors };
