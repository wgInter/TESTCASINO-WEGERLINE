# WAGERLINE

Casa de apuestas deportivas con casino académico: se juega con fichas de práctica, sin dinero real. Permite ver eventos con sus cuotas, armar un boleto, apostar, consultar el historial y jugar tragamonedas, ruleta y blackjack. Proyecto final de Buenas Prácticas de Desarrollo de Software (CUC).

## Integrantes

| Integrante | De qué se encargó |
|---|---|
| Hernán Santiago Alvarino (HSAR) | Rutas de eventos, sincronización y liquidación (`/eventos`, `/sports`, `/odds`, `/admin/sync*`, `/admin/settle*`, `/cron/*`), despliegue en AWS (S3 y EC2) |
| José Agustín Barranco Muñoz | Back por capas de apuestas, usuarios, casino y blackjack, con validaciones, constantes y pruebas. |
| Jeam Paul Serna Salgado | Front en React: componentes, páginas de inicio, cuenta y casino, y sus pruebas. |

**Cómo trabajamos:** `main` es la copia estable, `pruebas` es donde se verifica antes de pasar a `main` y `dev` integra lo que sube cada integrante. Cada uno trabaja en sus propias ramas `feature/...`, los commits siguen Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`) y todo entra a `dev` por Pull Request con una revisión de fondo de otro integrante, fusionado con *merge commit*.

## Tecnologías

- **Front-end:** React 18 + Vite, Vitest.
- **Back-end:** Node.js 22 o superior + Express, Vitest.
- **Base de datos y autenticación:** Supabase (PostgreSQL, Auth, RLS, funciones RPC y Realtime).
- **Datos deportivos:** The Odds API.
- **Infraestructura:** AWS, con S3 para el front y EC2 para la API.

```
backend/   API: rutas/ (reciben y responden), logica/ (reglas sin req ni res), datos/ (repositorios hacia Supabase)
front/     React: componentes/, funcionalidades/, hooks/, logica/ (reglas puras), api.js (único punto de contacto con el back)
docs/      ADR-001 (diseño del almacenamiento en S3), guía de despliegue y script de la instancia
db/        funciones SQL (ruleta_spin.sql)
```

> Las carpetas `api/`, `public/`, `sistema-academico/` y los archivos sueltos de la raíz son del monolito anterior; `backend/` y `front/` los reemplazan.

## Cómo levantarlo en local

Requisitos: Node 22 o superior y un proyecto de Supabase.

```bash
git clone https://github.com/wgInter/TESTCASINO-WEGERLINE.git
cd TESTCASINO-WEGERLINE
git switch dev

# Back-end (puerto 3000)
cd backend
npm install
cp .env.example .env        # y rellenar los valores (tabla de abajo)
npm run dev

# Front-end (puerto 5173), en otra terminal
cd front
npm install
npm run dev
```

Abrir `http://localhost:5173`. Comprobar el back en `http://localhost:3000/api/salud` (debe responder `{"estado":"ok"}`). Si cambias un `.env`, detén y vuelve a arrancar el proceso: no se relee solo.

**Variables de entorno del back (`backend/.env`, no se sube a Git):**

| Variable | Qué es y de dónde se saca |
|---|---|
| `SUPABASE_URL` | URL del proyecto (Supabase → Project Settings → API) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave **secreta** de servidor (API Keys → Secret key). Nunca va en el front |
| `SUPABASE_PUBLISHABLE_KEY` | Clave pública (API Keys → Publishable key) |
| `ODDS_API_KEY` | Clave de The Odds API |
| `CRON_SECRET` | Contraseña que protege las rutas `/api/cron/*` |
| `CORS_ORIGIN` | Origen permitido del front. En local `http://localhost:5173`; en producción la URL del sitio de S3, sin barra final. Varios se separan con comas |
| `PORT` | Puerto de la API (3000) |

**Variables del front (`front/.env.development` y `front/.env.production`):**

| Variable | Qué es |
|---|---|
| `VITE_API_URL` | Dirección de la API (`http://localhost:3000` en local; la IP de la EC2 en producción) |
| `VITE_SUPABASE_URL` | URL del proyecto de Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clave pública (publishable) de Supabase |

La dirección de la API se lee solo en `front/src/api.js`; ningún componente la escribe.

## Endpoints de la API

Todos cuelgan de `/api`. Las rutas marcadas con sesión requieren `Authorization: Bearer <token de Supabase>`.

| Método | Ruta | Qué hace | Respuesta |
|---|---|---|---|
| GET | `/salud` | Comprueba que la API responde | 200 · objeto |
| GET | `/eventos` | Lista eventos activos con sus cuotas (`?sportKey=` opcional) | 200 · arreglo |
| GET | `/eventos/apostadores?ids=` | Personas distintas que apostaron en cada evento | 200 · objeto · 400 |
| POST | `/apuestas/cotizar` | Calcula cuota total y ganancia potencial | 200 · objeto · 400 |
| POST | `/apuestas` | Coloca una apuesta (sesión) | 201 · apuesta · 400 |
| GET | `/apuestas` | Historial del usuario (sesión) | 200 · arreglo |
| GET | `/usuarios/me` | Perfil y saldo (sesión) | 200 · objeto |
| PATCH | `/usuarios/me` | Cambia el nombre de usuario (sesión) | 200 · 400 |
| GET | `/transacciones` | Movimientos del usuario (sesión) | 200 · arreglo |
| POST | `/casino/slot/spin` | Gira el tragamonedas (sesión) | 200 · 400 |
| POST | `/casino/ruleta/spin` | Gira la ruleta con una lista de apuestas (sesión) | 200 · 400 |
| GET | `/blackjack/mesa` | Estado público de la mesa | 200 · objeto |
| POST | `/blackjack/tick` | Avanza el reloj de la mesa (limitado en frecuencia) | 200 |
| POST | `/blackjack/sentarse`, `/pararse`, `/apostar`, `/pedir-carta`, `/plantarse` | Acciones del jugador (sesión) | 200 · 400 |
| GET | `/admin/apuestas/pendientes` | Apuestas por liquidar (admin) | 200 · arreglo |
| POST | `/admin/apuestas/:id/liquidar` | Liquida una apuesta (admin) | 200 · 400 |
| POST | `/admin/saldo/ajustar` | Depósito o retiro manual (admin) | 200 · 400 |
| GET | `/sports` | Lista los deportes de The Odds API (admin) | 200 · arreglo |
| GET | `/odds/:sportKey` | Cuotas directas de The Odds API; acepta `?region=`, `?markets=` y `?oddsFormat=` (admin) | 200 · objeto · 400 |
| POST | `/admin/sync-all` | Sincroniza eventos y cuotas de todos los deportes activos (admin) | 200 · objeto |
| POST | `/admin/sync/:sportKey` | Sincroniza un deporte; acepta `?region=`, `?markets=` y `?oddsFormat=` (admin) | 200 · objeto · 400 |
| POST | `/admin/settle-all` | Liquida las apuestas pendientes de todos los deportes (admin) | 200 · objeto |
| POST | `/admin/settle/:sportKey` | Trae los marcadores de un deporte y liquida; acepta `?daysFrom=` entre 1 y 3 (admin) | 200 · objeto · 400 |
| POST | `/admin/eventos/:id/resultado` | Carga manual del marcador final (`marcadorLocal`, `marcadorVisitante`) (admin) | 200 · objeto · 400 |
| POST | `/cron/sync-all`, `/cron/settle-all`, `/cron/sync/:sportKey`, `/cron/settle/:sportKey` | Lo mismo que las rutas `/admin/*` equivalentes, para un cron; requieren `Authorization: Bearer <CRON_SECRET>` | 200 · objeto · 400 · 401 |

Los errores de validación responden con el formato `{ "error": "mensaje claro" }`. Las rutas de sesión responden 401 si falta o vence el token, y las de admin responden 403 si el usuario no es administrador.

## Cómo correr las pruebas

```bash
cd backend && npm test      # 33 pruebas en 3 archivos (reglas de apuestas, casino y usuarios, y transformación de cuotas)
cd front && npm test        # 39 pruebas en 4 archivos (boleto, blackjack, ruleta, tragamonedas, cuenta y formato)
```

Las pruebas cubren reglas de negocio y casos límite (monto en el mínimo, lista vacía, As que baja de 11 a 1, contraseña de longitud exacta). Las reglas viven en `logica/` y no dependen de React ni de Express, por eso se prueban sin levantar nada.

## Despliegue

El front compilado se sirve desde un bucket público de S3 y la API corre en una instancia EC2. Los pasos completos están en [`docs/despliegue.md`](docs/despliegue.md) y el script de la instancia en [`docs/user-data.sh`](docs/user-data.sh).

| Recurso | Valor |
|---|---|
| Sitio (React compilado) | Bucket `cuc-bp-alvarino-sitio-2026`, alojamiento estático, us-east-1 |
| URL del sitio | http://cuc-bp-alvarino-sitio-2026.s3-website-us-east-1.amazonaws.com |
| Credenciales | Bucket privado `cuc-bp-alvarino-privado-2026`, carpeta `credenciales/` (responde 403 desde internet) |
| API | EC2 `wagerline-api` (t3.micro, Amazon Linux 2023), puerto 3000 |
| Security Group | Una sola regla de entrada: TCP 3000, sin SSH |

Resumen del procedimiento:

1. Subir el `.env` del back al bucket privado (`credenciales/backend.env`) con `CORS_ORIGIN` igual a la URL del sitio de S3, sin barra final y con el nombre de la variable una sola vez.
2. Lanzar la EC2 con el script de `docs/user-data.sh`: instala Node, baja el repo (`dev`), lee el `.env` desde S3 con el rol del laboratorio y deja la API como servicio.
3. Comprobar `http://IP:3000/api/salud` y el CORS con `curl.exe -i -H "Origin: <URL del sitio>" http://IP:3000/api/salud`.
4. En `front/`, crear `.env.production` con `VITE_API_URL=http://IP:3000`, hacer `npm run build` y subir el **contenido** de `dist/` al bucket del sitio.
5. Tomar las evidencias y **terminar la instancia** (no dejarla encendida).

**Estado:** el despliegue se probó y se documentó el 23 de noviembre de 2026 (evidencias en `WAGERLINE_Evidencias_Despliegue.pdf`, parte del documento de entrega). Al cerrar los recursos la instancia se termina, así que el sitio de S3 sigue abierto pero ya no puede traer datos de la API; para volver a desplegar se repiten los pasos de arriba.

Notas:
- El sitio usa HTTP (endpoint web de S3). La IP pública cambia si la instancia se detiene, por lo que hay que recompilar el front.
- Sin SSH, la instancia se administra con el Administrador de sesiones de SSM. Para cambiar el `.env`: subir el archivo nuevo a `credenciales/`, copiarlo con `aws s3 cp` a `/opt/wagerline/backend/.env` y ejecutar `sudo systemctl restart wagerline`.
- En EC2 no corre el cron diario de sincronización; los eventos se actualizan llamando a las rutas de `/admin/sync*`, y mientras tanto las cuotas pueden estar desactualizadas.

### Seguridad y dependencias

- Validación en el servidor en todas las rutas que reciben datos; los secretos viven fuera de Git (`.env` en el `.gitignore` y `.env.example` con valores de mentira); CORS restringido al sitio de S3; Security Group con una sola regla y SSH cerrado.
- La publishable key es pública por diseño: lo que protege los datos son las políticas RLS de Supabase. La clave secreta solo vive en el `.env` del back y en el bucket privado.
- **npm audit (front):** 6 vulnerabilidades (3 moderate, 1 high, 2 critical), todas en dependencias de desarrollo (vite/esbuild y vitest). No entran al build que se sube a S3. No se aplicó `npm audit fix --force` porque implica actualizar a versiones mayores con cambios incompatibles.
- **npm audit (back):** `npm audit` (back, 23/11/2026): reporta 6 vulnerabilidades (3 moderadas, 1 alta, 2 críticas), todas en `vitest` y sus dependencias (herramienta de pruebas, solo desarrollo); `npm audit --omit=dev` reporta 0, así que no afectan producción. Corregirlas exige actualizar vitest a una versión mayor (cambio incompatible).
