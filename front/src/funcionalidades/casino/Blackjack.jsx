import { useState } from 'react';
import { useMesaBlackjack } from './useMesaBlackjack';
import {
  ETIQUETAS_RESULTADO_BJ, colorPalo, estadoMesaBlackjack, valorManoBlackjack,
} from '../../logica/casino';
import { formatearDinero } from '../../logica/formato';
import { MONTO_INICIAL } from '../../constantes';

// Las cartas nuevas se montan con la animación "dealt"; las que ya estaban no se
// vuelven a animar porque React conserva sus elementos (la key incluye índice y carta).
function Carta({ carta }) {
  return <div className={`bj-card ${colorPalo(carta)} dealt`}>{carta}</div>;
}

function AsientoBlackjack({ asiento, esMio, esTurno, onSentarse }) {
  const clases = ['bj-seat'];
  if (asiento.estado !== 'vacio') clases.push('occupied');
  if (esMio) clases.push('mine');
  if (esTurno) clases.push('active-turn');
  if (asiento.estado === 'gano') clases.push('just-won');

  if (asiento.estado === 'vacio') {
    return (
      <div className={clases.join(' ')} onClick={() => onSentarse(asiento.asiento)}>
        <div className="bj-seat-empty">Asiento {asiento.asiento}<br />Sentarse</div>
      </div>
    );
  }

  const cartas = asiento.cartas || [];
  const estiloResultado = {
    gano: { background: 'rgba(44,230,143,.2)', color: 'var(--accent-green)' },
    perdio: { background: 'rgba(255,76,106,.2)', color: 'var(--accent-red)' },
    empate: { background: 'rgba(154,166,188,.2)', color: 'var(--text-mid)' },
  }[asiento.resultado];

  return (
    <div className={clases.join(' ')}>
      <div className="bj-seat-name">{asiento.nombre_usuario || 'Jugador'}</div>
      <div className="bj-cards" style={{ minHeight: 'auto', transform: 'scale(.8)' }}>
        {cartas.map((c, i) => <Carta key={`${asiento.asiento}-${i}-${c}`} carta={c} />)}
      </div>
      {cartas.length > 0 && <div className="bj-value">{valorManoBlackjack(cartas)}</div>}
      {asiento.apuesta > 0 && <div className="bj-seat-bet">{formatearDinero(asiento.apuesta)}</div>}
      {asiento.resultado && (
        <div className="bj-seat-result" style={estiloResultado}>
          {ETIQUETAS_RESULTADO_BJ[asiento.resultado] ?? asiento.resultado}
        </div>
      )}
    </div>
  );
}

export default function Blackjack({ token, usuarioId, onActualizarSaldo }) {
  const { estado, errorMesa, mensajeAccion, ahora, ejecutar } = useMesaBlackjack(token, onActualizarSaldo);
  const [monto, setMonto] = useState(String(MONTO_INICIAL));

  if (!estado) return <div className="bj-status-line">{errorMesa ?? 'Conectando a la mesa...'}</div>;

  const { mesa, asientos } = estado;
  const miAsiento = asientos.find((a) => usuarioId && a.usuario_id === usuarioId) ?? null;
  const { texto, segundos } = estadoMesaBlackjack(mesa, ahora);
  const mostrarOculta = mesa.dealer_carta_oculta && mesa.cartas_dealer.length > 0;
  const puedeSalir = miAsiento?.estado === 'sentado';
  const puedeApostar = miAsiento?.estado === 'sentado' && mesa.estado === 'esperando';
  const esMiTurno = miAsiento?.estado === 'jugando' && mesa.turno_asiento === miAsiento.asiento;

  const apostar = () => {
    const valor = Number(monto);
    if (!valor || valor <= 0) return;
    ejecutar('apostar', { monto: valor });
  };

  return (
    <div>
      <div className="bj-table">
        <div className="bj-dealer-area">
          <div className="bj-dealer-label">Dealer</div>
          <div className="bj-cards">
            {mesa.cartas_dealer.map((c, i) => <Carta key={`dealer-${i}-${c}`} carta={c} />)}
            {mostrarOculta && <div key="oculta" className="bj-card back dealt">?</div>}
          </div>
          <div className="bj-value">
            {mesa.dealer_carta_oculta ? '' : `Valor: ${valorManoBlackjack(mesa.cartas_dealer)}`}
          </div>
        </div>
        <div className="bj-seats">
          {asientos.map((a) => (
            <AsientoBlackjack
              key={a.asiento}
              asiento={a}
              esMio={Boolean(usuarioId) && a.usuario_id === usuarioId}
              esTurno={mesa.turno_asiento === a.asiento}
              onSentarse={(numero) => ejecutar('sentarse', { asiento: numero })}
            />
          ))}
        </div>
      </div>

      <div className="bj-status-line">
        {mensajeAccion ?? errorMesa ?? (
          <>{texto}{segundos !== null && <> — <span className="bj-timer">{segundos}s</span></>}</>
        )}
      </div>

      {miAsiento && (
        <div className="bj-controls">
          <button
            type="button" className="bj-btn-stand" disabled={!puedeSalir}
            title={puedeSalir ? '' : 'Espera a que termine la ronda para salir'}
            style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--text-mid)', opacity: puedeSalir ? 1 : 0.5 }}
            onClick={() => ejecutar('pararse')}
          >SALIR DE LA MESA</button>
        </div>
      )}

      {puedeApostar && (
        <div className="slot-bet-row">
          <input type="number" min="1" step="100" value={monto} onChange={(e) => setMonto(e.target.value)} />
          <button type="button" className="btn btn-primary" style={{ width: 'auto', padding: '10px 20px' }} onClick={apostar}>APOSTAR</button>
        </div>
      )}

      {esMiTurno && (
        <div className="bj-controls">
          <button type="button" className="bj-btn-hit" onClick={() => ejecutar('pedir-carta')}>PEDIR CARTA</button>
          <button type="button" className="bj-btn-stand" onClick={() => ejecutar('plantarse')}>PLANTARSE</button>
        </div>
      )}
    </div>
  );
}
