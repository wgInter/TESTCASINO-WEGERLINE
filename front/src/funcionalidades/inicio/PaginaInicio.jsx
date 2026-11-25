import { useState } from 'react';
import Pestanas from '../../componentes/Pestanas';
import EventoDestacado from '../../componentes/EventoDestacado';
import ListaEventos from '../../componentes/ListaEventos';
import { useEventos } from '../eventos/useEventos';
import { DEPORTES_INICIO, INTERVALO_REFRESCO_MS } from '../eventos/deportes';
import { esEnVivo } from '../../logica/cuotas';

export default function PaginaInicio({ selecciones, onSeleccionar }) {
  const [deporte, setDeporte] = useState(DEPORTES_INICIO[0].valor);
  const { eventos, cargando, error } = useEventos(deporte, INTERVALO_REFRESCO_MS);

  const destacado = eventos.find(esEnVivo) ?? eventos[0];
  const resto = eventos.filter((e) => e.id !== destacado?.id);

  return (
    <>
      <Pestanas opciones={DEPORTES_INICIO} activa={deporte} onCambiar={setDeporte} />
      {destacado && !cargando && !error && (
        <EventoDestacado evento={destacado} selecciones={selecciones} onSeleccionar={onSeleccionar} />
      )}
      <ListaEventos
        eventos={resto}
        cargando={cargando}
        error={error}
        selecciones={selecciones}
        onSeleccionar={onSeleccionar}
      />
    </>
  );
}
