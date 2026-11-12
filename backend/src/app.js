const express = require('express');
const { crearCors } = require('./config/cors');
const { registrar } = require('./middleware/registrar');
const rutas = require('./rutas');
const { responderError } = require('./utils/responder');
const { HTTP } = require('./config/constantes');

// app se crea aparte de servidor.js para poder probarla sin abrir un puerto.
const app = express();

app.use(crearCors());
app.use(express.json());
app.use(registrar);

app.use('/api', rutas);

app.use((_req, res) => responderError(res, HTTP.NO_ENCONTRADO, 'Ruta no encontrada'));

module.exports = app;
