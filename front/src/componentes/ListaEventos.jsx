import EstadoDatos from './EstadoDatos';
import TarjetaEvento from './TarjetaEvento';

// Reutilizado en: Inicio y Más deportes.
// apostadores (opcional): { eventoId: cantidad }; si no se pasa, no se muestra el contador.
export default function ListaEventos({ eventos, cargando, error, selecciones, onSeleccionar, apostadores }) {
  return (
    <EstadoDatos
      cargando={cargando}
      error={error}
      vacio={eventos.length === 0}
      textoVacio="No hay partidos disponibles para este deporte en este momento."
    >
      <div className="lista">
        {eventos.map((evento) => (
          <TarjetaEvento
            key={evento.id}
            evento={evento}
            selecciones={selecciones}
            onSeleccionar={onSeleccionar}
            apostadores={apostadores ? (apostadores[evento.id] ?? 0) : undefined}
          />
        ))}
      </div>
    </EstadoDatos>
  );
}
