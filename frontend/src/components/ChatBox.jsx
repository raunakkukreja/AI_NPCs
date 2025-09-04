// frontend/src/components/ChatBox.jsx
import React, { useState, useEffect, useRef } from "react";

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
  const [isTyping, setIsTyping] = useState(false);
  const historyRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [localHistory]);

  // Only update localHistory if a *different* history prop is provided
  useEffect(() => {
    if (Array.isArray(history)) {
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
    if (!text || isTyping) return;
    
    const userMsg = { who: "player", text, ts: Date.now() };
    setLocalHistory((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await onSend(text);
      setIsTyping(false);
      
      if (res && (typeof res.dialogue === "string")) {
        const npcMsg = { who: npc?.id || "npc", text: res.dialogue, ts: Date.now() };
        setLocalHistory((prev) => [...prev, npcMsg]);
      } else {
        const fallback = { who: npc?.id || "npc", text: "No response.", ts: Date.now() };
        setLocalHistory((prev) => [...prev, fallback]);
      }
    } catch (err) {
      setIsTyping(false);
      const errMsg = { who: npc?.id || "npc", text: "Error: could not get response.", ts: Date.now() };
      setLocalHistory((prev) => [...prev, errMsg]);
      console.error("[ChatBox] onSend error:", err);
    }
  };

  return (
    <div className="chatbox game-ui" role="dialog" aria-label="Chat with NPC">
      <div className="chatbox-header">
        <div className="npc-info">
          <div className="npc-avatar">🛡️</div>
          <div className="npc-details">
            <strong className="npc-name">{npc ? npc.name : "NPC"}</strong>
          </div>
        </div>
        <button className="close-btn" onClick={onClose} aria-label="Close chat">✕</button>
      </div>

      <div className="chatbox-history" ref={historyRef}>
        {localHistory.map((m, i) => (
          <div key={i} className={`msg ${m.who === "player" ? "msg-player" : "msg-npc"} msg-animate`}>
            <div className="msg-bubble">
              <div className="msg-text">{m.text}</div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="msg msg-npc typing-indicator">
            <div className="msg-bubble">
              <div className="typing-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="chatbox-input">
        <input
          className="game-input"
          placeholder="Speak to the NPC..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={isTyping}
        />
        <button className="send-btn" onClick={handleSend} disabled={isTyping}>
          ⚡
        </button>
      </div>
    </div>
  );
}
