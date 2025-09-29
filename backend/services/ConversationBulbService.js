const { spawn } = require('child_process');
const path = require('path');

class ConversationBulbService {
  constructor() {
    this.enabled = true;
    this.lastEmotion = null;
  }

  analyzeConversationEmotion(playerText, npcReply) {
    if (!this.enabled) return;

    // Combine both messages for emotion analysis
    const conversationText = `${playerText} ${npcReply}`;
    
    try {
      const scriptPath = path.join(__dirname, '../../model_server/emotion_bulb_controller.py');
      const python = spawn('python', [scriptPath, 'emotion', conversationText]);
      
      python.stdout.on('data', (data) => {
        const output = data.toString().trim();
        console.log(`[CONVERSATION-BULB] ${output}`);
        
        // Extract emotion from output
        const emotionMatch = output.match(/Emotion: (\w+)/);
        if (emotionMatch) {
          this.lastEmotion = emotionMatch[1];
        }
      });
      
      python.on('error', () => {
        // Silently fail if bulb not available
      });
      
    } catch (err) {
      // Silently fail if integration not available
    }
  }

  analyzePlayerMessage(playerText) {
    if (!this.enabled) return;

    try {
      const scriptPath = path.join(__dirname, '../../model_server/emotion_bulb_controller.py');
      const python = spawn('python', [scriptPath, 'emotion', playerText]);
      
      python.stdout.on('data', (data) => {
        console.log(`[PLAYER-BULB] ${data.toString().trim()}`);
      });
      
      python.on('error', () => {});
      
    } catch (err) {}
  }

  analyzeNPCResponse(npcReply) {
    if (!this.enabled) return;

    try {
      const scriptPath = path.join(__dirname, '../../model_server/emotion_bulb_controller.py');
      const python = spawn('python', [scriptPath, 'emotion', npcReply]);
      
      python.stdout.on('data', (data) => {
        console.log(`[NPC-BULB] ${data.toString().trim()}`);
      });
      
      python.on('error', () => {});
      
    } catch (err) {}
  }

  turnOff() {
    try {
      const scriptPath = path.join(__dirname, '../../model_server/emotion_bulb_controller.py');
      const python = spawn('python', [scriptPath, 'off']);
      python.on('error', () => {});
    } catch (err) {}
  }

  disable() {
    this.enabled = false;
  }

  enable() {
    this.enabled = true;
  }
}

module.exports = new ConversationBulbService();