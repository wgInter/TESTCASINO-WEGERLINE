const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { manejarAsync } = require('../utils/manejarAsync');
const { ok, peticionInvalida } = require('../utils/responder');
const { oddsRequest } = require('../datos/oddsClient');
const eventos = require('../datos/eventosRepositorio');
const {
  REGION_POR_DEFECTO,
  MERCADO_POR_DEFECTO,
  FORMATO_CUOTAS_POR_DEFECTO,
} = require('../config/constantes');
const { esSportKeyValido, opcionesOddsValidas, esMarcadorValido } = require('../logica/validaciones');
const { syncTodos, liquidarTodos, syncUno, liquidarUno } = require('./manejadores-sync');

// Esta capa solo recibe y responde: la lógica vive en logica/ y las consultas en datos/.
const router = express.Router();
const soloAdmin = [requireAuth, requireAdmin];

// GET /api/eventos — eventos programados/en vivo con sus mercados y cuotas (público)
router.get('/eventos', manejarAsync(async (req, res) => {
  const { sportKey } = req.query;
  if (sportKey !== undefined && !esSportKeyValido(sportKey)) {
    return peticionInvalida(res, 'sportKey inválido');
  }
  ok(res, await eventos.listarEventosActivos(sportKey));
}));

// GET /api/sports y /api/odds/:sportKey consumen la cuota de The Odds API,
// y el front no los usa (usa /api/eventos). Por eso ahora son solo para admin.
router.get('/sports', ...soloAdmin, manejarAsync(async (_req, res) => {
  ok(res, await oddsRequest('/sports'));
}));

router.get('/odds/:sportKey', ...soloAdmin, manejarAsync(async (req, res) => {
  const { sportKey } = req.params;
  const {
    region = REGION_POR_DEFECTO,
    markets = MERCADO_POR_DEFECTO,
    oddsFormat = FORMATO_CUOTAS_POR_DEFECTO,
  } = req.query;

  if (!esSportKeyValido(sportKey)) return peticionInvalida(res, 'sportKey inválido');
  if (!opcionesOddsValidas({ region, markets, oddsFormat })) {
    return peticionInvalida(res, 'region, markets u oddsFormat inválidos');
  }

  ok(res, await oddsRequest(`/sports/${sportKey}/odds`, { regions: region, markets, oddsFormat }));
}));

// Sincronización y liquidación manuales (admin)
router.post('/admin/sync-all', ...soloAdmin, syncTodos);
router.post('/admin/settle-all', ...soloAdmin, liquidarTodos);
router.post('/admin/sync/:sportKey', ...soloAdmin, syncUno);
router.post('/admin/settle/:sportKey', ...soloAdmin, liquidarUno);

// POST /api/admin/eventos/:id/resultado — carga manual del marcador final, para
// mercados o deportes que /scores no cubre.
router.post('/admin/eventos/:id/resultado', ...soloAdmin, manejarAsync(async (req, res) => {
  const { id } = req.params;
  const { marcadorLocal, marcadorVisitante } = req.body;

  if (!esMarcadorValido(marcadorLocal) || !esMarcadorValido(marcadorVisitante)) {
    return peticionInvalida(res, 'marcadorLocal y marcadorVisitante deben ser enteros entre 0 y 999');
  }

  ok(res, await eventos.cargarResultadoManual(id, marcadorLocal, marcadorVisitante));
}));

module.exports = router;
