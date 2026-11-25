// Números con nombre del front: ningún umbral ni tiempo queda suelto dentro del código.
// (Las reglas de negocio de verdad —monto mínimo, cuota total, ganancia— viven solo en el back.)

// ---------- Blackjack ----------
export const BLACKJACK_OBJETIVO = 21;   // pasarse de este valor pierde la mano
export const VALOR_AS_ALTO = 11;        // el As vale 11 mientras no te pases
export const VALOR_AS_BAJO = 1;         // ...y baja a 1 si te pasarías
export const VALOR_FIGURA = 10;         // J, Q y K

// ---------- Ruleta ----------
export const GRADOS_VUELTA = 360;
export const FILAS_TABLERO = 3;         // el paño tiene 3 filas...
export const COLUMNAS_TABLERO = 12;     // ...y 12 columnas de números (36 en total)
export const VUELTAS_MINIMAS_RULETA = 7;
export const VUELTAS_EXTRA_RULETA = 2;  // vueltas adicionales al azar (0 o 1)
export const AZAR_CENTRO = 0.5;         // centro del rango de Math.random()
export const DESVIO_MAXIMO_CASILLAS = 0.5; // la bola puede caer a media casilla del centro
export const MARGEN_SEGURIDAD_GIRO_MS = 600;
export const PAUSA_GIRO_AUTOMATICO_MS = 900;

// ---------- Tragamonedas ----------
export const VELOCIDAD_ANIMACION_SLOT_MS = 90;
export const ESPERA_RESULTADO_SLOT_MS = 700;

// ---------- Mesa de blackjack ----------
export const INTERVALO_RELOJ_MESA_MS = 1000;
export const DURACION_MENSAJE_ERROR_MS = 4000;

// ---------- Montos ----------
export const MONTO_INICIAL = 1000;   // valor de partida de los campos de monto (comodidad de la interfaz)
export const UMBRAL_MILES = 1000;    // desde aquí las fichas se muestran como 1K, 5K...

// ---------- Tiempo ----------
export const MS_POR_SEGUNDO = 1000;
