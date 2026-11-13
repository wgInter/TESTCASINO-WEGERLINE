import { describe, it, expect } from 'vitest';
import odds from '../src/logica/transformar-odds.js';

const {
  claveMercado, claveCuota, detectarMercadosFaltantes, repartirCuotas,
  extraerMarcador, seleccionarResultadosPorActualizar, dividirEnLotes,
} = odds;

const evento = {
  id: 'e1', home_team: 'A', away_team: 'B',
  bookmakers: [{ title: 'Casa', markets: [{ key: 'h2h', outcomes: [
    { name: 'A', price: 1.5 }, { name: 'B', price: 2.5 },
  ] }] }],
};

describe('detectarMercadosFaltantes', () => {
  it('pide crear el mercado que no existe', () => {
    expect(detectarMercadosFaltantes([evento], new Map())).toHaveLength(1);
  });

  it('no repite un mercado que ya existe', () => {
    const existentes = new Map([[claveMercado('e1', 'h2h'), { id: 10 }]]);
    expect(detectarMercadosFaltantes([evento], existentes)).toHaveLength(0);
  });
});

describe('repartirCuotas', () => {
  it('separa cuotas nuevas de las que solo cambian de valor', () => {
    const mercados = new Map([[claveMercado('e1', 'h2h'), { id: 10 }]]);
    const cuotas = new Map([[claveCuota(10, 'Casa', 'A'), { id: 99 }]]);

    const { porCrear, porActualizar } = repartirCuotas([evento], mercados, cuotas, 'ahora');

    expect(porActualizar).toEqual([{ id: 99, valor: 1.5 }]);
    expect(porCrear).toHaveLength(1);
    expect(porCrear[0].nombre_seleccion).toBe('B');
  });
});

describe('extraerMarcador', () => {
  it('lee el marcador de los dos equipos', () => {
    const ev = { home_team: 'A', away_team: 'B', scores: [{ name: 'A', score: '2' }, { name: 'B', score: '0' }] };
    expect(extraerMarcador(ev)).toEqual({ marcador_local: 2, marcador_visitante: 0 });
  });

  it('caso límite: devuelve null si falta un equipo o el puntaje no es número', () => {
    expect(extraerMarcador({ home_team: 'A', away_team: 'B', scores: [{ name: 'A', score: '1' }] })).toBeNull();
    expect(extraerMarcador({ home_team: 'A', away_team: 'B', scores: [{ name: 'A', score: '1' }, { name: 'B', score: 'x' }] })).toBeNull();
    expect(extraerMarcador({ home_team: 'A', away_team: 'B' })).toBeNull();
  });
});

describe('seleccionarResultadosPorActualizar', () => {
  it('ignora los eventos ya finalizados y los que no existen en la base', () => {
    const jugado = (id) => ({
      id, completed: true, home_team: 'A', away_team: 'B',
      scores: [{ name: 'A', score: '1' }, { name: 'B', score: '1' }],
    });
    const estados = new Map([['a', 'programado'], ['b', 'finalizado']]);

    const resultado = seleccionarResultadosPorActualizar([jugado('a'), jugado('b'), jugado('c')], estados);

    expect(resultado.map((r) => r.id)).toEqual(['a']);
  });
});

describe('dividirEnLotes', () => {
  it('parte una lista en lotes del tamaño pedido', () => {
    expect(dividirEnLotes([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('caso límite: una lista vacía no genera lotes', () => {
    expect(dividirEnLotes([], 10)).toEqual([]);
  });
});
