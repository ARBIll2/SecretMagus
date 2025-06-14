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

## Next Steps
- Expand React UI components for each gameplay phase (policy draw, powers).
- Write unit tests for game engine, utilities, and room management.
- Add visual indicators for executed players in all UI components and test presidency rotation logic.
- Implement a routing/state machine to manage Lobby vs Game views.
- Handle players leaving or disconnecting during an active game.
