/**
 * Game engine responsible for handling Secret Hitler logic.
 * All logic should be server-side and authoritative.
 */
const { ROLES, PHASES, POWERS, FASCIST_POWERS } = require('../shared/constants.js');
const { assignRoles, shuffleDeck } = require('../shared/utils.js');

const BASE_POLICY_DECK = [
  ...Array(6).fill('LIBERAL'),
  ...Array(11).fill('FASCIST'),
];

function createPolicyDeck() {
  return shuffleDeck([...BASE_POLICY_DECK]);
}

/**
 * Draws a number of policy cards from the deck, reshuffling the discard pile
 * if necessary.
 * @param {object} state Game state
 * @param {number} count Number of cards to draw
 * @returns {string[]} Array of policy cards
 */
function drawPolicies(state, count) {
  while (state.policyDeck.length < count) {
    state.policyDeck = shuffleDeck([...state.policyDeck, ...state.discardPile]);
    state.discardPile = [];
  }
  const cards = [];
  for (let i = 0; i < count; i++) {
    cards.push(state.policyDeck.pop());
  }
  return cards;
}

/**
 * Determines which Presidential power is granted when a fascist policy is enacted.
 * @param {object} state Game state
 * @returns {string|null} Power constant
 */
function getGrantedPower(state) {
  const mapping = FASCIST_POWERS[state.settings.playerCount] || [];
  const idx = state.enactedPolicies.fascist - 1; // array index for newly enacted policy
  return mapping[idx] || POWERS.NONE;
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
 * Advances the presidency to the next player, handling Special Election return
 * logic if applicable.
 * @param {object} state Game state
 */
function advancePresidency(state) {
  if (state.specialElectionReturnIndex !== null) {
    state.presidentIndex = state.specialElectionReturnIndex;
    state.specialElectionReturnIndex = null;
  } else {
    state.presidentIndex = (state.presidentIndex + 1) % state.players.length;
  }
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
    discardPile: [],
    enactedPolicies: { liberal: 0, fascist: 0 },
    history: [],
    settings: { playerCount: room.players.length },
    lastPresidentId: null,
    lastChancellorId: null,
    policyHand: null,
    policyStep: null,
    pendingPower: null,
    powerPresidentId: null,
    investigatedIds: [],
    specialElectionReturnIndex: null,
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
        const autoPolicy = drawPolicies(state, 1)[0];
        processPolicy(room, autoPolicy);
        state.failedElections = 0;
        state.lastPresidentId = null;
        state.lastChancellorId = null;
      }
      advancePresidency(state);
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

  if (!victory) {
    if (policy === 'FASCIST') {
      const power = getGrantedPower(state);
      if (power && power !== POWERS.NONE) {
        state.pendingPower = power;
        state.powerPresidentId = state.players[state.presidentIndex].id;
        state.phase = PHASES.POWER;
      } else {
        advancePresidency(state);
        state.phase = PHASES.NOMINATE;
      }
    } else {
      advancePresidency(state);
      state.phase = PHASES.NOMINATE;
    }
  }

  return {
    enactedPolicies: { ...state.enactedPolicies },
    ...(victory ? { gameOver: victory } : {}),
  };
}

/**
 * Begins the legislative session by drawing three policies for the President.
 * @param {object} room Room containing the game state
 * @returns {string[]} Policies drawn for the President
 */
function beginPolicyPhase(room) {
  const state = room.game;
  state.policyHand = drawPolicies(state, 3);
  state.policyStep = 'PRESIDENT';
  return [...state.policyHand];
}

/**
 * Handles policy choices from President and Chancellor during the legislative
 * session.
 * @param {object} room Room containing the game state
 * @param {string} playerId Socket id of the acting player
 * @param {string} policy Policy card chosen
 * @returns {object|null} Resulting action
 */
function handlePolicyChoice(room, playerId, policy) {
  const state = room.game;
  if (!state || state.phase !== PHASES.POLICY || !state.policyHand) return null;

  const president = state.players[state.presidentIndex];
  const chancellor = state.players[state.chancellorIndex];

  if (state.policyStep === 'PRESIDENT') {
    if (playerId !== president.id) return null;
    const idx = state.policyHand.indexOf(policy);
    if (idx === -1) return null;
    state.policyHand.splice(idx, 1);
    state.discardPile.push(policy);
    state.policyStep = 'CHANCELLOR';
    return { promptPlayerId: chancellor.id, policies: [...state.policyHand] };
  }

  if (state.policyStep === 'CHANCELLOR') {
    if (playerId !== chancellor.id) return null;
    const idx = state.policyHand.indexOf(policy);
    if (idx === -1) return null;
    state.policyHand.splice(idx, 1);
    const discarded = state.policyHand.pop();
    state.discardPile.push(discarded);
    const result = processPolicy(room, policy);
    state.policyHand = null;
    state.policyStep = null;
    return { enacted: true, result };
  }

  return null;
}

/**
 * Handles the execution of a Presidential power.
 * Currently only implements Investigate Loyalty.
 * @param {object} room Room containing the game state
 * @param {string} playerId Acting player's socket id (President)
 * @param {object} action Action details from the client
 * @returns {object|null} result of the power
 */
function handlePower(room, playerId, action) {
  const state = room.game;
  if (!state || state.phase !== PHASES.POWER || !state.pendingPower) return null;
  if (playerId !== state.powerPresidentId) return null;

  if (state.pendingPower === POWERS.INVESTIGATE) {
    const target = state.players.find((p) => p.id === action.targetId && p.alive);
    if (!target) return null;
    if (state.investigatedIds.includes(target.id)) return null;
    state.investigatedIds.push(target.id);
    const membership = target.role === ROLES.LIBERAL ? 'LIBERAL' : 'FASCIST';
    state.history.push({ type: 'INVESTIGATE', president: playerId, target: target.id });

    // cleanup and advance round
    state.pendingPower = null;
    state.powerPresidentId = null;
    advancePresidency(state);
    state.phase = PHASES.NOMINATE;

    return { power: POWERS.INVESTIGATE, targetId: target.id, membership };
  }

  if (state.pendingPower === POWERS.SPECIAL_ELECTION) {
    const targetIdx = state.players.findIndex((p) => p.id === action.targetId && p.alive);
    if (targetIdx === -1) return null;

    state.history.push({ type: 'SPECIAL_ELECTION', president: playerId, target: action.targetId });

    state.specialElectionReturnIndex = (state.presidentIndex + 1) % state.players.length;
    state.presidentIndex = targetIdx;

    state.pendingPower = null;
    state.powerPresidentId = null;
    state.phase = PHASES.NOMINATE;

    return { power: POWERS.SPECIAL_ELECTION, targetId: action.targetId };
  }

  return null;
}

module.exports = {
  startGame,
  handleVote,
  processPolicy,
  nominateChancellor,
  beginPolicyPhase,
  handlePolicyChoice,
  handlePower,
  // TODO: add more handlers for each phase and power
};
