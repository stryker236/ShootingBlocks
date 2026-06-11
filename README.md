# Shooting Blocks

Shooting Blocks is a local browser game prototype about surviving in a narrow arena while blocks fall, stack, and collapse. Move, jump, shoot blocks apart, and stay alive as the difficulty ramps up over time.

The game currently supports single-player, local two-player multiplayer on one keyboard, and a basic sandbox mode.

## Game Summary

Shooting Blocks feels like a compact arcade survival game mixed with a platforming pressure test. Blocks keep dropping into columns, turning the arena into shifting cover, stairs, traps, and danger all at once. You are not just dodging the blocks; you are deciding which ones to destroy, when to climb, and when to risk a shot before the stack gets too high.

The core feel is fast, readable, and a little chaotic: short jumps, quick side shots, airborne downward shots, and collapsing stacks create small tactical moments inside a simple survival loop. In multiplayer, both players share the same cramped arena, so the game becomes cooperative crowd control with a bit of local chaos.

## Run Locally

This project is a static HTML, CSS, and JavaScript game. Because the game uses JavaScript modules, run it from a local static server instead of opening `index.html` directly.

From the project root:

```powershell
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

If port `8000` is already in use, choose another port:

```powershell
python -m http.server 5173
```

## Controls

Choose `Single Player`, `Multiplayer`, or `Sandbox` before the game starts. During a run, press `Escape` or use `Pausar` to open the pause menu. Restarting, changing mode, and returning to Sandbox are only available from the start or pause menus.

### Player 1

| Action | Key |
| --- | --- |
| Move left | `A` |
| Move right | `D` |
| Jump | `W` |
| Shoot | `F` |
| Shoot downward | Hold `S` and press/hold `F` while airborne |

### Player 2

| Action | Key |
| --- | --- |
| Move left | `Left Arrow` |
| Move right | `Right Arrow` |
| Jump | `Up Arrow` |
| Shoot | `/` |
| Shoot downward | Hold `Down Arrow` and press/hold `/` while airborne |

### Sandbox

Sandbox uses Player 1 controls. It disables normal scoring and survival game-over pressure by default. Click an empty arena column to create a normal falling block, click an existing block to destroy it, or use the sandbox controls above the canvas for precise column spawning. Sandbox can also run normal block spawning, use a manually selected level, let difficulty increase over time like a normal run, switch weapons, toggle infinite bullets, toggle invincibility, or reset immediately from the sandbox controls.

## Weapons

- `Default`: the starting gun. It fires slowly and deals 1 damage to blocks.
- `Peashooter`: the baseline weapon. It fires faster than Default, shoots horizontally or downward while airborne, destroys one block per hit, and starts with 40 bullets.
- `Burst Gun`: an arena-sculpting weapon. It fires 3 quick shots per burst, then waits briefly before the next burst, and starts with 24 bullets.
- `Crusher Cannon`: a slow emergency weapon. It destroys the first block it hits, also breaks adjacent touching blocks above, below, left, and right, and starts with 8 bullets.

Sandbox includes a weapon selector for testing the current weapon set.

## Block Classes

Blocks are class-based so new block features can be added through config and small behavior hooks. Current classes:

- `Normal`: a standard falling block.
- `Weapon`: drops a random non-default weapon pickup when destroyed.
- `Ammo`: drops an ammo pickup when destroyed. Ammo pickups add bullets to the player's current weapon, but do nothing for the default weapon.

This structure is meant to expand into more block features later, such as heavy blocks, explosive blocks, supply blocks, or other class-specific drops.

## Gameplay Notes

- Falling blocks damage players on contact.
- Destroying a support block can release unsupported blocks above it.
- Weapon and ammo block classes can drop pickups when destroyed.
- Finite weapons return to `Default` when their bullets run out.
- Pickups hit from above by falling blocks try to move sideways; if there is no open side space, they are destroyed.
- The level increases over time, making blocks spawn faster and fall harder.
- The run ends when a block stack reaches the danger height.
- Sandbox mode does not end from stack overflow, and its spawning/difficulty controls can be changed while it is running.
- Players respawn after death, so HP loss no longer stops the run by itself.

## Project Docs

- [Roadmap](docs/ROADMAP.md)
- [Issue plan](docs/ISSUES.md)
