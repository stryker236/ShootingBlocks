export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 720;
export const FLOOR = CANVAS_HEIGHT - 56;
export const COLS = 12;
export const BLOCK_SIZE = 64;
export const ARENA_LEFT = (CANVAS_WIDTH - COLS * BLOCK_SIZE) / 2;
export const ARENA_RIGHT = ARENA_LEFT + COLS * BLOCK_SIZE;
export const GRAVITY = 1450;
export const MAX_ACTIVE_BLOCKS = 44;
export const PICKUP_FLOOR_TIMEOUT = 8;
export const PICKUP_CRUSH_DESTROY_CHANCE = 0.35;

export const WEAPONS = {
  default: {
    name: "Default",
    damage: 1,
    cooldown: 0.38,
    bulletSpeed: 620,
    burstCount: 1,
    burstInterval: 0,
    shockwave: false,
    ammo: Infinity,
  },
  peashooter: {
    name: "Peashooter",
    damage: 2,
    cooldown: 0.2,
    bulletSpeed: 720,
    burstCount: 1,
    burstInterval: 0,
    shockwave: false,
    ammo: 40,
  },
  burst: {
    name: "Burst Gun",
    damage: 1,
    cooldown: 0.58,
    bulletSpeed: 720,
    burstCount: 3,
    burstInterval: 0.055,
    shockwave: false,
    ammo: 24,
  },
  crusher: {
    name: "Crusher Cannon",
    damage: 3,
    cooldown: 0.95,
    bulletSpeed: 560,
    burstCount: 1,
    burstInterval: 0,
    shockwave: true,
    ammo: 8,
  },
};

export const WEAPON_ORDER = ["default", "peashooter", "burst", "crusher"];
export const DROPPABLE_WEAPONS = WEAPON_ORDER.filter((weaponKey) => weaponKey !== "default");

export const BLOCK_CLASSES = {
  normal: {
    name: "Normal",
    hpBonus: 0,
    color: "#5bbcff",
    drop: null,
    weight: 62,
    maxActive: 34,
  },
  weapon: {
    name: "Weapon",
    hpBonus: 0,
    color: "#54d5a7",
    drop: "weapon",
    weight: 14,
    maxActive: 4,
  },
  ammo: {
    name: "Ammo",
    hpBonus: 0,
    color: "#ffd166",
    drop: "ammo",
    ammoAmount: 12,
    weight: 14,
    maxActive: 5,
  },
  health: {
    name: "Health",
    hpBonus: 0,
    color: "#ff6b6b",
    drop: "health",
    healAmount: 1,
    weight: 10,
    maxActive: 4,
  },
};

export const BLOCK_CLASS_ORDER = ["normal", "weapon", "ammo", "health"];

export const PLAYER_TEMPLATES = [
  {
    id: 1,
    spawnX: ARENA_LEFT + BLOCK_SIZE * 4.5,
    color: "#54d5a7",
    left: "KeyA",
    right: "KeyD",
    jump: "KeyW",
    down: "KeyS",
    fire: "KeyF",
  },
  {
    id: 2,
    spawnX: ARENA_LEFT + BLOCK_SIZE * 7.5,
    color: "#ffd166",
    left: "ArrowLeft",
    right: "ArrowRight",
    jump: "ArrowUp",
    down: "ArrowDown",
    fire: "Slash",
  },
];
