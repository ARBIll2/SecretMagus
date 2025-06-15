
# Secret Hitler Webapp – Codex Build Instructions

## 🎯 Project Goal
Create a webapp version of *Secret Hitler* that allows multiple players to join a room, receive secret roles, and play a fully rules-compliant game in real time.

This is not a visual-heavy game. The priority is correctness, clarity, and smooth multiplayer logic.

---

## 📦 Stack

- **Frontend**: React (or Svelte if preferred), Tailwind CSS for quick styling
- **Backend**: Node.js with `socket.io` for real-time communication
- **State**: Central server-side game engine (no trust on client)
- **Deploy**: Vercel (frontend), Render/Heroku/Fly.io (backend)

---

## 🧱 Structure

### `/client`
- `index.html` – Base page
- `App.jsx` – Root component
- `Lobby.jsx` – Join/Create room, name entry
- `Game.jsx` – Main game UI (per player)
- `GameStateContext.js` – React context for shared state

### `/server`
- `index.js` – Main express + socket.io server
- `gameEngine.js` – Game logic (deck, role assignment, turn logic)
- `roomManager.js` – Track open/active games and players

### `/shared`
- `constants.js` – Shared game constants (roles, phases)
- `messages.js` – Socket message types
- `utils.js` – Game logic helpers (shuffling, role assignment)

---

## 🧠 Game Logic Core
Keep all game logic in a central state object, e.g.:

```js
{
  players: [
    { id, name, role, alive, socketId, hasVoted, vote }
  ],
  phase: 'NOMINATE' | 'VOTE' | 'POLICY' | 'POWER',
  presidentIndex: 0,
  chancellorIndex: null,
  failedElections: 0,
  policyDeck: [...],
  enactedPolicies: { liberal: 0, fascist: 0 },
  history: [...],
  settings: { playerCount, roomCode }
}
```

---

## ✅ MVP Features

### 🔐 Join/Create Room
- Host creates room, gets code (4–6 characters)
- Others join with code, enter name
- Host starts game when ready

### 🃏 Game Start
- Assign roles based on player count
- Notify each player of their secret role
- If fascists > 1, reveal teammates

### 🧑‍⚖️ Game Loop
- Nominate Chancellor
- Vote: Everyone votes yes/no
- If passed, go to policy phase
- If failed, increment election tracker

### 📜 Policy Phase
- Pres draws 3, discards 1 → sends 2 to Chancellor
- Chancellor discards 1 → enacts final policy
- Reveal policy, update board

### 🛠️ Powers
Trigger after X fascist policies:
- Investigate Loyalty
- Call Special Election
- Peek
- Execution (player marked dead)

### 🏆 Win Conditions
- 5 Liberal or 6 Fascist policies
- Hitler elected Chancellor after 3 Fascist policies
- Hitler is killed → Liberals win

---

## 🔁 Socket Message Flow
Use a `messageType` dispatch pattern:

### Client → Server
- `JOIN_ROOM` – name + code
- `CREATE_ROOM` – name
- `START_GAME`
- `NOMINATE_CHANCELLOR`
- `CAST_VOTE`
- `POLICY_CHOICE`
- `VETO_REQUEST`
- `VETO_DECISION`
- `USE_POWER`

### Server → Client
- `ROOM_UPDATE`
- `GAME_START`
- `ROLE_ASSIGNMENT`
- `VOTE_REQUEST`
- `VOTE_RESULT`
- `POLICY_PROMPT`
- `POLICY_RESULT`
- `VETO_PROMPT`
- `VETO_RESULT`
- `POWER_PROMPT`
- `GAME_OVER`

---

## 📐 Best Practice Coding Guidelines
- Keep all game logic server-side; never trust the client.
- Use enums/constants for phases, roles, and messages to avoid string errors.
- Modularize logic per game phase.
- Strictly validate input and reject malformed or out-of-order actions.
- Maintain clear separation of concerns: game logic vs communication vs UI.
- Log every significant state change (for debugging and auditing).
- Keep sockets organized with event-based handlers.

---

## 🧩 Future UI Framework
Right now we go text-based, but future UI components can follow this framework:

### Planned Components:
- `PlayerList`: Shows seating order and current roles (public info only)
- `PolicyTracker`: Display current number of enacted policies
- `Board`: Combines policy tracks and election tracker for quick reference
- `VotePanel`: Allows player to vote Yes/No
- `NominationPanel`: President picks a Chancellor
- `PolicyHand`: Policy selection (President/Chancellor)
- `PowerPanel`: Shows special powers when unlocked
- `GameLog`: Show action history (optional)

Use Tailwind CSS to ensure responsive layout, and structure all UI elements in a mobile-first grid/flex system.

---

## 🧪 Dev Notes
- Add simple log on server to trace game state changes.
- Use mock players for testing (e.g., 5 bots).
- Keep all UI mobile-friendly from the start.
- Chancellor term limit logic now enforced in `gameEngine.js`.
- Chancellor term limit logic now enforced in `gameEngine.js`.
- Investigate Loyalty implemented; remember to send POWER_PROMPT only to the acting President and POWER_RESULT only to them.
- Special Election power implemented. The President selects any alive player for the next Presidential Candidate. After that election, presidency returns left of the original President.
- Policy Peek power implemented. The top three policies are shown privately to the President.
- Execution power implemented. The President may kill a player; if Hitler is executed the Liberals win. POWER_RESULT is broadcast to all players.
- Veto power implemented. Chancellor may request veto after five Fascist policies; President decides and tracker advances if accepted.

---

## 🧱 Suggested Tasks for Codex
1. Scaffold `/client` and `/server` folders with entry files. ✅
2. Implement `roomManager.js` to handle player joins and room tracking. ✅
3. Build `gameEngine.js` to manage the full game state lifecycle. ✅
4. Set up `socket.io` server and connect React client.
5. Create basic UI for joining/creating room and nickname entry.
6. Implement game phases one at a time with full broadcast logic.
7. Write tests for role assignment, voting logic, and win condition checks.

👉 Keep `TODO.md` updated with ongoing progress and upcoming tasks.

### Development Best Practices
- Run `npm start` to launch the server during local development.
- Keep the game logic strictly on the server; clients only send user actions.
- Add unit tests for utilities and the game engine as they are implemented.
- Regularly update `TODO.md` when a step is completed or a new one appears.

### Rule Implementation Notes
- Term limits for Chancellor eligibility implemented (Rules: Election & Chancellor Eligibility).
- Basic policy draw/discard flow implemented. Deck reshuffles the discard pile when fewer than three cards remain (Rules: Legislative Session, Policy Deck Management).
- Investigate Loyalty power implemented with secrecy preserved (Rules: Presidential Powers - Investigate Loyalty).
- Special Election power implemented (Rules: Presidential Powers - Call Special Election). Presidency order resumes to the left of the original President after the election.
- Policy Peek power implemented (Rules: Presidential Powers - Policy Peek). President privately views top three policies.
- Execution power implemented (Rules: Presidential Powers - Execution). Killing Hitler results in an immediate Liberal victory.
- Initial fascist knowledge reveal implemented according to player count (Rules: Setup - Eyes Closed Sequence).
- Basic logging added on server for game start, nominations, votes, policies, vetoes, and powers.
- Executed player restrictions enforced. Dead players cannot vote or hold office and presidency skips them. UI still needs cues.
- Lobby now displays joined players and room code. Only the host may start the game once five or more players have joined. Clients stay in the lobby until the `GAME_START` message arrives.
- Players may leave a room before the game starts via `LEAVE_ROOM`. Disconnecting during a game now marks that player as executed and ends the game if Hitler disconnects.
- Leaving via `LEAVE_ROOM` after the game has begun is treated the same as a disconnect and executes that player.
- Disconnects are handled inside the game engine. If a disconnecting player was part of the active government, the election fails and the tracker advances. No role information is revealed unless Hitler was executed.
- Auto policy results from the Election Tracker are now broadcast to all players to maintain sync.
- Client tracks current nomination and displays vote results to improve transparency.
- Basic board UI added showing policy tracks and election tracker progress.
- Player list component added showing seating order with President and Chancellor markers.
- Jest test framework added with initial unit tests for utilities and
  game engine nomination rules.
- First Presidential Candidate now chosen randomly (Rules: Setup step 4).
- Added tests for vote majority, election tracker auto policy, and Hitler election victory.
- Added AI tips system and public action log. Tips use only visible information and a player's own role to avoid leaking secrets.



---

## 📝 Rule Enforcement Checklist
Codex agents and contributors must ensure every gameplay feature aligns with **RULES.md**. Use the following checklist during development and code review:

1. **Player Actions** – Validate that each action (nomination, vote, policy selection, power use) is legal for the current phase and obeys all eligibility rules.
2. **Win Conditions** – Confirm that win states are triggered exactly as described: five Liberal policies, six Fascist policies, Hitler killed, or Hitler elected Chancellor after three Fascist policies.
3. **Presidential Powers** – Trigger powers immediately when the associated Fascist policy is enacted and enforce all limitations (single use, investigate only Party Membership, etc.).
4. **Secrecy** – Never reveal hidden roles or policy cards except where rules explicitly require it. Maintain secrecy for discards and investigations.
5. **Election Tracker** – Increment on every failed election and automatically enact the top policy when it reaches three, then reset tracker and term limits.
6. **Policy Deck Management** – Reshuffle the discard pile into the draw deck whenever fewer than three cards remain.
7. **Veto Power** – Allow veto requests only after five Fascist policies and handle tracker advancement if a veto occurs.
8. **Eligibility and Term Limits** – Enforce that the last elected President and Chancellor cannot be nominated as Chancellor (except when only five players remain, where only the last Chancellor is barred).
9. **Logging & Validation** – Log all state changes and cross-check against RULES.md when implementing new features.
10. **Executed Players** – Server enforces that executed players cannot vote or hold office. UI still needs cues and restrictions.
11. **Vote Majority** – Count only alive players when determining if a government is elected (Rules: Election step 4).

Before merging any change, verify the checklist above and update tests to cover new logic.


## 📊 June 2025 Progress Evaluation

Feature | Status | Notes
--- | --- | ---
Room creation & join flow | ✅ | Server events add/remove players and broadcast updates
Role assignment | ✅ | `startGame` assigns roles and chooses a random first president
Game phases (nominate → vote → policy) | ✅ | Flow handled via nomination, voting, and policy choice handlers
Vote counting | ✅ | Votes tallied from alive players; majority check works
Policy deck handling (draw/discard/enact) | ✅ | Deck reshuffles as needed; selections recorded
Fascist powers | ✅ | Investigate, Special Election, Policy Peek, and Execution implemented
Win condition checks | ✅ | Liberal/Fascist policy totals and Hitler conditions evaluated
Game state broadcast & sync | Partial | Some state changes still missing dedicated events
UI reactivity | Partial | React components display basic prompts but lack polish
Socket message handling | ✅ | Client and server support defined message types
Rules compliance (RULES.md) | ✅ | Auto policy from the election tracker now ignores powers

- Current blockers:
  - Create phase-oriented UI components for better reactivity
  - Expand test coverage for powers and win conditions
  - Ensure every state change emits updates to prevent desync. Use the
    helper `emitRoomUpdate(roomCode, room?)` from `server/index.js` after
    mutating game state.
  - Improve overall styling and usability for playtesting

## 📊 July 2025 Progress Evaluation

Feature | Status | Notes
--- | --- | ---
Automated tests | ✅ | Added coverage for policy processing, Policy Peek power, and veto flow
AI tips & action log | ✅ | Client displays suggestions and history using only public data
