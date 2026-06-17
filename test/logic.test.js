import assert from "node:assert/strict";
import test from "node:test";

import { BLOCK_SIZE, FLOOR } from "../src/constants.js";
import {
  availableColumns,
  hasSettledSupport,
  landingYForColumn,
  releaseUnsupportedBlocks,
} from "../src/logic.js";

function settledBlock(col, y, overrides = {}) {
  return {
    col,
    y,
    settled: true,
    vy: 0,
    ...overrides,
  };
}

test("landingYForColumn lands on the floor when a column is empty", () => {
  assert.equal(landingYForColumn([], 0), FLOOR - BLOCK_SIZE);
});

test("landingYForColumn stacks above the highest settled block in a column", () => {
  const blocks = [
    settledBlock(2, FLOOR - BLOCK_SIZE),
    settledBlock(2, FLOOR - BLOCK_SIZE * 2),
    settledBlock(3, FLOOR - BLOCK_SIZE),
    settledBlock(2, FLOOR - BLOCK_SIZE * 3, { settled: false }),
  ];

  assert.equal(landingYForColumn(blocks, 2), FLOOR - BLOCK_SIZE * 3);
});

test("landingYForColumn can ignore the falling block being resolved", () => {
  const fallingBlock = settledBlock(1, FLOOR - BLOCK_SIZE * 2);
  const blocks = [settledBlock(1, FLOOR - BLOCK_SIZE), fallingBlock];

  assert.equal(landingYForColumn(blocks, 1, fallingBlock), FLOOR - BLOCK_SIZE * 2);
});

test("hasSettledSupport recognizes floor support", () => {
  const block = settledBlock(0, FLOOR - BLOCK_SIZE);

  assert.equal(hasSettledSupport([block], block), true);
});

test("hasSettledSupport recognizes direct support from a settled block below", () => {
  const lower = settledBlock(0, FLOOR - BLOCK_SIZE);
  const upper = settledBlock(0, FLOOR - BLOCK_SIZE * 2);

  assert.equal(hasSettledSupport([lower, upper], upper), true);
});

test("hasSettledSupport ignores blocks in other columns and unsettled blocks", () => {
  const upper = settledBlock(0, FLOOR - BLOCK_SIZE * 2);
  const otherColumn = settledBlock(1, FLOOR - BLOCK_SIZE);
  const fallingBelow = settledBlock(0, FLOOR - BLOCK_SIZE, { settled: false });

  assert.equal(hasSettledSupport([upper, otherColumn, fallingBelow], upper), false);
});

test("releaseUnsupportedBlocks releases an unsupported stack from the bottom up", () => {
  const middle = settledBlock(0, FLOOR - BLOCK_SIZE * 2, { vy: 10 });
  const top = settledBlock(0, FLOOR - BLOCK_SIZE * 3, { vy: 20 });

  const released = releaseUnsupportedBlocks([middle, top]);

  assert.deepEqual(released, [middle, top]);
  assert.equal(middle.settled, false);
  assert.equal(top.settled, false);
  assert.equal(middle.vy, 70);
  assert.equal(top.vy, 70);
});

test("releaseUnsupportedBlocks keeps fully supported stacks settled", () => {
  const lower = settledBlock(0, FLOOR - BLOCK_SIZE);
  const upper = settledBlock(0, FLOOR - BLOCK_SIZE * 2);

  const released = releaseUnsupportedBlocks([lower, upper]);

  assert.deepEqual(released, []);
  assert.equal(lower.settled, true);
  assert.equal(upper.settled, true);
});

test("availableColumns excludes full columns", () => {
  const blocks = [];
  for (let row = 0; landingYForColumn(blocks, 0) >= 0; row += 1) {
    blocks.push(settledBlock(0, FLOOR - BLOCK_SIZE * (row + 1)));
  }

  assert.deepEqual(availableColumns(blocks).includes(0), false);
  assert.equal(availableColumns(blocks).includes(1), true);
});
