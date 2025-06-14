/**
 * Game engine responsible for handling Secret Hitler logic.
 * All logic should be server-side and authoritative.
 */
const { ROLES, PHASES } = require('../shared/constants.js');

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
  // TODO: assign roles and initialize game state
  room.game = {};
}

/**
 * Handles player votes.
 */
function handleVote(room, playerId, vote) {
  // TODO: process vote and update state
}

/**
 * Processes a selected policy.
 */
function processPolicy(room, policy) {
  // TODO: update policy track and trigger powers
}

module.exports = {
  startGame,
  handleVote,
  processPolicy,
  // TODO: add more handlers for each phase and power
};
