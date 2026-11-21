import { useEffect, useState } from 'react';

// Hook genérico: ejecuta una función async y maneja cargando / error.
// Si se pasa intervaloMs, vuelve a pedir los datos cada ese tiempo sin parpadear.
// Lo usan eventos, perfil, resumen, apuestas, movimientos (DRY: se escribe una sola vez).
export function useDatos(cargar, dependencias, inicial = null, intervaloMs = 0) {
  const [datos, setDatos] = useState(inicial);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelado = false;

    const ejecutar = (silencioso) => {
      if (!silencioso) { setCargando(true); setError(null); }
      return cargar()
        .then((resultado) => { if (!cancelado) { setDatos(resultado); setError(null); } })
        .catch((e) => { if (!cancelado && !silencioso) setError(e.message); })
        .finally(() => { if (!cancelado && !silencioso) setCargando(false); });
    };

    ejecutar(false);
    const id = intervaloMs > 0 ? setInterval(() => ejecutar(true), intervaloMs) : null;

    return () => { cancelado = true; if (id) clearInterval(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencias);

  return { datos, cargando, error };
}
