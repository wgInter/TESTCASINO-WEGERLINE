const { clienteDeUsuario } = require('./supabaseClient');
const { llamarFuncion } = require('./consultas');

// La lógica del juego (símbolos, pago) corre en la función SQL, nunca en el
// cliente, para que no se pueda manipular.
function girarTragamonedas(usuarioId, monto) {
  return llamarFuncion('jugar_tragamonedas', { p_usuario_id: usuarioId, p_monto: monto });
}

// ruleta_spin identifica al jugador con auth.uid(), por eso se llama con un
// cliente que lleva el token del usuario y no con el de service role.
function girarRuleta(token, apuestas) {
  return llamarFuncion('ruleta_spin', { p_apuestas: apuestas }, clienteDeUsuario(token));
}

module.exports = { girarTragamonedas, girarRuleta };
