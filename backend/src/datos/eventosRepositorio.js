const { supabaseAdmin } = require('./supabaseClient');
const { ESTADOS_EVENTO } = require('../config/constantes');

// Todas las consultas a Supabase de eventos/mercados/cuotas viven aquí.
// Si algo falla, lanza el error; quien llama decide qué responder.
async function resolver(consulta) {
  const { data, error } = await consulta;
  if (error) throw error;
  return data;
}

// Se usa deportes!inner(...) y no deportes(...): con el join normal,
// .eq('deportes.clave', ...) filtra el objeto anidado pero NO las filas de
// eventos. Con !inner el filtro sí restringe los eventos devueltos.
function listarEventosActivos(sportKey) {
  let consulta = supabaseAdmin
    .from('eventos')
    .select(`
      id, equipo_local, equipo_visitante, fecha_inicio, estado,
      marcador_local, marcador_visitante,
      deportes!inner ( clave, nombre ),
      mercados (
        id, clave, descripcion,
        cuotas ( id, casa_apuestas, nombre_seleccion, valor, actualizado_en )
      )
    `)
    .in('estado', [ESTADOS_EVENTO.PROGRAMADO, ESTADOS_EVENTO.EN_VIVO])
    .order('fecha_inicio', { ascending: true });

  if (sportKey) consulta = consulta.eq('deportes.clave', sportKey);
  return resolver(consulta);
}

function guardarDeporte(sportKey) {
  return resolver(
    supabaseAdmin
      .from('deportes')
      .upsert({ clave: sportKey, nombre: sportKey }, { onConflict: 'clave' })
      .select()
      .single()
  );
}

function guardarEventos(filas) {
  return resolver(supabaseAdmin.from('eventos').upsert(filas, { onConflict: 'id' }));
}

async function buscarMercados(eventoIds) {
  return (await resolver(
    supabaseAdmin.from('mercados').select('id, evento_id, clave').in('evento_id', eventoIds)
  )) || [];
}

function insertarMercados(filas) {
  return resolver(supabaseAdmin.from('mercados').insert(filas).select('id, evento_id, clave'));
}

async function buscarCuotas(mercadoIds) {
  return (await resolver(
    supabaseAdmin
      .from('cuotas')
      .select('id, mercado_id, casa_apuestas, nombre_seleccion')
      .in('mercado_id', mercadoIds)
  )) || [];
}

function insertarCuotas(filas) {
  return resolver(supabaseAdmin.from('cuotas').insert(filas));
}

// Cada cuota lleva un valor distinto, así que hace falta una llamada por fila;
// se disparan todas en paralelo.
function actualizarCuotas(cuotas, ahora) {
  return Promise.all(
    cuotas.map((c) =>
      resolver(
        supabaseAdmin.from('cuotas').update({ valor: c.valor, actualizado_en: ahora }).eq('id', c.id)
      )
    )
  );
}

async function buscarEstadosEventos(ids) {
  return (await resolver(supabaseAdmin.from('eventos').select('id, estado').in('id', ids))) || [];
}

function finalizarEventos(actualizaciones, ahora) {
  return Promise.all(
    actualizaciones.map((u) =>
      resolver(
        supabaseAdmin
          .from('eventos')
          .update({
            marcador_local: u.marcador_local,
            marcador_visitante: u.marcador_visitante,
            estado: ESTADOS_EVENTO.FINALIZADO,
            actualizado_en: ahora,
          })
          .eq('id', u.id)
      )
    )
  );
}

function cargarResultadoManual(id, marcadorLocal, marcadorVisitante) {
  return resolver(
    supabaseAdmin
      .from('eventos')
      .update({
        marcador_local: marcadorLocal,
        marcador_visitante: marcadorVisitante,
        estado: ESTADOS_EVENTO.FINALIZADO,
        actualizado_en: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
  );
}

module.exports = {
  listarEventosActivos,
  guardarDeporte,
  guardarEventos,
  buscarMercados,
  insertarMercados,
  buscarCuotas,
  insertarCuotas,
  actualizarCuotas,
  buscarEstadosEventos,
  finalizarEventos,
  cargarResultadoManual,
};
