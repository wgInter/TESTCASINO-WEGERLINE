// Reglas de usuarios y saldo. Funciones puras, sin HTTP.
// validarX devuelve null si todo está bien, o un mensaje de error claro.
const {
  NOMBRE_USUARIO_MAXIMO,
  TIPOS_AJUSTE_SALDO,
  TIPO_AJUSTE_RETIRO,
} = require('../config/constantes');
const { esUuid } = require('./validaciones');
const { validarMonto } = require('./reglas-apuestas');

function validarNombreUsuario(nombre) {
  if (typeof nombre !== 'string') return 'nombreUsuario debe ser texto';
  const limpio = nombre.trim();
  if (limpio.length === 0) return 'nombreUsuario no puede estar vacío';
  if (limpio.length > NOMBRE_USUARIO_MAXIMO) {
    return `nombreUsuario admite máximo ${NOMBRE_USUARIO_MAXIMO} caracteres`;
  }
  return null;
}

function validarAjusteSaldo({ usuarioId, monto, tipo } = {}) {
  if (!esUuid(usuarioId)) return 'usuarioId inválido';
  if (!TIPOS_AJUSTE_SALDO.includes(tipo)) {
    return `tipo debe ser ${TIPOS_AJUSTE_SALDO.join(' o ')}`;
  }
  return validarMonto(monto);
}

// Un retiro resta del saldo; un depósito suma.
function aplicarSignoAjuste(monto, tipo) {
  return tipo === TIPO_AJUSTE_RETIRO ? -Math.abs(monto) : Math.abs(monto);
}

module.exports = { validarNombreUsuario, validarAjusteSaldo, aplicarSignoAjuste };
