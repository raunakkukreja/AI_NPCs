// frontend/src/api.js
export async function interact(npcId, text) {
  try {
    const url = '/api/npc/' + encodeURIComponent(npcId) + '/interact';
    console.log('API call', url, text);
    const res = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ text })
    });
    const txt = await res.text();
    try {
      const json = JSON.parse(txt);
      console.log('API response JSON', json);
      return json;
    } catch (e) {
      console.warn('API returned non-JSON:', txt);
      return { dialogue: txt || "No response", action: null };
    }
  } catch (err) {
    console.error('API error', err);
    throw err;
  }
}

export async function interactStream(npcId, text, onChunk) {
  try {
    const url = '/api/npc/' + encodeURIComponent(npcId) + '/interact/stream';
    const res = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ text })
    });
    
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
  } catch (err) {
    console.error('Stream API error', err);
    throw err;
  }
}

