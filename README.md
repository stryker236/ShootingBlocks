# Shooting Blocks

Shooting Blocks is a local browser game prototype about surviving in a narrow arena while blocks fall, stack, and collapse. Move, jump, shoot blocks apart, and stay alive as the difficulty ramps up over time.

The game currently supports single-player, local two-player multiplayer on one keyboard, and a basic sandbox mode.

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

Sandbox uses Player 1 controls. It disables normal scoring, random block spawning, and survival difficulty. Click an empty arena column to create a normal falling block, click an existing block to destroy it, or use the sandbox controls above the canvas for precise column spawning.

## Gameplay Notes

- Falling blocks damage players on contact.
- Destroying a support block can release unsupported blocks above it.
- The level increases over time, making blocks spawn faster and fall harder.
- The run ends when every active player is out of HP or a block stack reaches the danger height.
- Sandbox mode keeps the level at 1 and does not end from stack overflow.

## Project Docs

- [Roadmap](docs/ROADMAP.md)
- [Issue plan](docs/ISSUES.md)
