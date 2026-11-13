const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { manejarAsync } = require('../utils/manejarAsync');
const { ok, peticionInvalida } = require('../utils/responder');
const blackjack = require('../datos/blackjackRepositorio');
const { BLACKJACK_TICK_MINIMO_MS, BLACKJACK_TICK_MAXIMO_MESAS } = require('../config/constantes');
const { esIdentificadorValido } = require('../logica/validaciones');
const { validarMonto } = require('../logica/reglas-apuestas');
const { esAsientoValido, debeProcesarTick } = require('../logica/reglas-casino');

const router = express.Router();

// Un solo molde para las 5 acciones de un jugador (antes cada una repetía el
// mismo bloque): valida el cuerpo, llama a la función SQL y responde.
// `extras` valida lo propio de cada acción además de mesaId.
function accionDeMesa(ejecutar, extras = () => null) {
  return [
    requireAuth,
    manejarAsync(async (req, res) => {
      const { mesaId } = req.body;
      if (!esIdentificadorValido(mesaId)) return peticionInvalida(res, 'mesaId inválido');

      const error = extras(req.body);
      if (error) return peticionInvalida(res, error);

      ok(res, await ejecutar(req));
    }),
  ];
}

// GET /api/blackjack/mesa — estado público de la mesa (sin mazo ni carta oculta)
router.get('/blackjack/mesa', manejarAsync(async (_req, res) => {
  ok(res, await blackjack.obtenerMesaPublica());
}));

// POST /api/blackjack/tick — empuja el reloj de la mesa. Sigue siendo público
// (el front lo llama sin sesión) pero ahora valida el id y limita la frecuencia:
// si llega otro tick de la misma mesa antes de BLACKJACK_TICK_MINIMO_MS, se ignora.
const ultimoTickPorMesa = new Map();

router.post('/blackjack/tick', manejarAsync(async (req, res) => {
  const { mesaId } = req.body;
  if (!esIdentificadorValido(mesaId)) return peticionInvalida(res, 'mesaId inválido');

  const ahora = Date.now();
  if (!debeProcesarTick(ultimoTickPorMesa.get(mesaId), ahora, BLACKJACK_TICK_MINIMO_MS)) {
    return ok(res, { ok: true, omitido: true });
  }

  // El mapa no crece sin control aunque alguien mande ids inventados.
  if (ultimoTickPorMesa.size >= BLACKJACK_TICK_MAXIMO_MESAS) ultimoTickPorMesa.clear();
  ultimoTickPorMesa.set(mesaId, ahora);

  await blackjack.avanzarReloj(mesaId);
  ok(res, { ok: true });
}));

router.post('/blackjack/sentarse', ...accionDeMesa(
  (req) => blackjack.sentarse(req.body.mesaId, req.user.id, req.body.asiento),
  ({ asiento }) => (esAsientoValido(asiento) ? null : 'asiento inválido')
));

router.post('/blackjack/pararse', ...accionDeMesa(
  (req) => blackjack.pararse(req.body.mesaId, req.user.id)
));

router.post('/blackjack/apostar', ...accionDeMesa(
  (req) => blackjack.apostar(req.body.mesaId, req.user.id, req.body.monto),
  ({ monto }) => validarMonto(monto)
));

router.post('/blackjack/pedir-carta', ...accionDeMesa(
  (req) => blackjack.pedirCarta(req.body.mesaId, req.user.id)
));

router.post('/blackjack/plantarse', ...accionDeMesa(
  (req) => blackjack.plantarse(req.body.mesaId, req.user.id)
));

module.exports = router;
