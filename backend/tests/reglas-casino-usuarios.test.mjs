import { describe, it, expect } from 'vitest';
import casino from '../src/logica/reglas-casino.js';
import usuarios from '../src/logica/reglas-usuarios.js';
import apostadores from '../src/logica/apostadores.js';

describe('validarApuestasRuleta', () => {
  it('acepta apuestas a número y a casillas externas', () => {
    const apuestas = [{ tipo: 'num', valor: 17, monto: 10 }, { tipo: 'red', monto: 5 }];
    expect(casino.validarApuestasRuleta(apuestas)).toBeNull();
  });

  it('rechaza números fuera de 0..36 y tipos desconocidos', () => {
    expect(casino.validarApuestasRuleta([{ tipo: 'num', valor: 37, monto: 10 }])).not.toBeNull();
    expect(casino.validarApuestasRuleta([{ tipo: 'trampa', monto: 10 }])).not.toBeNull();
  });

  it('rechaza una lista vacía y montos inválidos', () => {
    expect(casino.validarApuestasRuleta([])).not.toBeNull();
    expect(casino.validarApuestasRuleta([{ tipo: 'red', monto: -5 }])).not.toBeNull();
  });
});

describe('blackjack', () => {
  it('esAsientoValido acepta 1..5 y rechaza lo demás', () => {
    expect(casino.esAsientoValido(1)).toBe(true);
    expect(casino.esAsientoValido(5)).toBe(true);
    expect(casino.esAsientoValido(0)).toBe(false);
    expect(casino.esAsientoValido(6)).toBe(false);
    expect(casino.esAsientoValido('2')).toBe(false);
  });

  it('debeProcesarTick limita la frecuencia del tick público', () => {
    expect(casino.debeProcesarTick(undefined, 5000, 1000)).toBe(true);
    expect(casino.debeProcesarTick(4500, 5000, 1000)).toBe(false);
    expect(casino.debeProcesarTick(4000, 5000, 1000)).toBe(true);
  });
});

describe('reglas de usuarios', () => {
  it('validarNombreUsuario rechaza vacío, solo espacios y demasiado largo', () => {
    expect(usuarios.validarNombreUsuario('Santiago')).toBeNull();
    expect(usuarios.validarNombreUsuario('   ')).not.toBeNull();
    expect(usuarios.validarNombreUsuario('x'.repeat(41))).not.toBeNull();
    expect(usuarios.validarNombreUsuario(123)).not.toBeNull();
  });

  it('aplicarSignoAjuste resta en retiros y suma en depósitos', () => {
    expect(usuarios.aplicarSignoAjuste(100, 'retiro')).toBe(-100);
    expect(usuarios.aplicarSignoAjuste(100, 'deposito')).toBe(100);
    expect(usuarios.aplicarSignoAjuste(-100, 'deposito')).toBe(100);
  });
});

describe('apostadores', () => {
  it('cuenta personas distintas por evento, con 0 si nadie apostó', () => {
    const filas = [
      { apuestas: { usuario_id: 'u1' }, cuotas: { mercados: { evento_id: 'e1' } } },
      { apuestas: { usuario_id: 'u1' }, cuotas: { mercados: { evento_id: 'e1' } } },
      { apuestas: { usuario_id: 'u2' }, cuotas: { mercados: { evento_id: 'e1' } } },
    ];
    expect(apostadores.contarApostadoresPorEvento(filas, ['e1', 'e2'])).toEqual({ e1: 2, e2: 0 });
  });

  it('parsearIdsEventos devuelve null con texto inválido o demasiados ids', () => {
    expect(apostadores.parsearIdsEventos('a,b')).toEqual(['a', 'b']);
    expect(apostadores.parsearIdsEventos('')).toBeNull();
    expect(apostadores.parsearIdsEventos('a,../x')).toBeNull();
    expect(apostadores.parsearIdsEventos(Array.from({ length: 51 }, (_, i) => 'e' + i).join(','))).toBeNull();
  });
});
