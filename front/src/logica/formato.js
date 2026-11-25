export function formatearDinero(valor) {
  return '$' + Number(valor || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 });
}

export function abreviar(nombre) {
  return String(nombre || '')
    .split(' ')
    .filter(Boolean)
    .map((palabra) => palabra[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();
}

export function formatearFecha(iso) {
  return new Intl.DateTimeFormat('es-CO', {
    weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}

export function formatearFechaLarga(iso) {
  return new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(iso));
}
