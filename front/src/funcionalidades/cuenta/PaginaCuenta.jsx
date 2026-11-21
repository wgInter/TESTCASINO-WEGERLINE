import { useState } from 'react';
import Pestanas from '../../componentes/Pestanas';
import EstadoDatos from '../../componentes/EstadoDatos';
import PerfilUsuario from './PerfilUsuario';
import ListaApuestas from './ListaApuestas';
import ListaMovimientos from './ListaMovimientos';
import { useDatos } from '../../hooks/useDatos';
import { obtenerApuestas, obtenerTransacciones } from '../../api';
import { FILTROS_APUESTAS, filtrarApuestas } from '../../logica/cuenta';

const PESTANAS = [
  { valor: 'apuestas', etiqueta: 'Mis apuestas' },
  { valor: 'transacciones', etiqueta: 'Movimientos' },
];

export default function PaginaCuenta({ token, perfil, version, onActualizarPerfil }) {
  const [pestana, setPestana] = useState('apuestas');
  const [filtro, setFiltro] = useState('todas');
  const apuestas = useDatos(() => obtenerApuestas(token), [token, version], []);
  const movimientos = useDatos(() => obtenerTransacciones(token), [token, version], []);

  const apuestasFiltradas = filtrarApuestas(apuestas.datos ?? [], filtro);

  return (
    <section className="cuenta">
      <PerfilUsuario token={token} perfil={perfil} onActualizar={onActualizarPerfil} />

      <Pestanas opciones={PESTANAS} activa={pestana} onCambiar={setPestana} />

      {pestana === 'apuestas' ? (
        <>
          <div className="filtros">
            <Pestanas opciones={FILTROS_APUESTAS} activa={filtro} onCambiar={setFiltro} />
          </div>
          <EstadoDatos
            cargando={apuestas.cargando}
            error={apuestas.error}
            vacio={apuestasFiltradas.length === 0}
            textoVacio="No tienes apuestas en esta categoría."
          >
            <ListaApuestas apuestas={apuestasFiltradas} />
          </EstadoDatos>
        </>
      ) : (
        <EstadoDatos
          cargando={movimientos.cargando}
          error={movimientos.error}
          vacio={(movimientos.datos ?? []).length === 0}
          textoVacio="Todavía no tienes movimientos."
        >
          <ListaMovimientos movimientos={movimientos.datos ?? []} />
        </EstadoDatos>
      )}
    </section>
  );
}
