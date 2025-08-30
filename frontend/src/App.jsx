
import React, { useState } from 'react';
import GameCanvas from './components/GameCanvas';
import NPCCard from './components/NPCCard';
import { interact } from './api';

export default function App(){
  const [dialogue, setDialogue] = useState("");
  const [lastNPC, setLastNPC] = useState(null);

  async function handleInteract(npcId){
    setLastNPC(npcId);
    try {
      const res = await interact(npcId, "Hello there");
      setDialogue(res.dialogue || "No response");
    } catch(e){
      setDialogue("Backend unreachable or error.");
    }
  }

  return (
    <div className="app">
      <GameCanvas onTalk={handleInteract} />
      <div className="ui">
        <h2>Living Worlds — Prototype</h2>
        <p><strong>Click the NPC cube</strong> to talk.</p>
        <NPCCard npcId={lastNPC} dialogue={dialogue} />
      </div>
    </div>
  );
}

