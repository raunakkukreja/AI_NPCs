import { useState } from "react";

export default function ChatBox({ npc, onSend }) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input) return;
    onSend(input);
    setInput("");
  };

  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 
                    bg-gray-900 text-white p-4 rounded-lg w-1/3">
      <p className="mb-2">{npc.name} is talking...</p>
      <div className="flex">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-grow p-2 rounded bg-gray-800 text-white"
          placeholder="Type your message..."
        />
        <button onClick={handleSend} className="ml-2 px-4 py-2 bg-blue-600 rounded">
          Send
        </button>
      </div>
    </div>
  );
}
