// backend/controllers/interactController.js
const fs = require('fs');
const path = require('path');
const { callLocalModel } = require('../services/LLMGateway');
const NPC_DIR = path.join(__dirname, '..', 'data', 'npcs');
const GAMESTATE = path.join(__dirname, '..', 'data', 'gamestate.json');
const MEMORY_FILE = path.join(__dirname, '..', 'data', 'memory.json');
const GOSSIP_FILE = path.join(__dirname, '..', 'data', 'gossip.log.json');

function loadNpcProfile(id) {
  try {
    const text = fs.readFileSync(path.join(NPC_DIR, `${id}.json`), 'utf8');
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}

function loadGameState() {
  try {
    return JSON.parse(fs.readFileSync(GAMESTATE, 'utf8'));
  } catch (e) {
    return {};
  }
}

function loadRecentGossipForNpc(npcId, limit = 5) {
  try {
    const arr = JSON.parse(fs.readFileSync(GOSSIP_FILE, 'utf8') || '[]');
    return arr.filter(g => (g.pair || []).includes(npcId)).slice(-limit);
  } catch (e) {
    return [];
  }
}

function saveMemorySnippet(npcId, snippet) {
  try {
    const mem = JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf8') || '{}');
    if (!mem[npcId]) mem[npcId] = [];
    mem[npcId].push({ t: new Date().toISOString(), text: snippet });
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(mem, null, 2), 'utf8');
  } catch (e) {
    console.warn("Failed to write memory:", e.message);
  }
}

// POST /api/npc/:id/interact
async function handleInteract(req, res) {
  const npcId = req.params.id;
  const playerText = (req.body && req.body.text) ? req.body.text : '';

  console.log(`[INTERACT] npc=${npcId}, playerText=${playerText}`);

  const npc = loadNpcProfile(npcId) || { name: npcId, personality: "", traits: [] };
  const gameState = loadGameState();
  const gossip = loadRecentGossipForNpc(npcId, 5);

  // Build messages for the model (simple: system persona + context + user)
  const systemContent = `You are ${npc.name}. Persona: ${npc.personality || ''}. Traits: ${ (npc.traits||[]).join(', ') }. You are role-playing as this NPC. Keep replies short and in-character.`;
  let context = `Location: ${gameState.location || 'unknown'}. Time: ${gameState.time || ''}. Player reputation: ${gameState.player?.reputation || 'unknown'}.`;
  if (gossip.length) {
    context += ` Recent gossip relevant to you: ${gossip.map(g => g.text).join(' | ')}`;
  }

  const messages = [
    { role: 'system', content: systemContent },
    { role: 'system', content: `Context: ${context}` },
    { role: 'user', content: playerText }
  ];

  try {
    const result = await callLocalModel(messages, { max_tokens: 200, temperature: 0.35 });
    const npcReply = (result && result.text) ? result.text.trim() : " ... ";

    // Optionally save a short memory snippet
    const memorySnippet = `Player said: "${playerText}" -> NPC replied: "${npcReply}"`;
    saveMemorySnippet(npcId, memorySnippet);

    return res.json({ ok: true, dialogue: npcReply });
  } catch (err) {
    console.error("LLM call failed:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}

module.exports = { handleInteract };
