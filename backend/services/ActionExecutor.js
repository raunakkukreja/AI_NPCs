
const GameStateManager = require('./GameStateManager');

const ALLOWED = {
  GiveItem: (params) => {
    const state = GameStateManager.get();
    if (!params || !params.itemId) return { error: 'invalid params' };
    state.player.inventory.push(params.itemId);
    GameStateManager.save();
    return { ok: true };
  }
};

function execute(action, ctx) {
  if (!action || !action.type) return { error: 'no action' };
  const fn = ALLOWED[action.type];
  if (!fn) return { error: `action ${action.type} not allowed` };
  return fn(action.params || {});
}

module.exports = { execute };

