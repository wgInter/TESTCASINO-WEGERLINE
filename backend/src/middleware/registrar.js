// Middleware: se ejecuta ANTES de todas las rutas, escrito una sola vez.
function registrar(req, _res, siguiente) {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  siguiente();
}

module.exports = { registrar };
