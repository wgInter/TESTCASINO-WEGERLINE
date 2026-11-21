import BotonCuota from './BotonCuota';
import { cuotasDeEvento } from '../logica/cuotas';

// Reutilizado en: TarjetaEvento y EventoDestacado.
export default function FilaCuotas({ evento, selecciones, onSeleccionar }) {
  const cuotas = cuotasDeEvento(evento);
  const botones = [
    { clave: 'local', etiqueta: 'Local', cuota: cuotas.local },
    // Baloncesto y vóleibol no tienen empate: si no hay cuota, no se muestra el botón.
    ...(cuotas.empate ? [{ clave: 'empate', etiqueta: 'Empate', cuota: cuotas.empate }] : []),
    { clave: 'visitante', etiqueta: 'Visitante', cuota: cuotas.visitante },
  ];

  return (
    <div className="fila-cuotas">
      {botones.map((b) => (
        <BotonCuota
          key={b.cuota?.id ?? b.clave}
          etiqueta={b.etiqueta}
          cuota={b.cuota}
          evento={evento}
          seleccionada={selecciones.some((s) => s.cuotaId === b.cuota?.id)}
          onSeleccionar={onSeleccionar}
        />
      ))}
    </div>
  );
}
