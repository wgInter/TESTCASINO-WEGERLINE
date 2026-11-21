import { obtenerEventos } from '../../api';
import { useDatos } from '../../hooks/useDatos';

export function useEventos(sportKey, intervaloMs = 0) {
  const { datos, cargando, error } = useDatos(
    () => obtenerEventos(sportKey), [sportKey], [], intervaloMs
  );
  return { eventos: datos ?? [], cargando, error };
}
