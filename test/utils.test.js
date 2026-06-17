import assert from "node:assert/strict";
import test from "node:test";

import { rectsOverlap } from "../src/utils.js";

test("rectsOverlap detects intersecting rectangles", () => {
  assert.equal(
    rectsOverlap(
      { x: 10, y: 10, w: 20, h: 20 },
      { x: 25, y: 25, w: 20, h: 20 },
    ),
    true,
  );
});

test("rectsOverlap treats touching edges as non-overlap", () => {
  assert.equal(
    rectsOverlap(
      { x: 0, y: 0, w: 10, h: 10 },
      { x: 10, y: 0, w: 10, h: 10 },
    ),
    false,
  );
});
