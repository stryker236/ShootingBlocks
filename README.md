# Shooting Blocks

Shooting Blocks is a local browser game prototype about surviving in a narrow arena while blocks fall, stack, and collapse. Move, jump, shoot blocks apart, and stay alive as the difficulty ramps up over time.

The game currently supports single-player and local two-player multiplayer on one keyboard.

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

Use the `Single` / `Multiplayer` button above the canvas to toggle between one player and two local players. Use `Reiniciar` to restart the current run.

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

## Gameplay Notes

- Falling blocks damage players on contact.
- Destroying a support block can release unsupported blocks above it.
- The level increases over time, making blocks spawn faster and fall harder.
- The run ends when every active player is out of HP or a block stack reaches the danger height.

## Project Docs

- [Roadmap](docs/ROADMAP.md)
- [Issue plan](docs/ISSUES.md)
