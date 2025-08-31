// backend/controllers/interactController.js
const NPCProfileManager = require("../services/NPCProfileManager");
const GameStateManager = require("../services/GameStateManager");
const MemoryStore = require("../services/MemoryStore");
const PromptAssembler = require("../services/PromptAssembler");
const LLMGateway = require("../services/LLMGateway");
const ActionExecutor = require("../services/ActionExecutor");

async function handleInteract(req, res) {
  try {
    const npcId = req.params.id;
    const playerText = (req.body && req.body.text) ? String(req.body.text) : "";

    console.log(`[INTERACT] npc=${npcId}, playerText=${playerText}`);

    // load npc profile
    const npc = NPCProfileManager.load(npcId);
    if (!npc) {
      return res.status(404).json({ dialogue: "I don't know that person.", action: null });
    }

    const gameState = GameStateManager.get();
    const recentMem = MemoryStore.getRecent(npcId, 3);
    const gossip = GameStateManager.getGossipForNPC(npc);

    const prompt = PromptAssembler.assemble(npc, gameState, recentMem, gossip, playerText);

    // Generate response (mock LLM or real gateway)
    const llmResponse = await LLMGateway.generate(prompt);

    // Ensure we have an object shape
    const response =
      typeof llmResponse === "object" && llmResponse !== null
        ? llmResponse
        : { dialogue: String(llmResponse || "No response"), action: null, metadata: {} };

    // Execute action (if present) safely
    if (response.action) {
      const result = ActionExecutor.execute(response.action, { npc, gameState });
      if (result && result.error) {
        // attach action error but still return dialogue
        response.actionError = result.error;
      }
    }

    // Persist small memory/gossip heuristics (demo purposes)
    // If player mentions 'help' we add a memory and gossip entry
    if (playerText.toLowerCase().includes("help")) {
      MemoryStore.add(npcId, { text: playerText, ts: Date.now(), importance: 7 });
      GameStateManager.appendGossip({
        id: "g" + Date.now(),
        text: `${npc.name} heard: "${playerText}"`,
        ts: Date.now(),
        importance: 5
      });
    }

    // return the response JSON
    return res.json(response);
  } catch (err) {
    console.error("interactController error:", err && err.stack ? err.stack : err);
    return res.status(500).json({ dialogue: "Server error while interacting.", action: null });
  }
}

module.exports = { handleInteract };
