const express = require('express');
const { requireCronSecret } = require('../middleware/cron');
const { syncTodos, liquidarTodos, syncUno, liquidarUno } = require('./manejadores-sync');

// Rutas para el cron (crontab de EC2 o un cron externo). Se montan en /api/cron.
// El secreto se verifica UNA vez, para todo el router, con requireCronSecret.
const router = express.Router();
router.use(requireCronSecret);

router.post('/sync-all', syncTodos);
router.post('/settle-all', liquidarTodos);
router.post('/sync/:sportKey', syncUno);
router.post('/settle/:sportKey', liquidarUno);

module.exports = router;
