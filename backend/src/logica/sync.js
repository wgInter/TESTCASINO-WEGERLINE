// Orquesta la sincronización con The Odds API y la liquidación de apuestas.
// Habla con la red y la base mediante datos/, pero no conoce nada de HTTP.
const { oddsRequest } = require('../datos/oddsClient');
const eventos = require('../datos/eventosRepositorio');
const liquidacion = require('../datos/liquidacionRepositorio');
const {
  DEPORTES_ACTIVOS,
  TAMANO_LOTE_LIQUIDACION,
  ESTADOS_APUESTA,
  REGION_POR_DEFECTO,
  MERCADO_POR_DEFECTO,
  FORMATO_CUOTAS_POR_DEFECTO,
  DIAS_MAXIMOS_SCORES,
} = require('../config/constantes');
const {
  claveMercado,
  claveCuota,
  construirFilasEventos,
  detectarMercadosFaltantes,
  repartirCuotas,
  seleccionarResultadosPorActualizar,
  dividirEnLotes,
} = require('./transformar-odds');

// Trae eventos + cuotas reales de un deporte y los guarda en deportes,
// eventos, mercados y cuotas.
async function syncSport(
  sportKey,
  {
    region = REGION_POR_DEFECTO,
    markets = MERCADO_POR_DEFECTO,
    oddsFormat = FORMATO_CUOTAS_POR_DEFECTO,
  } = {}
) {
  const oddsEvents = await oddsRequest(`/sports/${sportKey}/odds`, {
    regions: region,
    markets,
    oddsFormat,
  });
  const deporte = await eventos.guardarDeporte(sportKey);
  const ahora = new Date().toISOString();

  // 1) todos los eventos del deporte en un solo viaje a la base
  if (oddsEvents.length > 0) {
    await eventos.guardarEventos(construirFilasEventos(oddsEvents, deporte.id, ahora));
  }
  const eventosCreados = oddsEvents.length;

  // 2) mercados que ya existen, y 3) los que faltan, creados en un solo lote
  const eventoIds = oddsEvents.map((ev) => ev.id);
  const mercadosExistentes = eventoIds.length > 0 ? await eventos.buscarMercados(eventoIds) : [];
  const mercadoMap = new Map(
    mercadosExistentes.map((m) => [claveMercado(m.evento_id, m.clave), m])
  );

  const mercadosPorCrear = detectarMercadosFaltantes(oddsEvents, mercadoMap);
  let mercadosCreados = 0;
  if (mercadosPorCrear.length > 0) {
    const nuevos = await eventos.insertarMercados(mercadosPorCrear);
    for (const m of nuevos) mercadoMap.set(claveMercado(m.evento_id, m.clave), m);
    mercadosCreados = nuevos.length;
  }

  // 4) cuotas que ya existen, y 5) separar las nuevas de las que solo cambian
  const mercadoIds = [...mercadoMap.values()].map((m) => m.id);
  const cuotasExistentes = mercadoIds.length > 0 ? await eventos.buscarCuotas(mercadoIds) : [];
  const cuotaMap = new Map(
    cuotasExistentes.map((c) => [claveCuota(c.mercado_id, c.casa_apuestas, c.nombre_seleccion), c])
  );

  const { porCrear, porActualizar } = repartirCuotas(oddsEvents, mercadoMap, cuotaMap, ahora);
  if (porCrear.length > 0) await eventos.insertarCuotas(porCrear);
  if (porActualizar.length > 0) await eventos.actualizarCuotas(porActualizar, ahora);

  return { eventosCreados, mercadosCreados, cuotasCreadas: porCrear.length };
}

// Trae marcadores finales de partidos ya jugados y finaliza esos eventos.
// diasAtras: cuántos días hacia atrás buscar (máximo DIAS_MAXIMOS_SCORES).
async function syncScores(sportKey, diasAtras = DIAS_MAXIMOS_SCORES) {
  const scores = await oddsRequest(`/sports/${sportKey}/scores`, { daysFrom: diasAtras });

  const completados = scores.filter((ev) => ev.completed);
  if (completados.length === 0) return { eventosActualizados: 0 };

  const estados = await eventos.buscarEstadosEventos(completados.map((ev) => ev.id));
  const estadoMap = new Map(estados.map((e) => [e.id, e.estado]));

  const actualizaciones = seleccionarResultadosPorActualizar(completados, estadoMap);
  await eventos.finalizarEventos(actualizaciones, new Date().toISOString());

  return { eventosActualizados: actualizaciones.length };
}

// Recorre las apuestas pendientes e intenta liquidarlas, en lotes pequeños
// para no saturar el pool de conexiones de Supabase.
async function settlePendingBets() {
  const pendientes = await liquidacion.listarIdsPendientes();

  let liquidadas = 0;
  let siguenPendientes = 0;
  let errores = 0;

  for (const lote of dividirEnLotes(pendientes, TAMANO_LOTE_LIQUIDACION)) {
    const resultados = await Promise.allSettled(
      lote.map((apuesta) => liquidacion.liquidarApuesta(apuesta.id))
    );
    for (const r of resultados) {
      if (r.status === 'fulfilled' && !r.value.error) {
        const apuesta = r.value.data;
        if (apuesta && apuesta.estado !== ESTADOS_APUESTA.PENDIENTE) liquidadas++;
        else siguenPendientes++;
      } else {
        console.error('Error liquidando apuesta:', r.status === 'fulfilled' ? r.value.error : r.reason);
        errores++;
      }
    }
  }

  return { totalPendientesRevisadas: pendientes.length, liquidadas, siguenPendientes, errores };
}

// Corre una tarea para todos los deportes activos EN PARALELO y junta los
// resultados por deporte. Si uno falla, los demás siguen. Antes esta lógica
// estaba copiada en syncAllSports y en settleAllSports.
async function paraTodosLosDeportes(tarea) {
  const resultados = {};
  const terminadas = await Promise.allSettled(DEPORTES_ACTIVOS.map((sportKey) => tarea(sportKey)));
  terminadas.forEach((r, i) => {
    const sportKey = DEPORTES_ACTIVOS[i];
    if (r.status === 'fulfilled') {
      resultados[sportKey] = r.value;
    } else {
      console.error(`Error con ${sportKey}:`, r.reason?.message || r.reason);
      resultados[sportKey] = { error: r.reason?.message || String(r.reason) };
    }
  });
  return resultados;
}

const syncAllSports = () => paraTodosLosDeportes((sportKey) => syncSport(sportKey));

async function settleAllSports() {
  const scoresPorDeporte = await paraTodosLosDeportes((sportKey) => syncScores(sportKey));
  const liquidacionResultado = await settlePendingBets();
  return { scoresPorDeporte, ...liquidacionResultado };
}

module.exports = {
  syncSport,
  syncScores,
  settlePendingBets,
  syncAllSports,
  settleAllSports,
};
