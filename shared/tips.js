/**
 * Generates simple text tips for a player based on the current game state.
 * This helper is deliberately conservative to avoid leaking hidden information.
 * @param {object} game Current game state
 * @param {string} playerId Player requesting tips
 * @param {string} role Player's secret role (LIBERAL/FASCIST/HITLER)
 * @returns {string[]} Array of suggestion strings
 */
import { PHASES, ROLES, POWERS } from './constants.js';

export function getTipsForPlayer(game, playerId, role) {
  if (!game) return [];
  const tips = [];
  const meIdx = game.players.findIndex((p) => p.id === playerId);
  if (meIdx === -1) return tips;

  switch (game.phase) {
    case PHASES.NOMINATE:
      if (game.presidentIndex === meIdx) {
        tips.push('Choose an eligible player to nominate as Chancellor.');
      } else {
        tips.push('Waiting for the President to nominate a Chancellor.');
      }
      break;
    case PHASES.VOTE:
      tips.push(
        `Voting Ja will elect the proposed government. A Nein vote advances the election tracker (${game.failedElections}/3).`
      );
      if (game.enactedPolicies.fascist >= 3) {
        tips.push('If Hitler is elected Chancellor, the Fascists instantly win.');
      }
      break;
    case PHASES.POLICY:
      if (game.policyStep === 'PRESIDENT' && game.presidentIndex === meIdx) {
        tips.push('Discard one policy to pass the other two to the Chancellor.');
      } else if (
        game.policyStep === 'CHANCELLOR' &&
        game.chancellorIndex === meIdx
      ) {
        tips.push('Discard one policy to enact the remaining tile.');
        if (game.enactedPolicies.fascist >= 5) {
          tips.push('You may request a veto instead.');
        }
      } else if (game.policyStep === 'VETO' && game.presidentIndex === meIdx) {
        tips.push('Accepting the veto discards both policies and advances the tracker.');
      } else {
        tips.push('Waiting for the government to resolve the policy.');
      }
      break;
    case PHASES.POWER:
      if (game.powerPresidentId === playerId) {
        switch (game.pendingPower) {
          case POWERS.INVESTIGATE:
            tips.push('Select a player to investigate their Party Membership.');
            break;
          case POWERS.SPECIAL_ELECTION:
            tips.push('Choose a player to be the next Presidential Candidate.');
            break;
          case POWERS.POLICY_PEEK:
            tips.push('View the top three policy tiles.');
            break;
          case POWERS.EXECUTION:
            tips.push('Select a player to execute. If Hitler dies, Liberals win.');
            break;
          default:
            break;
        }
      } else {
        tips.push('Waiting for the President to use their power.');
      }
      break;
    case PHASES.GAME_OVER:
      tips.push('Game over.');
      break;
    default:
      break;
  }

  if (game.failedElections === 2 && game.phase !== PHASES.GAME_OVER) {
    tips.push('One more failed election will enact the top policy automatically.');
  }

  return tips;
}


