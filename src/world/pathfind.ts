// Flow-field pathfinding and the stuck rule. Pure module: no DOM, no React.
import { CELL } from './cityData.ts';
import { isWalkable, nearestWalkable } from './cityGen.ts';
import type { City } from './cityGen.ts';

/**
 * Walking distances (in 8-neighbour steps) from the target cell, for the (2r+1) x (2r+1) block of cells
 * centred on it. `dist` is indexed row-major from the block's top-left cell; -1 means not walkable or not reached.
 * `cx`, `cy` are the target cell's column and row in the city grid.
 */
export interface FlowField { cx: number; cy: number; radius: number; dist: Int16Array }

const NEIGH: ReadonlyArray<readonly [number, number]> = [
  [0, -1], [1, 0], [0, 1], [-1, 0], [1, -1], [1, 1], [-1, 1], [-1, -1],
];

function cellWalkable(city: City, col: number, row: number): boolean {
  return col >= 0 && row >= 0 && col < city.cols && row < city.rows && isWalkable(city, col * CELL + CELL / 2, row * CELL + CELL / 2);
}

/**
 * Breadth-first search over walkable cells within `radiusCells` (Chebyshev) of the target.
 * Diagonal steps are allowed only when both orthogonal cells are walkable, so paths never cut a building corner.
 * A target on a non-walkable cell starts from the nearest walkable cell instead. Cost: at most (2r+1)^2 cells.
 */
export function buildFlowField(city: City, targetX: number, targetY: number, radiusCells: number): FlowField {
  const radius = Math.max(1, Math.floor(radiusCells));
  const size = 2 * radius + 1;
  const dist = new Int16Array(size * size).fill(-1);
  let tx = targetX, ty = targetY;
  if (!isWalkable(city, tx, ty)) {
    const near = nearestWalkable(city, tx, ty, radius);
    if (near) { tx = near.x; ty = near.y; }
  }
  const cx = Math.min(city.cols - 1, Math.max(0, Math.floor(tx / CELL)));
  const cy = Math.min(city.rows - 1, Math.max(0, Math.floor(ty / CELL)));
  const field: FlowField = { cx, cy, radius, dist };
  if (!cellWalkable(city, cx, cy)) return field;
  const queue = new Int32Array(size * size);
  let head = 0, tail = 0;
  const start = radius * size + radius;
  dist[start] = 0;
  queue[tail++] = start;
  while (head < tail) {
    const i = queue[head++];
    const lx = i % size, ly = (i - lx) / size;
    const d = dist[i];
    const col = cx + lx - radius, row = cy + ly - radius;
    for (let n = 0; n < 8; n++) {
      const dx = NEIGH[n][0], dy = NEIGH[n][1];
      const nx = lx + dx, ny = ly + dy;
      if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
      const j = ny * size + nx;
      if (dist[j] !== -1) continue;
      if (!cellWalkable(city, col + dx, row + dy)) continue;
      if (dx !== 0 && dy !== 0 && (!cellWalkable(city, col + dx, row) || !cellWalkable(city, col, row + dy))) continue;
      dist[j] = d + 1;
      queue[tail++] = j;
    }
  }
  return field;
}

/**
 * Unit direction from (x, y) toward the centre of the lowest-distance neighbouring cell, or null when the point
 * is outside the field, in a cell the search did not reach, or already in the target cell (walk straight at it).
 */
export function flowDirection(field: FlowField, city: City, x: number, y: number): { dx: number; dy: number } | null {
  const size = 2 * field.radius + 1;
  const col = Math.floor(x / CELL), row = Math.floor(y / CELL);
  const lx = col - field.cx + field.radius, ly = row - field.cy + field.radius;
  if (lx < 0 || ly < 0 || lx >= size || ly >= size) return null;
  const here = field.dist[ly * size + lx];
  if (here <= 0) return null;
  let best = here, bdx = 0, bdy = 0, found = false;
  for (let n = 0; n < 8; n++) {
    const dx = NEIGH[n][0], dy = NEIGH[n][1];
    const nx = lx + dx, ny = ly + dy;
    if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
    const d = field.dist[ny * size + nx];
    if (d < 0 || d >= best) continue;
    if (dx !== 0 && dy !== 0) {
      // BFS only crossed this diagonal when both orthogonals were walkable, so re-check the same way.
      if (!cellWalkable(city, col + dx, row) || !cellWalkable(city, col, row + dy)) continue;
    }
    best = d; bdx = dx; bdy = dy; found = true;
  }
  if (!found) return null;
  const tx = (col + bdx) * CELL + CELL / 2 - x, ty = (row + bdy) * CELL + CELL / 2 - y;
  const len = Math.hypot(tx, ty);
  if (len < 1e-6) return { dx: bdx, dy: bdy };
  return { dx: tx / len, dy: ty / len };
}

export interface StuckTracker { lastX: number; lastY: number; still: number }

/** Seconds without progress before the stuck rule fires, and the distance that counts as progress. */
export const STUCK_SECONDS = 2;
export const STUCK_PROGRESS_PX = 6;

export function createStuckTracker(x: number, y: number): StuckTracker {
  return { lastX: x, lastY: y, still: 0 };
}

/**
 * Call once per frame. Returns true (and restarts the count) after STUCK_SECONDS in which the NPC, while `trying`
 * to move, never got STUCK_PROGRESS_PX away from where it started waiting. The caller then picks a new target.
 */
export function updateStuck(t: StuckTracker, x: number, y: number, dt: number, trying: boolean): boolean {
  if (!trying || Math.hypot(x - t.lastX, y - t.lastY) >= STUCK_PROGRESS_PX) {
    t.lastX = x; t.lastY = y; t.still = 0;
    return false;
  }
  t.still += dt;
  if (t.still >= STUCK_SECONDS - 1e-9) {
    t.still = 0; t.lastX = x; t.lastY = y;
    return true;
  }
  return false;
}

/**
 * A new walkable target for a stuck NPC: a random point within `radiusCells` of it, snapped to the nearest walkable
 * cell, never the cell it is standing in. Falls back to the nearest walkable cell to the NPC, or null if none.
 */
export function pickUnstuckTarget(city: City, x: number, y: number, rand: () => number, radiusCells = 8): { x: number; y: number } | null {
  const here = Math.floor(y / CELL) * city.cols + Math.floor(x / CELL);
  for (let attempt = 0; attempt < 12; attempt++) {
    const px = x + (rand() * 2 - 1) * radiusCells * CELL;
    const py = y + (rand() * 2 - 1) * radiusCells * CELL;
    const p = nearestWalkable(city, px, py, 4);
    if (!p) continue;
    if (Math.floor(p.y / CELL) * city.cols + Math.floor(p.x / CELL) === here) continue;
    return p;
  }
  return nearestWalkable(city, x, y, radiusCells);
}
