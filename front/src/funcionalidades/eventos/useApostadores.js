import { obtenerApostadores } from '../../api';
import { useDatos } from '../../hooks/useDatos';

// { eventoId: cantidad de personas distintas que apostaron }. Si falla, no se muestra error
// (igual que el index.html original): simplemente aparece 0.
export function useApostadores(eventos) {
  const ids = eventos.map((e) => e.id);
  const { datos } = useDatos(
    () => (ids.length ? obtenerApostadores(ids) : Promise.resolve({})),
    [ids.join(',')],
    {}
  );
  return datos ?? {};
}
