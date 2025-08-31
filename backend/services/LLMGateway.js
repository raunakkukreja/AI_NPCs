// backend/services/LLMGateway.js
/*
  Mock LLM gateway for Codespaces prototype.
  Performs simple safety checks and returns canned (JSON) responses.
*/

const bannedPatterns = [/kill/i, /steal/i, /hack/i, /bomb/i, /cheat/i];

async function generate(prompt) {
  // safety filter
  for (const r of bannedPatterns) {
    if (r.test(prompt)) {
      return { dialogue: "I won't help with that.", action: null, metadata: { safety: "refused" } };
    }
  }

  const p = (prompt || "").toLowerCase();

  // greeting / gossip responses
  if (p.includes("help") || p.includes("bribe") || p.includes("court") || p.includes("ledger")) {
    return { dialogue: "I remember hearing something about that — you might ask Helios by the ruins.", action: null, metadata: { tone: "informative" } };
  }

  if (p.includes("hello") || p.includes("hi") || p.includes("any news")) {
    return { dialogue: "Hey there — thanks for asking. I remember you helped someone earlier.", action: null, metadata: { tone: "friendly" } };
  }

  // default fallback
  return { dialogue: "I have little to say on that.", action: null, metadata: {} };
}

module.exports = { generate };
