import { useState } from 'react';
import Pestanas from '../../componentes/Pestanas';
import ListaEventos from '../../componentes/ListaEventos';
import { useEventos } from '../eventos/useEventos';
import { useApostadores } from '../eventos/useApostadores';
import { DEPORTES_MAS } from '../eventos/deportes';

export default function PaginaMasDeportes({ selecciones, onSeleccionar }) {
  const [deporte, setDeporte] = useState(DEPORTES_MAS[0].valor);
  const { eventos, cargando, error } = useEventos(deporte);
  const apostadores = useApostadores(eventos);

  return (
    <>
      <Pestanas opciones={DEPORTES_MAS} activa={deporte} onCambiar={setDeporte} />
      <ListaEventos
        eventos={eventos}
        cargando={cargando}
        error={error}
        selecciones={selecciones}
        onSeleccionar={onSeleccionar}
        apostadores={apostadores}
      />
    </>
  );
}
