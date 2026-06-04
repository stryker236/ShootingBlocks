# Shooting Blocks GitHub Issue Plan

This file is the draft source for GitHub issues. Once the plan is agreed, create these as real GitHub issues and assign each to the matching milestone.

## Milestone 0: Prototype Baseline

### Issue: Add README with run instructions and controls

Labels: `documentation`, `priority:high`

Acceptance criteria:

- README explains the game concept.
- README explains how to run with a local static server.
- README lists single-player and multiplayer controls.
- README links to roadmap and issue plan.

### Issue: Add manual QA checklist for prototype mechanics

Labels: `documentation`, `qa`, `priority:high`

Acceptance criteria:

- Checklist covers movement, jumping, shooting, downward shooting, block stacking, stack collapse, damage, restart, and mode toggle.
- Checklist can be followed manually in less than 10 minutes.

### Issue: Verify falling stack behavior after support block destruction

Labels: `bug`, `physics`, `priority:high`

Acceptance criteria:

- Destroying the bottom block in a column releases all unsupported blocks above it.
- Released blocks fall into valid grid positions.
- No two blocks in the same column occupy the same cell.
- Players standing on released blocks fall naturally.

### Issue: Improve player collision against moving blocks

Labels: `bug`, `physics`, `priority:high`

Acceptance criteria:

- A falling block damages the player when it lands on or intersects them.
- A player standing beside a settling block is not damaged unfairly.
- Player knockback does not push them through solid blocks.

### Issue: Prevent impossible column overflow states

Labels: `bug`, `difficulty`, `priority:medium`

Acceptance criteria:

- Game over triggers when a stack reaches the danger height.
- New blocks do not spawn into invalid settled positions.
- The overflow rule is visible or understandable during play.

## Milestone 1: Local MVP

### Issue: Add start screen with mode selection

Labels: `feature`, `ui`, `priority:high`

Acceptance criteria:

- Player can choose Single Player or Local Multiplayer before starting.
- The in-game mode toggle is removed or moved out of active gameplay.
- Starting a new run resets all state cleanly.

### Issue: Add pause and resume

Labels: `feature`, `ui`, `priority:medium`

Acceptance criteria:

- `Escape` toggles pause.
- Game physics stops while paused.
- HUD clearly shows paused state.
- Restart still works while paused.

### Issue: Add basic sandbox mode

Labels: `feature`, `debug`, `sandbox`, `priority:high`

Acceptance criteria:

- Start screen includes Sandbox as a selectable mode.
- Sandbox disables normal scoring and survival difficulty.
- Player can manually spawn blocks in selected columns.
- Player can test weapons and pickups without waiting for random drops.
- Sandbox can return to the start screen cleanly.

### Issue: Add local high score

Labels: `feature`, `scoring`, `priority:medium`

Acceptance criteria:

- Best score persists in `localStorage`.
- Game over screen shows current score and best score.
- Restart keeps the best score.

### Issue: Add weapon pickup system

Labels: `feature`, `weapons`, `priority:high`

Acceptance criteria:

- Destroyed blocks can drop weapon pickups.
- Player can collect a weapon pickup by touching it.
- Current weapon is visible in the HUD.
- Weapon state resets cleanly between runs.

### Issue: Add HP drops from destroyed blocks

Labels: `feature`, `pickups`, `priority:medium`

Acceptance criteria:

- Destroyed blocks can drop HP pickups.
- HP pickup restores health up to the player max HP.
- HP pickup does nothing if the player is already at max HP or is not collectible in that state.
- Drop chance is tunable.

### Issue: Add limited ammo to weapons

Labels: `feature`, `weapons`, `priority:high`

Acceptance criteria:

- Weapons can have a finite bullet count.
- Ammo count is visible in the HUD.
- When ammo reaches zero, player returns to the default weapon.
- Ammo cannot become negative.

### Issue: Add multiple weapon types

Labels: `feature`, `weapons`, `priority:high`

Acceptance criteria:

- At least three weapon types exist.
- Weapons differ by fire speed, damage, and ammo count.
- Weapon tuning lives in config.
- Weapon behavior works for side shooting and airborne downward shooting.

### Issue: Add column warning before blocks enter

Labels: `feature`, `readability`, `priority:high`

Acceptance criteria:

- A warning appears above the selected column before the block enters.
- Warning duration decreases with difficulty.
- Warning is visible but does not obscure the playfield.

### Issue: Tune player movement and shooting values

Labels: `game-feel`, `physics`, `priority:high`

Acceptance criteria:

- Horizontal movement feels controllable on one-block platforms.
- Jump height allows climbing one block comfortably.
- Side shooting and downward shooting feel responsive.
- Tunable values live in `constants.js` or a config object.

### Issue: Add short invulnerability after taking damage

Labels: `feature`, `game-feel`, `priority:medium`

Acceptance criteria:

- Player gets brief invulnerability after damage.
- Player visually flashes or otherwise shows invulnerability.
- One continuous overlap cannot remove all HP instantly.

### Issue: Improve scoring rules

Labels: `feature`, `scoring`, `priority:medium`

Acceptance criteria:

- Survival score increases over time.
- Destroying blocks gives points.
- Riskier actions, such as destroying blocks while airborne or near danger, can give bonus points.
- Final score is shown on game over.

## Milestone 2: Game Feel and Presentation

### Issue: Add special block types

Labels: `feature`, `blocks`, `priority:high`

Acceptance criteria:

- At least three block types exist.
- Block types have different gameplay properties, such as HP, fall speed, drop chance, or damage behavior.
- Block types are visually distinct.
- Block type probabilities are tunable by difficulty phase.

### Issue: Add explosive block behavior

Labels: `feature`, `blocks`, `priority:medium`

Acceptance criteria:

- Explosive blocks trigger an area effect when destroyed.
- Nearby blocks or players are affected according to clear rules.
- Explosion visual feedback is readable and not excessive.
- Explosive blocks cannot create invalid stack states.

### Issue: Add heavy block behavior

Labels: `feature`, `blocks`, `priority:medium`

Acceptance criteria:

- Heavy blocks have more HP or higher impact danger than normal blocks.
- Heavy blocks are visually distinct.
- Heavy block tuning scales with difficulty.

### Issue: Add supply block behavior

Labels: `feature`, `blocks`, `pickups`, `priority:medium`

Acceptance criteria:

- Supply blocks have higher chances to drop weapons or HP.
- Supply blocks are visually distinct.
- Supply blocks still obey normal falling and stacking rules.

### Issue: Add improved block impact and destruction feedback

Labels: `game-feel`, `visual`, `priority:medium`

Acceptance criteria:

- Blocks landing have visible impact feedback.
- Destroyed blocks have clearer particles or fragments.
- Effects do not hide bullets, players, or falling blocks.

### Issue: Add basic sound effects

Labels: `audio`, `game-feel`, `priority:medium`

Acceptance criteria:

- Shooting, hit, block landing, player damage, and game over have sound effects.
- Sounds can be muted.
- Sounds do not overlap in a harsh or distracting way.

### Issue: Improve player and block visuals

Labels: `visual`, `priority:medium`

Acceptance criteria:

- Players remain easy to identify.
- Blocks remain easy to classify as falling or settled.
- Visual style is consistent across HUD and canvas.

### Issue: Add settings panel

Labels: `feature`, `ui`, `priority:low`

Acceptance criteria:

- Player can adjust sound volume.
- Player can toggle screen shake or intense effects.
- Settings persist locally.

## Milestone 3: Architecture and Testability

### Issue: Move gameplay tuning into config

Labels: `refactor`, `architecture`, `priority:high`

Acceptance criteria:

- Movement, gravity, shooting, block spawning, and difficulty values are centralized.
- Tuning values are named by gameplay purpose.
- No gameplay behavior changes except intentional tuning.

### Issue: Add tests for pure logic

Labels: `test`, `architecture`, `priority:high`

Acceptance criteria:

- Tests cover rectangle overlap.
- Tests cover stack support detection.
- Tests cover landing position calculation.
- Tests run with one command.

### Issue: Add deterministic debug seed

Labels: `debug`, `architecture`, `priority:medium`

Acceptance criteria:

- Debug runs can use a fixed random seed.
- The same seed produces the same block column sequence.
- Normal runs still use random behavior.

### Issue: Add debug overlay

Labels: `debug`, `tooling`, `priority:medium`

Acceptance criteria:

- Overlay can show FPS, block count, player position/state, current level, and spawn timer.
- Overlay can be toggled without affecting gameplay.

### Issue: Expand sandbox into developer test scene

Labels: `debug`, `sandbox`, `tooling`, `priority:high`

Acceptance criteria:

- Sandbox can spawn specific block types.
- Sandbox can spawn specific weapon and HP pickups.
- Sandbox can set player HP, weapon, ammo, and position.
- Sandbox can freeze/resume falling blocks.
- Sandbox can clear all blocks, bullets, and pickups.
- Sandbox controls are documented.

### Issue: Document multiplayer architecture options

Labels: `documentation`, `architecture`, `multiplayer`, `priority:high`

Acceptance criteria:

- Compare client-authoritative, server-authoritative, and input-sync approaches.
- Recommend one approach for this game.
- Document expected tradeoffs for latency, cheating, implementation effort, and hosting.

### Issue: Document persistent data model

Labels: `documentation`, `architecture`, `database`, `priority:high`

Acceptance criteria:

- Document what data should be stored locally versus in a backend database.
- Include player profile, settings, stats, match history, leaderboard, and room/session data.
- Identify which data is required for v1 and which can wait.
- Include privacy and deletion considerations.

## Milestone 4: Online Multiplayer Prototype

### Issue: Choose database and backend persistence approach

Labels: `architecture`, `database`, `backend`, `priority:high`

Acceptance criteria:

- Compare at least two realistic options, such as SQLite/Postgres, Supabase, Firebase, or managed Postgres.
- Recommend one option for the current project size.
- Document local development setup.
- Document production hosting implications.

### Issue: Create minimal multiplayer server

Labels: `feature`, `multiplayer`, `backend`, `priority:high`

Acceptance criteria:

- A server can accept WebSocket connections.
- Server can create and track rooms.
- Server cleans up empty rooms.

### Issue: Add create/join room flow

Labels: `feature`, `multiplayer`, `ui`, `priority:high`

Acceptance criteria:

- Player can create a room and receive a room code.
- Second player can join with the room code.
- Both clients show who is connected.

### Issue: Sync online player input

Labels: `feature`, `multiplayer`, `netcode`, `priority:high`

Acceptance criteria:

- Each client can see both players moving.
- Input messages are small and frequent enough for responsive play.
- Lost or late messages do not crash the game.

### Issue: Sync blocks, bullets, and score

Labels: `feature`, `multiplayer`, `netcode`, `priority:high`

Acceptance criteria:

- Both clients see the same falling blocks.
- Both clients see meaningful bullet/block interactions.
- Score and game over remain consistent enough for prototype play.

### Issue: Add basic disconnect handling

Labels: `feature`, `multiplayer`, `priority:medium`

Acceptance criteria:

- If one player disconnects, the other sees a clear state.
- Room can be abandoned without server errors.
- Client can return to the start screen.

### Issue: Persist basic player stats

Labels: `feature`, `database`, `multiplayer`, `priority:medium`

Acceptance criteria:

- Backend can store player identifier, games played, best score, blocks destroyed, and survival time.
- Stats update at the end of an online run.
- Failed database writes do not crash the match.

## Milestone 5: Online Multiplayer Alpha

### Issue: Add lobby ready state

Labels: `feature`, `multiplayer`, `ui`, `priority:medium`

Acceptance criteria:

- Both players must mark ready before the run starts.
- Host or room state decides when the game begins.
- Leaving the lobby cleans up the room state.

### Issue: Improve online state consistency

Labels: `multiplayer`, `netcode`, `priority:high`

Acceptance criteria:

- Player positions, block states, bullet hits, and game over remain consistent over repeated runs.
- Known edge cases are documented.
- Debug information helps diagnose desyncs.

### Issue: Add latency display

Labels: `feature`, `multiplayer`, `debug`, `priority:medium`

Acceptance criteria:

- Client shows approximate ping or connection quality.
- Display is small and does not distract from gameplay.

### Issue: Add online rematch flow

Labels: `feature`, `multiplayer`, `ui`, `priority:medium`

Acceptance criteria:

- After game over, both players can request rematch.
- New run starts only when both players agree.
- Room does not need to be recreated for every run.

### Issue: Add online leaderboard

Labels: `feature`, `database`, `scoring`, `priority:medium`

Acceptance criteria:

- Leaderboard shows top scores or best survival times.
- Leaderboard data comes from backend persistence.
- Leaderboard handles ties consistently.
- Leaderboard can be disabled or hidden if backend is unavailable.

## Milestone 6: Online Multiplayer Beta

### Issue: Deploy client and server

Labels: `deployment`, `multiplayer`, `priority:high`

Acceptance criteria:

- Client is hosted publicly.
- Server is hosted publicly.
- Environment-specific config is documented.

### Issue: Add server logging and error tracking

Labels: `backend`, `observability`, `priority:high`

Acceptance criteria:

- Server logs room creation, join, leave, errors, and cleanup.
- Logs avoid sensitive data.
- Common failures can be diagnosed after the fact.

### Issue: Add room cleanup and rate limits

Labels: `backend`, `production`, `priority:high`

Acceptance criteria:

- Empty rooms are removed.
- Stale rooms expire.
- Basic rate limits protect room creation and messages.

### Issue: Run browser compatibility and performance pass

Labels: `qa`, `performance`, `priority:medium`

Acceptance criteria:

- Game is tested in current Chrome, Edge, and Firefox.
- Performance target is defined and measured.
- Obvious frame drops are addressed or documented.

## Milestone 7: Production Release

### Issue: Final balance pass

Labels: `game-feel`, `difficulty`, `priority:high`

Acceptance criteria:

- Difficulty curve is tested with multiple players.
- Online and local modes are both playable.
- Tuned values are documented in release notes.

### Issue: Final accessibility and controls pass

Labels: `accessibility`, `ui`, `priority:medium`

Acceptance criteria:

- Controls are clearly visible.
- Important state is not communicated by color only.
- Text remains readable on supported screen sizes.

### Issue: Prepare release notes and tag v1.0

Labels: `release`, `documentation`, `priority:high`

Acceptance criteria:

- Release notes summarize features and known limitations.
- Version is tagged as `v1.0`.
- GitHub milestone is closed after release.
