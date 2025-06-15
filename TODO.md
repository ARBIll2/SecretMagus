# TODO List

## Completed
- Scaffolded client and server folders with entry files.
- Implemented room manager and initial socket handlers.
- Created basic game engine with role assignment and policy logic.
- Hooked up `START_GAME` socket event.

## Previously Completed
- Implemented vote and policy socket events using the game engine.
- Added client handlers for role assignment, vote and policy events.
- Created basic UI elements for casting votes and selecting policies.
- Added nomination phase logic with server handler and React UI.
- Added win condition checks and GAME_OVER handling on server and client.
- Enforced Chancellor eligibility term limits according to rules.
- Implemented policy draw/discard flow with deck reshuffle and updated client prompts.
- Added initial implementation of Investigate Loyalty power with server handler and client prompt.
- Added Special Election presidential power with server logic and client UI.
- Implemented Policy Peek power with automatic handling.
- Implemented Execution power with victory checks.
- Added veto power after five fascist policies with request/decision flow.

## Completed in previous wave
- Implemented initial fascist/Hitler knowledge sharing on game start.
- Added simple server logging for key state changes.
- Enforced executed player restrictions: dead players cannot vote or hold office and presidency skips them. UI hides vote panel when executed.
- Improved lobby UI to list players, show room code and allow host to start the game. Errors now display in Lobby.

## Completed in this wave
- Added ability for players to leave a room before the game starts. Client UI now includes "Leave Room" buttons and server handles `LEAVE_ROOM` events.
- Fixed vote majority logic to count only alive players when determining if an election passes.
- Broadcast auto policy results when the election tracker triggers a random policy enactment so clients stay in sync.
- Disconnecting players during an active game are now treated as executed. If Hitler disconnects the Liberals win. Room state updates are emitted.
- Tracked current nomination on the client and display which players are up for election.
- Added vote result display showing each player's Ja!/Nein choice.
- Implemented board UI showing enacted policies and election tracker progress.
- Added PlayerList component showing seating order with President and Chancellor markers.
- Fixed auto policy logic so election tracker enactments never grant
  presidential powers.

### New in this wave
- Refactored disconnect handling into the game engine so disconnecting players
  are treated as executions without leaking roles. If the disconnecting player
  was part of the government the election now fails and advances the tracker.
- Added unit tests covering disconnect outcomes and Hitler disconnect victory.

### Previous wave
- Set up Jest with Babel configuration and added unit tests for `assignRoles`,
  `shuffleDeck` and Chancellor nomination eligibility.
- First Presidential Candidate is now selected randomly when the game starts.
- Added unit tests covering vote majority with dead players,
  automatic policy enactment after three failed elections,
  and Hitler election victory condition.

## Next Steps
- Ensure every game state change emits a room update to keep clients
  in sync.
- Expand React UI components for each gameplay phase (policy draw, powers, prompts) to improve reactivity.
- Add more unit tests covering policy processing and presidential
  powers. Integrate tests with CI.
- Improve UI styling for board and player list.
