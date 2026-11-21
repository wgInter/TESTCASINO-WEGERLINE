import { useEffect, useRef, useState } from 'react';
import { girarRuleta as pedirGiroRuleta } from '../../api';
import CeldaApuesta from './CeldaApuesta';
import {
  APUESTAS_EXTERIORES, DURACION_GIRO_MS, FICHA_INICIAL, PASO_RULETA, RULETA_COLOR_HEX,
  RULETA_FICHAS, RULETA_ORDEN, armarApuestasRuleta, calcularRotacionRuleta, celdasTablero,
  colorRuleta, formatearFicha, gradienteRueda, totalApostado,
} from '../../logica/casino';
import { formatearDinero } from '../../logica/formato';
import { esperar } from '../../logica/tiempo';

const GRADIENTE = gradienteRueda();
const CELDAS = celdasTablero();
const MENSAJE_INICIAL = { texto: 'Elige tus fichas y coloca tu apuesta en la mesa.', tipo: '', numero: null };

export default function Ruleta({ token, saldo, onActualizarSaldo }) {
  const haySesion = Boolean(token);
  const [apuestas, setApuestas] = useState({});
  const [ficha, setFicha] = useState(FICHA_INICIAL);
  const [girando, setGirando] = useState(false);
  const [estado, setEstado] = useState(MENSAJE_INICIAL);
  const [auto, setAuto] = useState(false);
  const [autoActivo, setAutoActivo] = useState(false);
  const [ultimas, setUltimas] = useState(null);
  const [rotacion, setRotacion] = useState(0);
  const [animando, setAnimando] = useState(false);

  // Refs: el bucle automático necesita ver siempre los valores más recientes.
  const apuestasRef = useRef(apuestas); apuestasRef.current = apuestas;
  const saldoRef = useRef(saldo); saldoRef.current = saldo;
  const rotacionRef = useRef(0);
  const resolverGiro = useRef(null);
  const autoCorriendo = useRef(false);
  const montado = useRef(true);

  useEffect(() => {
    montado.current = true;
    return () => { montado.current = false; autoCorriendo.current = false; };
  }, []);

  const avisar = (texto, tipo = '') => setEstado({ texto, tipo, numero: null });

  // Anima la rueda hasta el número ganador y espera a que termine la transición.
  const girarRueda = (numero) => new Promise((resolver) => {
    const nueva = calcularRotacionRuleta(rotacionRef.current, numero, Math.random(), Math.random());
    rotacionRef.current = nueva;
    const seguro = setTimeout(() => resolverGiro.current?.(), DURACION_GIRO_MS + 600);
    resolverGiro.current = () => { clearTimeout(seguro); resolverGiro.current = null; setAnimando(false); resolver(); };
    setAnimando(true);
    setRotacion(nueva);
  });

  const alTerminarTransicion = (e) => {
    if (e.target === e.currentTarget) resolverGiro.current?.();
  };

  const apostar = (clave) => {
    if (girando) return;
    if (!haySesion) return avisar('Inicia sesión para jugar.');
    setApuestas((a) => ({ ...a, [clave]: (a[clave] || 0) + ficha }));
  };

  const quitar = (clave) => {
    if (girando) return;
    setApuestas((a) => { const { [clave]: _quitada, ...resto } = a; return resto; });
  };

  const girarUnaVez = async () => {
    const actuales = apuestasRef.current;
    const total = totalApostado(actuales);
    if (!haySesion) { avisar('Inicia sesión para jugar.'); return false; }
    if (total <= 0) { avisar('Coloca al menos una apuesta en la mesa.'); return false; }
    if (total > saldoRef.current) { avisar('Fichas de práctica insuficientes para esta apuesta.', 'lose'); return false; }

    setGirando(true);
    avisar('Girando…');
    setUltimas({ ...actuales });

    try {
      const datos = await pedirGiroRuleta(token, armarApuestasRuleta(actuales));

      await girarRueda(datos.numero_ganador);
      onActualizarSaldo();

      const gano = datos.ganancia_total > 0;
      setEstado({
        numero: datos.numero_ganador,
        tipo: gano ? 'win' : 'lose',
        texto: gano ? `¡Ganaste ${formatearDinero(datos.ganancia_total)}!` : 'Sin premio esta vez.',
      });
      return true;
    } catch (e) {
      avisar(e.message || 'No se pudo procesar el giro.');
      return false;
    } finally {
      if (montado.current) setGirando(false);
    }
  };

  // Giros automáticos: se detiene pulsando el mismo botón (que pasa a decir DETENER).
  const manejarGiro = async () => {
    if (autoCorriendo.current) {
      autoCorriendo.current = false;
      avisar('Deteniendo giros automáticos…');
      return;
    }
    if (!auto) { await girarUnaVez(); return; }

    autoCorriendo.current = true;
    setAutoActivo(true);
    while (autoCorriendo.current) {
      const ok = await girarUnaVez();
      if (!ok || !autoCorriendo.current || !montado.current) break;
      await esperar(900); // pausa breve para que el ritmo se sienta natural
    }
    autoCorriendo.current = false;
    if (montado.current) setAutoActivo(false);
  };

  const etiquetaBoton = autoActivo ? 'DETENER' : auto ? 'GIRAR (AUTO)' : 'GIRAR';

  return (
    <div>
      <div className="rl-demo-badge">🎓 Modo demo — fichas de práctica</div>
      <div className="rl-wrap">
        <div className="rl-wheel-wrap">
          <div className="rl-pointer" />
          <div className="rl-wheel-outer">
            <div
              className={`rl-wheel ${animando ? 'spinning' : ''}`}
              style={{ background: GRADIENTE, transform: `rotate(${rotacion}deg)` }}
              onTransitionEnd={alTerminarTransicion}
            >
              {RULETA_ORDEN.map((numero, i) => (
                <div key={numero} className="rl-wheel-num" style={{ transform: `rotate(${i * PASO_RULETA}deg)` }}>
                  {numero}
                </div>
              ))}
            </div>
            <div className="rl-hub" />
          </div>
        </div>

        <div className={`rl-status ${estado.tipo}`}>
          {estado.numero !== null && (
            <>
              Salió{' '}
              <span className="rl-winnum" style={{ background: RULETA_COLOR_HEX[colorRuleta(estado.numero)] }}>
                {estado.numero}
              </span>{' '}
              —{' '}
            </>
          )}
          {estado.texto}
        </div>

        <div className="rl-controls-row">
          {RULETA_FICHAS.map((valor) => (
            <div key={valor} className={`rl-chip ${valor === ficha ? 'active' : ''}`} onClick={() => setFicha(valor)}>
              {formatearFicha(valor)}
            </div>
          ))}
        </div>

        <div className="rl-table">
          <div className="rl-table-grid">
            <CeldaApuesta
              clave="num-0" clase="rl-cell green" monto={apuestas['num-0']} bloqueada={girando}
              onApostar={apostar} onQuitar={quitar}
            >0</CeldaApuesta>
            {CELDAS.map((c) => (
              <CeldaApuesta
                key={c.numero} clave={`num-${c.numero}`} clase={`rl-cell ${colorRuleta(c.numero)}`}
                estilo={{ gridColumn: c.columna, gridRow: c.fila }}
                monto={apuestas[`num-${c.numero}`]} bloqueada={girando}
                onApostar={apostar} onQuitar={quitar}
              >{c.numero}</CeldaApuesta>
            ))}
          </div>
          <div className="rl-outside-row">
            <div />
            {APUESTAS_EXTERIORES.map((o) => (
              <CeldaApuesta
                key={o.clave} clave={o.clave} clase="rl-outside"
                estilo={RULETA_COLOR_HEX[o.clave] ? { background: RULETA_COLOR_HEX[o.clave] } : undefined}
                monto={apuestas[o.clave]} bloqueada={girando}
                onApostar={apostar} onQuitar={quitar}
              >{o.etiqueta}</CeldaApuesta>
            ))}
          </div>
        </div>

        <div className="rl-bottom-row">
          <div className="rl-total">Total apostado: <b>{formatearDinero(totalApostado(apuestas))}</b></div>
          <button type="button" className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: 12 }} disabled={girando} onClick={() => setApuestas({})}>
            Borrar apuestas
          </button>
          <button type="button" className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: 12 }} disabled={girando || !ultimas} onClick={() => setApuestas({ ...ultimas })}>
            Repetir última
          </button>
        </div>

        <div className="rl-bottom-row">
          <button type="button" className="btn btn-primary" style={{ width: 'auto', padding: '12px 28px' }} disabled={girando} onClick={manejarGiro}>
            {etiquetaBoton}
          </button>
          <div className="rl-auto-row">
            <span>Giros automáticos</span>
            <div
              className={`rl-switch ${auto ? 'on' : ''}`}
              style={{ pointerEvents: autoActivo ? 'none' : undefined }}
              onClick={() => setAuto((a) => !a)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
