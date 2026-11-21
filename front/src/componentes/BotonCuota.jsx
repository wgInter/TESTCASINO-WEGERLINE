export default function BotonCuota({ etiqueta, cuota, evento, seleccionada, onSeleccionar }) {
  if (!cuota) {
    return (
      <div className="cuota cuota--vacia">
        <span>{etiqueta}</span>
        <b>—</b>
      </div>
    );
  }

  const elegir = () =>
    onSeleccionar({
      cuotaId: cuota.id,
      eventoId: evento.id,
      partido: `${evento.equipo_local} vs ${evento.equipo_visitante}`,
      seleccion: cuota.nombre_seleccion,
      valor: Number(cuota.valor),
    });

  return (
    <button
      type="button"
      className={`cuota ${seleccionada ? 'cuota--activa' : ''}`}
      onClick={elegir}
    >
      <span>{etiqueta}</span>
      <b>{Number(cuota.valor).toFixed(2)}</b>
    </button>
  );
}
