import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../supabase';
import { accionBlackjack, obtenerMesaBlackjack, tickBlackjack } from '../../api';
import { DURACION_MENSAJE_ERROR_MS, INTERVALO_RELOJ_MESA_MS } from '../../constantes';

const INTERVALO_TICK_MS = 2000;

// Mantiene la mesa sincronizada: Realtime de Supabase + "tick" cada 2 s + reloj de 1 s.
// El estado siempre se vuelve a pedir al back (nunca se confía en el payload crudo).
export function useMesaBlackjack(token, onCambio) {
  const [estado, setEstado] = useState(null);
  const [errorMesa, setErrorMesa] = useState(null);
  const [mensajeAccion, setMensajeAccion] = useState(null);
  const [ahora, setAhora] = useState(Date.now());
  const mesaIdRef = useRef(null);
  mesaIdRef.current = estado?.mesa.id ?? null;

  const refrescar = useCallback(async () => {
    try {
      setEstado(await obtenerMesaBlackjack());
      setErrorMesa(null);
    } catch (e) {
      console.error(e);
      setErrorMesa('No se pudo cargar la mesa.');
    }
  }, []);

  useEffect(() => {
    refrescar();

    const canal = supabase
      .channel('blackjack-mesa')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mesas_blackjack' }, refrescar)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blackjack_asientos' }, refrescar)
      .subscribe();

    // El back avanza fases/turnos vencidos con cada tick; no dependemos solo de Realtime.
    const tick = setInterval(async () => {
      if (!mesaIdRef.current) return;
      try { await tickBlackjack(mesaIdRef.current); } catch (e) { console.error('tick falló', e); }
      refrescar();
    }, INTERVALO_TICK_MS);

    const reloj = setInterval(() => setAhora(Date.now()), INTERVALO_RELOJ_MESA_MS);

    return () => {
      supabase.removeChannel(canal);
      clearInterval(tick);
      clearInterval(reloj);
    };
  }, [refrescar]);

  const ejecutar = async (accion, extra) => {
    if (!token) { setMensajeAccion('Inicia sesión para jugar.'); return; }
    try {
      await accionBlackjack(token, accion, mesaIdRef.current, extra);
      setMensajeAccion(null);
    } catch (e) {
      setMensajeAccion(e.message);
      setTimeout(() => setMensajeAccion(null), DURACION_MENSAJE_ERROR_MS);
    }
    refrescar();
    onCambio?.();
  };

  return { estado, errorMesa, mensajeAccion, ahora, ejecutar };
}
