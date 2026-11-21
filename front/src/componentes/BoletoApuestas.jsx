import { useState } from 'react';
import { MONTO_INICIAL } from '../constantes';
import { formatearDinero } from '../logica/formato';
import { useCotizacion } from '../funcionalidades/apuestas/useCotizacion';

export default function BoletoApuestas({ selecciones, onQuitar, onApostar, haySesion, onIrALogin }) {
  const [monto, setMonto] = useState(String(MONTO_INICIAL));
  const [mensaje, setMensaje] = useState(null); // { tipo: 'ok' | 'error', texto }
  const [enviando, setEnviando] = useState(false);
  const cotizacion = useCotizacion(selecciones, monto);

  const apostar = async () => {
    setEnviando(true);
    setMensaje(null);
    try {
      await onApostar(Number(monto));
      setMensaje({ tipo: 'ok', texto: '¡Apuesta colocada!' });
    } catch (e) {
      setMensaje({ tipo: 'error', texto: e.message });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <aside className="boleto">
      <h2>Boleto</h2>

      {selecciones.length === 0 ? (
        <p className="aviso">Elige una cuota para empezar.</p>
      ) : (
        <ul className="boleto__lista">
          {selecciones.map((s) => (
            <li key={s.cuotaId}>
              <div>
                <small>{s.partido}</small>
                <div>{s.seleccion} <b>@ {s.valor.toFixed(2)}</b></div>
              </div>
              <button type="button" className="icono" onClick={() => onQuitar(s)}>✕</button>
            </li>
          ))}
        </ul>
      )}

      <label className="campo">
        Monto
        <input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} />
      </label>

      <p className="boleto__linea">
        Cuota total <b>{cotizacion.datos ? Number(cotizacion.datos.cuotaTotal).toFixed(2) : '—'}</b>
      </p>
      <p className="boleto__linea">
        Ganancia potencial <b>{cotizacion.datos ? formatearDinero(cotizacion.datos.gananciaPotencial) : '—'}</b>
      </p>
      {cotizacion.error && <p className="aviso aviso--error">{cotizacion.error}</p>}

      {haySesion ? (
        <button type="button" className="boton" disabled={enviando || selecciones.length === 0} onClick={apostar}>
          {enviando ? 'Enviando…' : 'Apostar'}
        </button>
      ) : (
        <button type="button" className="boton" onClick={onIrALogin}>Inicia sesión para apostar</button>
      )}

      {mensaje && <p className={`aviso ${mensaje.tipo === 'error' ? 'aviso--error' : 'aviso--ok'}`}>{mensaje.texto}</p>}
    </aside>
  );
}
