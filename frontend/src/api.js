// frontend/src/api.js
export async function interact(npcId, text) {
  // Use relative path so Vite proxies it to the backend (see vite.config.js)
  const url = '/api/npc/' + encodeURIComponent(npcId) + '/interact';
  const res = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ text })
  });
  if (!res.ok) {
    const txt = await res.text().catch(()=>null);
    throw new Error('Server error: ' + (res.status + ' ' + res.statusText + (txt ? (' - ' + txt) : '')));
  }
  return await res.json();
}
