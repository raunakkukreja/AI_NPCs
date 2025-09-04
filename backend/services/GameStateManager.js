
const fs = require('fs');
const path = require('path');
const DATA = path.join(__dirname,'../data/gamestate.json');
const GOSSIP = path.join(__dirname,'../data/gossip.log.json');

let state = { time: "evening", weather: "clear", player: { name: "Arin", reputation: "neutral", inventory: [] }, location: "tavern", activeQuests: [] };
let gossip = [];

function load() {
  try { state = JSON.parse(fs.readFileSync(DATA)); } catch(e) {}
  try { gossip = JSON.parse(fs.readFileSync(GOSSIP)); } catch(e) {}
}

function save() {
  try { fs.writeFileSync(DATA, JSON.stringify(state, null, 2)); } catch(e) {}
  try { fs.writeFileSync(GOSSIP, JSON.stringify(gossip, null, 2)); } catch(e) {}
}

function get() { return state; }

function appendGossip(entry) {
  gossip.push(entry);
  save();
}

function getGossipForNPC(npc) {
  if (!npc.traits || !npc.traits.includes('Gossiper')) return [];
  return gossip.slice(-3);
}

load();
module.exports = { get, save, load, appendGossip, getGossipForNPC };

