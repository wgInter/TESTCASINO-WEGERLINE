// Reglas de validación puras: reciben valores, devuelven true/false.
// Esta capa no sabe que existe HTTP.
const { DIAS_MAXIMOS_SCORES, MARCADOR_MAXIMO } = require('../config/constantes');

const LONGITUD_MAXIMA_CLAVE = 60;
const PATRON_CLAVE_DEPORTE = /^[a-z0-9_]+$/;
const PATRON_OPCION_ODDS = /^[a-z0-9_,]+$/;

function esSportKeyValido(valor) {
  return (
    typeof valor === 'string' &&
    valor.length <= LONGITUD_MAXIMA_CLAVE &&
    PATRON_CLAVE_DEPORTE.test(valor)
  );
}

// region, markets y oddsFormat son opcionales, pero si llegan deben tener forma válida.
function opcionesOddsValidas({ region, markets, oddsFormat } = {}) {
  return [region, markets, oddsFormat].every(
    (v) => v === undefined || (typeof v === 'string' && PATRON_OPCION_ODDS.test(v))
  );
}

// daysFrom es opcional; si llega debe ser un entero entre 1 y DIAS_MAXIMOS_SCORES.
function diasAtrasValido(valor) {
  if (valor === undefined) return true;
  const n = Number(valor);
  return Number.isInteger(n) && n >= 1 && n <= DIAS_MAXIMOS_SCORES;
}

function esMarcadorValido(valor) {
  return Number.isInteger(valor) && valor >= 0 && valor <= MARCADOR_MAXIMO;
}

module.exports = { esSportKeyValido, opcionesOddsValidas, diasAtrasValido, esMarcadorValido };
