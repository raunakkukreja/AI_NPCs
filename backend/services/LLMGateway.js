// backend/services/LLMGateway.js
//const fetch = require('node-fetch');
const LOCAL_LLM_URL = process.env.LOCAL_LLM_URL || 'http://127.0.0.1:8000';
const LOCAL_LLM_API_KEY = process.env.LOCAL_LLM_API_KEY || ''; // optional

async function callLocalModel(messages, opts = {}) {
  const url = `${LOCAL_LLM_URL}/chat`;
  const body = {
    messages,
    max_tokens: opts.max_tokens || 256,
    temperature: typeof opts.temperature === 'number' ? opts.temperature : 0.3
  };

  const headers = { 'Content-Type': 'application/json' };
  if (LOCAL_LLM_API_KEY) headers['x-api-key'] = LOCAL_LLM_API_KEY;

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    timeout: 60000
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Local LLM returned ${res.status}: ${text}`);
  }

  const data = await res.json();
  const assistant = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  return { raw: data, text: assistant || '' };
}

async function callLocalModelStream(messages, opts = {}, onChunk) {
  const url = `${LOCAL_LLM_URL}/chat/stream`;
  const body = {
    messages,
    max_tokens: opts.max_tokens || 256,
    temperature: typeof opts.temperature === 'number' ? opts.temperature : 0.3
  };

  const headers = { 'Content-Type': 'application/json' };
  if (LOCAL_LLM_API_KEY) headers['x-api-key'] = LOCAL_LLM_API_KEY;

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Local LLM returned ${res.status}: ${text}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') return;
        try {
          const chunk = JSON.parse(data);
          if (chunk.error) throw new Error(chunk.error);
          onChunk(chunk);
        } catch (e) {
          console.warn('Failed to parse chunk:', data);
        }
      }
    }
  }
}

module.exports = { callLocalModel, callLocalModelStream };
