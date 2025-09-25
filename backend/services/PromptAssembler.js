const RelationshipMatrix = require('./RelationshipMatrix');

function assemble(npc, gameState, recentMem, gossip, playerText) {
  const relationships = RelationshipMatrix.getNPCRelationships(npc.id);
  const npcFaction = RelationshipMatrix.getNPCFaction(npc.id);
  
  const relationshipContext = Object.entries(relationships)
    .map(([targetId, score]) => {
      let sentiment = 'neutral towards';
      if (score <= -30) sentiment = 'strongly dislikes';
      else if (score < 0) sentiment = 'dislikes';
      else if (score >= 30) sentiment = 'strongly likes';
      else if (score > 0) sentiment = 'likes';
      
      return `You ${sentiment} ${targetId}`;
    })
    .join('. ');

  const memText = (recentMem || []).map(m => `- ${m.text}`).join('\\n') || 'No recent memories.';
  const gossipText = (gossip || []).map(g => `- ${g.text}`).join('\\n') || 'No gossip nearby.';

  // Add to existing system prompt
  const system = [
    `You are ${npc.name}, ${npc.role}.`,
    `You belong to the ${npcFaction} faction.`,
    `Relationships: ${relationshipContext}`,
    `Personality: ${npc.personality}.`,
    `Goals: ${npc.goals.join(', ') || 'none'}.`,
    `Core knowledge: ${npc.knowledge ? npc.knowledge.join('; ') : 'none'}.`,
    '',
    'You must ALWAYS output valid JSON only, with keys: dialogue (string), action (object|null), metadata (object).',
    'Do not output any extra commentary or explanation outside the JSON.',
    '',
    'Safety rules: refuse to help the player with real-world illegal activity, exploitation, or anything that would enable cheats in this demo. If refusing, output dialogue that politely refuses and set action=null.',
    ''
  ].join('\\n');

  const prompt = [
    system,
    `Game state: time=${gameState.time}, weather=${gameState.weather}, location=${gameState.location}.`,
    `Recent memories:\\n${memText}`,
    `Gossip:\\n${gossipText}`,
    `Player says: "${playerText}"`,
    '',
    'Respond now.'
  ].join('\\n\\n');

  // For the local mock LLM we will simply return a small object; for real LLM we send `prompt`.
  return prompt;
}

module.exports = { assemble };
