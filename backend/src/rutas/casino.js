const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { manejarAsync } = require('../utils/manejarAsync');
const { ok, peticionInvalida } = require('../utils/responder');
const casino = require('../datos/casinoRepositorio');
const { validarMonto } = require('../logica/reglas-apuestas');
const { validarApuestasRuleta } = require('../logica/reglas-casino');

const router = express.Router();

// POST /api/casino/slot/spin — body: { monto }
router.post('/casino/slot/spin', requireAuth, manejarAsync(async (req, res) => {
  const error = validarMonto(req.body.monto);
  if (error) return peticionInvalida(res, error);

  ok(res, await casino.girarTragamonedas(req.user.id, req.body.monto));
}));

// POST /api/casino/ruleta/spin — antes el front llamaba a Supabase directo.
// body: { apuestas: [{ tipo: 'num', valor: 0..36, monto } | { tipo: 'red', monto }, ...] }
router.post('/casino/ruleta/spin', requireAuth, manejarAsync(async (req, res) => {
  const error = validarApuestasRuleta(req.body.apuestas);
  if (error) return peticionInvalida(res, error);

  ok(res, await casino.girarRuleta(req.token, req.body.apuestas));
}));

module.exports = router;
