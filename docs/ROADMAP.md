# Shooting Blocks Production Roadmap

This roadmap is designed for GitHub milestones. Each milestone should end with a playable build. The final production milestone should end with the game being stable and genuinely playable in online multiplayer.

## Milestone 0: Prototype Baseline

Goal: preserve the current prototype as a stable baseline before bigger changes.

Target release: `v0.1-prototype`

Main outcome:

- A local browser version where the core idea is playable.
- Single-player and local multiplayer both work.
- The codebase is understandable enough to extend safely.

Scope:

- Confirm player movement, jumping, side shooting, and air-only downward shooting.
- Confirm block columns, falling acceleration, stack support, and unsupported stack collapse.
- Confirm game over, restart, scoring, and difficulty scaling.
- Add README with run instructions and controls.
- Add basic manual QA checklist.

Definition of done:

- The game runs from a local static server.
- There are no known critical physics bugs.
- A new contributor can run and understand the project.
- GitHub milestones/issues exist for the next milestones.

## Milestone 1: Local MVP

Goal: make the local version feel like a coherent game instead of a toy prototype.

Target release: `v0.2-local-mvp`

Main outcome:

- A complete local game loop with start, play, pause, game over, restart, and high score.
- Single-player and local multiplayer are both intentionally supported.

Scope:

- Add start screen with mode selection.
- Add basic sandbox mode for local testing.
- Add pause/resume.
- Add local high score.
- Improve HUD and game over summary.
- Add clear column warnings before blocks enter.
- Add first weapon pickup system with ammo limits.
- Add HP drops from destroyed blocks.
- Tune movement, jump height, shooting cooldown, and block speed.
- Add short invulnerability after damage.
- Improve scoring rules.

Definition of done:

- A full local run feels complete from start screen to game over.
- Sandbox mode can be used to test core objects without waiting for normal spawns.
- Damage feels fair.
- Difficulty is understandable and ramps over time.
- Local multiplayer is playable without confusing controls or broken states.

## Milestone 2: Game Feel and Presentation

Goal: make the game readable, satisfying, and presentable.

Target release: `v0.3-polish`

Main outcome:

- The game communicates danger, impact, and state clearly.
- The visual/audio layer supports gameplay rather than hiding it.

Scope:

- Add better block impact and destruction effects.
- Add hit flash, landing feedback, and optional screen shake.
- Add sound effects for shoot, hit, block land, damage, and game over.
- Improve player and block visuals beyond plain rectangles.
- Add different block types with distinct properties.
- Add readable visual language for weapon and HP drops.
- Add settings for volume and visual effects.
- Improve responsive layout for different screen sizes.

Definition of done:

- Players can read falling danger quickly.
- Players can recognize special blocks and pickups without guessing.
- Hits, damage, and destroyed blocks are obvious.
- Presentation is clean enough to share with testers.

## Milestone 3: Architecture and Testability

Goal: make the codebase ready for multiplayer and longer-term development.

Target release: `v0.4-architecture`

Main outcome:

- Game logic is deterministic enough to support networking decisions.
- Core logic has tests.
- Rendering, simulation, input, and UI responsibilities are clearer.

Scope:

- Move tunable values into central config.
- Separate simulation state from rendering where useful.
- Add automated tests for pure logic.
- Add deterministic random seed support for debug runs.
- Expand sandbox mode into a proper developer test scene.
- Add debug overlay for FPS, block count, player state, and difficulty.
- Add lint/format workflow.
- Add data model document for persistent game info.
- Document architecture decisions.

Definition of done:

- Core physics helpers are testable outside the browser.
- There is a clear boundary between game simulation and presentation.
- We know what data should live locally, in memory, or in a database.
- Multiplayer implementation can start without rewriting the whole game.

## Milestone 4: Online Multiplayer Prototype

Goal: prove online multiplayer with the smallest real networked version.

Target release: `v0.5-online-prototype`

Main outcome:

- Two players can join the same online room and play together.
- This does not need production polish yet, but it must prove the technical approach.

Scope:

- Choose networking architecture.
- Choose database/storage approach for accounts, stats, rooms, and run history.
- Add a minimal Node/WebSocket server or equivalent backend.
- Add room creation and join by room code.
- Sync player inputs or game state.
- Decide server authority model.
- Add basic disconnect handling.
- Add local network or hosted test instructions.

Definition of done:

- Two browser clients on different machines can join one room.
- Both players see the same major game events.
- Disconnects do not crash the session.
- The backend has a clear plan for what data is persisted.
- Known sync limitations are documented.

## Milestone 5: Online Multiplayer Alpha

Goal: make online multiplayer consistently playable.

Target release: `v0.6-online-alpha`

Main outcome:

- Online multiplayer is fun enough for repeated testing.
- Networking problems are visible and recoverable.

Scope:

- Improve sync accuracy for players, blocks, bullets, and scoring.
- Add reconnect or graceful leave flow.
- Add lobby ready state.
- Add basic latency display.
- Persist relevant player and match stats.
- Add server-side validation for important game events.
- Add online game over and rematch flow.
- Add multiplayer-specific QA checklist.

Definition of done:

- Two players can complete multiple online runs.
- Relevant online stats survive page refresh and reconnects where appropriate.
- Common network failures are handled gracefully.
- Game state stays consistent enough for fair play.

## Milestone 6: Online Multiplayer Beta

Goal: prepare the online game for public testing.

Target release: `v0.7-online-beta`

Main outcome:

- The online version is hosted, stable, and testable by external players.

Scope:

- Deploy client and server.
- Add production configuration.
- Add logging and error tracking.
- Add production database migrations/backups if persistent storage is used.
- Add rate limits and room cleanup.
- Add basic moderation/safety decisions if public rooms exist.
- Add browser compatibility pass.
- Add performance budget and profiling.
- Add release checklist.

Definition of done:

- External testers can play without local setup.
- Server does not leak rooms or crash under normal testing.
- Production issues can be diagnosed from logs.

## Milestone 7: Production Release

Goal: release a stable online multiplayer version.

Target release: `v1.0`

Main outcome:

- Shooting Blocks is publicly playable online with a complete game loop.

Scope:

- Final balance pass.
- Final UI and accessibility pass.
- Add credits/about screen.
- Add privacy/deployment notes if needed.
- Fix beta feedback issues.
- Freeze v1 feature scope.
- Tag release and publish.

Definition of done:

- Online multiplayer is the primary supported mode.
- Single-player/local play still work unless intentionally removed.
- No known critical bugs remain.
- The release is tagged and documented.
