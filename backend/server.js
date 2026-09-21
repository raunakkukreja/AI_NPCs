// backend/server.js
require('dotenv').config(); // optional - install dotenv if you want to use .env files
const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const { handleInteract, handleInteractStream, handleGetGossip, handleGossipShare, handleReset, handleCheckGossip, handleGetProfile } = require('./controllers/interactController');

function updateSmartBulb(type, data) {
  try {
    const python = spawn('python', ['../model_server/game_bulb_controller.py', type, data]);
    python.on('error', () => {});
  } catch (err) {}
}

const app = express();
const ALLOWED_ORIGIN = process.env.FRONTEND_URL || '*';
app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(express.json());

app.post('/api/npc/:id/interact', (req, res) => {
  updateSmartBulb('interact', req.params.id);
  handleInteract(req, res);
});
app.post('/api/npc/:id/interact/stream', handleInteractStream);
app.get('/api/npc/:id/check-gossip', handleCheckGossip);
app.get('/api/npc/:id/profile', handleGetProfile);
app.get('/api/gossip', handleGetGossip);
app.post('/api/gossip/share', (req, res) => {
  updateSmartBulb('gossip', '');
  handleGossipShare(req, res);
});
app.post('/api/reset', handleReset);

// Bulb endpoints
app.post('/api/bulb/location', (req, res) => {
  const { locationId } = req.body;
  updateSmartBulb('location', locationId || 'neutral');
  res.json({ success: true });
});

app.post('/api/bulb/movement', (req, res) => {
  updateSmartBulb('movement', '');
  res.json({ success: true });
});

// simple health route
app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// show configured LLM state (for debugging)
console.log(`[CONFIG] ANTHROPIC_API_KEY=${process.env.ANTHROPIC_API_KEY ? '***' : '(none)'} FRONTEND_URL=${ALLOWED_ORIGIN}`);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend listening on ${PORT}`));
