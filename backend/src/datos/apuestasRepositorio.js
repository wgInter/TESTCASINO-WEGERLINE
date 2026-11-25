const { supabaseAdmin } = require('./supabaseClient');
const { resolver, llamarFuncion } = require('./consultas');
const { ESTADOS_APUESTA, LIMITE_HISTORIAL } = require('../config/constantes');

// Valores de las cuotas pedidas. Solo devuelve las que existen: quien llama
// compara cantidades para detectar ids inexistentes.
async function buscarCuotasPorIds(ids) {
  return (await resolver(supabaseAdmin.from('cuotas').select('id, valor').in('id', ids))) || [];
}

// colocar_apuesta (SQL) valida el saldo, congela las cuotas y descuenta el monto.
function colocarApuesta(usuarioId, monto, cuotaIds) {
  return llamarFuncion('colocar_apuesta', {
    p_usuario_id: usuarioId,
    p_monto: monto,
    p_selecciones: cuotaIds.map((id) => ({ cuota_id: id })),
  });
}

function listarApuestasDeUsuario(usuarioId) {
  return resolver(
    supabaseAdmin
      .from('apuestas')
      .select(`
        id, tipo, monto, cuota_total, ganancia_potencial, estado, creado_en, resuelto_en,
        apuesta_selecciones (
          id, valor_cuota_congelado, resultado,
          cuotas ( nombre_seleccion, mercados ( clave, eventos ( equipo_local, equipo_visitante ) ) )
        )
      `)
      .eq('usuario_id', usuarioId)
      .order('creado_en', { ascending: false })
      .limit(LIMITE_HISTORIAL)
  );
}

function listarPendientes() {
  return resolver(
    supabaseAdmin
      .from('apuestas')
      .select('*')
      .eq('estado', ESTADOS_APUESTA.PENDIENTE)
      .order('creado_en', { ascending: true })
  );
}

function liquidarUna(apuestaId) {
  return llamarFuncion('liquidar_apuesta', { p_apuesta_id: apuestaId });
}

// Selecciones que apuntan a los eventos pedidos, con quién apostó en cada una.
// cuotas!inner / mercados!inner hacen que el filtro por evento sí recorte las filas.
function listarSeleccionesDeEventos(eventoIds) {
  return resolver(
    supabaseAdmin
      .from('apuesta_selecciones')
      .select('apuestas ( usuario_id ), cuotas!inner ( mercados!inner ( evento_id ) )')
      .in('cuotas.mercados.evento_id', eventoIds)
  );
}

module.exports = {
  buscarCuotasPorIds,
  colocarApuesta,
  listarApuestasDeUsuario,
  listarPendientes,
  liquidarUna,
  listarSeleccionesDeEventos,
};
