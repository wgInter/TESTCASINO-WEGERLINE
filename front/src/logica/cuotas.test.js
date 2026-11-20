import { describe, it, expect } from 'vitest';
import { alternarSeleccion, cuotasDeEvento, armarCuerpoApuesta } from './cuotas';

const sel = (cuotaId, eventoId, valor = 2) => ({ cuotaId, eventoId, valor });

describe('alternarSeleccion', () => {
  it('agrega una selección nueva', () => {
    expect(alternarSeleccion([], sel('c1', 'e1'))).toHaveLength(1);
  });

  it('quita la selección si se vuelve a elegir la misma cuota', () => {
    expect(alternarSeleccion([sel('c1', 'e1')], sel('c1', 'e1'))).toEqual([]);
  });

  it('reemplaza la cuota anterior del mismo partido', () => {
    const resultado = alternarSeleccion([sel('c1', 'e1')], sel('c2', 'e1'));
    expect(resultado).toHaveLength(1);
    expect(resultado[0].cuotaId).toBe('c2');
  });

  it('permite combinar partidos distintos', () => {
    expect(alternarSeleccion([sel('c1', 'e1')], sel('c2', 'e2'))).toHaveLength(2);
  });
});

describe('cuotasDeEvento', () => {
  it('devuelve undefined si el evento no tiene mercado h2h (caso límite)', () => {
    const r = cuotasDeEvento({ equipo_local: 'A', equipo_visitante: 'B', mercados: [] });
    expect(r.local).toBeUndefined();
  });

  it('encuentra local, empate y visitante por nombre', () => {
    const evento = {
      equipo_local: 'A', equipo_visitante: 'B',
      mercados: [{ clave: 'h2h', cuotas: [
        { id: 1, nombre_seleccion: 'A' }, { id: 2, nombre_seleccion: 'Draw' }, { id: 3, nombre_seleccion: 'B' },
      ] }],
    };
    const r = cuotasDeEvento(evento);
    expect([r.local.id, r.empate.id, r.visitante.id]).toEqual([1, 2, 3]);
  });
});

describe('armarCuerpoApuesta', () => {
  it('convierte el monto a número y deja solo el cuotaId', () => {
    expect(armarCuerpoApuesta([sel('c1', 'e1'), sel('c2', 'e2')], '500')).toEqual({
      monto: 500,
      selecciones: [{ cuotaId: 'c1' }, { cuotaId: 'c2' }],
    });
  });

  it('con boleto vacío manda una lista vacía (caso límite)', () => {
    expect(armarCuerpoApuesta([], '10').selecciones).toEqual([]);
  });
});
