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
  };
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
      state.phase = PHASES.POLICY;
      state.failedElections = 0;
    } else {
      state.failedElections += 1;
      if (state.failedElections >= 3) {
        const autoPolicy = state.policyDeck.pop();
        processPolicy(room, autoPolicy);
        state.failedElections = 0;
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

  state.chancellorIndex = null;
  state.presidentIndex = (state.presidentIndex + 1) % state.players.length;
  state.phase = PHASES.NOMINATE;

  return {
    enactedPolicies: { ...state.enactedPolicies },
  };
}

module.exports = {
  startGame,
  handleVote,
  processPolicy,
  // TODO: add more handlers for each phase and power
};
