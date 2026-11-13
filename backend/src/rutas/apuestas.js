const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { manejarAsync } = require('../utils/manejarAsync');
const { ok, creado, peticionInvalida } = require('../utils/responder');
const apuestas = require('../datos/apuestasRepositorio');
const {
  calcularCuotaTotal,
  calcularGananciaPotencial,
  validarApuesta,
} = require('../logica/reglas-apuestas');
const { contarApostadoresPorEvento, parsearIdsEventos } = require('../logica/apostadores');
const { esIdentificadorValido } = require('../logica/validaciones');

const router = express.Router();
const soloAdmin = [requireAuth, requireAdmin];

// POST /api/apuestas/cotizar — calcula cuota total y ganancia potencial.
// La regla vive SOLO en el back: el front deja de calcularla por su cuenta.
// body: { monto, selecciones: [{ cuotaId }, ...] }  (público, no toca saldo)
router.post('/apuestas/cotizar', manejarAsync(async (req, res) => {
  const error = validarApuesta(req.body);
  if (error) return peticionInvalida(res, error);

  const { monto, selecciones } = req.body;
  const ids = selecciones.map((s) => s.cuotaId);
  const cuotas = await apuestas.buscarCuotasPorIds(ids);
  if (cuotas.length !== ids.length) return peticionInvalida(res, 'alguna cuota no existe');

  const cuotaTotal = calcularCuotaTotal(cuotas.map((c) => Number(c.valor)));
  ok(res, { cuotaTotal, gananciaPotencial: calcularGananciaPotencial(monto, cuotaTotal) });
}));

// POST /api/apuestas — colocar una apuesta (simple = 1 selección, combinada = 2+)
router.post('/apuestas', requireAuth, manejarAsync(async (req, res) => {
  const error = validarApuesta(req.body);
  if (error) return peticionInvalida(res, error);

  const { monto, selecciones } = req.body;
  const apuesta = await apuestas.colocarApuesta(
    req.user.id,
    monto,
    selecciones.map((s) => s.cuotaId)
  );
  creado(res, apuesta);
}));

// GET /api/apuestas — historial del usuario, con sus selecciones
router.get('/apuestas', requireAuth, manejarAsync(async (req, res) => {
  ok(res, await apuestas.listarApuestasDeUsuario(req.user.id));
}));

// GET /api/eventos/apostadores?ids=a,b,c — cuánta gente distinta apostó en cada
// evento. Público: el front lo llama sin sesión. Devuelve { eventoId: cantidad }.
router.get('/eventos/apostadores', manejarAsync(async (req, res) => {
  const ids = parsearIdsEventos(req.query.ids);
  if (!ids) return peticionInvalida(res, 'ids debe ser una lista de ids separados por coma');

  const filas = await apuestas.listarSeleccionesDeEventos(ids);
  ok(res, contarApostadoresPorEvento(filas, ids));
}));

// GET /api/admin/apuestas/pendientes — apuestas por liquidar
router.get('/admin/apuestas/pendientes', ...soloAdmin, manejarAsync(async (_req, res) => {
  ok(res, await apuestas.listarPendientes());
}));

// POST /api/admin/apuestas/:id/liquidar — intenta liquidar una apuesta puntual
router.post('/admin/apuestas/:id/liquidar', ...soloAdmin, manejarAsync(async (req, res) => {
  const { id } = req.params;
  if (!esIdentificadorValido(id)) return peticionInvalida(res, 'id de apuesta inválido');
  ok(res, await apuestas.liquidarUna(id));
}));

module.exports = router;
