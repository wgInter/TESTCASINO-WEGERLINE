import { useEffect, useState } from 'react';
import { cotizarApuesta } from '../../api';

// Espera a que el usuario deje de escribir antes de pedir la cotización al back.
export const ESPERA_COTIZACION_MS = 300;

export function useCotizacion(selecciones, monto) {
  const [datos, setDatos] = useState(null); // { cuotaTotal, gananciaPotencial }
  const [error, setError] = useState(null);
  const clave = selecciones.map((s) => s.cuotaId).join(',');

  useEffect(() => {
    if (selecciones.length === 0) { setDatos(null); setError(null); return undefined; }

    let cancelado = false;
    const espera = setTimeout(() => {
      cotizarApuesta(monto, selecciones)
        .then((r) => { if (!cancelado) { setDatos(r); setError(null); } })
        .catch((e) => { if (!cancelado) { setDatos(null); setError(e.message); } });
    }, ESPERA_COTIZACION_MS);

    return () => { cancelado = true; clearTimeout(espera); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, monto]);

  return { datos, error };
}
