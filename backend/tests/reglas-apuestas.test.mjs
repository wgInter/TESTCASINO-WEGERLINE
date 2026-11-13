import { describe, it, expect } from 'vitest';
import reglas from '../src/logica/reglas-apuestas.js';

const { calcularCuotaTotal, calcularGananciaPotencial, validarMonto, validarSelecciones, validarApuesta } = reglas;

const ID_A = '11111111-1111-4111-8111-111111111111';
const ID_B = '22222222-2222-4222-8222-222222222222';

describe('calcularCuotaTotal', () => {
  it('multiplica las cuotas de una combinada', () => {
    expect(calcularCuotaTotal([1.5, 2, 3])).toBe(9);
  });

  it('con una sola cuota devuelve esa misma cuota', () => {
    expect(calcularCuotaTotal([1.85])).toBe(1.85);
  });

  it('caso límite: sin cuotas devuelve 1, el neutro del producto', () => {
    expect(calcularCuotaTotal([])).toBe(1);
  });

  it('caso límite: no arrastra el error de decimales de JavaScript', () => {
    // 1.1 * 1.1 en JavaScript da 1.2100000000000002
    expect(calcularCuotaTotal([1.1, 1.1])).toBe(1.21);
  });
});

describe('calcularGananciaPotencial', () => {
  it('es monto por cuota total', () => {
    expect(calcularGananciaPotencial(10000, 2.5)).toBe(25000);
  });

  it('redondea a 2 decimales', () => {
    expect(calcularGananciaPotencial(10, 1.333)).toBe(13.33);
  });
});

describe('validarMonto', () => {
  it('acepta un monto normal', () => {
    expect(validarMonto(5000)).toBeNull();
  });

  it('rechaza cero y negativos', () => {
    expect(validarMonto(0)).not.toBeNull();
    expect(validarMonto(-50)).not.toBeNull();
  });

  it('rechaza lo que no es un número (texto, NaN, Infinity)', () => {
    expect(validarMonto('100')).not.toBeNull();
    expect(validarMonto(NaN)).not.toBeNull();
    expect(validarMonto(Infinity)).not.toBeNull();
  });

  it('rechaza más de 2 decimales y montos gigantes', () => {
    expect(validarMonto(10.123)).not.toBeNull();
    expect(validarMonto(1e12)).not.toBeNull();
  });
});

describe('validarSelecciones y validarApuesta', () => {
  it('acepta selecciones con cuotaId válido', () => {
    expect(validarSelecciones([{ cuotaId: ID_A }, { cuotaId: ID_B }])).toBeNull();
  });

  it('rechaza lista vacía, que no sea arreglo, o ids que no son uuid', () => {
    expect(validarSelecciones([])).not.toBeNull();
    expect(validarSelecciones('x')).not.toBeNull();
    expect(validarSelecciones([{ cuotaId: 'abc' }])).not.toBeNull();
  });

  it('rechaza repetir la misma cuota', () => {
    expect(validarSelecciones([{ cuotaId: ID_A }, { cuotaId: ID_A }])).not.toBeNull();
  });

  it('validarApuesta revisa monto y selecciones juntos', () => {
    expect(validarApuesta({ monto: 1000, selecciones: [{ cuotaId: ID_A }] })).toBeNull();
    expect(validarApuesta({ monto: -1, selecciones: [{ cuotaId: ID_A }] })).not.toBeNull();
    expect(validarApuesta(undefined)).not.toBeNull();
  });
});
