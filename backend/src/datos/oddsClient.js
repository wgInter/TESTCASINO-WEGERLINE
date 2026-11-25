const fetch = require('node-fetch');
const { ODDS_API_URL, CACHE_TTL_MS, HTTP } = require('../config/constantes');

const cache = new Map();

// Pide datos a The Odds API. La API key se agrega aquí, una sola vez, y las
// respuestas se guardan en memoria CACHE_TTL_MS para no gastar cuota de más.
async function oddsRequest(ruta, query = {}) {
  const url = new URL(`${ODDS_API_URL}${ruta}`);
  url.searchParams.set('apiKey', process.env.ODDS_API_KEY);
  Object.entries(query).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== '') url.searchParams.set(clave, valor);
  });

  const clave = url.toString();
  const enCache = cache.get(clave);
  if (enCache && Date.now() - enCache.hora < CACHE_TTL_MS) return enCache.datos;

  const respuesta = await fetch(clave);

  if (!respuesta.ok) {
    const cuerpo = await respuesta.text();
    const error = new Error(`The Odds API ${respuesta.status}: ${cuerpo}`);
    error.codigoHttp = HTTP.PASARELA_FALLIDA;
    throw error;
  }

  const datos = await respuesta.json();
  cache.set(clave, { hora: Date.now(), datos });
  return datos;
}

module.exports = { oddsRequest };
