import {
  ARENA_LEFT,
  ARENA_RIGHT,
  BLOCK_CLASSES,
  BLOCK_CLASS_ORDER,
  BLOCK_SIZE,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  COLS,
  FLOOR,
  MAX_ACTIVE_BLOCKS,
  PICKUP_CRUSH_DESTROY_CHANCE,
  PLAYER_TEMPLATES,
  DROPPABLE_WEAPONS,
  WEAPON_ORDER,
  WEAPONS,
} from "./constants.js";
import { Block, Particle, Pickup, Player } from "./entities.js";
import { Input } from "./input.js";
import {
  availableColumns as getAvailableColumns,
  hasSettledSupport as blockHasSettledSupport,
  isColumnFull as columnIsFull,
  landingYForColumn as getLandingYForColumn,
  releaseUnsupportedBlocks as releaseUnsupportedStackBlocks,
} from "./logic.js";
import { rectsOverlap } from "./utils.js";

const LEADERBOARD_KEY = "shooting-blocks-leaderboard";
const PLAYER_NAME_KEY = "shooting-blocks-player-name";
const MAX_LEADERBOARD_ENTRIES = 10;

class Game {
  constructor() {
    this.canvas = document.querySelector("#game");
    this.ctx = this.canvas.getContext("2d");
    this.timeEl = document.querySelector("#time");
    this.scoreEl = document.querySelector("#score");
    this.levelEl = document.querySelector("#level");
    this.modeLabelEl = document.querySelector("#mode-label");
    this.weaponLabelEl = document.querySelector("#weapon-label");
    this.ammoLabelEl = document.querySelector("#ammo-label");
    this.pauseButton = document.querySelector("#pause");
    this.overlay = document.querySelector("#overlay");
    this.overlayKicker = document.querySelector("#overlay-kicker");
    this.overlayTitle = document.querySelector("#overlay-title");
    this.overlayCopy = document.querySelector("#overlay-copy");
    this.overlayActions = document.querySelector("#overlay-actions");
    this.sandboxControls = document.querySelector("#sandbox-controls");
    this.sandboxColumn = document.querySelector("#sandbox-column");
    this.sandboxSpawnButton = document.querySelector("#sandbox-spawn");
    this.sandboxWeapon = document.querySelector("#sandbox-weapon");
    this.sandboxInfiniteAmmo = document.querySelector("#sandbox-infinite-ammo");
    this.sandboxInvincible = document.querySelector("#sandbox-invincible");
    this.sandboxNormalSpawn = document.querySelector("#sandbox-normal-spawn");
    this.sandboxAutoLevel = document.querySelector("#sandbox-auto-level");
    this.sandboxLevelInput = document.querySelector("#sandbox-level");
    this.sandboxResetButton = document.querySelector("#sandbox-reset");
    this.leaderboardList = document.querySelector("#leaderboard-list");
    this.leaderboardEmpty = document.querySelector("#leaderboard-empty");
    this.leaderboardClearButton = document.querySelector("#leaderboard-clear");
    this.input = new Input();

    this.mode = "single";
    this.state = "menu";
    this.sandboxSettings = {
      normalSpawn: false,
      autoLevel: false,
      manualLevel: 1,
      weapon: "default",
      infiniteAmmo: true,
      invincible: true,
    };
    this.lastTime = performance.now();

    this.populateSandboxColumns();
    this.populateSandboxWeapons();
    this.pauseButton.addEventListener("click", () => this.togglePause());
    this.sandboxSpawnButton.addEventListener("click", () => {
      this.spawnBlock(Number(this.sandboxColumn.value));
    });
    this.sandboxWeapon.addEventListener("change", () => {
      this.sandboxSettings.weapon = this.sandboxWeapon.value;
      this.applySandboxWeapon();
      this.syncUi();
    });
    this.sandboxInfiniteAmmo.addEventListener("change", () => {
      this.sandboxSettings.infiniteAmmo = this.sandboxInfiniteAmmo.checked;
      this.syncUi();
    });
    this.sandboxInvincible.addEventListener("change", () => {
      this.sandboxSettings.invincible = this.sandboxInvincible.checked;
    });
    this.sandboxNormalSpawn.addEventListener("change", () => {
      this.sandboxSettings.normalSpawn = this.sandboxNormalSpawn.checked;
      this.spawnTimer = Math.min(this.spawnTimer, 0.2);
    });
    this.sandboxAutoLevel.addEventListener("change", () => {
      this.sandboxSettings.autoLevel = this.sandboxAutoLevel.checked;
      if (!this.sandboxSettings.autoLevel) this.sandboxSettings.manualLevel = this.level;
      this.syncUi();
    });
    this.sandboxLevelInput.addEventListener("input", () => {
      if (this.sandboxLevelInput.value === "") return;

      this.sandboxSettings.manualLevel = this.sandboxLevelValue();
      if (this.isSandbox() && !this.sandboxSettings.autoLevel) this.level = this.sandboxSettings.manualLevel;
    });
    this.sandboxLevelInput.addEventListener("blur", () => {
      this.sandboxSettings.manualLevel = this.sandboxLevelValue();
      this.level = this.sandboxSettings.manualLevel;
      this.syncUi();
    });
    this.sandboxResetButton.addEventListener("click", () => this.resetSandbox());
    this.leaderboardClearButton.addEventListener("click", () => {
      localStorage.removeItem(LEADERBOARD_KEY);
      this.renderLeaderboard();
    });
    this.canvas.addEventListener("click", (event) => this.spawnSandboxBlockAt(event));
    window.addEventListener("keydown", (event) => {
      if (event.code !== "Escape") return;
      if (this.state !== "playing" && this.state !== "paused") return;

      event.preventDefault();
      this.togglePause();
    });

    this.resetRun(this.mode);
    this.renderLeaderboard();
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

  populateSandboxWeapons() {
    for (const weaponKey of WEAPON_ORDER) {
      const option = document.createElement("option");
      option.value = weaponKey;
      option.textContent = WEAPONS[weaponKey].name;
      this.sandboxWeapon.append(option);
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

  leaderboardEntries() {
    try {
      const entries = JSON.parse(localStorage.getItem(LEADERBOARD_KEY) ?? "[]");
      return Array.isArray(entries) ? entries : [];
    } catch {
      return [];
    }
  }

  saveLeaderboard(entries) {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries.slice(0, MAX_LEADERBOARD_ENTRIES)));
  }

  renderLeaderboard() {
    const entries = this.leaderboardEntries();
    this.leaderboardList.replaceChildren(
      ...entries.map((entry) => {
        const item = document.createElement("li");
        const name = document.createElement("strong");
        const details = document.createElement("span");

        name.textContent = entry.name;
        details.textContent = `${entry.score} pontos - ${entry.mode}`;
        item.append(name, details);
        return item;
      }),
    );
    this.leaderboardEmpty.hidden = entries.length > 0;
  }

  submitScore(name) {
    if (this.scoreSubmitted || this.isSandbox()) return;

    const cleanName = name.trim().slice(0, 18) || "Player";
    const score = Math.floor(this.score);
    const entries = [
      ...this.leaderboardEntries(),
      {
        name: cleanName,
        score,
        mode: this.modeLabel(),
        date: new Date().toISOString(),
      },
    ].sort((a, b) => b.score - a.score);

    localStorage.setItem(PLAYER_NAME_KEY, cleanName);
    this.saveLeaderboard(entries);
    this.scoreSubmitted = true;
    this.renderLeaderboard();
    this.renderOverlay();
  }

  scoreForm() {
    const form = document.createElement("form");
    const input = document.createElement("input");
    const button = document.createElement("button");

    form.className = "score-form";
    input.type = "text";
    input.name = "name";
    input.maxLength = 18;
    input.placeholder = "O teu nome";
    input.value = localStorage.getItem(PLAYER_NAME_KEY) ?? "";
    button.type = "submit";
    button.textContent = "Guardar pontuacao";

    form.append(input, button);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      this.submitScore(input.value);
    });

    return form;
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
      const actions = [
        this.actionButton("Reiniciar este modo", () => this.startRun(this.mode)),
        this.actionButton("Voltar ao inicio", () => this.openMenu()),
      ];
      if (!this.scoreSubmitted && !this.isSandbox()) actions.unshift(this.scoreForm());

      this.setOverlay({
        kicker: this.modeLabel(),
        title: "Fim de jogo",
        copy: this.scoreSubmitted
          ? "Pontuacao guardada. Reinicia este modo ou volta ao inicio para escolher outro."
          : "Escreve o teu nome para guardar esta pontuacao localmente.",
        actions,
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
    const primaryPlayer = this.players[0];
    this.modeLabelEl.textContent = this.modeLabel();
    this.weaponLabelEl.textContent = primaryPlayer ? WEAPONS[primaryPlayer.weaponKey].name : "Default";
    this.ammoLabelEl.textContent = primaryPlayer ? this.ammoLabel(primaryPlayer) : "∞";
    this.pauseButton.disabled = this.state !== "playing";
    this.pauseButton.textContent = this.state === "paused" ? "Pausado" : "Pausar";
    this.sandboxControls.hidden = !this.isSandbox() || this.state !== "playing";
    this.sandboxWeapon.value = this.sandboxSettings.weapon;
    this.sandboxInfiniteAmmo.checked = this.sandboxSettings.infiniteAmmo;
    this.sandboxInvincible.checked = this.sandboxSettings.invincible;
    this.sandboxNormalSpawn.checked = this.sandboxSettings.normalSpawn;
    this.sandboxAutoLevel.checked = this.sandboxSettings.autoLevel;
    this.sandboxLevelInput.disabled = this.sandboxSettings.autoLevel;
    if (document.activeElement !== this.sandboxLevelInput || this.sandboxSettings.autoLevel) {
      this.sandboxLevelInput.value = this.level.toString();
    }
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

  togglePause() {
    if (this.state === "playing") {
      this.pause();
    } else if (this.state === "paused") {
      this.resume();
    }
  }

  resume() {
    if (this.state !== "paused") return;
    this.state = "playing";
    this.lastTime = performance.now();
    this.renderOverlay();
    this.syncUi();
  }

  resetSandbox() {
    if (!this.isSandbox()) return;
    this.resetRun("sandbox");
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
    this.pickups = [];
    this.particles = [];
    this.spawnTimer = 0.8;
    this.elapsed = 0;
    this.score = 0;
    this.level = 1;
    this.gameOver = false;
    this.scoreSubmitted = false;
    if (this.isSandbox()) this.level = this.sandboxSettings.autoLevel ? 1 : this.sandboxSettings.manualLevel;
    this.applySandboxWeapon();
    this.syncUi();
  }

  applySandboxWeapon() {
    if (!this.isSandbox() || !this.players.length) return;

    this.players[0].setWeapon(this.sandboxSettings.weapon);
  }

  isInfiniteAmmo() {
    return this.isSandbox() && this.sandboxSettings.infiniteAmmo;
  }

  isPlayerInvincible() {
    return this.isSandbox() && this.sandboxSettings.invincible;
  }

  ammoLabel(player) {
    if (this.isInfiniteAmmo() || player.ammo === Infinity) return "∞";
    return Math.max(0, player.ammo).toString();
  }

  hasAmmo(player, amount = 1) {
    return this.isInfiniteAmmo() || player.ammo === Infinity || player.ammo >= amount;
  }

  consumeAmmo(player) {
    if (this.isInfiniteAmmo() || player.ammo === Infinity) return true;
    if (player.ammo <= 0) return false;

    player.ammo -= 1;
    this.syncUi();
    return true;
  }

  handleAmmoDepleted(player) {
    if (this.isInfiniteAmmo() || player.weaponKey === "default" || player.ammo > 0) return;

    player.setWeapon("default");
    if (this.isSandbox() && player === this.players[0]) this.sandboxSettings.weapon = "default";
    this.syncUi();
  }

  sandboxLevelValue() {
    const parsed = Number(this.sandboxLevelInput.value);
    if (!Number.isFinite(parsed)) return 1;
    return Math.max(1, Math.min(99, Math.floor(parsed)));
  }

  solidBlocks() {
    return this.blocks.filter((block) => block.settled);
  }

  landingYForColumn(col, ignoreBlock) {
    return getLandingYForColumn(this.blocks, col, ignoreBlock);
  }

  hasSettledSupport(block) {
    return blockHasSettledSupport(this.blocks, block);
  }

  releaseUnsupportedBlocks() {
    releaseUnsupportedStackBlocks(this.blocks);
  }

  addBurst(x, y, color, amount = 10) {
    for (let i = 0; i < amount; i += 1) {
      this.particles.push(new Particle(x, y, color));
    }
  }

  availableColumns() {
    return getAvailableColumns(this.blocks);
  }

  isColumnFull(col) {
    return columnIsFull(this.blocks, col);
  }

  randomAvailableColumn() {
    const columns = this.availableColumns();
    if (columns.length === 0) return null;
    return columns[Math.floor(Math.random() * columns.length)];
  }

  playerHasNonDefaultWeapon() {
    return this.players.some((player) => player.weaponKey !== "default");
  }

  missingPlayerHealth() {
    return this.players.reduce((missing, player) => missing + Math.max(0, player.maxHp - player.hp), 0);
  }

  longestNonDefaultWeaponHold() {
    return this.players.reduce((longest, player) => {
      if (player.weaponKey === "default") return longest;
      return Math.max(longest, player.weaponHeldTime);
    }, 0);
  }

  currentBlockWeights() {
    const weights = {};
    for (const classKey of BLOCK_CLASS_ORDER) {
      const blockClass = BLOCK_CLASSES[classKey];
      const activeCount = this.blocks.filter((block) => block.classKey === classKey).length;
      weights[classKey] = activeCount >= blockClass.maxActive ? 0 : blockClass.weight;
    }

    if (this.playerHasNonDefaultWeapon() && weights.weapon > 0) {
      weights.weapon = Math.max(1, Math.floor(weights.weapon * 0.18));
    }

    const weaponHoldTime = this.longestNonDefaultWeaponHold();
    if (weaponHoldTime > 0 && weights.ammo > 0) {
      const ammoFactor = Math.max(0.15, 1 - weaponHoldTime / 28);
      weights.ammo = Math.max(1, Math.floor(weights.ammo * ammoFactor));
    }

    const missingHealth = this.missingPlayerHealth();
    if (missingHealth > 0 && weights.health > 0) weights.health += missingHealth * 12;

    return weights;
  }

  weightedBlockClass() {
    const weights = this.currentBlockWeights();
    const totalWeight = BLOCK_CLASS_ORDER.reduce((sum, classKey) => sum + weights[classKey], 0);
    if (totalWeight <= 0) return null;

    let roll = Math.random() * totalWeight;
    for (const classKey of BLOCK_CLASS_ORDER) {
      roll -= weights[classKey];
      if (roll <= 0) return classKey;
    }
    return "normal";
  }

  spawnBlock(col = this.randomAvailableColumn(), classKey = this.weightedBlockClass()) {
    if (this.blocks.length >= MAX_ACTIVE_BLOCKS) return false;
    if (!classKey) return false;
    if (col === null || this.isColumnFull(col)) return false;

    this.blocks.push(new Block(col, this.level, classKey));
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
        block.hp -= bullet.damage;
        if (bullet.shockwave) this.crushAdjacentBlocks(block);
        if (!this.isSandbox()) this.score += 25;
        this.addBurst(bullet.x, bullet.y, bullet.color, 4);
      }
    }

    this.bullets = this.bullets.filter((bullet) => !bullet.dead);
  }

  pickupStackKey(config) {
    return `${config.type}:${config.weaponKey ?? ""}`;
  }

  addPickup(config) {
    const stackKey = this.pickupStackKey(config);
    const existingPickup = this.pickups.find((pickup) => {
      if (pickup.collected || pickup.destroyed || pickup.stackKey !== stackKey) return false;
      return Math.abs(pickup.x - config.x) < 18 && Math.abs(pickup.y - config.y) < 18;
    });

    if (existingPickup) {
      existingPickup.stack += 1;
      existingPickup.amount = (existingPickup.amount ?? 0) + (config.amount ?? 0);
      existingPickup.floorLife = Math.max(existingPickup.floorLife, config.floorLife ?? existingPickup.floorLife);
      return existingPickup;
    }

    const pickup = new Pickup({
      ...config,
      stackKey,
    });
    this.pickups.push(pickup);
    return pickup;
  }

  canStackPickups(a, b) {
    if (a === b || a.collected || b.collected || a.destroyed || b.destroyed) return false;
    if (!a.grounded || !b.grounded || a.stackKey !== b.stackKey) return false;

    const aCenterX = a.x + a.w / 2;
    const bCenterX = b.x + b.w / 2;
    const aCenterY = a.y + a.h / 2;
    const bCenterY = b.y + b.h / 2;

    return Math.abs(aCenterX - bCenterX) <= 24 && Math.abs(aCenterY - bCenterY) <= 8;
  }

  mergePickupInto(target, source) {
    target.stack += source.stack;
    target.amount = (target.amount ?? 0) + (source.amount ?? 0);
    target.floorLife = Math.max(target.floorLife, source.floorLife);
    source.collected = true;
  }

  mergePickupStacks() {
    for (let i = 0; i < this.pickups.length; i += 1) {
      const target = this.pickups[i];
      if (target.collected || target.destroyed) continue;

      for (let j = i + 1; j < this.pickups.length; j += 1) {
        const source = this.pickups[j];
        if (!this.canStackPickups(target, source)) continue;
        this.mergePickupInto(target, source);
      }
    }

    this.pickups = this.pickups.filter((pickup) => !pickup.collected);
  }

  dropFromBlock(block) {
    const { drop } = block.blockClass;
    if (!drop) return;

    if (drop === "weapon") {
      const weaponKey = DROPPABLE_WEAPONS[Math.floor(Math.random() * DROPPABLE_WEAPONS.length)];
      this.addPickup({
        type: "weapon",
        weaponKey,
        x: block.x + block.w / 2 - 14,
        y: block.y + block.h / 2 - 14,
        color: "#54d5a7",
        label: "W",
      });
      return;
    }

    if (drop === "ammo") {
      this.addPickup({
        type: "ammo",
        amount: block.blockClass.ammoAmount,
        x: block.x + block.w / 2 - 14,
        y: block.y + block.h / 2 - 14,
        color: "#ffd166",
        label: "+",
      });
      return;
    }

    if (drop === "health") {
      this.addPickup({
        type: "health",
        amount: block.blockClass.healAmount,
        x: block.x + block.w / 2 - 14,
        y: block.y + block.h / 2 - 14,
        color: "#ff6b6b",
        label: "H",
      });
    }
  }

  updatePickups(dt) {
    const solidBlocks = this.solidBlocks();
    for (const pickup of this.pickups) pickup.update(dt, solidBlocks);
    this.pickups = this.pickups.filter((pickup) => pickup.floorLife > 0);
    this.mergePickupStacks();

    for (const pickup of this.pickups) {
      for (const player of this.players) {
        if (!player.alive || pickup.collected || !rectsOverlap(player, pickup)) continue;
        this.collectPickup(player, pickup);
      }
    }

    this.pickups = this.pickups.filter((pickup) => !pickup.collected);
  }

  collectPickup(player, pickup) {
    pickup.collected = true;
    if (pickup.type === "weapon") {
      player.setWeapon(pickup.weaponKey);
      this.addBurst(pickup.x + pickup.w / 2, pickup.y + pickup.h / 2, pickup.color, 12);
      return;
    }

    if (pickup.type === "ammo" && player.weaponKey !== "default") {
      player.ammo += pickup.amount;
      this.addBurst(pickup.x + pickup.w / 2, pickup.y + pickup.h / 2, pickup.color, 10);
      return;
    }

    if (pickup.type === "health") {
      player.heal(pickup.amount);
      this.addBurst(pickup.x + pickup.w / 2, pickup.y + pickup.h / 2, pickup.color, 12);
    }
  }

  crushAdjacentBlocks(originBlock) {
    const adjacentBlocks = this.blocks.filter((block) => {
      if (block === originBlock || block.hp <= 0) return false;

      const sameColumn = block.col === originBlock.col;
      const neighboringColumn = Math.abs(block.col - originBlock.col) === 1;
      const sameRow = Math.abs(block.y - originBlock.y) < 0.5;
      const touchingAboveOrBelow = sameColumn && Math.abs(block.y - originBlock.y) === BLOCK_SIZE;
      const touchingLeftOrRight = neighboringColumn && sameRow;

      return touchingAboveOrBelow || touchingLeftOrRight;
    });

    for (const block of adjacentBlocks) {
      block.hp = 0;
      this.addBurst(block.x + block.w / 2, block.y + block.h / 2, block.color, 8);
    }
  }

  update(dt) {
    if (this.state !== "playing" || this.gameOver) return;

    this.elapsed += dt;
    if (this.isSandbox()) {
      this.level = this.sandboxSettings.autoLevel
        ? 1 + Math.floor(this.elapsed / 18)
        : this.sandboxSettings.manualLevel;
      if (this.sandboxSettings.autoLevel || document.activeElement !== this.sandboxLevelInput) {
        this.sandboxLevelInput.value = this.level.toString();
      }
    } else {
      this.level = 1 + Math.floor(this.elapsed / 18);
    }
    if (!this.isSandbox()) this.score += dt * 8 * this.level;

    const shouldAutoSpawn = !this.isSandbox() || this.sandboxSettings.normalSpawn;
    if (shouldAutoSpawn) this.spawnTimer -= dt;
    if (shouldAutoSpawn && this.spawnTimer <= 0) {
      const spawned = this.spawnBlock();
      if (!spawned && !this.isSandbox() && this.availableColumns().length === 0) this.gameOver = true;
      this.spawnTimer = Math.max(0.24, 1.35 - this.level * 0.085);
    }

    for (const player of this.players) player.update(dt, this);
    this.updateBlocks(dt);
    this.resolvePickupBlockImpacts();
    this.updateBullets(dt);

    for (const block of this.blocks) {
      if (block.hp <= 0) {
        if (!this.isSandbox()) this.score += 80;
        this.addBurst(block.x + block.w / 2, block.y + block.h / 2, block.color, 14);
        this.dropFromBlock(block);
      }
    }

    const hadDestroyedBlocks = this.blocks.some((block) => block.hp <= 0);
    this.blocks = this.blocks.filter((block) => block.hp > 0);
    if (hadDestroyedBlocks) this.releaseUnsupportedBlocks();

    this.updatePickups(dt);

    for (const particle of this.particles) particle.update(dt);
    this.particles = this.particles.filter((particle) => particle.life > 0);

    if (this.gameOver) {
      this.state = "gameover";
      this.renderOverlay();
      this.syncUi();
    }
  }

  resolvePickupBlockImpacts() {
    for (const pickup of this.pickups) {
      if (pickup.collected || pickup.destroyed) continue;

      for (const block of this.blocks) {
        if (block.settled || block.hp <= 0 || !rectsOverlap(pickup, block)) continue;
        if (!this.blockHitPickupFromAbove(block, pickup)) continue;

        if (Math.random() < PICKUP_CRUSH_DESTROY_CHANCE || !this.knockPickupAside(pickup, block)) {
          pickup.destroyed = true;
          this.addBurst(pickup.x + pickup.w / 2, pickup.y + pickup.h / 2, pickup.color, 8);
        }
        break;
      }
    }

    this.pickups = this.pickups.filter((pickup) => !pickup.destroyed);
  }

  blockHitPickupFromAbove(block, pickup) {
    const previousBottom = block.previousY + block.h;
    const horizontalOverlap = block.x < pickup.x + pickup.w && block.x + block.w > pickup.x;
    return horizontalOverlap && previousBottom <= pickup.y + 6 && block.y + block.h >= pickup.y;
  }

  knockPickupAside(pickup, block) {
    const directions = pickup.x + pickup.w / 2 < block.x + block.w / 2 ? [-1, 1] : [1, -1];

    for (const direction of directions) {
      const nextX = pickup.x + direction * BLOCK_SIZE;
      if (nextX < ARENA_LEFT || nextX + pickup.w > ARENA_RIGHT) continue;

      const candidate = { ...pickup, x: nextX };
      const blocked = this.blocks.some((otherBlock) => otherBlock.hp > 0 && rectsOverlap(candidate, otherBlock));
      if (blocked) continue;

      pickup.x = nextX;
      pickup.vy = -120;
      return true;
    }

    return false;
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
    for (const pickup of this.pickups) pickup.draw(ctx);
    for (const bullet of this.bullets) bullet.draw(ctx);
    for (const player of this.players) player.draw(ctx, this.input);
    for (const particle of this.particles) particle.draw(ctx);

    this.timeEl.textContent = `${this.elapsed.toFixed(1)}s`;
    this.scoreEl.textContent = Math.floor(this.score).toString();
    this.levelEl.textContent = this.level.toString();
    this.syncUi();
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
