// backend/server.js
require('dotenv').config(); // optional - install dotenv if you want to use .env files
const express = require('express');
const cors = require('cors');
const { handleInteract, handleInteractStream, handleGetGossip, handleGossipShare, handleReset, handleCheckGossip, handleGetProfile } = require('./controllers/interactController');
const habitController = require('./controllers/habitController');
const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/npc/:id/interact', handleInteract);
app.post('/api/npc/:id/interact/stream', handleInteractStream);
app.get('/api/npc/:id/check-gossip', handleCheckGossip);
app.get('/api/npc/:id/profile', handleGetProfile);
app.get('/api/gossip', handleGetGossip);
app.post('/api/gossip/share', handleGossipShare);
app.post('/api/reset', handleReset);

app.get('/api/habits', habitController.getHabits);
app.post('/api/habits/steps', habitController.addSteps);
app.post('/api/habits/npc', habitController.interactNPC);
app.post('/api/habits/area', habitController.interactArea);

// simple health route
app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// show configured LLM target (for debugging)
const LOCAL_LLM_URL = process.env.LOCAL_LLM_URL || 'http://127.0.0.1:8000';
const LOCAL_LLM_API_KEY = process.env.LOCAL_LLM_API_KEY || '';
console.log(`[CONFIG] LOCAL_LLM_URL=${LOCAL_LLM_URL} LOCAL_LLM_API_KEY=${LOCAL_LLM_API_KEY ? '***' : '(none)'} `);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend listening on ${PORT}`));
