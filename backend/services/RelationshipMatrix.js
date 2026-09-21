// backend/services/RelationshipMatrix.js
const DataStore = require('./DataStore'); // expects backend/services/DataStore.js

class RelationshipMatrix {
  constructor() {
    this.store = DataStore;
  }

  // MUST be called once at server startup
  async initialize() {
    // DataStore.load() will create file if missing
    if (typeof this.store.load === 'function') {
      await this.store.load();
    } else {
      // fallback: ensure in-memory structure exists
      if (!this.store.relationships) {
        this.store.relationships = { npc: {}, player: {}, npcFactions: {} };
      }
    }

    // ensure keys exist
    const r = this.store.relationships;
    if (!r.npc) r.npc = {};
    if (!r.player) r.player = {};
    if (!r.npcFactions) r.npcFactions = {};

    // persist any created defaults
    if (typeof this.store.save === 'function') {
      await this.store.save();
    }
  }

  // Return snapshot copy
  getRelationships() {
    return JSON.parse(JSON.stringify(this.store.relationships || { npc: {}, player: {}, npcFactions: {} }));
  }

  getNPCFaction(npcId) {
    return (this.store.relationships?.npcFactions?.[npcId]) || 'NEUTRAL';
  }

  getPlayerRelationship(npcId) {
    return (this.store.relationships?.player?.[npcId]) ?? 0;
  }

  // returns an object of otherNpcId -> score
  getNPCRelationships(npcId) {
    const out = {};
    const pairs = this.store.relationships?.npc || {};
    Object.keys(pairs).forEach(k => {
      const parts = k.split('-');
      if (parts.length !== 2) return;
      const [a, b] = parts;
      const score = pairs[k] || 0;
      if (a === npcId) out[b] = score;
      else if (b === npcId) out[a] = score;
    });
    return out;
  }

  // get directional value source->target
  getNPCRelation(source, target) {
    return (this.store.relationships?.npc?.[`${source}-${target}`]) ?? 0;
  }

  async updateRelationship(source, target, delta) {
    if (!source || !target) throw new Error('source and target required');
    if (!this.store.relationships) this.store.relationships = { npc: {}, player: {}, npcFactions: {} };

    const key = `${source}-${target}`;
    const reverseKey = `${target}-${source}`;

    this.store.relationships.npc[key] = (this.store.relationships.npc[key] || 0) + delta;

    const reverseDelta = Math.round(delta * 0.5);
    this.store.relationships.npc[reverseKey] = (this.store.relationships.npc[reverseKey] || 0) + reverseDelta;

    if (typeof this.store.save === 'function') {
      await this.store.save();
    }
    return this.store.relationships.npc[key];
  }

  async updatePlayerRelationship(npcId, delta) {
    if (!npcId) throw new Error('npcId required');
    if (!this.store.relationships) this.store.relationships = { npc: {}, player: {}, npcFactions: {} };
    this.store.relationships.player[npcId] = (this.store.relationships.player[npcId] || 0) + delta;
    if (typeof this.store.save === 'function') {
      await this.store.save();
    }
    return this.store.relationships.player[npcId];
  }

  async setRelationship(source, target, value) {
    if (!this.store.relationships) this.store.relationships = { npc: {}, player: {}, npcFactions: {} };
    this.store.relationships.npc[`${source}-${target}`] = value;
    if (typeof this.store.save === 'function') {
      await this.store.save();
    }
  }

  async decayRelationships() {
    const decay = -1;
    Object.keys(this.store.relationships.player).forEach(async (npcId) => {
      if (this.store.relationships.player[npcId] !== 0) {
        await this.updatePlayerRelationship(npcId, decay);
      }
    });
  }
}

module.exports = new RelationshipMatrix();

// The relationship scores follow these general rules:

// -50 to -30: Strong dislike/distrust
// -29 to -10: Mild dislike
// -9 to 9: Neutral
// 10 to 29: Positive relationship
// 30 to 50: Strong friendship/trust