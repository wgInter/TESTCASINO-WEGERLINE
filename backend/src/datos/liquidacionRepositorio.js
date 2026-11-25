const { supabaseAdmin } = require('./supabaseClient');
const { ESTADOS_APUESTA } = require('../config/constantes');

async function listarIdsPendientes() {
  const { data, error } = await supabaseAdmin
    .from('apuestas')
    .select('id')
    .eq('estado', ESTADOS_APUESTA.PENDIENTE);
  if (error) throw error;
  return data || [];
}

// liquidar_apuesta() en Supabase es segura de llamar aunque el partido no haya
// terminado: no hace nada y devuelve la apuesta sin cambios. Devuelve {data, error}
// tal cual porque quien liquida en lote necesita contar errores sin cortar el lote.
function liquidarApuesta(apuestaId) {
  return supabaseAdmin.rpc('liquidar_apuesta', { p_apuesta_id: apuestaId });
}

module.exports = { listarIdsPendientes, liquidarApuesta };
