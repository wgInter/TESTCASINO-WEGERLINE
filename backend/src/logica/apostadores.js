// Conteo de apostadores por evento. Funciones puras, sin HTTP.
const { MAXIMO_EVENTOS_APOSTADORES } = require('../config/constantes');
const { esIdentificadorValido } = require('./validaciones');

// Recibe las filas de apuesta_selecciones (con su apuesta y su evento) y
// devuelve { eventoId: cantidadDePersonasDistintas }. Todos los eventos pedidos
// aparecen en el resultado, con 0 si nadie ha apostado.
function contarApostadoresPorEvento(filas, eventoIds) {
  const porEvento = new Map(eventoIds.map((id) => [id, new Set()]));

  for (const fila of filas) {
    const eventoId = fila.cuotas?.mercados?.evento_id;
    const usuarioId = fila.apuestas?.usuario_id;
    if (usuarioId && porEvento.has(eventoId)) porEvento.get(eventoId).add(usuarioId);
  }

  return Object.fromEntries([...porEvento].map(([id, usuarios]) => [id, usuarios.size]));
}

// "a,b,c" -> ['a','b','c']. Devuelve null si el texto es inválido o trae
// demasiados ids.
function parsearIdsEventos(texto) {
  if (typeof texto !== 'string' || texto === '') return null;
  const ids = [...new Set(texto.split(','))];
  if (ids.length > MAXIMO_EVENTOS_APOSTADORES) return null;
  return ids.every(esIdentificadorValido) ? ids : null;
}

module.exports = { contarApostadoresPorEvento, parsearIdsEventos };
