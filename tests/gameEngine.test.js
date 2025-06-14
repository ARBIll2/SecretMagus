const {
  nominateChancellor,
  startGame,
  handleVote,
} = require('../server/gameEngine.js');
const { ROLE_DISTRIBUTION, PHASES, ROLES } = require('../shared/constants.js');

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

describe('handleVote', () => {
  test('majority counts only alive players', () => {
    const room = createRoom(5);
    startGame(room);
    const state = room.game;
    state.presidentIndex = 0;
    nominateChancellor(room, state.players[0].id, state.players[1].id);
    // kill one player
    state.players[4].alive = false;
    handleVote(room, state.players[0].id, true);
    handleVote(room, state.players[1].id, true);
    handleVote(room, state.players[2].id, true);
    const result = handleVote(room, state.players[3].id, false);
    expect(result.passed).toBe(true);
    expect(state.phase).toBe(PHASES.POLICY);
  });

  test('auto policy enacted after three failed elections', () => {
    const room = createRoom(5);
    startGame(room);
    const state = room.game;
    state.presidentIndex = 0;
    // stack deck to know result
    state.policyDeck = ['FASCIST'];
    for (let i = 0; i < 3; i++) {
      const president = state.players[state.presidentIndex];
      const nominee = state.players[(state.presidentIndex + 1) % state.players.length];
      nominateChancellor(room, president.id, nominee.id);
      state.players
        .filter((p) => p.alive)
        .forEach((p) => handleVote(room, p.id, false));
      if (i < 2) {
        expect(state.failedElections).toBe(i + 1);
        expect(state.phase).toBe(PHASES.NOMINATE);
      }
    }
    expect(state.failedElections).toBe(0);
    expect(state.enactedPolicies.fascist + state.enactedPolicies.liberal).toBe(1);
  });

  test('auto policy from election tracker grants no power', () => {
    const room = createRoom(7);
    startGame(room);
    const state = room.game;
    state.presidentIndex = 0;
    state.policyDeck = ['FASCIST'];
    for (let i = 0; i < 3; i++) {
      const president = state.players[state.presidentIndex];
      const nominee = state.players[(state.presidentIndex + 1) % state.players.length];
      nominateChancellor(room, president.id, nominee.id);
      state.players
        .filter((p) => p.alive)
        .forEach((p) => handleVote(room, p.id, false));
    }
    expect(state.pendingPower).toBe(null);
    expect(state.phase).toBe(PHASES.NOMINATE);
  });

  test('electing Hitler after three fascist policies ends game', () => {
    const room = createRoom(5);
    startGame(room);
    const state = room.game;
    state.presidentIndex = 0;
    state.enactedPolicies.fascist = 3;
    state.players[2].role = ROLES.HITLER;
    nominateChancellor(room, state.players[0].id, state.players[2].id);
    const alive = state.players.filter((p) => p.alive);
    let result;
    alive.forEach((p, idx) => {
      result = handleVote(room, p.id, true);
    });
    expect(result.gameOver).toEqual({
      winner: 'FASCISTS',
      reason: 'HITLER_ELECTED',
    });
  });
});
