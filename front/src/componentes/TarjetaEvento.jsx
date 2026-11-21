import FilaCuotas from './FilaCuotas';
import { esEnVivo } from '../logica/cuotas';
import { formatearFecha } from '../logica/formato';

// apostadores es opcional: si llega un número, se muestra "👥 N apostando".
export default function TarjetaEvento({ evento, selecciones, onSeleccionar, apostadores }) {
  return (
    <article className="tarjeta">
      <div className="tarjeta__top">
        <span>{evento.deportes?.nombre}</span>
        <span className={esEnVivo(evento) ? 'badge badge--vivo' : 'badge'}>
          {esEnVivo(evento) ? 'EN VIVO' : formatearFecha(evento.fecha_inicio)}
        </span>
      </div>
      <h3 className="tarjeta__equipos">
        {evento.equipo_local} <small>vs</small> {evento.equipo_visitante}
      </h3>
      {apostadores !== undefined && <span className="md-bettors">👥 {apostadores} apostando</span>}
      <FilaCuotas evento={evento} selecciones={selecciones} onSeleccionar={onSeleccionar} />
    </article>
  );
}
