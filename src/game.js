import {
  ARENA_LEFT,
  ARENA_RIGHT,
  BLOCK_SIZE,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  COLS,
  FLOOR,
  PLAYER_TEMPLATES,
} from "./constants.js";
import { Block, Particle, Player } from "./entities.js";
import { Input } from "./input.js";
import { rectsOverlap } from "./utils.js";

class Game {
  constructor() {
    this.canvas = document.querySelector("#game");
    this.ctx = this.canvas.getContext("2d");
    this.timeEl = document.querySelector("#time");
    this.scoreEl = document.querySelector("#score");
    this.levelEl = document.querySelector("#level");
    this.modeLabelEl = document.querySelector("#mode-label");
    this.pauseButton = document.querySelector("#pause");
    this.overlay = document.querySelector("#overlay");
    this.overlayKicker = document.querySelector("#overlay-kicker");
    this.overlayTitle = document.querySelector("#overlay-title");
    this.overlayCopy = document.querySelector("#overlay-copy");
    this.overlayActions = document.querySelector("#overlay-actions");
    this.sandboxControls = document.querySelector("#sandbox-controls");
    this.sandboxColumn = document.querySelector("#sandbox-column");
    this.sandboxSpawnButton = document.querySelector("#sandbox-spawn");
    this.input = new Input();

    this.mode = "single";
    this.state = "menu";
    this.lastTime = performance.now();

    this.populateSandboxColumns();
    this.pauseButton.addEventListener("click", () => this.pause());
    this.sandboxSpawnButton.addEventListener("click", () => {
      this.spawnBlock(Number(this.sandboxColumn.value));
    });
    this.canvas.addEventListener("click", (event) => this.spawnSandboxBlockAt(event));
    window.addEventListener("keydown", (event) => {
      if (event.code !== "Escape") return;
      if (this.state === "playing") this.pause();
      else if (this.state === "paused") this.resume();
    });

    this.resetRun(this.mode);
    this.renderOverlay();
    requestAnimationFrame((now) => this.frame(now));
  }

  populateSandboxColumns() {
    for (let col = 0; col < COLS; col += 1) {
      const option = document.createElement("option");
      option.value = col.toString();
      option.textContent = `Coluna ${col + 1}`;
      this.sandboxColumn.append(option);
    }
  }

  isSandbox() {
    return this.mode === "sandbox";
  }

  modeLabel() {
    if (this.mode === "multi") return "Multiplayer";
    if (this.mode === "sandbox") return "Sandbox";
    return "Single";
  }

  actionButton(label, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", onClick);
    return button;
  }

  setOverlay({ kicker, title, copy, actions }) {
    this.overlayKicker.textContent = kicker;
    this.overlayTitle.textContent = title;
    this.overlayCopy.textContent = copy;
    this.overlayActions.replaceChildren(...actions);
    this.overlay.hidden = false;
  }

  renderOverlay() {
    if (this.state === "playing") {
      this.overlay.hidden = true;
      return;
    }

    if (this.state === "paused") {
      this.setOverlay({
        kicker: this.modeLabel(),
        title: "Jogo em pausa",
        copy: "Retoma a run ou muda de modo a partir daqui.",
        actions: [
          this.actionButton("Continuar", () => this.resume()),
          this.actionButton("Reiniciar este modo", () => this.startRun(this.mode)),
          this.actionButton("Single Player", () => this.startRun("single")),
          this.actionButton("Multiplayer", () => this.startRun("multi")),
          this.actionButton("Sandbox", () => this.startRun("sandbox")),
          this.actionButton("Voltar ao inicio", () => this.openMenu()),
        ],
      });
      return;
    }

    if (this.state === "gameover") {
      this.setOverlay({
        kicker: this.modeLabel(),
        title: "Fim de jogo",
        copy: "Reinicia este modo ou volta ao inicio para escolher outro.",
        actions: [
          this.actionButton("Reiniciar este modo", () => this.startRun(this.mode)),
          this.actionButton("Voltar ao inicio", () => this.openMenu()),
        ],
      });
      return;
    }

    this.setOverlay({
      kicker: "Shooting Blocks",
      title: "Escolhe o modo",
      copy: "Comeca uma run local antes de os blocos encherem a arena.",
      actions: [
        this.actionButton("Single Player", () => this.startRun("single")),
        this.actionButton("Multiplayer", () => this.startRun("multi")),
        this.actionButton("Sandbox", () => this.startRun("sandbox")),
      ],
    });
  }

  syncUi() {
    this.modeLabelEl.textContent = this.modeLabel();
    this.pauseButton.disabled = this.state !== "playing";
    this.pauseButton.textContent = this.state === "paused" ? "Pausado" : "Pausar";
    this.sandboxControls.hidden = !this.isSandbox() || this.state !== "playing";
  }

  openMenu() {
    this.state = "menu";
    this.resetRun("single");
    this.renderOverlay();
    this.syncUi();
  }

  startRun(mode) {
    this.resetRun(mode);
    this.state = "playing";
    this.lastTime = performance.now();
    this.renderOverlay();
    this.syncUi();
  }

  pause() {
    if (this.state !== "playing") return;
    this.state = "paused";
    this.renderOverlay();
    this.syncUi();
  }

  resume() {
    if (this.state !== "paused") return;
    this.state = "playing";
    this.lastTime = performance.now();
    this.renderOverlay();
    this.syncUi();
  }

  resetRun(mode) {
    this.mode = mode;
    const activePlayers = mode === "multi" ? PLAYER_TEMPLATES : PLAYER_TEMPLATES.slice(0, 1);

    this.players = activePlayers.map((template) => new Player(template));
    this.bullets = [];
    this.blocks = [];
    this.particles = [];
    this.spawnTimer = 0.8;
    this.elapsed = 0;
    this.score = 0;
    this.level = 1;
    this.gameOver = false;
    this.syncUi();
  }

  solidBlocks() {
    return this.blocks.filter((block) => block.settled);
  }

  landingYForColumn(col, ignoreBlock) {
    let landingY = FLOOR - BLOCK_SIZE;
    for (const block of this.blocks) {
      if (block === ignoreBlock || !block.settled || block.col !== col) continue;
      landingY = Math.min(landingY, block.y - BLOCK_SIZE);
    }
    return landingY;
  }

  hasSettledSupport(block) {
    if (Math.abs(block.y - (FLOOR - BLOCK_SIZE)) < 0.5) return true;

    return this.blocks.some(
      (other) =>
        other !== block &&
        other.settled &&
        other.col === block.col &&
        Math.abs(other.y - (block.y + BLOCK_SIZE)) < 0.5,
    );
  }

  releaseUnsupportedBlocks() {
    let changed = true;

    while (changed) {
      changed = false;

      for (const block of this.blocks) {
        if (!block.settled || this.hasSettledSupport(block)) continue;

        block.settled = false;
        block.vy = Math.max(block.vy, 70);
        changed = true;
      }
    }
  }

  addBurst(x, y, color, amount = 10) {
    for (let i = 0; i < amount; i += 1) {
      this.particles.push(new Particle(x, y, color));
    }
  }

  availableColumns() {
    const columns = [];
    for (let col = 0; col < COLS; col += 1) {
      if (!this.isColumnFull(col)) columns.push(col);
    }
    return columns;
  }

  isColumnFull(col) {
    return this.landingYForColumn(col) < 0;
  }

  randomAvailableColumn() {
    const columns = this.availableColumns();
    if (columns.length === 0) return null;
    return columns[Math.floor(Math.random() * columns.length)];
  }

  spawnBlock(col = this.randomAvailableColumn()) {
    if (col === null || this.isColumnFull(col)) return false;

    this.blocks.push(new Block(col, this.level));
    return true;
  }

  spawnSandboxBlockAt(event) {
    if (!this.isSandbox() || this.state !== "playing") return;

    const rect = this.canvas.getBoundingClientRect();
    const canvasX = ((event.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    const canvasY = ((event.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
    const clickedBlock = this.blockAt(canvasX, canvasY);
    if (clickedBlock) {
      clickedBlock.hp = 0;
      return;
    }

    if (canvasX < ARENA_LEFT || canvasX >= ARENA_RIGHT) return;

    const col = Math.floor((canvasX - ARENA_LEFT) / BLOCK_SIZE);
    this.sandboxColumn.value = col.toString();
    this.spawnBlock(col);
  }

  blockAt(x, y) {
    for (let i = this.blocks.length - 1; i >= 0; i -= 1) {
      const block = this.blocks[i];
      if (x >= block.x && x <= block.x + block.w && y >= block.y && y <= block.y + block.h) {
        return block;
      }
    }

    return null;
  }

  updateBlocks(dt) {
    const fallingBlocks = this.blocks
      .filter((block) => !block.settled)
      .sort((a, b) => b.y - a.y);

    for (const block of fallingBlocks) block.update(dt, this);
  }

  updateBullets(dt) {
    for (const bullet of this.bullets) bullet.update(dt);
    this.bullets = this.bullets.filter((bullet) => bullet.isInBounds());

    for (const block of this.blocks) {
      for (const bullet of this.bullets) {
        if (bullet.dead || !rectsOverlap(bullet, block)) continue;
        bullet.dead = true;
        block.hp -= 1;
        if (!this.isSandbox()) this.score += 25;
        this.addBurst(bullet.x, bullet.y, bullet.color, 4);
      }
    }

    this.bullets = this.bullets.filter((bullet) => !bullet.dead);
  }

  update(dt) {
    if (this.state !== "playing" || this.gameOver) return;

    this.elapsed += dt;
    this.level = this.isSandbox() ? 1 : 1 + Math.floor(this.elapsed / 18);
    if (!this.isSandbox()) this.score += dt * 8 * this.level;

    if (!this.isSandbox()) this.spawnTimer -= dt;
    if (!this.isSandbox() && this.spawnTimer <= 0) {
      if (!this.spawnBlock()) this.gameOver = true;
      this.spawnTimer = Math.max(0.24, 1.35 - this.level * 0.085);
    }

    for (const player of this.players) player.update(dt, this);
    this.updateBlocks(dt);
    this.updateBullets(dt);

    for (const block of this.blocks) {
      if (block.hp <= 0) {
        if (!this.isSandbox()) this.score += 80;
        this.addBurst(block.x + block.w / 2, block.y + block.h / 2, block.color, 14);
      }
    }

    const hadDestroyedBlocks = this.blocks.some((block) => block.hp <= 0);
    this.blocks = this.blocks.filter((block) => block.hp > 0);
    if (hadDestroyedBlocks) this.releaseUnsupportedBlocks();

    for (const particle of this.particles) particle.update(dt);
    this.particles = this.particles.filter((particle) => particle.life > 0);

    if (this.players.every((player) => !player.alive)) this.gameOver = true;
    if (this.gameOver) {
      this.state = "gameover";
      this.renderOverlay();
      this.syncUi();
    }
  }

  drawGrid() {
    const { ctx } = this;
    ctx.strokeStyle = "rgba(255,255,255,0.055)";
    ctx.lineWidth = 1;

    for (let col = 0; col <= COLS; col += 1) {
      const x = ARENA_LEFT + col * BLOCK_SIZE;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, FLOOR);
      ctx.stroke();
    }

    for (let y = FLOOR; y > 0; y -= BLOCK_SIZE) {
      ctx.beginPath();
      ctx.moveTo(ARENA_LEFT, y);
      ctx.lineTo(ARENA_RIGHT, y);
      ctx.stroke();
    }
  }

  drawGameOver() {
    const { ctx } = this;
    ctx.fillStyle = "rgba(8,10,14,0.72)";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = "#eef3f8";
    ctx.textAlign = "center";
    ctx.font = "800 54px system-ui, sans-serif";
    ctx.fillText("Fim de jogo", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 18);
    ctx.font = "600 24px system-ui, sans-serif";
    ctx.fillText("Carrega em Reiniciar para tentar outra vez", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 28);
    ctx.textAlign = "left";
  }

  draw() {
    const { ctx } = this;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    bg.addColorStop(0, "#121722");
    bg.addColorStop(1, "#080a0e");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = "rgba(255,255,255,0.025)";
    ctx.fillRect(ARENA_LEFT, 0, COLS * BLOCK_SIZE, FLOOR);
    this.drawGrid();

    ctx.fillStyle = "#1f2937";
    ctx.fillRect(0, FLOOR, CANVAS_WIDTH, CANVAS_HEIGHT - FLOOR);
    ctx.fillStyle = "rgba(84,213,167,0.2)";
    ctx.fillRect(ARENA_LEFT, FLOOR - 4, COLS * BLOCK_SIZE, 4);

    for (const block of this.blocks) block.draw(ctx);
    for (const bullet of this.bullets) bullet.draw(ctx);
    for (const player of this.players) player.draw(ctx, this.input);
    for (const particle of this.particles) particle.draw(ctx);

    this.timeEl.textContent = `${this.elapsed.toFixed(1)}s`;
    this.scoreEl.textContent = Math.floor(this.score).toString();
    this.levelEl.textContent = this.level.toString();
  }

  frame(now) {
    const dt = Math.min(0.033, (now - this.lastTime) / 1000);
    this.lastTime = now;
    this.update(dt);
    this.input.endFrame();
    this.draw();
    requestAnimationFrame((nextNow) => this.frame(nextNow));
  }
}

new Game();
