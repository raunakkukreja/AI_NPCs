const { spawn } = require('child_process');
const path = require('path');

class SmartBulbController {
  constructor() {
    this.enabled = true;
    this.lastTheme = null;
  }

  updateBulb(type, data) {
    if (!this.enabled) return;
    
    console.log(`[BULB-TRIGGER] Attempting to change bulb: ${type} - ${data}`);
    
    try {
      const scriptPath = path.join(__dirname, '../../model_server/game_bulb_controller.py');
      const python = spawn('python', [scriptPath, type, data]);
      
      python.stdout.on('data', (output) => {
        console.log(`[BULB-OUTPUT] ${output.toString().trim()}`);
      });
      
      python.stderr.on('data', (error) => {
        console.log(`[BULB-ERROR] ${error.toString().trim()}`);
      });
      
      python.on('close', (code) => {
        if (code === 0) {
          console.log(`[BULB-SUCCESS] Updated: ${type} - ${data}`);
          this.lastTheme = data;
        } else {
          console.log(`[BULB-FAILED] Exit code: ${code}`);
        }
      });
      
      python.on('error', (err) => {
        console.log(`[BULB-SPAWN-ERROR] ${err.message}`);
      });
    } catch (err) {
      console.log(`[BULB-CATCH-ERROR] ${err.message}`);
    }
  }

  setLocationTheme(locationId) {
    this.updateBulb('location', locationId);
  }

  setInteractionTheme(npcId, interactionType = 'neutral') {
    if (interactionType === 'gossip') {
      this.updateBulb('gossip', '');
    } else {
      this.updateBulb('interact', npcId);
    }
  }

  triggerMovement() {
    this.updateBulb('movement', '');
  }

  triggerDanger() {
    this.updateBulb('danger', '');
  }

  setConversationTone(tone, intensity = 1.0) {
    this.updateBulb('tone', `${tone} ${intensity}`);
  }

  setDangerMode() {
    this.updateBulb('danger', '');
  }

  disable() {
    this.enabled = false;
  }

  enable() {
    this.enabled = true;
  }
}

module.exports = new SmartBulbController();