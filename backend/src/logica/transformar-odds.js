// Transformaciones puras de los datos de The Odds API. Sin red, sin base de
// datos ni HTTP: por eso se pueden probar con una sola línea.
const { ESTADOS_EVENTO } = require('../config/constantes');

const claveMercado = (eventoId, clave) => `${eventoId}|${clave}`;
const claveCuota = (mercadoId, casa, seleccion) => `${mercadoId}|${casa}|${seleccion}`;

function construirFilasEventos(oddsEvents, deporteId, ahora) {
  return oddsEvents.map((ev) => ({
    id: ev.id,
    deporte_id: deporteId,
    equipo_local: ev.home_team,
    equipo_visitante: ev.away_team,
    fecha_inicio: ev.commence_time,
    estado: ESTADOS_EVENTO.PROGRAMADO,
    actualizado_en: ahora,
  }));
}

// Devuelve los mercados que aparecen en la API pero todavía no existen en la
// base (mercadoMap: "eventoId|clave" -> mercado). Cada uno sale una sola vez.
function detectarMercadosFaltantes(oddsEvents, mercadoMap) {
  const faltantes = [];
  const vistas = new Set();
  for (const ev of oddsEvents) {
    for (const casa of ev.bookmakers || []) {
      for (const mkt of casa.markets || []) {
        const clave = claveMercado(ev.id, mkt.key);
        if (!mercadoMap.has(clave) && !vistas.has(clave)) {
          vistas.add(clave);
          faltantes.push({ evento_id: ev.id, clave: mkt.key, descripcion: mkt.key });
        }
      }
    }
  }
  return faltantes;
}

// Separa las cuotas en las que hay que insertar y las que solo cambian de valor.
function repartirCuotas(oddsEvents, mercadoMap, cuotaMap, ahora) {
  const porCrear = [];
  const porActualizar = [];

  for (const ev of oddsEvents) {
    for (const casa of ev.bookmakers || []) {
      for (const mkt of casa.markets || []) {
        const mercado = mercadoMap.get(claveMercado(ev.id, mkt.key));
        if (!mercado) continue;

        for (const resultado of mkt.outcomes || []) {
          const existente = cuotaMap.get(claveCuota(mercado.id, casa.title, resultado.name));
          if (existente) {
            porActualizar.push({ id: existente.id, valor: resultado.price });
          } else {
            porCrear.push({
              mercado_id: mercado.id,
              casa_apuestas: casa.title,
              nombre_seleccion: resultado.name,
              valor: resultado.price,
              actualizado_en: ahora,
            });
          }
        }
      }
    }
  }

  return { porCrear, porActualizar };
}

// Marcador final de un evento de /scores, o null si falta alguno de los dos
// equipos o el puntaje no es un número.
function extraerMarcador(ev) {
  if (!Array.isArray(ev.scores)) return null;
  const local = ev.scores.find((s) => s.name === ev.home_team);
  const visitante = ev.scores.find((s) => s.name === ev.away_team);
  if (!local || !visitante) return null;

  const marcadorLocal = parseInt(local.score, 10);
  const marcadorVisitante = parseInt(visitante.score, 10);
  if (Number.isNaN(marcadorLocal) || Number.isNaN(marcadorVisitante)) return null;

  return { marcador_local: marcadorLocal, marcador_visitante: marcadorVisitante };
}

// Partidos terminados con marcador válido, que existen en la base y todavía
// no están finalizados (estadoMap: id -> estado actual).
function seleccionarResultadosPorActualizar(scores, estadoMap) {
  return scores
    .filter((ev) => ev.completed && estadoMap.has(ev.id) && estadoMap.get(ev.id) !== ESTADOS_EVENTO.FINALIZADO)
    .map((ev) => ({ id: ev.id, marcador: extraerMarcador(ev) }))
    .filter((r) => r.marcador !== null)
    .map((r) => ({ id: r.id, ...r.marcador }));
}

function dividirEnLotes(lista, tamano) {
  const lotes = [];
  for (let i = 0; i < lista.length; i += tamano) {
    lotes.push(lista.slice(i, i + tamano));
  }
  return lotes;
}

module.exports = {
  claveMercado,
  claveCuota,
  construirFilasEventos,
  detectarMercadosFaltantes,
  repartirCuotas,
  extraerMarcador,
  seleccionarResultadosPorActualizar,
  dividirEnLotes,
};
