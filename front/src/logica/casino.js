// Reglas de los juegos del casino. SIN React: se prueban con Vitest.
// El resultado real de cada juego lo decide SIEMPRE el servidor; aquí solo hay
// presentación (colores, formato, animación) y validaciones previas.
import { formatearDinero } from './formato';
import {
  AZAR_CENTRO, BLACKJACK_OBJETIVO, COLUMNAS_TABLERO, DESVIO_MAXIMO_CASILLAS, FILAS_TABLERO,
  GRADOS_VUELTA, MS_POR_SEGUNDO, VALOR_AS_ALTO, VALOR_AS_BAJO, VALOR_FIGURA,
  UMBRAL_MILES, VUELTAS_EXTRA_RULETA, VUELTAS_MINIMAS_RULETA,
} from '../constantes';

// ---------- Tragamonedas ----------
export const SIMBOLOS_SLOT = ['🍒', '🔔', '⭐', '💎', '7️⃣'];
export const PAGOS_SLOT = [
  '🍒🍒🍒 = x3', '🔔🔔🔔 = x5', '⭐⭐⭐ = x8', '💎💎💎 = x15', '7️⃣7️⃣7️⃣ = x40', 'Par = devuelve apuesta',
];

export function simbolosAlAzar(aleatorio = Math.random) {
  return [0, 1, 2].map(() => SIMBOLOS_SLOT[Math.floor(aleatorio() * SIMBOLOS_SLOT.length)]);
}

export function describirResultadoSlot(datos) {
  if (datos.ganancia > 0) {
    return {
      tipo: 'win',
      texto: datos.resultado === 'triple'
        ? `¡TRIPLE! Ganaste ${formatearDinero(datos.ganancia)}`
        : `Par — recuperas ${formatearDinero(datos.ganancia)}`,
    };
  }
  return { tipo: 'lose', texto: 'Sin premio esta vez.' };
}

// ---------- Ruleta ----------
export const RULETA_ORDEN = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
export const RULETA_ROJOS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
export const RULETA_FICHAS = [500, 1000, 5000, 10000, 25000];
export const RULETA_COLOR_HEX = { red: '#c92c46', black: '#171b26', green: '#159463' };
export const FICHA_INICIAL = 1000;
export const DURACION_GIRO_MS = 4400; // igual que la transición CSS de .rl-wheel.spinning
export const PASO_RULETA = GRADOS_VUELTA / RULETA_ORDEN.length;

export const APUESTAS_EXTERIORES = [
  { clave: 'dozen1', etiqueta: '1ra 12' }, { clave: 'dozen2', etiqueta: '2da 12' }, { clave: 'dozen3', etiqueta: '3ra 12' },
  { clave: 'low', etiqueta: '1-18' }, { clave: 'even', etiqueta: 'PAR' }, { clave: 'red', etiqueta: 'ROJO' },
  { clave: 'black', etiqueta: 'NEGRO' }, { clave: 'odd', etiqueta: 'IMPAR' }, { clave: 'high', etiqueta: '19-36' },
];

export const colorRuleta = (numero) => (numero === 0 ? 'green' : RULETA_ROJOS.has(numero) ? 'red' : 'black');

export function formatearFicha(valor) {
  return valor >= UMBRAL_MILES
    ? (valor / UMBRAL_MILES).toLocaleString('es-CO', { maximumFractionDigits: 1 }) + 'K'
    : String(valor);
}

export const totalApostado = (apuestas) => Object.values(apuestas).reduce((suma, monto) => suma + monto, 0);

// { 'num-17': 500, red: 1000 } -> lista que espera POST /api/casino/ruleta/spin.
export function armarApuestasRuleta(apuestas) {
  return Object.entries(apuestas).map(([clave, monto]) =>
    clave.startsWith('num-') ? { tipo: 'num', valor: Number(clave.slice(4)), monto } : { tipo: clave, monto }
  );
}

// Los 36 números del paño, con su fila y columna en la cuadrícula (el 0 va aparte).
export function celdasTablero() {
  const celdas = [];
  for (let fila = 0; fila < FILAS_TABLERO; fila++) {
    for (let columna = 0; columna < COLUMNAS_TABLERO; columna++) {
      celdas.push({ numero: columna * FILAS_TABLERO + (FILAS_TABLERO - fila), fila: fila + 1, columna: columna + 2 });
    }
  }
  return celdas;
}

export function gradienteRueda() {
  const partes = RULETA_ORDEN.map((numero, i) =>
    `${RULETA_COLOR_HEX[colorRuleta(numero)]} ${i * PASO_RULETA - PASO_RULETA / 2}deg ${i * PASO_RULETA + PASO_RULETA / 2}deg`
  );
  return `conic-gradient(${partes.join(',')})`;
}

// Gira siempre hacia adelante hasta que el número ganador quede bajo el puntero.
// Los dos "aleatorios" (0-1) entran como parámetro para poder probarla.
export function calcularRotacionRuleta(actual, numeroGanador, aleatorioA, aleatorioB) {
  const indice = RULETA_ORDEN.indexOf(numeroGanador);
  const desvio = (aleatorioA - AZAR_CENTRO) * PASO_RULETA * DESVIO_MAXIMO_CASILLAS;
  let objetivo = (-(indice * PASO_RULETA + desvio)) % GRADOS_VUELTA;
  if (objetivo < 0) objetivo += GRADOS_VUELTA;
  const vueltas = VUELTAS_MINIMAS_RULETA + Math.floor(aleatorioB * VUELTAS_EXTRA_RULETA);
  const base = actual - (actual % GRADOS_VUELTA);
  let nueva = base + vueltas * GRADOS_VUELTA + objetivo;
  if (nueva <= actual) nueva += GRADOS_VUELTA;
  return nueva;
}

// ---------- Blackjack ----------
export const ESTADOS_MESA_BJ = {
  esperando: 'Esperando apuestas...',
  apostando: 'Fase de apuestas',
  repartiendo: 'Repartiendo cartas...',
  turnos: 'En juego',
  dealer: 'Turno del dealer...',
  liquidando: 'Ronda terminada',
};
export const ETIQUETAS_RESULTADO_BJ = { gano: 'GANÓ', perdio: 'PERDIÓ', pasado: 'SE PASÓ', empate: 'EMPATE' };

export const colorPalo = (carta) => (carta.includes('♥') || carta.includes('♦') ? '' : 'black');

export function valorManoBlackjack(cartas) {
  let total = 0;
  let ases = 0;
  for (const carta of cartas) {
    const rango = carta.slice(0, -1);
    if (rango === 'A') { ases++; total += VALOR_AS_ALTO; }
    else if (['J', 'Q', 'K'].includes(rango)) total += VALOR_FIGURA;
    else total += Number(rango);
  }
  while (total > BLACKJACK_OBJETIVO && ases > 0) { total -= VALOR_AS_ALTO - VALOR_AS_BAJO; ases--; }
  return total;
}

export function estadoMesaBlackjack(mesa, ahora) {
  const texto = ESTADOS_MESA_BJ[mesa.estado] ?? mesa.estado;
  const segundos = mesa.estado === 'turnos' && mesa.turno_expira_en
    ? Math.max(0, Math.round((new Date(mesa.turno_expira_en) - ahora) / MS_POR_SEGUNDO))
    : null;
  return { texto, segundos };
}
