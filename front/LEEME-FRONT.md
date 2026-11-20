# Cómo pegar esta carpeta

1. En tu rama `feature/front-react` (creada desde `dev` con el back de José ya fusionado), **reemplaza** `src/` por el de este paquete
   y copia a la raíz del front: `package.json`, `package-lock.json`, `vite.config.js`, `index.html`, `.gitignore`,
   `.env.example`, `.env.development`, `.env.production.example`.
2. Borra `src/funcionalidades/notas` (es el ejemplo de la guía, no de WAGERLINE).
3. Back: `npm install` y `npm run dev` (puerto 3000 por defecto, `src/servidor.js`). Front: `npm install` y `npm run dev`.
4. `npm test` → 39 pruebas en verde.

## Cambios por el back de José (rutas/apuestas.js)
- **Puerto:** el back escucha en `process.env.PORT || 3000`, así que `VITE_API_URL` ahora es `http://localhost:3000`.
- **Cotización:** el boleto ya NO calcula la cuota total ni la ganancia; llama a `POST /api/apuestas/cotizar`
  (con espera de 300 ms al escribir). Se eliminaron del front `calcularCuotaTotal`, `calcularGananciaPotencial`,
  `validarMonto` y `MONTO_MINIMO`: la regla vive solo en el back (ya no hay constante duplicada).
- **Apostadores:** "Más deportes" vuelve a mostrar "👥 N apostando" con `GET /api/eventos/apostadores?ids=...`
  (lo traía el index.html original y se me había quedado fuera).
- **Resumen:** se quitaron las tarjetas de resumen de Mi cuenta porque `GET /api/apuestas/resumen` no existe en el back de José.

## Contrato con el back (revisado contra responder.js, app.js, usuarios.js, casino.js y blackjack.js)
- `ok(res, datos)` responde el JSON tal cual y los errores vienen como `{ error: "mensaje" }`: es lo que lee `pedir()` en `api.js`.
- El router cuelga de `/api` (app.js) y el 404 también responde `{ error }`.
- **Ruleta:** ahora usa `POST /api/casino/ruleta/spin` con `{ apuestas: [...] }` (ya no llama a Supabase directo).
  Se asume que responde `{ numero_ganador, ganancia_total, saldo_nuevo }`, igual que la función SQL.
- **Blackjack:** el tick público se limita en el back (si llega antes del mínimo responde `{ ok: true, omitido: true }`; no es error).
- Falta ver `config/cors.js` para confirmar que el CORS quede restringido al bucket en la entrega.

## Qué migró del index.html original
| Original | Ahora |
|---|---|
| ticker de cuotas | `componentes/Ticker.jsx` |
| renderLive / renderUpcoming / renderFeatured | `funcionalidades/inicio` + `TarjetaEvento`, `EventoDestacado` |
| renderMultiDeporte | `funcionalidades/masdeportes` (con apostadores) |
| renderSlip (boleto) | `componentes/BoletoApuestas.jsx` + `useCotizacion` |
| login + registro | `componentes/FormularioLogin.jsx` |
| perfil (nombre, contraseña, saldo) | `funcionalidades/cuenta/PerfilUsuario.jsx` |
| mis apuestas + filtros / movimientos | `ListaApuestas.jsx`, `ListaMovimientos.jsx` |
| tragamonedas / ruleta / blackjack | `funcionalidades/casino/*` |

## Para la entrega (DRY, medición para el PDF)
| Pieza reutilizada | Dónde se usa |
|---|---|
| `Pestanas` | Navbar, deportes de Inicio, Más deportes, juegos del Casino, Mi cuenta (x2) |
| `FilaCuotas` | TarjetaEvento, EventoDestacado |
| `ListaEventos` / `TarjetaEvento` | Inicio, Más deportes |
| `EstadoDatos` | ListaEventos, apuestas, movimientos |
| `CeldaApuesta` | 0, 36 números y 9 apuestas exteriores de la ruleta |
| `useDatos` (hook) | eventos, ticker, perfil, apostadores, apuestas, movimientos |
| `pedir()` en `api.js` | todas las llamadas al back; la URL sale de `VITE_API_URL` |
| `armarCuerpoApuesta` | cotizar y colocar apuesta (un solo formato de cuerpo) |

Regla compartida front/back: monto mínimo, cuota total y ganancia viven SOLO en el back (`/apuestas/cotizar`).
Antes había una constante `MONTO_MINIMO` duplicada y se eliminó: esa es una "copia eliminada" para la tabla de medición.

## Pruebas (39)
`cuotas.test.js` (boleto), `casino.test.js` (blackjack, ruleta, tragamonedas), `cuenta.test.js`, `formato.test.js`.
Evidencia de la prueba que falla (verificado): en `src/logica/casino.js`, dentro de `valorManoBlackjack`,
cambia `while (total > 21 && ases > 0)` por `while (total >= 21 && ases > 0)`, corre `npm test`, captura las
2 pruebas rojas ("cuenta el As como 11..." y "baja el As a 1...") y devuélvelo.

## Despliegue
Crea `.env.production` (copiando `.env.production.example`) con la IP de la EC2 y el puerto, luego `npm run build`
y sube el **contenido** de `dist/` al bucket S3. El Security Group debe abrir solo el puerto de la API.
