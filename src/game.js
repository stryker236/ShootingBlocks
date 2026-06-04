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
    this.modeButton = document.querySelector("#mode");
    this.restartButton = document.querySelector("#restart");
    this.input = new Input();

    this.multiplayer = false;
    this.lastTime = performance.now();

    this.modeButton.addEventListener("click", () => {
      this.multiplayer = !this.multiplayer;
      this.reset();
    });
    this.restartButton.addEventListener("click", () => this.reset());

    this.reset();
    requestAnimationFrame((now) => this.frame(now));
  }

  reset() {
    const activePlayers = this.multiplayer ? PLAYER_TEMPLATES : PLAYER_TEMPLATES.slice(0, 1);

    this.players = activePlayers.map((template) => new Player(template));
    this.bullets = [];
    this.blocks = [];
    this.particles = [];
    this.spawnTimer = 0.8;
    this.elapsed = 0;
    this.score = 0;
    this.level = 1;
    this.gameOver = false;
    this.modeButton.textContent = this.multiplayer ? "Multiplayer" : "Single";
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

  spawnBlock() {
    this.blocks.push(new Block(Math.floor(Math.random() * COLS), this.level));
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
        this.score += 25;
        this.addBurst(bullet.x, bullet.y, bullet.color, 4);
      }
    }

    this.bullets = this.bullets.filter((bullet) => !bullet.dead);
  }

  update(dt) {
    if (this.gameOver) return;

    this.elapsed += dt;
    this.level = 1 + Math.floor(this.elapsed / 18);
    this.score += dt * 8 * this.level;

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnBlock();
      this.spawnTimer = Math.max(0.24, 1.35 - this.level * 0.085);
    }

    for (const player of this.players) player.update(dt, this);
    this.updateBlocks(dt);
    this.updateBullets(dt);

    for (const block of this.blocks) {
      if (block.hp <= 0) {
        this.score += 80;
        this.addBurst(block.x + block.w / 2, block.y + block.h / 2, block.color, 14);
      }
    }

    const hadDestroyedBlocks = this.blocks.some((block) => block.hp <= 0);
    this.blocks = this.blocks.filter((block) => block.hp > 0);
    if (hadDestroyedBlocks) this.releaseUnsupportedBlocks();

    for (const particle of this.particles) particle.update(dt);
    this.particles = this.particles.filter((particle) => particle.life > 0);

    if (this.players.every((player) => !player.alive)) this.gameOver = true;
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

    if (this.gameOver) this.drawGameOver();

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
