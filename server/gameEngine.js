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
  // Skip executed players
  let safety = 0;
  while (!state.players[state.presidentIndex].alive && safety < state.players.length) {
    state.presidentIndex = (state.presidentIndex + 1) % state.players.length;
    safety += 1;
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
 * Randomly selects the first President as required by the setup rules.
 */
function startGame(room) {
  room.players = assignRoles(room.players);
  const firstPresident = Math.floor(Math.random() * room.players.length);
  room.game = {
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      role: p.role,
      socketId: p.socketId,
      alive: true,
      hasVoted: false,
      vote: null,
    })),
    phase: PHASES.NOMINATE,
    presidentIndex: firstPresident,
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
 * Determines which players each participant knows at the start of the game.
 * Implements the "eyes closed" sequence from the official rules.
 * @param {object} game Initialized game state
 * @returns {object} Mapping of playerId -> info { role, fascists?, hitler? }
 */
function getInitialKnowledge(game) {
  const count = game.players.length;
  const hitler = game.players.find((p) => p.role === ROLES.HITLER);
  const fascists = game.players.filter((p) => p.role === ROLES.FASCIST);

  const knowledge = {};
  game.players.forEach((p) => {
    const info = { role: p.role };
    if (p.role === ROLES.FASCIST) {
      info.fascists = fascists
        .filter((f) => f.id !== p.id)
        .map((f) => ({ id: f.id, name: f.name }));
      info.hitler = { id: hitler.id, name: hitler.name };
    } else if (p.role === ROLES.HITLER) {
      if (count <= 6) {
        info.fascists = fascists.map((f) => ({ id: f.id, name: f.name }));
      } else {
        info.fascists = [];
      }
    }
    knowledge[p.id] = info;
  });

  return knowledge;
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
  if (!player || !player.alive || player.hasVoted) return null;

  player.hasVoted = true;
  player.vote = vote;

  const alivePlayers = state.players.filter((p) => p.alive);

  if (alivePlayers.every((p) => p.hasVoted)) {
    const yesVotes = alivePlayers.filter((p) => p.vote === true).length;
    const passed = yesVotes > alivePlayers.length / 2;
    let autoResult = null;

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
        autoResult = processPolicy(room, autoPolicy, false);
        state.failedElections = 0;
        state.lastPresidentId = null;
        state.lastChancellorId = null;
      } else {
        advancePresidency(state);
        state.phase = PHASES.NOMINATE;
      }
    }

    return {
      completed: true,
      passed,
      votes: state.history[state.history.length - 1].votes,
      ...(autoResult ? { autoResult } : {}),
    };
  }

  return { completed: false };
}

/**
 * Processes a selected policy.
 * @param {object} room Room containing the game state
 * @param {string} policy Policy to enact
 * @param {boolean} grantPower Whether a fascist power should trigger
 */
function processPolicy(room, policy, grantPower = true) {
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
    if (policy === 'FASCIST' && grantPower) {
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
function handlePolicyChoice(room, playerId, choice) {
  const state = room.game;
  if (!state || state.phase !== PHASES.POLICY || !state.policyHand) return null;

  const president = state.players[state.presidentIndex];
  const chancellor = state.players[state.chancellorIndex];

  if (state.policyStep === 'PRESIDENT') {
    if (playerId !== president.id) return null;
    const idx = state.policyHand.indexOf(choice.policy);
    if (idx === -1) return null;
    state.policyHand.splice(idx, 1);
    state.discardPile.push(choice.policy);
    state.policyStep = 'CHANCELLOR';
    return {
      promptPlayerId: chancellor.id,
      policies: [...state.policyHand],
      canVeto: state.enactedPolicies.fascist >= 5,
    };
  }

  if (state.policyStep === 'CHANCELLOR') {
    if (playerId !== chancellor.id) return null;
    if (choice.veto) {
      if (state.enactedPolicies.fascist < 5) return null;
      state.policyStep = 'VETO';
      return { veto: true, promptPlayerId: president.id };
    }
    const idx = state.policyHand.indexOf(choice.policy);
    if (idx === -1) return null;
    state.policyHand.splice(idx, 1);
    const discarded = state.policyHand.pop();
    state.discardPile.push(discarded);
    const result = processPolicy(room, choice.policy);
    state.policyHand = null;
    state.policyStep = null;
    return { enacted: true, result };
  }

  return null;
}

/**
 * Handles the President's decision on a veto request.
 * @param {object} room Room containing the game state
 * @param {string} playerId Socket id of the acting President
 * @param {boolean} accept Whether the President accepts the veto
 * @returns {object|null} Resulting action
 */
function handleVetoDecision(room, playerId, accept) {
  const state = room.game;
  if (!state || state.phase !== PHASES.POLICY || state.policyStep !== 'VETO')
    return null;

  const president = state.players[state.presidentIndex];
  if (president.id !== playerId) return null;
  const chancellor = state.players[state.chancellorIndex];

  if (accept) {
    state.discardPile.push(...state.policyHand);
    state.policyHand = null;
    state.policyStep = null;
    state.history.push({ type: 'VETO', accepted: true });
    state.failedElections += 1;

    let autoResult = null;
    if (state.failedElections >= 3) {
      const autoPolicy = drawPolicies(state, 1)[0];
      autoResult = processPolicy(room, autoPolicy, false);
      state.failedElections = 0;
      state.lastPresidentId = null;
      state.lastChancellorId = null;
    } else {
      advancePresidency(state);
      state.phase = PHASES.NOMINATE;
    }

    return { accepted: true, autoResult };
  }

  state.policyStep = 'CHANCELLOR';
  state.history.push({ type: 'VETO', accepted: false });
  return {
    accepted: false,
    promptPlayerId: chancellor.id,
    policies: [...state.policyHand],
    canVeto: true,
  };
}

/**
 * Handles the execution of a Presidential power.
 * Implements Investigate Loyalty, Special Election, Policy Peek, and Execution.
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

  if (state.pendingPower === POWERS.POLICY_PEEK) {
    while (state.policyDeck.length < 3) {
      state.policyDeck = shuffleDeck([...state.policyDeck, ...state.discardPile]);
      state.discardPile = [];
    }
    const peek = state.policyDeck.slice(-3);
    state.history.push({ type: 'POLICY_PEEK', president: playerId });

    state.pendingPower = null;
    state.powerPresidentId = null;
    advancePresidency(state);
    state.phase = PHASES.NOMINATE;

    return { power: POWERS.POLICY_PEEK, policies: peek };
  }

  if (state.pendingPower === POWERS.EXECUTION) {
    const target = state.players.find((p) => p.id === action.targetId && p.alive);
    if (!target) return null;

    target.alive = false;
    state.history.push({ type: 'EXECUTION', president: playerId, target: target.id });

    const victory =
      target.role === ROLES.HITLER
        ? { winner: 'LIBERALS', reason: 'HITLER_EXECUTED' }
        : null;

    state.pendingPower = null;
    state.powerPresidentId = null;

    if (!victory) {
      advancePresidency(state);
      state.phase = PHASES.NOMINATE;
    } else {
      state.phase = PHASES.GAME_OVER;
    }

    return { power: POWERS.EXECUTION, targetId: target.id, targetName: target.name, gameOver: victory, broadcast: true };
  }

  return null;
}

/**
 * Handles a player disconnecting mid-game. The player is treated as executed
 * without revealing their role. If Hitler disconnects the Liberals win. If the
 * player was part of the current government, the election fails and the
 * election tracker advances.
 * @param {object} room Room containing the game state
 * @param {string} playerId Socket id of the disconnecting player
 * @returns {object|null} result of automatic actions (gameOver or autoResult)
 */
function handleDisconnect(room, playerId) {
  const state = room.game;
  if (!state || state.phase === PHASES.GAME_OVER) return null;

  const idx = state.players.findIndex((p) => p.id === playerId);
  if (idx === -1) return null;
  const player = state.players[idx];
  if (!player.alive) return null;

  player.alive = false;
  state.history.push({ type: 'DISCONNECT', player: playerId });

  if (player.role === ROLES.HITLER) {
    state.phase = PHASES.GAME_OVER;
    return { gameOver: { winner: 'LIBERALS', reason: 'HITLER_EXECUTED' } };
  }

  const involved =
    idx === state.presidentIndex ||
    idx === state.chancellorIndex ||
    state.powerPresidentId === playerId;
  if (involved) {
    state.pendingPower = null;
    state.powerPresidentId = null;
    state.policyHand = null;
    state.policyStep = null;
    state.chancellorIndex = null;
    state.failedElections += 1;
    let autoResult = null;
    if (state.failedElections >= 3) {
      const autoPolicy = drawPolicies(state, 1)[0];
      autoResult = processPolicy(room, autoPolicy, false);
      state.failedElections = 0;
      state.lastPresidentId = null;
      state.lastChancellorId = null;
    } else {
      advancePresidency(state);
      state.phase = PHASES.NOMINATE;
    }
    if (autoResult) {
      return { autoResult };
    }
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
  handleVetoDecision,
  handlePower,
  getInitialKnowledge,
  handleDisconnect,
  // NOTE: additional handlers can be introduced if new phases or powers are added
};
