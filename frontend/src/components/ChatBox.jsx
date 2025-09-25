// frontend/src/components/ChatBox.jsx
import React, { useState, useEffect, useRef } from "react";
import { interactStream } from "../api";

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
  const inputRef = useRef(null);

  // Add audio ref
  const audioRef = useRef({
    sfxSwish: null,
    sfxType: null
  });

  // Initialize audio and auto-focus input
  useEffect(() => {
    audioRef.current.sfxSwish = new Audio("/assets/sfx_npc_swish.mp3");
    audioRef.current.sfxSwish.volume = 0.9;
    
    console.log("[Audio] ChatBox audio objects initialized:", {
      sfxSwish: audioRef.current.sfxSwish
    });
    
    // Auto-focus input when chat opens
    setTimeout(() => inputRef.current && inputRef.current.focus(), 80);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [localHistory]);

  // History sync effect
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
  }, [history, localHistory.length]);

  const handleSend = async () => {
    const text = (input || "").trim();
    if (!text || isTyping) return;
    
    const userMsg = { who: "player", text, ts: Date.now() };
    setLocalHistory((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      let streamingMsg = { who: npc?.id || "npc", text: "", ts: Date.now(), streaming: true };
      setLocalHistory((prev) => [...prev, streamingMsg]);
      
      await interactStream(npc?.id, text, (chunk) => {
        if (chunk.choices?.[0]?.delta?.content) {
          const content = chunk.choices[0].delta.content;
          
          // Play swish sound on first character of response
          if (streamingMsg.text === "") {
            try {
              console.log("[Audio] Playing NPC response swish sound");
              audioRef.current.sfxSwish.cloneNode().play().catch((e) => {
                console.log("[Audio] Failed to play swish sound:", e);
              });
            } catch (e) {
              console.error("[Audio] Error playing swish sound:", e);
            }
          }
          
          setLocalHistory((prev) => {
            const newHistory = [...prev];
            const lastMsg = newHistory[newHistory.length - 1];
            if (lastMsg.streaming) {
              lastMsg.text += content;
            }
            return newHistory;
          });
        }
      });
      
      setLocalHistory((prev) => {
        const newHistory = [...prev];
        const lastMsg = newHistory[newHistory.length - 1];
        if (lastMsg.streaming) {
          delete lastMsg.streaming;
        }
        return newHistory;
      });
      
      setIsTyping(false);
    } catch (err) {
      setIsTyping(false);
      const errMsg = { who: npc?.id || "npc", text: "Error: could not get response.", ts: Date.now() };
      setLocalHistory((prev) => [...prev, errMsg]);
      console.error("[ChatBox] stream error:", err);
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
        {isTyping && !localHistory.some(m => m.streaming) && (
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
          ref={inputRef}
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
