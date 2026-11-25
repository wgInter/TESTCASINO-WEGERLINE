import Pestanas from './Pestanas';
import { formatearDinero } from '../logica/formato';

const VISTAS = [
  { valor: 'inicio', etiqueta: 'Inicio' },
  { valor: 'mas', etiqueta: 'Más deportes' },
  { valor: 'casino', etiqueta: '🎰 Casino' },
  { valor: 'cuenta', etiqueta: 'Mi cuenta' },
];

export default function Navbar({ vista, onCambiarVista, saldo, haySesion, onSalir, onAutenticar }) {
  return (
    <header className="navbar">
      <div className="logo">WAGER<span>LINE</span></div>
      <Pestanas opciones={VISTAS} activa={vista} onCambiar={onCambiarVista} />
      <div className="navbar__acciones">
        {haySesion ? (
          <>
            <button type="button" className="saldo" onClick={() => onCambiarVista('cuenta')}>
              {formatearDinero(saldo)}
            </button>
            <button type="button" className="boton boton--fantasma" onClick={onSalir}>Salir</button>
          </>
        ) : (
          <>
            <button type="button" className="boton boton--fantasma" onClick={() => onAutenticar('login')}>Iniciar sesión</button>
            <button type="button" className="boton" style={{ width: 'auto', margin: 0 }} onClick={() => onAutenticar('signup')}>Registrarse</button>
          </>
        )}
      </div>
    </header>
  );
}
