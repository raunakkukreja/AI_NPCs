// frontend/src/App.jsx
import React, { useState, useEffect } from "react";
import World2D from "./components/World2D";
import ChatBox from "./components/ChatBox";
import NPCCard from "./components/NPCCard";
import { interact } from "./api";

export default function App() {
  const [showTutorial, setShowTutorial] = useState(true);
  const [currentNPC, setCurrentNPC] = useState(null);
  const [chatVisible, setChatVisible] = useState(false);
  const [lastDialogue, setLastDialogue] = useState("");
  const [panelSubject, setPanelSubject] = useState(null);

  // listen for small "distance hint" events from the world (optional)
  useEffect(() => {
    function onFail(e) {
      const d = e.detail?.distance ?? 999;
      // show a tiny in-UI hint (we set lastDialogue)
      if (d > 2.2) setLastDialogue("You are too far from an NPC to interact (move closer).");
    }
    window.addEventListener("game-interact-failed", onFail);
    return () => window.removeEventListener("game-interact-failed", onFail);
  }, []);

  // replace handleTalkRequest with:
  const handleTalkRequest = async (idOrObj) => {
    console.log("[APP] talk request for", idOrObj);
    if (!idOrObj) return;
    if (typeof idOrObj === "string") {
      setCurrentNPC({ id: idOrObj, name: idOrObj });
      setChatVisible(true);
      setLastDialogue("");
      setPanelSubject({ type: 'npc', id: idOrObj });
    } else if (typeof idOrObj === "object") {
      if (idOrObj.type === 'area') {
        setPanelSubject({ type: 'area', id: idOrObj.id });
      } else if (idOrObj.type === 'npc') {
        setCurrentNPC({ id: idOrObj.id, name: idOrObj.id });
        setChatVisible(true);
        setPanelSubject({ type: 'npc', id: idOrObj.id });
      }
    }
  };

  const handleSendToNPC = async (text) => {
    if (!currentNPC) throw new Error("No NPC selected");
    console.log("[APP] sending to", currentNPC.id, "text:", text);
    try {
      const res = await interact(currentNPC.id, text);
      console.log("[APP] received response:", res);
      return res;
    } catch (err) {
      console.error("[APP] interact error:", err);
      throw err;
    }
  };

  return (
    <div className="app">
      {showTutorial && (
        <div className="tutorial">
          <h3>Welcome to the city</h3>
          <p>Click in the canvas to lock mouse.</p>
          <p>Use <strong>W A S D</strong> to move, move mouse to look around.</p>
          <p>Press <strong>E</strong> to interact with nearby NPCs.</p>
          <button onClick={() => setShowTutorial(false)}>Got it</button>
        </div>
      )}

      {/* Map area */}
      <div className="canvas-wrap">
        <World2D onTalkRequest={handleTalkRequest} />
      </div>

      {/* Info panel */}
      <div className="ui-panel">
        <h2>Living Worlds — Prototype</h2>
        <p>{lastDialogue}</p>
        <NPCCard subject={panelSubject} />
      </div>

      {chatVisible && currentNPC && (
        <ChatBox
          npc={currentNPC}
          onClose={() => setChatVisible(false)}
          onSend={handleSendToNPC}
        />
      )}
    </div>
  );
}
