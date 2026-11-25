const express = require('express');
const { ok } = require('../utils/responder');

const router = express.Router();

// Ruta de salud: sirve para comprobar que la API responde desde internet.
router.get('/salud', (_req, res) => ok(res, { estado: 'ok' }));

// Cada integrante monta aquí su router cuando lo tenga listo (una línea por router):
router.use(require('./eventos'));        // Alvarino: /eventos, /sports, /odds, /admin/sync*, /admin/settle*
router.use('/cron', require('./cron'));  // Alvarino: /cron/*
router.use(require('./apuestas'));   // José: /apuestas, /apuestas/cotizar, /eventos/apostadores, /admin/apuestas/*
router.use(require('./usuarios'));   // José: /usuarios/me, /transacciones, /admin/saldo/ajustar
router.use(require('./casino'));     // José: /casino/slot/spin, /casino/ruleta/spin
router.use(require('./blackjack'));  // José: /blackjack/*

module.exports = router;
