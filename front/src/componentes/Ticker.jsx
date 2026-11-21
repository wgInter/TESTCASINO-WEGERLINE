import { useEventos } from '../funcionalidades/eventos/useEventos';
import { emojiDeporte, INTERVALO_REFRESCO_MS } from '../funcionalidades/eventos/deportes';
import { cuotasDeEvento, obtenerMercadoH2H } from '../logica/cuotas';
import { abreviar } from '../logica/formato';

const fmt = (cuota) => (cuota ? Number(cuota.valor).toFixed(2) : '-');

// Cinta de cuotas de todos los deportes. La lista se pinta dos veces para que el
// desplazamiento sea continuo (igual que el index.html original).
export default function Ticker() {
  const { eventos } = useEventos(undefined, INTERVALO_REFRESCO_MS);
  const conMercado = eventos.filter((e) => obtenerMercadoH2H(e));

  const items = (sufijo) =>
    conMercado.map((e) => {
      const c = cuotasDeEvento(e);
      return (
        <div className="tick-item" key={`${e.id}-${sufijo}`}>
          {emojiDeporte(e.deportes?.clave)} <b>{abreviar(e.equipo_local)}</b> vs <b>{abreviar(e.equipo_visitante)}</b>{' '}
          <span className="odd">{fmt(c.local)}</span> · <span className="odd">{fmt(c.empate)}</span> ·{' '}
          <span className="odd">{fmt(c.visitante)}</span>
        </div>
      );
    });

  return (
    <div className="ticker-wrap">
      <div className="ticker-track">{items('a')}{items('b')}</div>
    </div>
  );
}
