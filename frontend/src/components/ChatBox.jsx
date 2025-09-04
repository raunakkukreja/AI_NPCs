// frontend/src/components/ChatBox.jsx
import React, { useState, useEffect } from "react";

/*
  ChatBox:
  - npc: { id, name }
  - onSend: async function(text) => { dialogue, action, metadata }
  - onClose: function
  - history: optional array of { who, text, ts }
*/

export default function ChatBox({ npc, onSend, onClose, history }) {
  const [input, setInput] = useState("");
  const [localHistory, setLocalHistory] = useState(() => (Array.isArray(history) ? history.slice() : []));

  // Only update localHistory if a *different* history prop is provided
  useEffect(() => {
    if (Array.isArray(history)) {
      // shallow compare length and last item to avoid unnecessary updates
      const same =
        localHistory.length === history.length &&
        (localHistory.length === 0 ||
          localHistory[localHistory.length - 1].text === history[history.length - 1].text);
      if (!same) {
        setLocalHistory(history.slice());
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history]);

  const handleSend = async () => {
    const text = (input || "").trim();
    if (!text) return;
    // append player message immediately for responsiveness
    const userMsg = { who: "player", text, ts: Date.now() };
    setLocalHistory((prev) => [...prev, userMsg]);
    setInput("");

    try {
      const res = await onSend(text); // expect object { dialogue, action, metadata }
      if (res && (typeof res.dialogue === "string")) {
        const npcMsg = { who: npc?.id || "npc", text: res.dialogue, ts: Date.now() };
        setLocalHistory((prev) => [...prev, npcMsg]);
      } else {
        // fallback if unexpected response
        const fallback = { who: npc?.id || "npc", text: "No response.", ts: Date.now() };
        setLocalHistory((prev) => [...prev, fallback]);
      }
    } catch (err) {
      // show error to user
      const errMsg = { who: npc?.id || "npc", text: "Error: could not get response.", ts: Date.now() };
      setLocalHistory((prev) => [...prev, errMsg]);
      // also surface to console
      console.error("[ChatBox] onSend error:", err);
    }
  };

  return (
    <div className="chatbox" role="dialog" aria-label="Chat with NPC">
      <div className="chatbox-header">
        <strong>{npc ? npc.name : "NPC"}</strong>
        <button className="close-btn" onClick={onClose} aria-label="Close chat">✕</button>
      </div>

      <div className="chatbox-history" id="chat-history">
        {localHistory.map((m, i) => (
          <div key={i} className={`msg ${m.who === "player" ? "msg-player" : "msg-npc"}`}>
            <div className="msg-text">{m.text}</div>
          </div>
        ))}
      </div>

      <div className="chatbox-input">
        <input
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}
