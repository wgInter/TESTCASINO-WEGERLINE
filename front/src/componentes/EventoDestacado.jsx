import FilaCuotas from './FilaCuotas';
import { esEnVivo } from '../logica/cuotas';
import { abreviar } from '../logica/formato';

export default function EventoDestacado({ evento, selecciones, onSeleccionar }) {
  return (
    <section className="destacado">
      <span className={esEnVivo(evento) ? 'badge badge--vivo' : 'badge'}>
        {esEnVivo(evento) ? 'EN VIVO' : 'PRÓXIMO'}
      </span>
      <div className="destacado__equipos">
        <div><span className="escudo">{abreviar(evento.equipo_local)}</span>{evento.equipo_local}</div>
        <div className="destacado__marcador">
          {evento.marcador_local ?? '-'} : {evento.marcador_visitante ?? '-'}
        </div>
        <div><span className="escudo">{abreviar(evento.equipo_visitante)}</span>{evento.equipo_visitante}</div>
      </div>
      <FilaCuotas evento={evento} selecciones={selecciones} onSeleccionar={onSeleccionar} />
    </section>
  );
}
