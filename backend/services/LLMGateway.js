
/*
  Mock LLM gateway for Codespaces prototype.

  Replace this with a real gateway to Ollama or remote API when ready.
*/
async function generate(prompt) {
  // very simple mock: return a small JSON object
  const dialogue = "Hey there — thanks for asking. I remember you helped someone earlier.";
  const action = null;
  const metadata = { tone: "friendly" };
  return { dialogue, action, metadata, promptPreview: prompt.slice(0, 800) };
}

module.exports = { generate };

