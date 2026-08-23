require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');
const { supabaseAdmin } = require('../supabaseClient');
const { requireAuth, requireAdmin } = require('../authMiddleware');

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.ODDS_API_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

app.use(cors());
app.use(express.json());

// Sirve el frontend (public/index.html). Necesario porque en Vercel todo
// el tráfico llega a esta función; Vercel ya no sirve /public por su cuenta.
app.use(express.static(path.join(__dirname, '..', 'public')));

if (!API_KEY) {
  console.warn('⚠️ Falta ODDS_API_KEY en el archivo .env');
}

if (!CRON_SECRET) {
  console.warn('⚠️ Falta CRON_SECRET en el archivo .env — rutas /api/cron/* rechazarán todo');
}

// Deportes/ligas activas del sitio. Los keys son los reales confirmados por
// GET /api/sports para esta cuenta de The Odds API (F1/Motorsport no está
// disponible en el plan actual, por eso no aparece aquí).
const ACTIVE_SPORTS = [
  'soccer_epl',
  'basketball_nba',
  'tennis_atp_cincinnati_open',
  'americanfootball_nfl',
  'mma_mixed_martial_arts',
];

const cache = new Map();
const CACHE_TTL = 20_000;

async function oddsRequest(path, query = {}) {
  const url = new URL(`https://api.the-odds-api.com/v4${path}`);
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') url.searchParams.set(key, value);
  });

  const cached = cache.get(url.toString());
  if (cached && Date.now() - cached.time < CACHE_TTL) return cached.data;

  const response = await fetch(url.toString());

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`The Odds API ${response.status}: ${body}`);
  }

  const data = await response.json();
  cache.set(url.toString(), { time: Date.now(), data });
  return data;
}

app.get('/api/sports', async (_req, res) => {
  try {
    res.json(await oddsRequest('/sports', { apiKey: API_KEY }));
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: error.message });
  }
});

app.get('/api/odds/:sportKey', async (req, res) => {
  try {
    const {
      sportKey
    } = req.params;

    const {
      region = 'eu',
      markets = 'h2h',
      oddsFormat = 'decimal'
    } = req.query;

    const data = await oddsRequest(`/sports/${sportKey}/odds`, {
      apiKey: API_KEY,
      regions: region,
      markets,
      oddsFormat
    });

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: error.message });
  }
});

// =========================================================
// USUARIO / SALDO
// =========================================================

// GET /api/usuarios/me — perfil + saldo del usuario autenticado
app.get('/api/usuarios/me', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('usuarios')
    .select('id, nombre_usuario, email, saldo, rol, estado, fecha_registro')
    .eq('id', req.user.id)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/transacciones — historial de movimientos del usuario
app.get('/api/transacciones', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('transacciones')
    .select('*')
    .eq('usuario_id', req.user.id)
    .order('creado_en', { ascending: false })
    .limit(100);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/admin/saldo/ajustar — depósito/retiro manual (solo admin, sin pasarela de pago aún)
// body: { usuarioId, monto, tipo: 'deposito' | 'retiro' }
app.post('/api/admin/saldo/ajustar', requireAuth, requireAdmin, async (req, res) => {
  const { usuarioId, monto, tipo } = req.body;

  if (!usuarioId || !monto || !['deposito', 'retiro'].includes(tipo)) {
    return res.status(400).json({ error: 'usuarioId, monto y tipo son requeridos' });
  }

  const montoConSigno = tipo === 'retiro' ? -Math.abs(monto) : Math.abs(monto);

  const { data, error } = await supabaseAdmin.rpc('ajustar_saldo', {
    p_usuario_id: usuarioId,
    p_monto: montoConSigno,
    p_tipo: tipo,
  });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// =========================================================
// CATÁLOGO DEPORTIVO (deportes, eventos, mercados, cuotas)
// =========================================================

// GET /api/eventos — eventos programados/en vivo con sus mercados y cuotas
app.get('/api/eventos', async (req, res) => {
  const { sportKey } = req.query;

  let query = supabaseAdmin
    .from('eventos')
    .select(`
      id, equipo_local, equipo_visitante, fecha_inicio, estado,
      marcador_local, marcador_visitante,
      deportes ( clave, nombre ),
      mercados (
        id, clave, descripcion,
        cuotas ( id, casa_apuestas, nombre_seleccion, valor, actualizado_en )
      )
    `)
    .in('estado', ['programado', 'en_vivo'])
    .order('fecha_inicio', { ascending: true });

  if (sportKey) query = query.eq('deportes.clave', sportKey);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// syncSport(sportKey, options) — trae deportes+eventos+cuotas reales desde
// The Odds API y los guarda/actualiza en deportes, eventos, mercados y cuotas.
async function syncSport(sportKey, { region = 'eu', markets = 'h2h', oddsFormat = 'decimal' } = {}) {
  const oddsEvents = await oddsRequest(`/sports/${sportKey}/odds`, {
    apiKey: API_KEY,
    regions: region,
    markets,
    oddsFormat,
  });

  const { data: deporte, error: deporteError } = await supabaseAdmin
    .from('deportes')
    .upsert({ clave: sportKey, nombre: sportKey }, { onConflict: 'clave' })
    .select()
    .single();
  if (deporteError) throw deporteError;

  let eventosCreados = 0, mercadosCreados = 0, cuotasCreadas = 0;

  for (const ev of oddsEvents) {
    const { error: eventoError } = await supabaseAdmin
      .from('eventos')
      .upsert({
        id: ev.id,
        deporte_id: deporte.id,
        equipo_local: ev.home_team,
        equipo_visitante: ev.away_team,
        fecha_inicio: ev.commence_time,
        estado: 'programado',
        actualizado_en: new Date().toISOString(),
      }, { onConflict: 'id' });
    if (eventoError) throw eventoError;
    eventosCreados++;

    for (const bookmaker of ev.bookmakers || []) {
      for (const mkt of bookmaker.markets || []) {
        let { data: mercado, error: mercadoSelError } = await supabaseAdmin
          .from('mercados')
          .select('id')
          .eq('evento_id', ev.id)
          .eq('clave', mkt.key)
          .maybeSingle();
        if (mercadoSelError) throw mercadoSelError;

        if (!mercado) {
          const { data: nuevoMercado, error: mercadoInsError } = await supabaseAdmin
            .from('mercados')
            .insert({ evento_id: ev.id, clave: mkt.key, descripcion: mkt.key })
            .select('id')
            .single();
          if (mercadoInsError) throw mercadoInsError;
          mercado = nuevoMercado;
          mercadosCreados++;
        }

        for (const outcome of mkt.outcomes || []) {
          const { data: existente } = await supabaseAdmin
            .from('cuotas')
            .select('id')
            .eq('mercado_id', mercado.id)
            .eq('casa_apuestas', bookmaker.title)
            .eq('nombre_seleccion', outcome.name)
            .maybeSingle();

          if (existente) {
            await supabaseAdmin
              .from('cuotas')
              .update({ valor: outcome.price, actualizado_en: new Date().toISOString() })
              .eq('id', existente.id);
          } else {
            await supabaseAdmin.from('cuotas').insert({
              mercado_id: mercado.id,
              casa_apuestas: bookmaker.title,
              nombre_seleccion: outcome.name,
              valor: outcome.price,
              actualizado_en: new Date().toISOString(),
            });
            cuotasCreadas++;
          }
        }
      }
    }
  }

  return { eventosCreados, mercadosCreados, cuotasCreadas };
}

// syncScores(sportKey, daysFrom) — trae resultados reales (marcador final) de
// partidos ya jugados desde The Odds API /scores y actualiza la tabla eventos.
// daysFrom: cuántos días hacia atrás buscar resultados (máximo 3 según la API).
async function syncScores(sportKey, daysFrom = 3) {
  const scores = await oddsRequest(`/sports/${sportKey}/scores`, {
    apiKey: API_KEY,
    daysFrom,
  });

  let eventosActualizados = 0;

  for (const ev of scores) {
    // la API solo manda "completed: true" cuando el partido ya terminó
    // y trae el array "scores" con el marcador de cada equipo
    if (!ev.completed || !Array.isArray(ev.scores)) continue;

    const localScore = ev.scores.find((s) => s.name === ev.home_team);
    const awayScore = ev.scores.find((s) => s.name === ev.away_team);
    if (!localScore || !awayScore) continue;

    const { data: eventoExistente } = await supabaseAdmin
      .from('eventos')
      .select('id, estado')
      .eq('id', ev.id)
      .maybeSingle();

    // si el evento no está en nuestra base, o ya estaba finalizado, no hay nada que hacer
    if (!eventoExistente || eventoExistente.estado === 'finalizado') continue;

    const { error } = await supabaseAdmin
      .from('eventos')
      .update({
        marcador_local: parseInt(localScore.score, 10),
        marcador_visitante: parseInt(awayScore.score, 10),
        estado: 'finalizado',
        actualizado_en: new Date().toISOString(),
      })
      .eq('id', ev.id);

    if (error) throw error;
    eventosActualizados++;
  }

  return { eventosActualizados };
}

// settlePendingBets() — recorre todas las apuestas 'pendiente' e intenta
// liquidarlas. liquidar_apuesta() en Supabase ya es segura de llamar aunque
// el partido de esa apuesta no haya terminado: simplemente no hace nada y
// devuelve la apuesta sin cambios en ese caso, así que no hay riesgo de
// liquidar antes de tiempo.
async function settlePendingBets() {
  const { data: pendientes, error } = await supabaseAdmin
    .from('apuestas')
    .select('id')
    .eq('estado', 'pendiente');

  if (error) throw error;

  let liquidadas = 0, siguenPendientes = 0, errores = 0;

  for (const apuesta of pendientes || []) {
    try {
      const { data, error: liquidarError } = await supabaseAdmin.rpc('liquidar_apuesta', {
        p_apuesta_id: apuesta.id,
      });
      if (liquidarError) throw liquidarError;

      if (data && data.estado !== 'pendiente') {
        liquidadas++;
      } else {
        siguenPendientes++;
      }
    } catch (err) {
      console.error(`Error liquidando apuesta ${apuesta.id}:`, err.message);
      errores++;
    }
  }

  return { totalPendientesRevisadas: (pendientes || []).length, liquidadas, siguenPendientes, errores };
}

// POST /api/admin/sync-all — versión manual/admin: sincroniza cuotas de
// TODOS los deportes activos (ACTIVE_SPORTS) en una sola llamada.
app.post('/api/admin/sync-all', requireAuth, requireAdmin, async (req, res) => {
  const resultados = {};
  for (const sportKey of ACTIVE_SPORTS) {
    try {
      resultados[sportKey] = await syncSport(sportKey);
    } catch (error) {
      console.error(`Error sincronizando ${sportKey}:`, error.message);
      resultados[sportKey] = { error: error.message };
    }
  }
  res.json(resultados);
});

// POST /api/admin/settle-all — versión manual/admin: trae resultados y
// liquida apuestas pendientes para TODOS los deportes activos.
app.post('/api/admin/settle-all', requireAuth, requireAdmin, async (req, res) => {
  const scoresPorDeporte = {};
  for (const sportKey of ACTIVE_SPORTS) {
    try {
      scoresPorDeporte[sportKey] = await syncScores(sportKey);
    } catch (error) {
      console.error(`Error trayendo scores de ${sportKey}:`, error.message);
      scoresPorDeporte[sportKey] = { error: error.message };
    }
  }
  const settleResult = await settlePendingBets();
  res.json({ scoresPorDeporte, ...settleResult });
});

// POST /api/cron/sync-all — versión para cron (Vercel o externo): sincroniza
// cuotas de todos los deportes activos. Autenticado con CRON_SECRET.
app.post('/api/cron/sync-all', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  const resultados = {};
  for (const sportKey of ACTIVE_SPORTS) {
    try {
      resultados[sportKey] = await syncSport(sportKey);
    } catch (error) {
      console.error(`Error sincronizando ${sportKey}:`, error.message);
      resultados[sportKey] = { error: error.message };
    }
  }
  res.json(resultados);
});

// POST /api/cron/settle-all — versión para cron (Vercel o externo): trae
// resultados y liquida apuestas pendientes para todos los deportes activos
// en una sola llamada. Pensada para el cron externo (cron-job.org) que
// corre cada 15 min, así solo se necesita UN job externo en vez de uno por
// deporte. Autenticado con CRON_SECRET.
app.post('/api/cron/settle-all', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  const scoresPorDeporte = {};
  for (const sportKey of ACTIVE_SPORTS) {
    try {
      scoresPorDeporte[sportKey] = await syncScores(sportKey);
    } catch (error) {
      console.error(`Error trayendo scores de ${sportKey}:`, error.message);
      scoresPorDeporte[sportKey] = { error: error.message };
    }
  }
  const settleResult = await settlePendingBets();
  res.json({ scoresPorDeporte, ...settleResult });
});

// POST /api/admin/sync/:sportKey — versión manual/admin para traer cuotas.
app.post('/api/admin/sync/:sportKey', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { sportKey } = req.params;
    const { region, markets, oddsFormat } = req.query;
    const resultado = await syncSport(sportKey, { region, markets, oddsFormat });
    res.json(resultado);
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: error.message });
  }
});

// POST /api/admin/settle/:sportKey — versión manual/admin: trae resultados
// reales y liquida todas las apuestas pendientes que ya puedan resolverse.
app.post('/api/admin/settle/:sportKey', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { sportKey } = req.params;
    const { daysFrom } = req.query;
    const scoresResult = await syncScores(sportKey, daysFrom ? Number(daysFrom) : undefined);
    const settleResult = await settlePendingBets();
    res.json({ ...scoresResult, ...settleResult });
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: error.message });
  }
});

// POST /api/cron/sync/:sportKey — versión para Vercel Cron Jobs (trae cuotas
// nuevas). Autenticado con CRON_SECRET, no con JWT de usuario.
app.post('/api/cron/sync/:sportKey', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    const { sportKey } = req.params;
    const resultado = await syncSport(sportKey);
    res.json(resultado);
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: error.message });
  }
});

// POST /api/cron/settle/:sportKey — versión para Vercel Cron Jobs: trae
// resultados reales de partidos jugados y liquida automáticamente todas las
// apuestas pendientes que ya puedan resolverse (paga o descuenta según toque).
// Autenticado con CRON_SECRET, no con JWT de usuario.
app.post('/api/cron/settle/:sportKey', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    const { sportKey } = req.params;
    const scoresResult = await syncScores(sportKey);
    const settleResult = await settlePendingBets();
    res.json({ ...scoresResult, ...settleResult });
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: error.message });
  }
});

// =========================================================
// APUESTAS
// =========================================================

// POST /api/apuestas — colocar una apuesta (simple = 1 selección, combinada = 2+)
// body: { monto, selecciones: [{ cuotaId }, ...] }
app.post('/api/apuestas', requireAuth, async (req, res) => {
  const { monto, selecciones } = req.body;

  if (!monto || !Array.isArray(selecciones) || selecciones.length === 0) {
    return res.status(400).json({ error: 'monto y selecciones (array) son requeridos' });
  }

  const seleccionesJson = selecciones.map((s) => ({ cuota_id: s.cuotaId }));

  const { data, error } = await supabaseAdmin.rpc('colocar_apuesta', {
    p_usuario_id: req.user.id,
    p_monto: monto,
    p_selecciones: seleccionesJson,
  });

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

// GET /api/apuestas — historial de apuestas del usuario, con sus selecciones
app.get('/api/apuestas', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('apuestas')
    .select(`
      id, tipo, monto, cuota_total, ganancia_potencial, estado, creado_en, resuelto_en,
      apuesta_selecciones (
        id, valor_cuota_congelado, resultado,
        cuotas ( nombre_seleccion, mercados ( clave, eventos ( equipo_local, equipo_visitante ) ) )
      )
    `)
    .eq('usuario_id', req.user.id)
    .order('creado_en', { ascending: false })
    .limit(100);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/admin/apuestas/:id/liquidar — intenta liquidar una apuesta puntual (solo admin)
app.post('/api/admin/apuestas/:id/liquidar', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabaseAdmin.rpc('liquidar_apuesta', {
    p_apuesta_id: id,
  });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// GET /api/admin/apuestas/pendientes — apuestas por liquidar (solo admin)
app.get('/api/admin/apuestas/pendientes', requireAuth, requireAdmin, async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from('apuestas')
    .select('*')
    .eq('estado', 'pendiente')
    .order('creado_en', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/admin/eventos/:id/resultado — carga manual del marcador final de
// un evento (solo admin). Sigue disponible por si algún mercado/deporte no
// está cubierto por syncScores (mercados distintos a h2h, deportes sin
// soporte de /scores en The Odds API, etc.)
app.post('/api/admin/eventos/:id/resultado', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { marcadorLocal, marcadorVisitante } = req.body;

  if (marcadorLocal === undefined || marcadorVisitante === undefined) {
    return res.status(400).json({ error: 'marcadorLocal y marcadorVisitante son requeridos' });
  }

  const { data, error } = await supabaseAdmin
    .from('eventos')
    .update({
      marcador_local: marcadorLocal,
      marcador_visitante: marcadorVisitante,
      estado: 'finalizado',
      actualizado_en: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// En local (npm run dev) levantamos un servidor normal.
// En Vercel, este archivo se exporta como handler serverless y
// nunca se llama a app.listen().
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`WAGERLINE backend (modo local): http://localhost:${PORT}`);
  });
}

module.exports = app;
