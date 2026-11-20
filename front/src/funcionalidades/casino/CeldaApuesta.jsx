import { formatearFicha } from '../../logica/casino';

// Casilla del paño de la ruleta. Reutilizada para los números y para las apuestas
// exteriores (rojo/negro, docenas, par/impar...). Clic = apostar, clic derecho = quitar.
export default function CeldaApuesta({ clave, clase, estilo, monto, bloqueada, onApostar, onQuitar, children }) {
  return (
    <div
      className={clase}
      style={{ ...estilo, pointerEvents: bloqueada ? 'none' : undefined }}
      onClick={() => onApostar(clave)}
      onContextMenu={(e) => { e.preventDefault(); onQuitar(clave); }}
    >
      {children}
      {monto > 0 && <div className="rl-chip-stack">{formatearFicha(monto)}</div>}
    </div>
  );
}
