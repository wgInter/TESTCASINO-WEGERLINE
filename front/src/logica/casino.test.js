import { describe, it, expect } from 'vitest';
import {
  valorManoBlackjack, colorRuleta, formatearFicha, totalApostado, armarApuestasRuleta,
  celdasTablero, gradienteRueda, calcularRotacionRuleta, estadoMesaBlackjack,
  describirResultadoSlot, simbolosAlAzar, SIMBOLOS_SLOT, RULETA_ORDEN,
} from './casino';

describe('valorManoBlackjack', () => {
  it('suma cartas numéricas y figuras', () => {
    expect(valorManoBlackjack(['10♥', '7♣'])).toBe(17);
    expect(valorManoBlackjack(['K♠', 'Q♥'])).toBe(20);
  });
  it('cuenta el As como 11 cuando no se pasa (blackjack = 21)', () => {
    expect(valorManoBlackjack(['A♠', 'K♥'])).toBe(21);
  });
  it('baja el As a 1 cuando se pasaría de 21 (caso límite)', () => {
    expect(valorManoBlackjack(['A♠', 'A♥', '9♦'])).toBe(21);
  });
  it('detecta que la mano se pasó', () => {
    expect(valorManoBlackjack(['K♠', 'Q♥', '5♦'])).toBe(25);
  });
  it('una mano vacía vale 0 (caso límite)', () => {
    expect(valorManoBlackjack([])).toBe(0);
  });
});

describe('ruleta: colores y apuestas', () => {
  it('el 0 es verde, el 1 rojo y el 2 negro', () => {
    expect(colorRuleta(0)).toBe('green');
    expect(colorRuleta(1)).toBe('red');
    expect(colorRuleta(2)).toBe('black');
  });
  it('formatea las fichas', () => {
    expect(formatearFicha(500)).toBe('500');
    expect(formatearFicha(25000)).toBe('25K');
  });
  it('suma el total apostado, y es 0 sin apuestas (caso límite)', () => {
    expect(totalApostado({ red: 1000, 'num-7': 500 })).toBe(1500);
    expect(totalApostado({})).toBe(0);
  });
  it('arma la lista de apuestas para el back', () => {
    expect(armarApuestasRuleta({ 'num-17': 500, red: 1000 })).toEqual([
      { tipo: 'num', valor: 17, monto: 500 },
      { tipo: 'red', monto: 1000 },
    ]);
  });
  it('el tablero tiene 36 casillas y el 3 queda arriba a la izquierda', () => {
    const celdas = celdasTablero();
    expect(celdas).toHaveLength(36);
    expect(celdas[0]).toEqual({ numero: 3, fila: 1, columna: 2 });
  });
  it('el degradado de la rueda trae un tramo por número', () => {
    const g = gradienteRueda();
    expect(g.startsWith('conic-gradient(')).toBe(true);
    expect(g.match(/deg \d/g).length).toBeGreaterThanOrEqual(RULETA_ORDEN.length);
  });
});

describe('calcularRotacionRuleta', () => {
  it('siempre gira hacia adelante, incluso en giros seguidos', () => {
    let rotacion = 0;
    for (const numero of [0, 17, 17, 36]) {
      const nueva = calcularRotacionRuleta(rotacion, numero, 0.5, 0.5);
      expect(nueva).toBeGreaterThan(rotacion);
      rotacion = nueva;
    }
  });
  it('el ángulo final deja el número bajo el puntero (sin desvío)', () => {
    const nueva = calcularRotacionRuleta(0, 32, 0.5, 0);
    const paso = 360 / RULETA_ORDEN.length;
    expect(nueva % 360).toBeCloseTo(360 - paso, 5);
  });
});

describe('estadoMesaBlackjack', () => {
  const ahora = new Date('2026-11-12T12:00:00Z').getTime();
  it('muestra los segundos restantes del turno', () => {
    const mesa = { estado: 'turnos', turno_expira_en: new Date(ahora + 5000).toISOString() };
    expect(estadoMesaBlackjack(mesa, ahora)).toEqual({ texto: 'En juego', segundos: 5 });
  });
  it('nunca devuelve segundos negativos (caso límite)', () => {
    const mesa = { estado: 'turnos', turno_expira_en: new Date(ahora - 9000).toISOString() };
    expect(estadoMesaBlackjack(mesa, ahora).segundos).toBe(0);
  });
  it('fuera de turnos no hay contador', () => {
    expect(estadoMesaBlackjack({ estado: 'esperando' }, ahora).segundos).toBeNull();
  });
});

describe('tragamonedas', () => {
  it('describe un triple, un par y una derrota', () => {
    expect(describirResultadoSlot({ ganancia: 3000, resultado: 'triple' }).tipo).toBe('win');
    expect(describirResultadoSlot({ ganancia: 1000, resultado: 'par' }).texto).toContain('Par');
    expect(describirResultadoSlot({ ganancia: 0 }).tipo).toBe('lose');
  });
  it('simbolosAlAzar devuelve 3 símbolos válidos', () => {
    const r = simbolosAlAzar(() => 0.99);
    expect(r).toHaveLength(3);
    r.forEach((s) => expect(SIMBOLOS_SLOT).toContain(s));
  });
});
