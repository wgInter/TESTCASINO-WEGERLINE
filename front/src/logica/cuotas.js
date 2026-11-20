// Reglas del front. SIN React: por eso se pueden probar con Vitest.
// La cuota total, la ganancia y el monto mínimo los decide SOLO el back
// (POST /api/apuestas/cotizar): el front no repite esas reglas.

// Valor inicial del campo "Monto" en el boleto (comodidad de la interfaz, no es una regla).
export const MONTO_INICIAL = 1000;

export const MERCADO_H2H = 'h2h';
export const ESTADO_EN_VIVO = 'en_vivo';
export const NOMBRE_EMPATE = 'Draw';

export const esEnVivo = (evento) => evento.estado === ESTADO_EN_VIVO;

export function obtenerMercadoH2H(evento) {
  return (evento.mercados || []).find((m) => m.clave === MERCADO_H2H);
}

export function buscarCuota(mercado, nombreSeleccion) {
  return mercado?.cuotas?.find((c) => c.nombre_seleccion === nombreSeleccion);
}

export function cuotasDeEvento(evento) {
  const mercado = obtenerMercadoH2H(evento);
  return {
    local: buscarCuota(mercado, evento.equipo_local),
    empate: buscarCuota(mercado, NOMBRE_EMPATE),
    visitante: buscarCuota(mercado, evento.equipo_visitante),
  };
}

// Click en una cuota: la agrega, la quita si ya estaba, o reemplaza la que
// hubiera elegido del mismo partido (una sola selección por evento).
export function alternarSeleccion(selecciones, nueva) {
  if (selecciones.some((s) => s.cuotaId === nueva.cuotaId)) {
    return selecciones.filter((s) => s.cuotaId !== nueva.cuotaId);
  }
  return [...selecciones.filter((s) => s.eventoId !== nueva.eventoId), nueva];
}

// Cuerpo que esperan /apuestas/cotizar y /apuestas: { monto, selecciones: [{ cuotaId }] }.
export function armarCuerpoApuesta(selecciones, monto) {
  return { monto: Number(monto), selecciones: selecciones.map((s) => ({ cuotaId: s.cuotaId })) };
}
