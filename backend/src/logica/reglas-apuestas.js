// Reglas del negocio de las apuestas. Funciones puras: reciben valores y
// devuelven valores, sin red, sin base de datos y sin HTTP.
//
// Convención de nombres:
//   - calcularX(...) devuelve un número.
//   - validarX(...) devuelve null si todo está bien, o un mensaje de error claro.
const {
  MONTO_MINIMO,
  MONTO_MAXIMO,
  DECIMALES_DINERO,
  DECIMALES_CUOTA,
  MAXIMO_SELECCIONES,
} = require('../config/constantes');
const { esUuid } = require('./validaciones');

const redondear = (valor, decimales) => Number(valor.toFixed(decimales));

// La cuota total de una combinada es el producto de las cuotas. Con una lista
// vacía devuelve 1 (el neutro del producto). Se redondea para quitar el ruido
// de decimales de JavaScript (1.1 * 1.1 = 1.2100000000000002).
function calcularCuotaTotal(cuotas) {
  const producto = cuotas.reduce((total, cuota) => total * cuota, 1);
  return redondear(producto, DECIMALES_CUOTA);
}

// Pago total si se gana (incluye lo apostado), igual que muestra el front.
function calcularGananciaPotencial(monto, cuotaTotal) {
  return redondear(monto * cuotaTotal, DECIMALES_DINERO);
}

function validarMonto(monto) {
  if (typeof monto !== 'number' || !Number.isFinite(monto)) return 'monto debe ser un número';
  if (monto < MONTO_MINIMO) return `monto debe ser al menos ${MONTO_MINIMO}`;
  if (monto > MONTO_MAXIMO) return `monto no puede superar ${MONTO_MAXIMO}`;
  if (redondear(monto, DECIMALES_DINERO) !== monto) {
    return `monto admite máximo ${DECIMALES_DINERO} decimales`;
  }
  return null;
}

function validarSelecciones(selecciones) {
  if (!Array.isArray(selecciones) || selecciones.length === 0) {
    return 'selecciones debe ser un arreglo con al menos una cuota';
  }
  if (selecciones.length > MAXIMO_SELECCIONES) {
    return `selecciones admite máximo ${MAXIMO_SELECCIONES} cuotas`;
  }

  const ids = selecciones.map((s) => s?.cuotaId);
  if (!ids.every(esUuid)) return 'cada selección debe traer un cuotaId válido';
  if (new Set(ids).size !== ids.length) return 'no se puede repetir la misma cuota';

  return null;
}

// Valida el cuerpo completo de una apuesta: { monto, selecciones }.
function validarApuesta({ monto, selecciones } = {}) {
  return validarMonto(monto) || validarSelecciones(selecciones);
}

module.exports = {
  calcularCuotaTotal,
  calcularGananciaPotencial,
  validarMonto,
  validarSelecciones,
  validarApuesta,
};
