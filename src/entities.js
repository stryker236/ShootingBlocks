import {
  ARENA_LEFT,
  ARENA_RIGHT,
  BLOCK_CLASSES,
  BLOCK_SIZE,
  FLOOR,
  GRAVITY,
  PICKUP_FLOOR_TIMEOUT,
  WEAPONS,
} from "./constants.js";
import { clamp, rectsOverlap } from "./utils.js";

export class Player {
  constructor(template) {
    Object.assign(this, template);
    this.x = template.spawnX - 15;
    this.y = FLOOR - 38;
    this.previousY = this.y;
    this.vx = 0;
    this.vy = 0;
    this.aim = template.id === 1 ? 1 : -1;
    this.w = 30;
    this.h = 38;
    this.maxHp = 3;
    this.hp = this.maxHp;
    this.cooldown = 0;
    this.weaponKey = "default";
    this.ammo = Infinity;
    this.burstShotsRemaining = 0;
    this.burstTimer = 0;
    this.respawnTimer = 0;
    this.weaponHeldTime = 0;
    this.grounded = true;
    this.alive = true;
  }

  update(dt, game) {
    if (!this.alive) {
      this.respawnTimer = Math.max(0, this.respawnTimer - dt);
      if (this.respawnTimer === 0) this.respawn(game);
      return;
    }

    this.previousY = this.y;
    this.weaponHeldTime += dt;

    const move = (game.input.isDown(this.right) ? 1 : 0) - (game.input.isDown(this.left) ? 1 : 0);
    this.vx = move * 260;
    if (move !== 0) this.aim = move;

    if (game.input.wasPressed(this.jump) && this.grounded) {
      this.vy = -640;
      this.grounded = false;
    }

    this.vy = Math.min(900, this.vy + GRAVITY * dt);
    this.x = clamp(this.x + this.vx * dt, ARENA_LEFT, ARENA_RIGHT - this.w);
    this.resolveHorizontal(game.solidBlocks());

    this.y += this.vy * dt;
    this.resolveVertical(game.solidBlocks());

    this.cooldown = Math.max(0, this.cooldown - dt);
    this.burstTimer = Math.max(0, this.burstTimer - dt);
    if (this.burstShotsRemaining > 0 && this.burstTimer <= 0) this.fireBurstShot(game);
    if (game.input.isDown(this.fire)) this.shoot(game);
  }

  resolveHorizontal(blocks) {
    for (const block of blocks) {
      if (!rectsOverlap(this, block)) continue;
      if (this.vx > 0) this.x = block.x - this.w;
      if (this.vx < 0) this.x = block.x + block.w;
      this.vx = 0;
    }
  }

  resolveVertical(blocks) {
    this.grounded = false;

    if (this.y + this.h >= FLOOR) {
      this.y = FLOOR - this.h;
      this.vy = 0;
      this.grounded = true;
    }

    for (const block of blocks) {
      if (!rectsOverlap(this, block)) continue;

      const wasAbove = this.previousY + this.h <= block.y + 4;
      const wasBelow = this.previousY >= block.y + block.h - 4;

      if (this.vy >= 0 && wasAbove) {
        this.y = block.y - this.h;
        this.vy = 0;
        this.grounded = true;
      } else if (this.vy < 0 && wasBelow) {
        this.y = block.y + block.h;
        this.vy = 0;
      } else if (this.x + this.w / 2 < block.x + block.w / 2) {
        this.x = block.x - this.w;
      } else {
        this.x = block.x + block.w;
      }
    }
  }

  shoot(game) {
    if (this.cooldown > 0 || this.burstShotsRemaining > 0) return;

    const weapon = WEAPONS[this.weaponKey];
    if (!game.hasAmmo(this, weapon.burstCount)) return;
    if (weapon.burstCount > 1) {
      this.burstShotsRemaining = weapon.burstCount;
      this.fireBurstShot(game);
      return;
    }

    this.fireBullet(game, weapon);
    this.cooldown = weapon.cooldown;
  }

  fireBurstShot(game) {
    const weapon = WEAPONS[this.weaponKey];
    if (!game.consumeAmmo(this)) {
      this.burstShotsRemaining = 0;
      this.cooldown = weapon.cooldown;
      return;
    }

    this.fireBullet(game, weapon);
    this.burstShotsRemaining -= 1;
    this.burstTimer = weapon.burstInterval;
    if (this.burstShotsRemaining === 0) {
      this.cooldown = weapon.cooldown;
      game.handleAmmoDepleted(this);
    }
  }

  fireBullet(game, weapon) {
    if (weapon.burstCount === 1 && !game.consumeAmmo(this)) return;

    const aimingDown = game.input.isDown(this.down) && !this.grounded;
    const dir = this.aim;
    game.bullets.push(
      new Bullet({
        owner: this.id,
        x: aimingDown ? this.x + this.w / 2 - 3 : dir > 0 ? this.x + this.w : this.x - 18,
        y: aimingDown ? this.y + this.h : this.y + this.h * 0.36,
        w: aimingDown ? 6 : 18,
        h: aimingDown ? 18 : 6,
        vx: aimingDown ? 0 : dir * weapon.bulletSpeed,
        vy: aimingDown ? weapon.bulletSpeed : 0,
        damage: weapon.damage,
        shockwave: weapon.shockwave,
        color: this.color,
      }),
    );
    if (weapon.burstCount === 1) game.handleAmmoDepleted(this);
  }

  setWeapon(weaponKey) {
    if (!WEAPONS[weaponKey]) return;

    if (this.weaponKey !== weaponKey) this.weaponHeldTime = 0;
    this.weaponKey = weaponKey;
    this.ammo = WEAPONS[weaponKey].ammo;
    this.cooldown = 0;
    this.burstShotsRemaining = 0;
    this.burstTimer = 0;
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  damage(game) {
    if (game.isPlayerInvincible()) {
      this.vy = -360;
      game.addBurst(this.x + this.w / 2, this.y + this.h / 2, this.color, 18);
      return;
    }

    this.hp -= 1;
    this.alive = this.hp > 0;
    this.vy = -360;
    game.addBurst(this.x + this.w / 2, this.y + this.h / 2, this.color, 18);
    if (!this.alive) this.respawnTimer = 1.2;
  }

  respawn(game) {
    this.x = this.spawnX - 15;
    this.y = FLOOR - this.h;
    this.previousY = this.y;
    this.vx = 0;
    this.vy = 0;
    this.hp = this.maxHp;
    this.cooldown = 0;
    this.burstShotsRemaining = 0;
    this.burstTimer = 0;
    this.weaponHeldTime = 0;
    this.grounded = true;
    this.alive = true;
    game.addBurst(this.x + this.w / 2, this.y + this.h / 2, this.color, 16);
  }

  draw(ctx, input) {
    ctx.save();
    ctx.globalAlpha = this.alive ? 1 : 0.35;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.fillStyle = "#11151c";
    ctx.fillRect(this.x + 11, this.y - 10, 8, 13);
    ctx.fillStyle = "#eef3f8";
    if (input.isDown(this.down) && !this.grounded) {
      ctx.fillRect(this.x + 12, this.y + this.h, 6, 12);
    } else if (this.aim > 0) {
      ctx.fillRect(this.x + this.w, this.y + 13, 12, 6);
    } else {
      ctx.fillRect(this.x - 12, this.y + 13, 12, 6);
    }

    for (let i = 0; i < this.hp; i += 1) {
      ctx.fillStyle = "#ff6b6b";
      ctx.fillRect(this.x + i * 9, this.y + this.h + 7, 7, 7);
    }
    ctx.restore();
  }
}

export class Block {
  constructor(col, level, classKey = "normal") {
    const blockClass = BLOCK_CLASSES[classKey] ?? BLOCK_CLASSES.normal;
    const hp = 2 + Math.floor(level / 4) + blockClass.hpBonus;
    this.col = col;
    this.classKey = classKey;
    this.blockClass = blockClass;
    this.x = ARENA_LEFT + col * BLOCK_SIZE;
    this.y = -BLOCK_SIZE;
    this.w = BLOCK_SIZE;
    this.h = BLOCK_SIZE;
    this.hp = hp;
    this.maxHp = hp;
    this.previousY = this.y;
    this.vy = 28 + level * 4;
    this.ay = 380 + level * 34;
    this.maxVy = 430 + level * 42;
    this.settled = false;
    this.color = blockClass.color;
  }

  update(dt, game) {
    if (this.settled || this.hp <= 0) return;

    this.previousY = this.y;
    this.vy = Math.min(this.maxVy, this.vy + this.ay * dt);
    this.y += this.vy * dt;

    const landingY = game.landingYForColumn(this.col, this);
    if (this.y >= landingY) {
      this.y = landingY;
      this.vy = 0;
      this.settled = true;
      game.addBurst(this.x + BLOCK_SIZE / 2, this.y + BLOCK_SIZE, this.color, 8);

      if (!game.isSandbox() && this.y < 80) game.gameOver = true;
    }

    for (const player of game.players) {
      if (!player.alive || !rectsOverlap(player, this)) continue;

      if (this.hitPlayerFromAbove(player)) {
        player.damage(game);
        this.hp = 0;
      } else {
        this.pushPlayerAside(player);
      }
    }
  }

  hitPlayerFromAbove(player) {
    const previousBottom = this.previousY + this.h;
    const horizontalOverlap = this.x < player.x + player.w - 4 && this.x + this.w > player.x + 4;

    return horizontalOverlap && previousBottom <= player.y + 6 && this.y + this.h >= player.y;
  }

  pushPlayerAside(player) {
    if (player.x + player.w / 2 < this.x + this.w / 2) {
      player.x = this.x - player.w;
    } else {
      player.x = this.x + this.w;
    }

    player.x = clamp(player.x, ARENA_LEFT, ARENA_RIGHT - player.w);
    player.vx = 0;
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.strokeStyle = this.settled ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.72)";
    ctx.lineWidth = this.settled ? 2 : 3;
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.strokeRect(this.x, this.y, this.w, this.h);

    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect(this.x + 8, this.y + 8, this.w - 16, 6);
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    ctx.font = "800 18px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(this.blockClass.name[0], this.x + this.w / 2, this.y + this.h / 2 + 7);
    ctx.textAlign = "left";

    const cracks = this.maxHp - this.hp;
    ctx.strokeStyle = "rgba(0,0,0,0.38)";
    for (let i = 0; i < cracks; i += 1) {
      const px = this.x + ((i + 1) * this.w) / (cracks + 2);
      ctx.beginPath();
      ctx.moveTo(px, this.y + 10);
      ctx.lineTo(px + 12, this.y + this.h - 8);
      ctx.stroke();
    }
    ctx.restore();
  }
}

export class Pickup {
  constructor(config) {
    Object.assign(this, config);
    this.w = 28;
    this.h = 28;
    this.vy = -90;
    this.floorLife = PICKUP_FLOOR_TIMEOUT;
    this.stack = this.stack ?? 1;
    this.previousY = this.y;
    this.grounded = false;
  }

  update(dt, solidBlocks = []) {
    this.previousY = this.y;
    this.grounded = false;
    this.vy = Math.min(420, this.vy + 760 * dt);
    this.y += this.vy * dt;
    this.resolveLanding(solidBlocks);
    if (this.grounded && Math.abs(this.y + this.h - FLOOR) < 0.5) {
      this.floorLife -= dt;
    }
  }

  resolveLanding(solidBlocks) {
    let landingY = this.y;
    let landed = false;

    if (this.y + this.h >= FLOOR) {
      landingY = FLOOR - this.h;
      landed = true;
    }

    for (const block of solidBlocks) {
      const overlapsX = this.x < block.x + block.w && this.x + this.w > block.x;
      const crossedTop = this.previousY + this.h <= block.y + 4 && this.y + this.h >= block.y;
      if (!overlapsX || !crossedTop) continue;

      landingY = landed ? Math.min(landingY, block.y - this.h) : block.y - this.h;
      landed = true;
    }

    if (!landed) return;

    this.y = landingY;
    this.vy = 0;
    this.grounded = true;
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 2;
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.strokeRect(this.x, this.y, this.w, this.h);
    ctx.fillStyle = "#10131a";
    ctx.font = "800 16px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(this.label, this.x + this.w / 2, this.y + 20);
    if (this.stack > 1) {
      ctx.fillStyle = "#10131a";
      ctx.fillRect(this.x + this.w - 15, this.y - 6, 22, 14);
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.strokeRect(this.x + this.w - 15, this.y - 6, 22, 14);
      ctx.fillStyle = "#eef3f8";
      ctx.font = "800 10px system-ui, sans-serif";
      ctx.fillText(`x${this.stack}`, this.x + this.w - 4, this.y + 5);
    }
    ctx.restore();
  }
}

export class Bullet {
  constructor(config) {
    Object.assign(this, config);
    this.dead = false;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  isInBounds() {
    return this.x + this.w > ARENA_LEFT && this.x < ARENA_RIGHT && this.y + this.h > 0 && this.y < FLOOR;
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.w, this.h);
  }
}

export class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 180;
    this.vy = (Math.random() - 0.75) * 180;
    this.life = 0.35 + Math.random() * 0.25;
    this.color = color;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += 260 * dt;
    this.life -= dt;
  }

  draw(ctx) {
    ctx.globalAlpha = clamp(this.life * 2.5, 0, 1);
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, 4, 4);
    ctx.globalAlpha = 1;
  }
}
