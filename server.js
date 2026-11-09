require('dotenv').config();
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const session = require('express-session');
const store = require('./store');

const PORT = process.env.PORT || 3000;
const APP_PASSWORD = process.env.APP_PASSWORD;
const SESSION_SECRET = process.env.SESSION_SECRET;

if (!APP_PASSWORD || !SESSION_SECRET) {
  console.error('Missing APP_PASSWORD or SESSION_SECRET. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const app = express();
app.use(express.json({ limit: '5mb' }));
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 12 },
}));

function requireAuth(req, res, next) {
  if (req.session && req.session.auth) return next();
  res.status(401).json({ error: 'unauthorized' });
}

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

app.post('/api/login', (req, res) => {
  const password = req.body && req.body.password;
  if (typeof password === 'string' && safeEqual(password, APP_PASSWORD)) {
    req.session.auth = true;
    return res.json({ auth: true });
  }
  res.status(401).json({ error: 'wrong password' });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ auth: false }));
});

app.get('/api/session', (req, res) => {
  res.json({ auth: !!(req.session && req.session.auth) });
});

app.get('/api/state', requireAuth, async (req, res, next) => {
  try {
    res.json(await store.readState());
  } catch (err) { next(err); }
});

app.put('/api/state', requireAuth, async (req, res, next) => {
  try {
    const { version, state } = req.body || {};
    if (!Number.isInteger(version) || !state || typeof state !== 'object' || Array.isArray(state)) {
      return res.status(400).json({ error: 'invalid body' });
    }
    const result = await store.saveState(version, state);
    if (!result.ok) return res.status(409).json(result.state);
    res.json({ version: result.state.version });
  } catch (err) { next(err); }
});

app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'app.html')));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'server error' });
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
