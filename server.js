/* Servidor de la Copa de la Liga Prudan
   - Sirve la página (index.html) a todo el mundo (solo lectura)
   - GET  /data.json   → datos actuales
   - POST /api/login   → valida el PIN de admin
   - POST /api/save    → guarda los datos (requiere PIN)
   PIN: variable de entorno ADMIN_PIN (por defecto "prudan")
   Datos: variable DATA_PATH (con volumen de Railway: /data/data.json) */
const express = require('express');
const fs = require('fs');
const path = require('path');

const app  = express();
const PIN  = process.env.ADMIN_PIN || 'prudan';
const SEED = path.join(__dirname, 'data.json');
const DATA = process.env.DATA_PATH || SEED;

// primera vez con volumen: copiar los datos iniciales
if (DATA !== SEED && !fs.existsSync(DATA)) {
  fs.mkdirSync(path.dirname(DATA), { recursive: true });
  fs.copyFileSync(SEED, DATA);
  console.log('Datos iniciales copiados a', DATA);
}

app.use(express.json({ limit: '10mb' }));

app.get('/data.json', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.sendFile(DATA);
});

app.post('/api/login', (req, res) => {
  res.json({ ok: (req.body && req.body.pin) === PIN });
});

app.post('/api/save', (req, res) => {
  if (!req.body || req.body.pin !== PIN) return res.status(403).json({ ok: false, error: 'PIN incorrecto' });
  const d = req.body.data;
  if (!d || !Array.isArray(d.jugadores) || !Array.isArray(d.partidos)) return res.status(400).json({ ok: false, error: 'Datos inválidos' });
  const tmp = DATA + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(d, null, 1));
  fs.renameSync(tmp, DATA);              // escritura atómica
  res.json({ ok: true });
});

app.use(express.static(__dirname, { extensions: ['html'] }));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Liga Prudan escuchando en el puerto ' + port));
