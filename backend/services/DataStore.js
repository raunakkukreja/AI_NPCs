const fs = require('fs/promises');
const path = require('path');

class DataStore {
    constructor() {
        this.dataPath = path.join(__dirname, '../data/relationships.json');
        this.relationships = {
            npc: {},
            player: {}
        };
    }

    async load() {
        try {
            const data = await fs.readFile(this.dataPath, 'utf8');
            this.relationships = JSON.parse(data);
        } catch (error) {
            // If file doesn't exist, use default empty relationships
            await this.save();
        }
    }

    async save() {
        console.log('[DEBUG] Saving to path:', this.dataPath);
        console.log('[DEBUG] Current relationships:', JSON.stringify(this.relationships, null, 2));
        
        try {
            await fs.writeFile(
                this.dataPath, 
                JSON.stringify(this.relationships, null, 2)
            );
            console.log('[DEBUG] Save successful');
        } catch (error) {
            console.error('[DEBUG] Save failed:', error);
            throw error;
        }
    }
}

module.exports = new DataStore();