// backend/controllers/interactController.js
const fs = require('fs');
const path = require('path');
const { callLocalModel, callLocalModelStream } = require('../services/LLMGateway');
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

function saveNpcProfile(id, profile) {
  try {
    fs.writeFileSync(path.join(NPC_DIR, `${id}.json`), JSON.stringify(profile, null, 2), 'utf8');
  } catch (e) {
    console.warn(`Failed to save NPC profile ${id}:`, e.message);
  }
}

async function updateNpcMemory(npcId, userText, assistantText) {
  console.log(`[MEMORY] Updating memory for ${npcId}:`, { userText, assistantText });
  const npc = loadNpcProfile(npcId) || { name: npcId, personality: "", traits: [] };
  if (!npc.memory) npc.memory = [];
  if (!npc.gossip) npc.gossip = [];
  
  npc.memory.push({ role: 'user', content: userText });
  npc.memory.push({ role: 'assistant', content: assistantText });
  
  // Keep only last 20 messages (10 interactions)
  if (npc.memory.length > 20) {
    npc.memory = npc.memory.slice(-20);
  }
  
  // Create simple gossip summary
  const gossipSummary = `Player talked to ${npc.name} about: ${userText.substring(0, 50)}${userText.length > 50 ? '...' : ''}`;
  
  const gossipItem = {
    id: `gossip_${Date.now()}`,
    summary: gossipSummary,
    timestamp: Date.now(),
    source: 'player_interaction'
  };
  
  npc.gossip.push(gossipItem);
  
  // Keep only last 10 gossip items
  if (npc.gossip.length > 10) {
    npc.gossip = npc.gossip.slice(-10);
  }
  
  console.log(`[GOSSIP] Created gossip for ${npcId}:`, gossipSummary);
  
  console.log(`[MEMORY] New memory for ${npcId}:`, npc.memory);
  saveNpcProfile(npc.id || npcId, npc);
  console.log(`[MEMORY] Saved profile for ${npcId}`);
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

  // Check if NPC has gossip about the player and should start conversation
  const npcGossip = npc.gossip || [];
  const playerGossip = npcGossip.filter(g => g.summary && g.summary.includes('Player'));
  const shouldStartWithGossip = playerGossip.length > 0 && (!npc.memory || npc.memory.length === 0);

  const systemContent = `You are ${npc.name}. Persona: ${npc.personality || ''}. Traits: ${ (npc.traits||[]).join(', ') }. You are role-playing as this NPC. Keep replies short and in-character.`;
  let context = `Location: ${gameState.location || 'unknown'}. Time: ${gameState.time || ''}. Player reputation: ${gameState.player?.reputation || 'unknown'}.`;
  if (gossip.length) {
    context += ` Recent gossip relevant to you: ${gossip.map(g => g.text).join(' | ')}`;
  }
  if (playerGossip.length > 0) {
    context += ` You've heard gossip about the player: ${playerGossip.map(g => g.summary).join(', ')}`;
  }

  const messages = [
    { role: 'system', content: systemContent },
    { role: 'system', content: `Context: ${context}` }
  ];
  
  if (npc.memory && npc.memory.length > 0) {
    messages.push(...npc.memory);
  }
  
  // If NPC has gossip, they initiate conversation about it
  if (shouldStartWithGossip) {
    const gossipToMention = playerGossip[0].summary;
    messages.push({ role: 'user', content: `Player approaches you. You should immediately start talking about the gossip you heard: "${gossipToMention}"` });
  } else {
    messages.push({ role: 'user', content: playerText });
  }

  try {
    const result = await callLocalModel(messages, { max_tokens: 200, temperature: 0.35 });
    const npcReply = (result && result.text) ? result.text.trim() : " ... ";

    // Update NPC memory with last 4 exchanges (run in background)
    updateNpcMemory(npcId, playerText, npcReply).catch(err => 
      console.error('Memory update failed:', err)
    );

    return res.json({ ok: true, dialogue: npcReply });
  } catch (err) {
    console.error("LLM call failed:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}

// GET /api/npc/:id/check-gossip - Check if NPC should initiate gossip conversation
function handleCheckGossip(req, res) {
  const npcId = req.params.id;
  const npc = loadNpcProfile(npcId) || { name: npcId, personality: "", traits: [] };
  
  const npcGossip = npc.gossip || [];
  const playerGossip = npcGossip.filter(g => g.summary && g.summary.includes('Player'));
  const shouldStartWithGossip = playerGossip.length > 0 && (!npc.memory || npc.memory.length === 0);
  
  res.json({ shouldInitiate: shouldStartWithGossip, gossip: shouldStartWithGossip ? playerGossip[0].summary : null });
}

// GET /api/npc/:id/profile - Get NPC profile
function handleGetProfile(req, res) {
  const npcId = req.params.id;
  const npc = loadNpcProfile(npcId);
  
  if (!npc) {
    return res.status(404).json({ error: 'NPC not found' });
  }
  
  res.json(npc);
}

// POST /api/npc/:id/interact/stream
async function handleInteractStream(req, res) {
  const npcId = req.params.id;
  const playerText = (req.body && req.body.text) ? req.body.text : '';

  console.log(`[INTERACT STREAM] npc=${npcId}, playerText=${playerText}`);

  const npc = loadNpcProfile(npcId) || { name: npcId, personality: "", traits: [] };
  const gameState = loadGameState();
  const gossip = loadRecentGossipForNpc(npcId, 5);

  // Check if NPC has gossip about the player and should start conversation
  const npcGossip = npc.gossip || [];
  const playerGossip = npcGossip.filter(g => g.summary && g.summary.includes('Player'));
  const shouldStartWithGossip = playerGossip.length > 0 && (!npc.memory || npc.memory.length === 0);

  const systemContent = `You are ${npc.name}. Persona: ${npc.personality || ''}. Traits: ${ (npc.traits||[]).join(', ') }. You are role-playing as this NPC. Keep replies short and in-character.`;
  let context = `Location: ${gameState.location || 'unknown'}. Time: ${gameState.time || ''}. Player reputation: ${gameState.player?.reputation || 'unknown'}.`;
  if (gossip.length) {
    context += ` Recent gossip relevant to you: ${gossip.map(g => g.text).join(' | ')}`;
  }
  if (playerGossip.length > 0) {
    context += ` You've heard gossip about the player: ${playerGossip.map(g => g.summary).join(', ')}`;
  }

  const messages = [
    { role: 'system', content: systemContent },
    { role: 'system', content: `Context: ${context}` }
  ];
  
  if (npc.memory && npc.memory.length > 0) {
    messages.push(...npc.memory);
  }
  
  // If NPC has gossip, they initiate conversation about it
  if (shouldStartWithGossip) {
    const gossipToMention = playerGossip[0].summary;
    messages.push({ role: 'user', content: `Player approaches you. You should immediately start talking about the gossip you heard: "${gossipToMention}"` });
  } else {
    messages.push({ role: 'user', content: playerText });
  }

  try {
    res.writeHead(200, {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    let fullResponse = '';
    await callLocalModelStream(messages, { max_tokens: 200, temperature: 0.35 }, (chunk) => {
      if (chunk.choices?.[0]?.delta?.content) {
        const content = chunk.choices[0].delta.content;
        fullResponse += content;
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }
    });

    res.write('data: [DONE]\n\n');
    res.end();

    // Update NPC memory after streaming is complete
    console.log(`[STREAM] Full response for ${npcId}:`, fullResponse.trim());
    await updateNpcMemory(npcId, playerText, fullResponse.trim());
  } catch (err) {
    console.error("LLM stream failed:", err);
    res.write(`data: ${JSON.stringify({error: err.message})}\n\n`);
    res.end();
  }
}

// GET /api/gossip - Get all gossip from all NPCs
function handleGetGossip(req, res) {
  try {
    const gossipNetwork = {};
    const files = fs.readdirSync(NPC_DIR);
    
    files.forEach(file => {
      if (file.endsWith('.json')) {
        const npcId = file.replace('.json', '');
        const npc = loadNpcProfile(npcId);
        if (npc && npc.gossip) {
          gossipNetwork[npcId] = npc.gossip;
        }
      }
    });
    
    res.json(gossipNetwork);
  } catch (err) {
    console.error('Failed to load gossip network:', err);
    res.status(500).json({ error: err.message });
  }
}

// POST /api/reset - Reset all NPC memory and gossip
function handleReset(req, res) {
  try {
    const files = fs.readdirSync(NPC_DIR);
    
    files.forEach(file => {
      if (file.endsWith('.json')) {
        const npcId = file.replace('.json', '');
        const npc = loadNpcProfile(npcId);
        if (npc) {
          npc.memory = [];
          npc.gossip = [];
          saveNpcProfile(npcId, npc);
        }
      }
    });
    
    console.log('[RESET] All NPC memory and gossip cleared');
    res.json({ success: true, message: 'All NPC data reset' });
  } catch (err) {
    console.error('Reset failed:', err);
    res.status(500).json({ error: err.message });
  }
}

// POST /api/gossip/share - Share gossip between two NPCs
function handleGossipShare(req, res) {
  const { npc1, npc2 } = req.body;
  
  try {
    const npcProfile1 = loadNpcProfile(npc1);
    const npcProfile2 = loadNpcProfile(npc2);
    
    if (!npcProfile1 || !npcProfile2) {
      return res.status(404).json({ error: 'NPC not found' });
    }
    
    if (!npcProfile1.gossip) npcProfile1.gossip = [];
    if (!npcProfile2.gossip) npcProfile2.gossip = [];
    
    let shared = false;
    
    // Share gossip from npc1 to npc2
    npcProfile1.gossip.forEach(gossip => {
      if (!npcProfile2.gossip.some(g => g.id === gossip.id)) {
        npcProfile2.gossip.push({ ...gossip, source: npc1, sharedAt: Date.now() });
        shared = true;
      }
    });
    
    // Share gossip from npc2 to npc1
    npcProfile2.gossip.forEach(gossip => {
      if (!npcProfile1.gossip.some(g => g.id === gossip.id)) {
        npcProfile1.gossip.push({ ...gossip, source: npc2, sharedAt: Date.now() });
        shared = true;
      }
    });
    
    if (shared) {
      // Keep only last 10 gossip items per NPC
      if (npcProfile1.gossip.length > 10) {
        npcProfile1.gossip = npcProfile1.gossip.slice(-10);
      }
      if (npcProfile2.gossip.length > 10) {
        npcProfile2.gossip = npcProfile2.gossip.slice(-10);
      }
      
      saveNpcProfile(npc1, npcProfile1);
      saveNpcProfile(npc2, npcProfile2);
      console.log(`[GOSSIP] Shared gossip between ${npc1} and ${npc2}`);
    }
    
    res.json({ shared });
  } catch (err) {
    console.error('Gossip sharing failed:', err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { handleInteract, handleInteractStream, handleGetGossip, handleGossipShare, handleReset, handleCheckGossip, handleGetProfile };
