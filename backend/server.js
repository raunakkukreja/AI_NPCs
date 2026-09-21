// backend/server.js
require('dotenv').config(); // optional - install dotenv if you want to use .env files
const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const { handleInteract, handleInteractStream, handleGetGossip, handleGossipShare, handleReset, handleCheckGossip, handleGetProfile } = require('./controllers/interactController');
const RelationshipMatrix = require('./services/RelationshipMatrix');

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

<<<<<<< HEAD
// debug: return the relationships JSON
app.get('/api/relationships', (req, res) => {
  try {
    const data = RelationshipMatrix.getRelationships();
    return res.json({ ok: true, data });
  } catch (err) {
    console.error('failed to get relationships', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// Add this route to easily check relationship changes
app.get('/api/relationships/player', (req, res) => {
    try {
        const data = RelationshipMatrix.getRelationships();
        return res.json({ 
            ok: true, 
            relationships: data.player 
        });
    } catch (err) {
        console.error('Failed to get player relationships', err);
        return res.status(500).json({ ok: false, error: err.message });
    }
=======
// Bulb endpoints
app.post('/api/bulb/location', (req, res) => {
  const { locationId } = req.body;
  updateSmartBulb('location', locationId || 'neutral');
  res.json({ success: true });
});

app.post('/api/bulb/movement', (req, res) => {
  updateSmartBulb('movement', '');
  res.json({ success: true });
>>>>>>> origin/master
});

// simple health route
app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

<<<<<<< HEAD
// show configured LLM target (for debugging)
const LOCAL_LLM_URL = process.env.LOCAL_LLM_URL || 'http://127.0.0.1:8000';
const LOCAL_LLM_API_KEY = process.env.LOCAL_LLM_API_KEY || '';
console.log(`[CONFIG] LOCAL_LLM_URL=${LOCAL_LLM_URL} LOCAL_LLM_API_KEY=${LOCAL_LLM_API_KEY ? '***' : '(none)'} ` );
=======
// show configured LLM state (for debugging)
console.log(`[CONFIG] ANTHROPIC_API_KEY=${process.env.ANTHROPIC_API_KEY ? '***' : '(none)'} FRONTEND_URL=${ALLOWED_ORIGIN}`);
>>>>>>> origin/master

const PORT = process.env.PORT || 3000;

async function initializeServer() {
    app.listen(PORT, () => console.log(`Backend listening on ${PORT}`));
    await RelationshipMatrix.initialize();
}

initializeServer();
