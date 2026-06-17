import { BLOCK_SIZE, COLS, FLOOR } from "./constants.js";

export function landingYForColumn(blocks, col, ignoreBlock = null, blockSize = BLOCK_SIZE, floor = FLOOR) {
  let landingY = floor - blockSize;

  for (const block of blocks) {
    if (block === ignoreBlock || !block.settled || block.col !== col) continue;
    landingY = Math.min(landingY, block.y - blockSize);
  }

  return landingY;
}

export function hasSettledSupport(blocks, block, blockSize = BLOCK_SIZE, floor = FLOOR) {
  if (Math.abs(block.y - (floor - blockSize)) < 0.5) return true;

  return blocks.some(
    (other) =>
      other !== block &&
      other.settled &&
      other.col === block.col &&
      Math.abs(other.y - (block.y + blockSize)) < 0.5,
  );
}

export function releaseUnsupportedBlocks(blocks, minFallVelocity = 70) {
  const released = [];
  let changed = true;

  while (changed) {
    changed = false;

    for (const block of blocks) {
      if (!block.settled || hasSettledSupport(blocks, block)) continue;

      block.settled = false;
      block.vy = Math.max(block.vy, minFallVelocity);
      released.push(block);
      changed = true;
    }
  }

  return released;
}

export function isColumnFull(blocks, col) {
  return landingYForColumn(blocks, col) < 0;
}

export function availableColumns(blocks, cols = COLS) {
  const columns = [];

  for (let col = 0; col < cols; col += 1) {
    if (!isColumnFull(blocks, col)) columns.push(col);
  }

  return columns;
}
