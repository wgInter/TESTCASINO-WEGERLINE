const { supabaseAdmin } = require('./supabaseClient');
const { resolver, llamarFuncion } = require('./consultas');

// NUNCA se consulta blackjack_mazos: el mazo y la carta oculta del dealer no
// deben salir del servidor.
async function obtenerMesaPublica() {
  const mesa = await resolver(
    supabaseAdmin
      .from('mesas_blackjack')
      .select('id, nombre, estado, cartas_dealer, dealer_carta_oculta, turno_asiento, turno_expira_en, fase_expira_en')
      .limit(1)
      .single()
  );

  const asientos = await resolver(
    supabaseAdmin
      .from('blackjack_asientos')
      .select('asiento, usuario_id, nombre_usuario, apuesta, cartas, estado, resultado, ganancia')
      .eq('mesa_id', mesa.id)
      .order('asiento', { ascending: true })
  );

  return { mesa, asientos };
}

// Avanza la fase de la mesa si el tiempo ya venció.
function avanzarReloj(mesaId) {
  return llamarFuncion('bj_tick', { p_mesa_id: mesaId });
}

async function sentarse(mesaId, usuarioId, asiento) {
  const usuario = await resolver(
    supabaseAdmin.from('usuarios').select('nombre_usuario, email').eq('id', usuarioId).single()
  );

  return llamarFuncion('bj_sentarse', {
    p_mesa_id: mesaId,
    p_usuario_id: usuarioId,
    p_asiento: asiento,
    p_nombre_usuario: usuario.nombre_usuario || usuario.email,
  });
}

const pararse = (mesaId, usuarioId) =>
  llamarFuncion('bj_pararse', { p_mesa_id: mesaId, p_usuario_id: usuarioId });

const apostar = (mesaId, usuarioId, monto) =>
  llamarFuncion('bj_apostar', { p_mesa_id: mesaId, p_usuario_id: usuarioId, p_monto: monto });

const pedirCarta = (mesaId, usuarioId) =>
  llamarFuncion('bj_pedir_carta', { p_mesa_id: mesaId, p_usuario_id: usuarioId });

const plantarse = (mesaId, usuarioId) =>
  llamarFuncion('bj_plantarse', { p_mesa_id: mesaId, p_usuario_id: usuarioId });

module.exports = {
  obtenerMesaPublica,
  avanzarReloj,
  sentarse,
  pararse,
  apostar,
  pedirCarta,
  plantarse,
};
