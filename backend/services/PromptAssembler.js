
function assemble(npc, gameState, recentMem, gossip, playerText) {
  const memText = (recentMem || []).map(m=>m.text).join('\\n') || 'No recent memories.';
  const gossipText = (gossip || []).map(g=>g.text).join('\\n') || 'No gossip nearby.';
  return [
    `You are ${npc.name}, ${npc.role}. Personality: ${npc.personality}. Goals: ${npc.goals.join(', ')}.`,
    `Game state: time=${gameState.time}, weather=${gameState.weather}, location=${gameState.location}.`,
    `Recent memory:\\n${memText}`,
    `Gossip:\\n${gossipText}`,
    `Player says: ${playerText}`,
    'Output a JSON object only with keys: dialogue (string), action (object|null), metadata (object).'
  ].join('\\n\\n');
}

module.exports = { assemble };
