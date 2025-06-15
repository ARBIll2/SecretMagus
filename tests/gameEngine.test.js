const {
  nominateChancellor,
  startGame,
  handleVote,
  beginPolicyPhase,
  handlePolicyChoice,
  handleVetoDecision,
  handleDisconnect,
  handlePower,
  processPolicy,
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

describe('handleDisconnect', () => {
  test('disconnecting Hitler ends the game for liberals', () => {
    const room = createRoom(5);
    startGame(room);
    const state = room.game;
    state.players[2].role = ROLES.HITLER;
    const result = handleDisconnect(room, state.players[2].id);
    expect(state.players[2].alive).toBe(false);
    expect(result.gameOver).toEqual({
      winner: 'LIBERALS',
      reason: 'HITLER_EXECUTED',
    });
  });

  test('disconnecting current President counts as failed election', () => {
    const room = createRoom(5);
    startGame(room);
    const state = room.game;
    state.presidentIndex = 0;
    state.players[0].role = ROLES.LIBERAL;
    const result = handleDisconnect(room, state.players[0].id);
    expect(state.failedElections).toBe(1);
    expect(state.phase).toBe(PHASES.NOMINATE);
    expect(result).toBeNull();
  });
});

describe('policy phase and powers', () => {
  test('fascist policy after two fascists grants Policy Peek', () => {
    const room = createRoom(5);
    startGame(room);
    const state = room.game;
    state.presidentIndex = 0;
    state.chancellorIndex = 1;
    state.phase = PHASES.POLICY;
    state.enactedPolicies.fascist = 2;
    state.policyDeck = ['FASCIST', 'LIBERAL', 'LIBERAL'];

    const presidentId = state.players[state.presidentIndex].id;
    const chancellorId = state.players[state.chancellorIndex].id;

    beginPolicyPhase(room);
    const first = state.policyHand[0];
    const out1 = handlePolicyChoice(room, presidentId, { policy: first });
    expect(out1.promptPlayerId).toBe(chancellorId);
    expect(out1.policies).toHaveLength(2);

    const fascistPolicy = state.policyHand.find((p) => p === 'FASCIST');
    const out2 = handlePolicyChoice(room, chancellorId, { policy: fascistPolicy });
    expect(out2.enacted).toBe(true);
    expect(state.pendingPower).toBe('POLICY_PEEK');
    expect(state.phase).toBe(PHASES.POWER);
  });

  test('veto request after five fascist policies advances tracker', () => {
    const room = createRoom(5);
    startGame(room);
    const state = room.game;
    state.presidentIndex = 0;
    state.chancellorIndex = 1;
    state.phase = PHASES.POLICY;
    state.enactedPolicies.fascist = 5;
    state.policyDeck = ['FASCIST', 'LIBERAL', 'FASCIST'];

    const presidentId = state.players[state.presidentIndex].id;
    const chancellorId = state.players[state.chancellorIndex].id;

    beginPolicyPhase(room);
    handlePolicyChoice(room, presidentId, { policy: state.policyHand[0] });
    const out = handlePolicyChoice(room, chancellorId, { veto: true });
    expect(out.veto).toBe(true);
    expect(out.promptPlayerId).toBe(presidentId);

    const result = handleVetoDecision(room, presidentId, true);
    expect(result.accepted).toBe(true);
    expect(state.failedElections).toBe(1);
    expect(state.policyHand).toBeNull();
    expect(state.phase).toBe(PHASES.NOMINATE);
  });

  test('investigate loyalty cannot target same player twice', () => {
    const room = createRoom(7);
    startGame(room);
    const state = room.game;
    state.presidentIndex = 0;
    state.pendingPower = 'INVESTIGATE';
    state.powerPresidentId = state.players[0].id;
    state.phase = PHASES.POWER;

    const targetId = state.players[1].id;
    const res1 = handlePower(room, state.players[0].id, { targetId });
    expect(res1).toEqual({ power: 'INVESTIGATE', targetId, membership: expect.any(String) });
    expect(state.phase).toBe(PHASES.NOMINATE);

    state.pendingPower = 'INVESTIGATE';
    state.powerPresidentId = state.players[0].id;
    state.phase = PHASES.POWER;
    const res2 = handlePower(room, state.players[0].id, { targetId });
    expect(res2).toBeNull();
  });

  test('special election sets presidency and returns after session', () => {
    const room = createRoom(7);
    startGame(room);
    const state = room.game;
    const originalIndex = 0;
    state.presidentIndex = originalIndex;
    state.pendingPower = 'SPECIAL_ELECTION';
    state.powerPresidentId = state.players[originalIndex].id;
    state.phase = PHASES.POWER;

    const targetIdx = 3;
    const targetId = state.players[targetIdx].id;
    const out = handlePower(room, state.players[originalIndex].id, { targetId });
    expect(out).toEqual({ power: 'SPECIAL_ELECTION', targetId });
    expect(state.presidentIndex).toBe(targetIdx);
    const returnIdx = (originalIndex + 1) % state.players.length;
    expect(state.specialElectionReturnIndex).toBe(returnIdx);
    expect(state.phase).toBe(PHASES.NOMINATE);

    processPolicy(room, 'LIBERAL');
    expect(state.presidentIndex).toBe(returnIdx);
    expect(state.specialElectionReturnIndex).toBeNull();
  });

  test('execution of Hitler ends the game immediately', () => {
    const room = createRoom(7);
    startGame(room);
    const state = room.game;
    state.presidentIndex = 0;
    const hitler = state.players[2];
    hitler.role = ROLES.HITLER;

    state.pendingPower = 'EXECUTION';
    state.powerPresidentId = state.players[0].id;
    state.phase = PHASES.POWER;

    const result = handlePower(room, state.players[0].id, { targetId: hitler.id });
    expect(result.power).toBe('EXECUTION');
    expect(result.gameOver).toEqual({ winner: 'LIBERALS', reason: 'HITLER_EXECUTED' });
    expect(state.phase).toBe(PHASES.GAME_OVER);
  });
});
