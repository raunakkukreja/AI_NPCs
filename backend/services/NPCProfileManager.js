
const fs = require('fs');
const path = require('path');

function load(npcId) {
  try {
    const p = path.join(__dirname, '../data/npcs', npcId + '.json');
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch(e) {
    return { id: npcId, name: npcId, role: "unknown", personality: "neutral", goals: [], traits: [], knowledge: [] };
  }
}

module.exports = { load };
