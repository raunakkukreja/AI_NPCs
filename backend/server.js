// backend/server.js
const express = require('express');
const { handleInteract } = require('./controllers/interactController');

const app = express();

// ======= Dev-friendly CORS + preflight handling =======
// For Codespaces preview and local dev we allow all origins.
// In production narrow this to trusted origins only.
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // allow all origins for dev
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// JSON parser
app.use(express.json());

// Simple request logger (helpful during development)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

// ======= Routes =======
app.post('/api/npc/:id/interact', handleInteract);

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// Basic 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend listening on ${PORT}`));
