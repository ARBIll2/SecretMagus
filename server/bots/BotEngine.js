import { ROLES, POWERS } from "../../shared/constants.js";

/**
 * Creates a basic bot agent for Secret Hitler.
 * Bots keep simple memory of votes, policies, and suspicion per player.
 * Suspicion ranges from 0 (trusted) to 1 (certain fascist).
 */
function createBot(role, name) {
  const behavior = {
    riskTolerance: clamp(0, 1, 0.6 + (Math.random() - 0.5) * 0.3),
    deceptionLevel: clamp(0, 1, 0.3 + (Math.random() - 0.5) * 0.3),
    allianceStickiness: clamp(0, 1, 0.5 + (Math.random() - 0.5) * 0.3),
    trustDecayRate: clamp(0, 1, 0.2 + (Math.random() - 0.5) * 0.2),
  };

  const tones = ['cautious', 'aggressive', 'neutral'];
  const tone = tones[Math.floor(Math.random() * tones.length)];

  const memory = {
    votingHistory: [],
    enactedPolicies: { liberal: 0, fascist: 0 },
    suspicion: {},
  };

  function log(reason) {
    if (process.env.BOT_DEBUG === "true") {
      console.log(`[Bot ${name}] ${reason}`);
    }
  }

  function updateSuspicion(playerId, delta) {
    if (!memory.suspicion[playerId]) memory.suspicion[playerId] = 0.5;
    memory.suspicion[playerId] = clamp(
      0,
      1,
      memory.suspicion[playerId] + delta
    );
  }

  function decayTrust() {
    Object.keys(memory.suspicion).forEach((id) => {
      const delta = behavior.trustDecayRate * (0.5 - memory.suspicion[id]);
      memory.suspicion[id] = clamp(0, 1, memory.suspicion[id] + delta);
    });
  }

  /** Choose whether to vote yes or no on a proposed government. */
  function voteOnGovernment(gameState) {
    decayTrust();
    const president = gameState.players[gameState.presidentIndex];
    const chancellor = gameState.players[gameState.chancellorIndex];
    const suspPres = memory.suspicion[president.id] ?? 0.5;
    const suspChan = memory.suspicion[chancellor.id] ?? 0.5;
    const avgSuspicion = (suspPres + suspChan) / 2;
    const threshold = 0.6 + behavior.riskTolerance * 0.3;

    let vote = avgSuspicion < threshold ? "Y" : "N";

    if (role !== ROLES.LIBERAL) {
      // Fascists favor governments with fellow fascists
      if (president.role === role || chancellor.role === role) vote = "Y";
      if (chancellor.role === ROLES.HITLER && gameState.enactedPolicies.fascist >= 3) vote = "Y";
    }

    memory.votingHistory.push({ president: president.id, chancellor: chancellor.id, vote });
    log(`Voting ${vote === "Y" ? "YES" : "NO"} — susp ${avgSuspicion.toFixed(2)}`);
    return vote;
  }

  /** Nominate a chancellor from a list of player objects */
  function nominateChancellor(playerList) {
    const eligible = playerList.filter((p) => p.alive && p.id !== name);
    eligible.sort((a, b) => (memory.suspicion[a.id] ?? 0.5) - (memory.suspicion[b.id] ?? 0.5));
    const choice = eligible[0];
    log(`Nominating ${choice.name}`);
    return choice.id;
  }

  /**
   * Choose which policy to discard.
   * policies is an array of strings [policy1, policy2, ...]
   */
  function choosePolicy(policies) {
    let discardIndex;
    if (role === ROLES.LIBERAL) {
      discardIndex = policies.indexOf("FASCIST");
      if (discardIndex === -1) discardIndex = 0;
    } else {
      // fascists prefer discarding liberal if they can hide it
      discardIndex = policies.indexOf("LIBERAL");
      if (discardIndex === -1 || Math.random() < behavior.deceptionLevel) {
        discardIndex = 0;
      }
    }
    log(`Discarding policy index ${discardIndex}`);
    return discardIndex;
  }

  /** Decide how to use a presidential power */
  function usePower(powerType, gameState) {
    const alive = gameState.players.filter((p) => p.alive && p.id !== name);
    alive.sort((a, b) => (memory.suspicion[b.id] ?? 0.5) - (memory.suspicion[a.id] ?? 0.5));
    const target = alive[0];
    log(`Using power ${powerType} on ${target.name}`);
    return target.id;
  }

  function say(context = {}) {
    const lines = [];
    if (context.event === 'nomination' && context.nomineeName) {
      if (tone === 'cautious') lines.push('Hmm… interesting nomination.');
      if (tone === 'aggressive') lines.push(`Don't trust ${context.nomineeName} at all.`);
      lines.push(`Good luck, ${context.nomineeName}.`);
    }
    if (context.event === 'voteResult') {
      if (context.passed) lines.push('That was a bold play.');
      else lines.push('Looks like that government failed.');
    }
    if (context.event === 'policy') {
      lines.push('Let\'s keep moving.');
    }
    if (lines.length === 0) return null;
    return lines[Math.floor(Math.random() * lines.length)];
  }

  return {
    role,
    name,
    behavior,
    memory,
    tone,
    voteOnGovernment,
    nominateChancellor,
    choosePolicy,
    usePower,
    say,
    updateSuspicion,
  };
}

function clamp(min, max, val) {
  return Math.max(min, Math.min(max, val));
}

export { createBot };

