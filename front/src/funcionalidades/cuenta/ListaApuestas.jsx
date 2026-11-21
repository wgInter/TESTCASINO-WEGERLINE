import {
  ETIQUETAS_ESTADO_APUESTA, ETIQUETAS_RESULTADO_SELECCION,
} from '../../logica/cuenta';
import { formatearDinero, formatearFecha } from '../../logica/formato';

function Seleccion({ seleccion }) {
  const evento = seleccion.cuotas?.mercados?.eventos;
  const partido = evento ? `${evento.equipo_local} vs ${evento.equipo_visitante}` : 'Evento';
  const resultado = seleccion.resultado || 'pendiente';
  return (
    <div className="bhi-sel">
      <span>
        {partido} — <span className="sel-name">{seleccion.cuotas?.nombre_seleccion}</span>{' '}
        @ {Number(seleccion.valor_cuota_congelado).toFixed(2)}
      </span>
      <span className={`status-badge sel-result status-${resultado}`}>
        {ETIQUETAS_RESULTADO_SELECCION[resultado]}
      </span>
    </div>
  );
}

export default function ListaApuestas({ apuestas }) {
  return (
    <div>
      {apuestas.map((a) => {
        const selecciones = a.apuesta_selecciones || [];
        return (
          <div className="bet-history-item" key={a.id}>
            <div className="bhi-top">
              <div>
                <div className="bhi-match">
                  {a.tipo === 'combinada' ? `Combinada · ${selecciones.length} selecciones` : 'Simple'}
                </div>
                <div className="bhi-date">{formatearFecha(a.creado_en)}</div>
              </div>
              <span className={`status-badge status-${a.estado}`}>
                {ETIQUETAS_ESTADO_APUESTA[a.estado] ?? a.estado}
              </span>
            </div>
            <div className="bhi-selections">
              {selecciones.map((s) => <Seleccion key={s.id} seleccion={s} />)}
            </div>
            <div className="bhi-foot">
              <span>Importe <strong>{formatearDinero(a.monto)}</strong> · Cuota <strong>{Number(a.cuota_total).toFixed(2)}</strong></span>
              <span>
                Ganancia {a.estado === 'ganada' ? 'pagada' : 'potencial'}{' '}
                <strong className={a.estado === 'ganada' ? 'win' : ''}>{formatearDinero(a.ganancia_potencial)}</strong>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
