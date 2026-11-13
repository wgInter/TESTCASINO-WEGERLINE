const { supabaseAdmin } = require('./supabaseClient');
const { HTTP } = require('../config/constantes');

// Helpers compartidos por todos los repositorios (antes cada uno repetía el suyo).

// Ejecuta una consulta de Supabase y devuelve los datos. Si falla, lanza el
// error (llega a manejarAsync, que responde 500).
async function resolver(consulta) {
  const { data, error } = await consulta;
  if (error) throw error;
  return data;
}

// Llama a una función SQL de Supabase (colocar_apuesta, bj_apostar, ...). Esas
// funciones validan reglas de negocio (saldo insuficiente, no es tu turno...),
// así que un error aquí es culpa de la petición: responde 400 con su mensaje.
// `cliente` permite llamarla con el cliente de un usuario (ver ruleta).
async function llamarFuncion(nombre, parametros, cliente = supabaseAdmin) {
  const { data, error } = await cliente.rpc(nombre, parametros);
  if (error) {
    const fallo = new Error(error.message);
    fallo.codigoHttp = HTTP.PETICION_INVALIDA;
    throw fallo;
  }
  return data;
}

module.exports = { resolver, llamarFuncion };
