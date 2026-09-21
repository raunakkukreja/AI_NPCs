const RelationshipMatrix = require('./RelationshipMatrix');

function assemble(npc, gameState, recentMem, gossip, playerText) {
  const relationships = RelationshipMatrix.getNPCRelationships(npc.id);
  const npcFaction = RelationshipMatrix.getNPCFaction(npc.id);
  const playerRelation = RelationshipMatrix.getPlayerRelationship(npc.id);
  
  const relationshipContext = Object.entries(relationships)
    .map(([targetId, score]) => {
        let sentiment = 'neutral towards';
        let description = '';
        
        if (score <= -30) {
            sentiment = 'strongly dislikes';
            description = 'speak with clear disdain about';
        } else if (score < 0) {
            sentiment = 'dislikes';
            description = 'speak negatively about';
        } else if (score >= 30) {
            sentiment = 'strongly likes';
            description = 'speak very warmly about';
        } else if (score > 0) {
            sentiment = 'likes';
            description = 'speak positively about';
        }
        
        return `You ${sentiment} ${targetId}. When discussing ${targetId}, you should ${description} them.`;
    })
    .join('. ');

  const memText = (recentMem || []).map(m => `- ${m.text}`).join('\\n') || 'No recent memories.';
  const gossipText = (gossip || []).map(g => `- ${g.text}`).join('\\n') || 'No gossip nearby.';

  // Enhanced player relationship context
  let playerContext = '';
  if (playerRelation <= -30) {
      playerContext = 'You strongly distrust the player and are hostile';
  } else if (playerRelation <= -10) {
      playerContext = 'You are wary and suspicious of the player';
  } else if (playerRelation >= 30) {
      playerContext = 'You consider the player a trusted friend';
  } else if (playerRelation >= 10) {
      playerContext = 'You are friendly and open with the player';
  } else {
      playerContext = 'You are neutral towards the player';
  }

  const systemPrompt = [
      `You are ${npc.name}. ${npc.personality || ''}`,
      `Current relationship with player: ${playerContext}`,
      `Your relationships with others: ${relationshipContext}`,
      `Recent memories: ${memText}`,
      `Recent gossip: ${gossipText}`,
      `Respond based on these relationship dynamics.`
  ].join('\n');

  return systemPrompt;
}

class PlanGenerator {
    generatePlan(npc, target, relationships) {
        const npcGoals = npc.goals;
        const relationshipScore = relationships[target];
        const factionTension = getFactionTension(npc, target);
        
        // Generate plan based on these factors
        return {
            type: relationshipScore < 0 ? 'sabotage' : 'cooperation',
            description: '', // AI generated plan
            requirements: [],
            risks: []
        };
    }
}

// Need to modify in PromptAssembler.js
function processGossip(gossip, sourceNpc, targetNpc) {
    const relationship = RelationshipMatrix.getNPCRelation(sourceNpc, targetNpc);
    
    let credibilityContext = '';
    if (relationship <= -20) {
        credibilityContext = `(You are skeptical of this gossip since it comes from ${sourceNpc}, whom you distrust)`;
    } else if (relationship >= 20) {
        credibilityContext = `(You take this seriously since it comes from ${sourceNpc}, whom you trust)`;
    }
    
    return `${gossip} ${credibilityContext}`;
}

// Add to PromptAssembler.js
function getAvailableDialogueOptions(playerRelation) {
    if (playerRelation >= 30) {
        return ['Share secrets', 'Ask for help', 'Personal conversation'];
    } else if (playerRelation <= -20) {
        return ['Basic interaction', 'Try to improve relationship'];
    }
    return ['Standard dialogue options'];
}

module.exports = { assemble, PlanGenerator, processGossip, getAvailableDialogueOptions };
