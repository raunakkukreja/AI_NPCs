
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '../data/memory.json');
let store = {};
try { store = JSON.parse(fs.readFileSync(FILE)); } catch(e) {}

function save() { fs.writeFileSync(FILE, JSON.stringify(store, null, 2)); }

function getRecent(npcId, n=3) {
  const arr = store[npcId] || [];
  return arr.slice(-n);
}

function add(npcId, snippet) {
  store[npcId] = store[npcId] || [];
  store[npcId].push(snippet);
  save();
}

module.exports = { getRecent, add, save };

