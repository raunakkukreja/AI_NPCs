// backend/services/LLMGateway.js
// Gateway from Node -> Claude API. Reads ANTHROPIC_API_KEY from the environment
// (see .env.example). Replaces the old local llama.cpp model server, which
// can't run on a serverless/hosted platform.
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic();
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-5';

// interactController.js builds an OpenAI-style messages array with
// interleaved 'system' entries. Claude only accepts 'user'/'assistant' in
// `messages`, with a separate top-level `system` string, and the first
// message must be from the user.
function splitMessages(messages) {
  const systemParts = [];
  const chatMessages = [];
  for (const m of messages) {
    if (m.role === 'system') {
      systemParts.push(m.content);
    } else {
      chatMessages.push({ role: m.role, content: m.content });
    }
  }
  if (chatMessages.length === 0 || chatMessages[0].role !== 'user') {
    chatMessages.unshift({ role: 'user', content: '(The player approaches.)' });
  }
  return { system: systemParts.join('\n\n'), messages: chatMessages };
}

async function callLocalModel(messages, opts = {}) {
  const { system, messages: chatMessages } = splitMessages(messages);
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: opts.max_tokens || 256,
      temperature: typeof opts.temperature === 'number' ? opts.temperature : 0.3,
      system,
      messages: chatMessages
    });
    const textBlock = response.content.find((b) => b.type === 'text');
    return { raw: response, text: textBlock ? textBlock.text : '' };
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      console.error('LLMGateway auth error: check ANTHROPIC_API_KEY', err.message);
    } else {
      console.error('LLMGateway error:', err);
    }
    return { raw: null, text: 'The NPC falls silent.' };
  }
}

async function callLocalModelStream(messages, opts = {}, onChunk) {
  const { system, messages: chatMessages } = splitMessages(messages);
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: opts.max_tokens || 256,
    temperature: typeof opts.temperature === 'number' ? opts.temperature : 0.3,
    system,
    messages: chatMessages
  });

  stream.on('text', (text) => {
    onChunk({ choices: [{ delta: { content: text } }] });
  });

  await stream.finalMessage();
}

module.exports = { callLocalModel, callLocalModelStream };
