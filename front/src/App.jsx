import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { colocarApuesta, obtenerPerfil } from './api';
import { useDatos } from './hooks/useDatos';
import { alternarSeleccion } from './logica/cuotas';
import Navbar from './componentes/Navbar';
import Ticker from './componentes/Ticker';
import BoletoApuestas from './componentes/BoletoApuestas';
import FormularioLogin from './componentes/FormularioLogin';
import PaginaInicio from './funcionalidades/inicio/PaginaInicio';
import PaginaMasDeportes from './funcionalidades/masdeportes/PaginaMasDeportes';
import PaginaCasino from './funcionalidades/casino/PaginaCasino';
import PaginaCuenta from './funcionalidades/cuenta/PaginaCuenta';

const VISTAS_CON_BOLETO = ['inicio', 'mas'];

export default function App() {
  const [sesion, setSesion] = useState(null);
  const [vista, setVista] = useState('inicio');
  const [modoAuth, setModoAuth] = useState('login');
  const [selecciones, setSelecciones] = useState([]);
  const [version, setVersion] = useState(0); // sube cuando hay que recargar saldo/historial

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSesion(data.session));
    const { data } = supabase.auth.onAuthStateChange((_evento, nueva) => setSesion(nueva));
    return () => data.subscription.unsubscribe();
  }, []);

  const token = sesion?.access_token;
  const perfil = useDatos(
    () => (token ? obtenerPerfil(token) : Promise.resolve(null)),
    [token, version]
  );
  const saldo = perfil.datos?.saldo ?? 0;
  const refrescarCuenta = () => setVersion((v) => v + 1);

  const alternar = (seleccion) => setSelecciones((actuales) => alternarSeleccion(actuales, seleccion));
  const quitar = (seleccion) => setSelecciones((actuales) => actuales.filter((s) => s.cuotaId !== seleccion.cuotaId));

  const apostar = async (monto) => {
    await colocarApuesta(token, monto, selecciones);
    setSelecciones([]);
    refrescarCuenta();
  };

  const salir = async () => {
    await supabase.auth.signOut();
    setSelecciones([]);
    setVista('inicio');
  };

  const irAAutenticar = (modo) => { setModoAuth(modo); setVista('cuenta'); };

  let contenido;
  if (vista === 'cuenta') {
    contenido = sesion
      ? <PaginaCuenta token={token} perfil={perfil.datos} version={version} onActualizarPerfil={refrescarCuenta} />
      : <FormularioLogin key={modoAuth} modoInicial={modoAuth} />;
  } else if (vista === 'casino') {
    contenido = <PaginaCasino sesion={sesion} saldo={saldo} onActualizarSaldo={refrescarCuenta} />;
  } else if (vista === 'mas') {
    contenido = <PaginaMasDeportes selecciones={selecciones} onSeleccionar={alternar} />;
  } else {
    contenido = <PaginaInicio selecciones={selecciones} onSeleccionar={alternar} />;
  }

  const conBoleto = VISTAS_CON_BOLETO.includes(vista);

  return (
    <>
      <Navbar
        vista={vista}
        onCambiarVista={setVista}
        saldo={saldo}
        haySesion={Boolean(sesion)}
        onSalir={salir}
        onAutenticar={irAAutenticar}
      />
      <Ticker />
      <main className={`layout ${conBoleto ? '' : 'layout--sola'}`}>
        <div className="layout__contenido">{contenido}</div>
        {conBoleto && (
          <BoletoApuestas
            selecciones={selecciones}
            onQuitar={quitar}
            onApostar={apostar}
            haySesion={Boolean(sesion)}
            onIrALogin={() => irAAutenticar('login')}
          />
        )}
      </main>
    </>
  );
}
