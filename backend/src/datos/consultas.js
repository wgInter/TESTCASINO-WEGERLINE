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

// Código que Postgres da a los RAISE EXCEPTION de nuestras funciones SQL.
const ERROR_NEGOCIO_SQL = 'P0001';

// Llama a una función SQL de Supabase (colocar_apuesta, bj_apostar, ...).
// - Error de negocio (saldo insuficiente, no es tu turno...): es culpa de la
//   petición, responde 400 con el mensaje de la función.
// - Cualquier otro error (base caída, función rota...): es nuestro, se registra
//   en el servidor y responde 500 con un mensaje genérico, sin detalles internos.
// `cliente` permite llamarla con el cliente de un usuario (ver ruleta).
async function llamarFuncion(nombre, parametros, cliente = supabaseAdmin) {
  const { data, error } = await cliente.rpc(nombre, parametros);
  if (!error) return data;

  if (error.code === ERROR_NEGOCIO_SQL) {
    const fallo = new Error(error.message);
    fallo.codigoHttp = HTTP.PETICION_INVALIDA;
    throw fallo;
  }

  console.error(`rpc ${nombre} falló:`, error);
  throw new Error('Error interno del servidor');
}

module.exports = { resolver, llamarFuncion };
