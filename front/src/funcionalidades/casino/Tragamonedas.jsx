import { useEffect, useRef, useState } from 'react';
import { girarTragamonedas } from '../../api';
import { PAGOS_SLOT, describirResultadoSlot, simbolosAlAzar } from '../../logica/casino';
import { esperar } from '../../logica/tiempo';
import { ESPERA_RESULTADO_SLOT_MS, MONTO_INICIAL, VELOCIDAD_ANIMACION_SLOT_MS } from '../../constantes';

export default function Tragamonedas({ token, onActualizarSaldo }) {
  const [simbolos, setSimbolos] = useState(['🍒', '🔔', '⭐']);
  const [monto, setMonto] = useState(String(MONTO_INICIAL));
  const [girando, setGirando] = useState(false);
  const [resultado, setResultado] = useState(null); // { texto, tipo }
  const animacion = useRef(null);

  useEffect(() => () => clearInterval(animacion.current), []);

  const girar = async () => {
    if (girando) return;
    if (!token) return setResultado({ texto: 'Inicia sesión para jugar.', tipo: '' });
    const valor = Number(monto);
    if (!valor || valor <= 0) return setResultado({ texto: 'Ingresa un monto válido.', tipo: '' });

    setGirando(true);
    setResultado(null);
    // Animación local: cicla símbolos al azar mientras esperamos al servidor.
    animacion.current = setInterval(() => setSimbolos(simbolosAlAzar()), VELOCIDAD_ANIMACION_SLOT_MS);

    try {
      const datos = await girarTragamonedas(token, valor);
      await esperar(ESPERA_RESULTADO_SLOT_MS);
      clearInterval(animacion.current);
      setSimbolos(datos.simbolos);
      setResultado(describirResultadoSlot(datos));
      onActualizarSaldo();
    } catch (e) {
      clearInterval(animacion.current);
      setResultado({ texto: e.message || 'No se pudo procesar el giro.', tipo: '' });
    } finally {
      setGirando(false);
    }
  };

  return (
    <div className="slot-machine">
      <div className="slot-reels">
        {simbolos.map((simbolo, i) => (
          <div key={`carrete-${i}`} className={`slot-reel ${girando ? 'spinning' : ''}`}>{simbolo}</div>
        ))}
      </div>
      <div className="slot-bet-row">
        <input type="number" min="1" step="100" value={monto} onChange={(e) => setMonto(e.target.value)} />
        <button type="button" className="btn btn-primary" style={{ width: 'auto', padding: '12px 24px' }} disabled={girando} onClick={girar}>
          GIRAR
        </button>
      </div>
      <div className={`slot-result ${resultado?.tipo ?? ''}`}>{resultado?.texto}</div>
      <div className="slot-paytable">
        {PAGOS_SLOT.map((pago) => <span key={pago}>{pago}</span>)}
      </div>
    </div>
  );
}
