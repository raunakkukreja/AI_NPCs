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

