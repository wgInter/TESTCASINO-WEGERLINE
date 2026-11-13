const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { manejarAsync } = require('../utils/manejarAsync');
const { ok, peticionInvalida } = require('../utils/responder');
const usuarios = require('../datos/usuariosRepositorio');
const {
  validarNombreUsuario,
  validarAjusteSaldo,
  aplicarSignoAjuste,
} = require('../logica/reglas-usuarios');

const router = express.Router();

// GET /api/usuarios/me — perfil + saldo del usuario autenticado
router.get('/usuarios/me', requireAuth, manejarAsync(async (req, res) => {
  ok(res, await usuarios.obtenerPerfil(req.user.id));
}));

// PATCH /api/usuarios/me — cambiar el nombre de usuario. body: { nombreUsuario }
router.patch('/usuarios/me', requireAuth, manejarAsync(async (req, res) => {
  const { nombreUsuario } = req.body;
  const error = validarNombreUsuario(nombreUsuario);
  if (error) return peticionInvalida(res, error);

  ok(res, await usuarios.actualizarNombreUsuario(req.user.id, nombreUsuario.trim()));
}));

// GET /api/transacciones — historial de movimientos del usuario
router.get('/transacciones', requireAuth, manejarAsync(async (req, res) => {
  ok(res, await usuarios.listarTransacciones(req.user.id));
}));

// POST /api/admin/saldo/ajustar — depósito/retiro manual (solo admin)
// body: { usuarioId, monto, tipo: 'deposito' | 'retiro' }
router.post('/admin/saldo/ajustar', requireAuth, requireAdmin, manejarAsync(async (req, res) => {
  const error = validarAjusteSaldo(req.body);
  if (error) return peticionInvalida(res, error);

  const { usuarioId, monto, tipo } = req.body;
  ok(res, await usuarios.ajustarSaldo(usuarioId, aplicarSignoAjuste(monto, tipo), tipo));
}));

module.exports = router;
