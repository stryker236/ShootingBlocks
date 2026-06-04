export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 720;
export const FLOOR = CANVAS_HEIGHT - 56;
export const COLS = 12;
export const BLOCK_SIZE = 64;
export const ARENA_LEFT = (CANVAS_WIDTH - COLS * BLOCK_SIZE) / 2;
export const ARENA_RIGHT = ARENA_LEFT + COLS * BLOCK_SIZE;
export const GRAVITY = 1450;

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
