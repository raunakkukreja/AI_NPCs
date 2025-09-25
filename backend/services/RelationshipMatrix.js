const fs = require('fs');
const path = require('path');

class RelationshipMatrix {
  constructor() {
    this.matrixPath = path.join(__dirname, '../data/relationships.json');
    this.factions = {
      COURT_LOYALISTS: 'Court Loyalists',
      MARKET_MERCHANTS: 'Market Merchants',
      UNDERWORLD: 'Underworld',
      NEUTRAL: 'Neutral'
    };
    
    this.relationships = this.loadRelationships();
  }

  loadRelationships() {
    try {
      return JSON.parse(fs.readFileSync(this.matrixPath, 'utf8'));
    } catch (e) {
      // Initialize default relationships if file doesn't exist
      return this.initializeDefaultRelationships();
    }
  }

  initializeDefaultRelationships() {
    const defaultMatrix = {
      factionRelations: {},  // Tracks overall faction relationships
      npcRelations: {},      // Tracks individual NPC relationships
      npcFactions: {         // Define NPC faction memberships
        'guard': 'COURT_LOYALISTS',
        'guard2': 'COURT_LOYALISTS',
        'merchant': 'MARKET_MERCHANTS',
        'thief': 'UNDERWORLD',
        'bartender': 'MARKET_MERCHANTS',
        'helios': 'UNDERWORLD',
        'moody_old_man': 'NEUTRAL'
      }
    };

    // Save the default matrix
    fs.writeFileSync(this.matrixPath, JSON.stringify(defaultMatrix, null, 2));
    return defaultMatrix;
  }

  getFactionRelation(faction1, faction2) {
    const key = `${faction1}_${faction2}`;
    return this.relationships.factionRelations[key] || 0;
  }

  getNPCRelation(npc1Id, npc2Id) {
    const key = `${npc1Id}_${npc2Id}`;
    return this.relationships.npcRelations[key] || 0;
  }

  updateRelation(npc1Id, npc2Id, delta) {
    const key = `${npc1Id}_${npc2Id}`;
    const reverseKey = `${npc2Id}_${npc1Id}`;
    
    this.relationships.npcRelations[key] = (this.relationships.npcRelations[key] || 0) + delta;
    // Optional: Update reverse relation with reduced impact
    this.relationships.npcRelations[reverseKey] = (this.relationships.npcRelations[reverseKey] || 0) + (delta * 0.5);
    
    this.save();
    return this.relationships.npcRelations[key];
  }

  getNPCFaction(npcId) {
    return this.relationships.npcFactions[npcId] || 'NEUTRAL';
  }

  save() {
    fs.writeFileSync(this.matrixPath, JSON.stringify(this.relationships, null, 2));
  }

  // Get all relationships for an NPC
  getNPCRelationships(npcId) {
    const relations = {};
    Object.keys(this.relationships.npcRelations).forEach(key => {
      if (key.startsWith(npcId + '_')) {
        const targetNpc = key.split('_')[1];
        relations[targetNpc] = this.relationships.npcRelations[key];
      }
    });
    return relations;
  }
}

module.exports = new RelationshipMatrix();