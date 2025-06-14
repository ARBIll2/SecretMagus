/**
 * Game engine responsible for handling Secret Hitler logic.
 * All logic should be server-side and authoritative.
 */
const { ROLES, PHASES } = require('../shared/constants.js');
const { assignRoles, shuffleDeck } = require('../shared/utils.js');

const BASE_POLICY_DECK = [
  ...Array(6).fill('LIBERAL'),
  ...Array(11).fill('FASCIST'),
];

function createPolicyDeck() {
  return shuffleDeck([...BASE_POLICY_DECK]);
}

/**
 * Checks if any win conditions are met.
 * @param {object} state Game state
 * @returns {object|null} result if game over
 */
function checkVictory(state) {
  if (state.enactedPolicies.liberal >= 5) {
    state.phase = PHASES.GAME_OVER;
    return { winner: 'LIBERALS', reason: 'LIBERAL_POLICIES' };
  }
  if (state.enactedPolicies.fascist >= 6) {
    state.phase = PHASES.GAME_OVER;
    return { winner: 'FASCISTS', reason: 'FASCIST_POLICIES' };
  }
  return null;
}

/**
 * Example structure of a game state object.
 */
// const exampleState = {
//   players: [],
//   phase: PHASES.NOMINATE,
//   presidentIndex: 0,
//   chancellorIndex: null,
//   failedElections: 0,
//   policyDeck: [],
//   enactedPolicies: { liberal: 0, fascist: 0 },
//   history: [],
//   settings: { playerCount: 0, roomCode: '' },
// };

/**
 * Starts a new game for a given room.
 */
function startGame(room) {
  room.players = assignRoles(room.players);
  room.game = {
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      role: p.role,
      alive: true,
      hasVoted: false,
      vote: null,
    })),
    phase: PHASES.NOMINATE,
    presidentIndex: 0,
    chancellorIndex: null,
    failedElections: 0,
    policyDeck: createPolicyDeck(),
    enactedPolicies: { liberal: 0, fascist: 0 },
    history: [],
    settings: { playerCount: room.players.length },
    lastPresidentId: null,
    lastChancellorId: null,
  };
}

/**
 * Nominates a chancellor and moves to voting phase.
 */
function nominateChancellor(room, presidentId, nomineeId) {
  const state = room.game;
  if (!state || state.phase !== PHASES.NOMINATE) return false;

  const president = state.players[state.presidentIndex];
  if (president.id !== presidentId) return false;

  const nomineeIndex = state.players.findIndex(
    (p) => p.id === nomineeId && p.alive
  );
  if (nomineeIndex === -1 || nomineeIndex === state.presidentIndex) return false;

  const aliveCount = state.players.filter((p) => p.alive).length;
  if (state.lastChancellorId && nomineeId === state.lastChancellorId) return false;
  if (aliveCount > 5 && state.lastPresidentId && nomineeId === state.lastPresidentId)
    return false;

  state.chancellorIndex = nomineeIndex;
  state.phase = PHASES.VOTE;

  state.history.push({ type: 'NOMINATION', president: presidentId, chancellor: nomineeId });

  return true;
}

/**
 * Handles player votes.
 */
function handleVote(room, playerId, vote) {
  const state = room.game;
  if (!state || state.phase !== PHASES.VOTE) return null;

  const player = state.players.find((p) => p.id === playerId);
  if (!player || player.hasVoted) return null;

  player.hasVoted = true;
  player.vote = vote;

  if (state.players.every((p) => p.hasVoted)) {
    const yesVotes = state.players.filter((p) => p.vote === true).length;
    const passed = yesVotes > state.players.length / 2;

    state.history.push({
      type: 'VOTE',
      result: passed,
      votes: state.players.map((p) => ({ id: p.id, vote: p.vote })),
    });

    state.players.forEach((p) => {
      p.hasVoted = false;
      p.vote = null;
    });

    if (passed) {
      const chancellor = state.players[state.chancellorIndex];

      state.lastPresidentId = state.players[state.presidentIndex].id;
      state.lastChancellorId = chancellor.id;

      if (
        chancellor.role === ROLES.HITLER &&
        state.enactedPolicies.fascist >= 3
      ) {
        state.phase = PHASES.GAME_OVER;
        return {
          completed: true,
          passed,
          votes: state.history[state.history.length - 1].votes,
          gameOver: { winner: 'FASCISTS', reason: 'HITLER_ELECTED' },
        };
      }
      state.phase = PHASES.POLICY;
      state.failedElections = 0;
    } else {
      state.failedElections += 1;
      if (state.failedElections >= 3) {
        const autoPolicy = state.policyDeck.pop();
        processPolicy(room, autoPolicy);
        state.failedElections = 0;
        state.lastPresidentId = null;
        state.lastChancellorId = null;
      }
      state.presidentIndex = (state.presidentIndex + 1) % state.players.length;
      state.phase = PHASES.NOMINATE;
    }

    return {
      completed: true,
      passed,
      votes: state.history[state.history.length - 1].votes,
    };
  }

  return { completed: false };
}

/**
 * Processes a selected policy.
 */
function processPolicy(room, policy) {
  const state = room.game;
  if (!state) return null;

  if (policy === 'LIBERAL') {
    state.enactedPolicies.liberal += 1;
  } else {
    state.enactedPolicies.fascist += 1;
  }

  state.history.push({ type: 'POLICY', policy });

  const victory = checkVictory(state);

  state.chancellorIndex = null;
  state.presidentIndex = (state.presidentIndex + 1) % state.players.length;
  if (!victory) {
    state.phase = PHASES.NOMINATE;
  }

  return {
    enactedPolicies: { ...state.enactedPolicies },
    ...(victory ? { gameOver: victory } : {}),
  };
}

module.exports = {
  startGame,
  handleVote,
  processPolicy,
  nominateChancellor,
  // TODO: add more handlers for each phase and power
};
