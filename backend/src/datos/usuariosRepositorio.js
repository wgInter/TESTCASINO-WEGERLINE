const { supabaseAdmin } = require('./supabaseClient');
const { resolver, llamarFuncion } = require('./consultas');
const { LIMITE_HISTORIAL } = require('../config/constantes');

const COLUMNAS_PERFIL = 'id, nombre_usuario, email, saldo, rol, estado, fecha_registro';

function obtenerPerfil(usuarioId) {
  return resolver(
    supabaseAdmin.from('usuarios').select(COLUMNAS_PERFIL).eq('id', usuarioId).single()
  );
}

function actualizarNombreUsuario(usuarioId, nombreUsuario) {
  return resolver(
    supabaseAdmin
      .from('usuarios')
      .update({ nombre_usuario: nombreUsuario })
      .eq('id', usuarioId)
      .select(COLUMNAS_PERFIL)
      .single()
  );
}

function listarTransacciones(usuarioId) {
  return resolver(
    supabaseAdmin
      .from('transacciones')
      .select('*')
      .eq('usuario_id', usuarioId)
      .order('creado_en', { ascending: false })
      .limit(LIMITE_HISTORIAL)
  );
}

// ajustar_saldo (SQL) aplica el movimiento y deja registro en transacciones.
function ajustarSaldo(usuarioId, montoConSigno, tipo) {
  return llamarFuncion('ajustar_saldo', {
    p_usuario_id: usuarioId,
    p_monto: montoConSigno,
    p_tipo: tipo,
  });
}

module.exports = { obtenerPerfil, actualizarNombreUsuario, listarTransacciones, ajustarSaldo };
