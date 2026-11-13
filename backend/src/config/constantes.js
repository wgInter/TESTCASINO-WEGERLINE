// Constantes con nombre: ningún número ni string "mágico" suelto en el código.
// Si una regla cambia, se cambia aquí y en ninguna otra parte.

// Deportes/ligas activas del sitio (keys reales de The Odds API).
const DEPORTES_ACTIVOS = [
  'soccer_epl',
  'basketball_nba',
  'tennis_atp_cincinnati_open',
  'americanfootball_nfl',
  'mma_mixed_martial_arts',
];

// Caché en memoria de las respuestas de The Odds API (milisegundos).
const CACHE_TTL_MS = 20_000;

// Cuántas apuestas se liquidan en paralelo para no saturar a Supabase.
const TAMANO_LOTE_LIQUIDACION = 10;

// Nombre que usa The Odds API para el empate en mercados h2h.
const SELECCION_EMPATE = 'Draw';

const ESTADOS_EVENTO = Object.freeze({
  PROGRAMADO: 'programado',
  EN_VIVO: 'en_vivo',
  FINALIZADO: 'finalizado',
});

const ESTADOS_APUESTA = Object.freeze({
  PENDIENTE: 'pendiente',
  GANADA: 'ganada',
  PERDIDA: 'perdida',
  ANULADA: 'anulada',
});

const ROLES = Object.freeze({
  ADMIN: 'admin',
  USUARIO: 'usuario',
});

const TIPOS_AJUSTE_SALDO = Object.freeze(['deposito', 'retiro']);

// The Odds API
const ODDS_API_URL = 'https://api.the-odds-api.com/v4';
const REGION_POR_DEFECTO = 'eu';
const MERCADO_POR_DEFECTO = 'h2h';
const FORMATO_CUOTAS_POR_DEFECTO = 'decimal';

// /scores solo permite buscar resultados hasta 3 días hacia atrás.
const DIAS_MAXIMOS_SCORES = 3;

// Tope razonable para un marcador cargado a mano por un admin.
const MARCADOR_MAXIMO = 999;

// Dinero y apuestas
const MONTO_MINIMO = 1;
const MONTO_MAXIMO = 100_000_000;
const DECIMALES_DINERO = 2;
const DECIMALES_CUOTA = 4;
const MAXIMO_SELECCIONES = 20;
const LIMITE_HISTORIAL = 100;
const MAXIMO_EVENTOS_APOSTADORES = 50;

// Usuarios
const NOMBRE_USUARIO_MAXIMO = 40;
const TIPO_AJUSTE_RETIRO = 'retiro';

// Blackjack
const BLACKJACK_ASIENTOS = 5;
const BLACKJACK_TICK_MINIMO_MS = 1000; // el tick es público: se ignora si llega más seguido
const BLACKJACK_TICK_MAXIMO_MESAS = 100; // tope de mesas recordadas por el limitador

// Ruleta
const RULETA_NUMERO_MAXIMO = 36;
const RULETA_TIPO_NUMERO = 'num';
const RULETA_APUESTAS_EXTERNAS = Object.freeze([
  'dozen1', 'dozen2', 'dozen3', 'low', 'high', 'even', 'odd', 'red', 'black',
]);
// Una apuesta por casilla: números 0..36 más las apuestas externas.
const RULETA_MAXIMO_APUESTAS = RULETA_NUMERO_MAXIMO + 1 + RULETA_APUESTAS_EXTERNAS.length;

// Códigos HTTP usados en la API.
const HTTP = Object.freeze({
  OK: 200,
  CREADO: 201,
  PETICION_INVALIDA: 400,
  NO_AUTENTICADO: 401,
  PROHIBIDO: 403,
  NO_ENCONTRADO: 404,
  ERROR_SERVIDOR: 500,
  PASARELA_FALLIDA: 502,
});

module.exports = {
  DEPORTES_ACTIVOS,
  CACHE_TTL_MS,
  TAMANO_LOTE_LIQUIDACION,
  SELECCION_EMPATE,
  ESTADOS_EVENTO,
  ESTADOS_APUESTA,
  ROLES,
  TIPOS_AJUSTE_SALDO,
  ODDS_API_URL,
  REGION_POR_DEFECTO,
  MERCADO_POR_DEFECTO,
  FORMATO_CUOTAS_POR_DEFECTO,
  DIAS_MAXIMOS_SCORES,
  MARCADOR_MAXIMO,
  MONTO_MINIMO,
  MONTO_MAXIMO,
  DECIMALES_DINERO,
  DECIMALES_CUOTA,
  MAXIMO_SELECCIONES,
  LIMITE_HISTORIAL,
  MAXIMO_EVENTOS_APOSTADORES,
  NOMBRE_USUARIO_MAXIMO,
  TIPO_AJUSTE_RETIRO,
  BLACKJACK_ASIENTOS,
  BLACKJACK_TICK_MINIMO_MS,
  BLACKJACK_TICK_MAXIMO_MESAS,
  RULETA_NUMERO_MAXIMO,
  RULETA_TIPO_NUMERO,
  RULETA_APUESTAS_EXTERNAS,
  RULETA_MAXIMO_APUESTAS,
  HTTP,
};
