
const NPCProfileManager = require('../services/NPCProfileManager');
const GameStateManager = require('../services/GameStateManager');
const MemoryStore = require('../services/MemoryStore');
const PromptAssembler = require('../services/PromptAssembler');
const LLMGateway = require('../services/LLMGateway');
const ActionExecutor = require('../services/ActionExecutor');

async function handleInteract(req, res) {
  try {
    const npcId = req.params.id;
    const playerText = req.body.text || '';
    const npc = NPCProfileManager.load(npcId);
    const gameState = GameStateManager.get();
    const recentMem = MemoryStore.getRecent(npcId, 3);
    const gossip = GameStateManager.getGossipForNPC(npc);

    const prompt = PromptAssembler.assemble(npc, gameState, recentMem, gossip, playerText);
    const llmRaw = await LLMGateway.generate(prompt);

    // LLMGateway returns an object (mock or parsed JSON)
    const response = llmRaw || { dialogue: "I'm not sure what to say.", action: null, metadata: {} };

    // Execute action (safely) if present
    if (response.action) {
      const result = ActionExecutor.execute(response.action, { npc, gameState });
      if (result && result.error) response.actionError = result.error;
    }

    // Optionally persist memory/gossip from this interaction
    if (playerText.toLowerCase().includes('help')) {
      MemoryStore.add(npcId, { text: playerText, ts: Date.now(), importance: 7 });
      GameStateManager.appendGossip({ id: 'g' + Date.now(), text: `${npc.name} heard player offered help`, ts: Date.now(), importance: 6 });
    }

    res.json(response);
  } catch (err) {
    console.error('interact error', err);
    res.status(500).json({ dialogue: "Something went wrong on the server.", action: null });
  }
}

module.exports = { handleInteract };

import { PointerLockControls } from "@react-three/drei";
import { useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { characters } from "./characters";

export default function GameWorld() {
  const [playerPos, setPlayerPos] = useState(new THREE.Vector3(0, 0.5, 0));
  const speed = 0.1;

  // WASD movement
  useEffect(() => {
    const keys = {};
    const handleKeyDown = (e) => (keys[e.code] = true);
    const handleKeyUp = (e) => (keys[e.code] = false);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useFrame(({ camera }) => {
    let moved = false;
    const newPos = playerPos.clone();

    if (keys["KeyW"]) { camera.translateZ(-speed); moved = true; }
    if (keys["KeyS"]) { camera.translateZ(speed); moved = true; }
    if (keys["KeyA"]) { camera.translateX(-speed); moved = true; }
    if (keys["KeyD"]) { camera.translateX(speed); moved = true; }

    if (moved) {
      setPlayerPos(camera.position.clone());
    }
  });

  return (
    <>
      <PointerLockControls />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />

      {/* Render NPCs */}
      {characters.filter(c => c.type === "npc").map((npc) => (
        <mesh key={npc.id} position={npc.position}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="orange" />
        </mesh>
      ))}
    </>
  );
}
