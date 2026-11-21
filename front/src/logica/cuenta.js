// Reglas de la cuenta de usuario. SIN React: se prueban con Vitest.
export const LONGITUD_MINIMA_CLAVE = 6;

export const ETIQUETAS_TRANSACCION = {
  deposito: 'Depósito',
  retiro: 'Retiro',
  apuesta_realizada: 'Apuesta realizada',
  pago_ganancia: 'Pago de ganancia',
  bono: 'Bono',
  ajuste: 'Ajuste',
};
export const etiquetaTransaccion = (tipo) => ETIQUETAS_TRANSACCION[tipo] ?? tipo;

export const ETIQUETAS_ESTADO_APUESTA = {
  pendiente: 'Pendiente', ganada: 'Ganada', perdida: 'Perdida', anulada: 'Anulada',
};
export const ETIQUETAS_RESULTADO_SELECCION = {
  pendiente: '—', ganada: '✔ Ganó', perdida: '✘ Perdió', anulada: 'Anulada',
};

export const FILTROS_APUESTAS = [
  { valor: 'todas', etiqueta: 'Todas' },
  { valor: 'pendiente', etiqueta: 'Pendientes' },
  { valor: 'ganada', etiqueta: 'Ganadas' },
  { valor: 'perdida', etiqueta: 'Perdidas' },
];

export function filtrarApuestas(apuestas, filtro) {
  return filtro === 'todas' ? apuestas : apuestas.filter((a) => a.estado === filtro);
}

// Devuelve un mensaje de error, o null si la contraseña es válida.
export function validarClave(clave) {
  if (!clave || clave.length < LONGITUD_MINIMA_CLAVE) {
    return `La contraseña debe tener al menos ${LONGITUD_MINIMA_CLAVE} caracteres.`;
  }
  return null;
}

export function nombreVisible(perfil) {
  return perfil?.nombre_usuario || perfil?.email?.split('@')[0] || 'Jugador';
}
