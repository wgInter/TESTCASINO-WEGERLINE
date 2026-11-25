// ÚNICO lugar donde el front habla con el back. La dirección sale de una
// variable de entorno (.env.development / .env.production), nunca de los componentes.
import { armarCuerpoApuesta } from './logica/cuotas';

const BASE = import.meta.env.VITE_API_URL;

async function pedir(ruta, { token, metodo = 'GET', cuerpo } = {}) {
  const respuesta = await fetch(`${BASE}${ruta}`, {
    method: metodo,
    headers: {
      ...(cuerpo ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });

  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) throw new Error(datos?.error || `Error ${respuesta.status}`);
  return datos;
}

// Eventos y apuestas
export const obtenerEventos = (sportKey) =>
  pedir(`/api/eventos${sportKey ? `?sportKey=${encodeURIComponent(sportKey)}` : ''}`);
export const obtenerApostadores = (ids) =>
  pedir(`/api/eventos/apostadores?ids=${encodeURIComponent(ids.join(','))}`);
export const obtenerApuestas = (token) => pedir('/api/apuestas', { token });

// La cuota total y la ganancia las calcula SOLO el back (DRY: la regla vive en un lugar).
export const cotizarApuesta = (monto, selecciones) =>
  pedir('/api/apuestas/cotizar', { metodo: 'POST', cuerpo: armarCuerpoApuesta(selecciones, monto) });
export const colocarApuesta = (token, monto, selecciones) =>
  pedir('/api/apuestas', { token, metodo: 'POST', cuerpo: armarCuerpoApuesta(selecciones, monto) });

// Usuario
export const obtenerPerfil = (token) => pedir('/api/usuarios/me', { token });
export const actualizarNombre = (token, nombreUsuario) =>
  pedir('/api/usuarios/me', { token, metodo: 'PATCH', cuerpo: { nombreUsuario } });
export const obtenerTransacciones = (token) => pedir('/api/transacciones', { token });

// Casino
export const girarTragamonedas = (token, monto) =>
  pedir('/api/casino/slot/spin', { token, metodo: 'POST', cuerpo: { monto } });
export const girarRuleta = (token, apuestas) =>
  pedir('/api/casino/ruleta/spin', { token, metodo: 'POST', cuerpo: { apuestas } });
export const obtenerMesaBlackjack = () => pedir('/api/blackjack/mesa');
export const tickBlackjack = (mesaId) =>
  pedir('/api/blackjack/tick', { metodo: 'POST', cuerpo: { mesaId } });
// accion: sentarse | apostar | pedir-carta | plantarse | pararse
export const accionBlackjack = (token, accion, mesaId, extra = {}) =>
  pedir(`/api/blackjack/${accion}`, { token, metodo: 'POST', cuerpo: { mesaId, ...extra } });
