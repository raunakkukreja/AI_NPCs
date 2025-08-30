
import React from 'react';
export default function NPCCard({ npcId, dialogue }){
  if(!npcId) return <div className="npc-card">Talk to an NPC by clicking the orange cube.</div>;
  return (
    <div className="npc-card">
      <h3>{npcId}</h3>
      <div className="dialogue-box">{dialogue}</div>
    </div>
  );
}

