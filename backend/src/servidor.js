require('dotenv').config();
const app = require('./app');

const PUERTO = process.env.PORT || 3000;

// Levanta el servidor. En EC2 se deja corriendo como servicio.
app.listen(PUERTO, () => console.log('API escuchando en el puerto ' + PUERTO));
