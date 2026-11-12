const express = require('express');
const { ok } = require('../utils/responder');

const router = express.Router();

// Ruta de salud: sirve para comprobar que la API responde desde internet.
router.get('/salud', (_req, res) => ok(res, { estado: 'ok' }));

// Cada integrante monta aquí su router cuando lo tenga listo (una línea por router):
router.use(require('./eventos'));        // Alvarino: /eventos, /sports, /odds, /admin/sync*, /admin/settle*
router.use('/cron', require('./cron'));  // Alvarino: /cron/*
//   router.use('/apuestas', require('./apuestas'));    // José
//   router.use('/usuarios', require('./usuarios'));    // José
//   router.use('/casino', require('./casino'));        // José
//   router.use('/blackjack', require('./blackjack'));  // José

module.exports = router;
