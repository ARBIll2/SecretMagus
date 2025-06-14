const { nominateChancellor, startGame } = require('../server/gameEngine.js');
const { ROLE_DISTRIBUTION } = require('../shared/constants.js');

function createRoom(playerCount) {
  const players = Array.from({ length: playerCount }, (_, i) => ({ id: `p${i}`, name: `P${i}` }));
  return { players, game: null };
}

describe('nominateChancellor eligibility', () => {
  test('prevents nominating last elected President', () => {
    const room = createRoom(6);
    startGame(room);
    const state = room.game;
    state.lastPresidentId = state.players[0].id;
    state.presidentIndex = 1;
    const success = nominateChancellor(room, state.players[1].id, state.players[0].id);
    expect(success).toBe(false);
  });

  test('allows nominating last President when only five players remain', () => {
    const room = createRoom(5);
    startGame(room);
    const state = room.game;
    state.lastPresidentId = state.players[0].id;
    state.presidentIndex = 1;
    const success = nominateChancellor(room, state.players[1].id, state.players[0].id);
    expect(success).toBe(true);
  });
});
