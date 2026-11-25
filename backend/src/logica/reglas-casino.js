// Reglas del casino. Funciones puras, sin HTTP.
// validarX devuelve null si todo está bien, o un mensaje de error claro.
//
// El resultado de los juegos (símbolos, cartas, número ganador) NO se decide
// aquí: lo decide la base de datos, para que el cliente no pueda manipularlo.
// Esta capa solo valida lo que el cliente envía.
const {
  MONTO_MAXIMO,
  BLACKJACK_ASIENTOS,
  RULETA_NUMERO_MAXIMO,
  RULETA_TIPO_NUMERO,
  RULETA_APUESTAS_EXTERNAS,
  RULETA_MAXIMO_APUESTAS,
} = require('../config/constantes');
const { validarMonto } = require('./reglas-apuestas');

function validarApuestaRuleta(apuesta) {
  if (!apuesta || typeof apuesta !== 'object') return 'cada apuesta debe ser un objeto';

  const errorMonto = validarMonto(apuesta.monto);
  if (errorMonto) return errorMonto;

  if (apuesta.tipo === RULETA_TIPO_NUMERO) {
    const valido =
      Number.isInteger(apuesta.valor) && apuesta.valor >= 0 && apuesta.valor <= RULETA_NUMERO_MAXIMO;
    return valido ? null : `valor debe ser un entero entre 0 y ${RULETA_NUMERO_MAXIMO}`;
  }

  return RULETA_APUESTAS_EXTERNAS.includes(apuesta.tipo) ? null : 'tipo de apuesta inválido';
}

function sumarApuestasRuleta(apuestas) {
  return apuestas.reduce((total, apuesta) => total + apuesta.monto, 0);
}

// Identifica la casilla de una apuesta: un número concreto ("numero:7") o una
// apuesta externa ("rojo"). Dos apuestas con la misma clave van a la misma casilla.
function claveCasilla(apuesta) {
  return apuesta.tipo === RULETA_TIPO_NUMERO ? `${apuesta.tipo}:${apuesta.valor}` : apuesta.tipo;
}

function validarApuestasRuleta(apuestas) {
  if (!Array.isArray(apuestas) || apuestas.length === 0) {
    return 'apuestas debe ser un arreglo con al menos una apuesta';
  }
  if (apuestas.length > RULETA_MAXIMO_APUESTAS) {
    return `apuestas admite máximo ${RULETA_MAXIMO_APUESTAS} casillas`;
  }

  for (const apuesta of apuestas) {
    const error = validarApuestaRuleta(apuesta);
    if (error) return error;
  }

  // Una apuesta por casilla (ver RULETA_MAXIMO_APUESTAS en constantes.js).
  const casillas = apuestas.map(claveCasilla);
  if (new Set(casillas).size !== casillas.length) {
    return 'no se puede apostar dos veces a la misma casilla';
  }

  if (sumarApuestasRuleta(apuestas) > MONTO_MAXIMO) {
    return `el total apostado no puede superar ${MONTO_MAXIMO}`;
  }
  return null;
}

function esAsientoValido(asiento) {
  return Number.isInteger(asiento) && asiento >= 1 && asiento <= BLACKJACK_ASIENTOS;
}

// El tick de blackjack es público, así que se limita: solo se procesa si pasó
// al menos `minimoMs` desde el último tick de esa mesa.
function debeProcesarTick(ultimaVezMs, ahoraMs, minimoMs) {
  return ultimaVezMs === undefined || ahoraMs - ultimaVezMs >= minimoMs;
}

// Guarda el último tick de una mesa sin dejar crecer el mapa. Si está lleno,
// borra solo la entrada más vieja (un Map conserva el orden de inserción), no
// todo el registro: así ids inventados no borran el límite de las mesas reales.
function registrarTick(mapa, mesaId, ahoraMs, maximo) {
  mapa.delete(mesaId); // la mesa actual pasa a ser la más reciente
  if (mapa.size >= maximo) mapa.delete(mapa.keys().next().value);
  mapa.set(mesaId, ahoraMs);
}

module.exports = {
  validarApuestasRuleta,
  sumarApuestasRuleta,
  esAsientoValido,
  debeProcesarTick,
  registrarTick,
};
