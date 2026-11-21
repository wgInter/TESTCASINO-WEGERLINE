import { describe, it, expect } from 'vitest';
import {
  etiquetaTransaccion, filtrarApuestas, validarClave, nombreVisible, LONGITUD_MINIMA_CLAVE,
} from './cuenta';

const apuestas = [{ id: 1, estado: 'ganada' }, { id: 2, estado: 'perdida' }, { id: 3, estado: 'ganada' }];

describe('filtrarApuestas', () => {
  it('con "todas" devuelve la lista completa', () => {
    expect(filtrarApuestas(apuestas, 'todas')).toHaveLength(3);
  });
  it('filtra por estado', () => {
    expect(filtrarApuestas(apuestas, 'ganada')).toHaveLength(2);
  });
  it('devuelve lista vacía si ninguna coincide (caso límite)', () => {
    expect(filtrarApuestas(apuestas, 'pendiente')).toEqual([]);
  });
});

describe('validarClave', () => {
  it('rechaza una clave más corta que el mínimo', () => {
    expect(validarClave('a'.repeat(LONGITUD_MINIMA_CLAVE - 1))).not.toBeNull();
  });
  it('acepta una clave exactamente del mínimo (caso límite)', () => {
    expect(validarClave('a'.repeat(LONGITUD_MINIMA_CLAVE))).toBeNull();
  });
  it('rechaza una clave vacía', () => {
    expect(validarClave('')).not.toBeNull();
  });
});

describe('etiquetaTransaccion', () => {
  it('traduce los tipos conocidos', () => {
    expect(etiquetaTransaccion('pago_ganancia')).toBe('Pago de ganancia');
  });
  it('devuelve el mismo texto si el tipo es desconocido', () => {
    expect(etiquetaTransaccion('otro_tipo')).toBe('otro_tipo');
  });
});

describe('nombreVisible', () => {
  it('usa el nombre de usuario si existe', () => {
    expect(nombreVisible({ nombre_usuario: 'hsar', email: 'x@y.com' })).toBe('hsar');
  });
  it('si no hay nombre usa la parte local del correo', () => {
    expect(nombreVisible({ email: 'santiago@cuc.edu.co' })).toBe('santiago');
  });
});
