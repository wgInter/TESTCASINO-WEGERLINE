const { HTTP } = require('../config/constantes');

// Una sola función para responder: el formato de éxito y de error
// se define aquí y no se repite en cada ruta.
function responder(res, codigo, datos) {
  return res.status(codigo).json(datos);
}

function responderError(res, codigo, mensaje) {
  return responder(res, codigo, { error: mensaje });
}

// Atajos de uso frecuente.
const ok = (res, datos) => responder(res, HTTP.OK, datos);
const creado = (res, datos) => responder(res, HTTP.CREADO, datos);
const peticionInvalida = (res, mensaje) => responderError(res, HTTP.PETICION_INVALIDA, mensaje);
const errorServidor = (res, mensaje) => responderError(res, HTTP.ERROR_SERVIDOR, mensaje);
const pasarelaFallida = (res, mensaje) => responderError(res, HTTP.PASARELA_FALLIDA, mensaje);

module.exports = {
  responder,
  responderError,
  ok,
  creado,
  peticionInvalida,
  errorServidor,
  pasarelaFallida,
};
