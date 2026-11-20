import { describe, it, expect } from 'vitest';
import { abreviar, formatearDinero } from './formato';

describe('abreviar', () => {
  it('toma las iniciales, máximo 3, en mayúscula', () => {
    expect(abreviar('real madrid club de futbol')).toBe('RMC');
  });

  it('devuelve cadena vacía si no hay nombre (caso límite)', () => {
    expect(abreviar(undefined)).toBe('');
  });
});

describe('formatearDinero', () => {
  it('muestra cero con dos decimales', () => {
    expect(formatearDinero(0)).toBe('$0,00');
  });
});
