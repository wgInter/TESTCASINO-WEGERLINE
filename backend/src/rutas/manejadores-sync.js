// Handlers compartidos por las rutas de admin y las de cron. Antes cada ruta
// tenía su propia copia del mismo código; ahora se escriben una sola vez.
const { manejarAsync } = require('../utils/manejarAsync');
const { ok, peticionInvalida } = require('../utils/responder');
const {
  syncSport,
  syncScores,
  syncAllSports,
  settleAllSports,
  settlePendingBets,
} = require('../logica/sync');
const { esSportKeyValido, opcionesOddsValidas, diasAtrasValido } = require('../logica/validaciones');

const syncTodos = manejarAsync(async (_req, res) => {
  ok(res, await syncAllSports());
});

const liquidarTodos = manejarAsync(async (_req, res) => {
  ok(res, await settleAllSports());
});

const syncUno = manejarAsync(async (req, res) => {
  const { sportKey } = req.params;
  const { region, markets, oddsFormat } = req.query;

  if (!esSportKeyValido(sportKey)) return peticionInvalida(res, 'sportKey inválido');
  if (!opcionesOddsValidas({ region, markets, oddsFormat })) {
    return peticionInvalida(res, 'region, markets u oddsFormat inválidos');
  }

  ok(res, await syncSport(sportKey, { region, markets, oddsFormat }));
});

const liquidarUno = manejarAsync(async (req, res) => {
  const { sportKey } = req.params;
  const { daysFrom } = req.query;

  if (!esSportKeyValido(sportKey)) return peticionInvalida(res, 'sportKey inválido');
  if (!diasAtrasValido(daysFrom)) return peticionInvalida(res, 'daysFrom debe ser un entero entre 1 y 3');

  const scores = await syncScores(sportKey, daysFrom === undefined ? undefined : Number(daysFrom));
  const liquidacion = await settlePendingBets();
  ok(res, { ...scores, ...liquidacion });
});

module.exports = { syncTodos, liquidarTodos, syncUno, liquidarUno };
