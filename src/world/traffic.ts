// Lane traffic on ROAD and BRIDGE cells. Pure module: no DOM, no React.
import { CELL } from './cityData.ts';
import { CellKind, isDrivable } from './cityGen.ts';
import type { City } from './cityGen.ts';

/** dir: 0 north (y falls), 1 east (x rises), 2 south, 3 west. Traffic keeps right. */
export interface Car { x: number; y: number; dir: 0 | 1 | 2 | 3; speed: number; color: string; isPolice: boolean }

const DX = [0, 1, 0, -1];
const DY = [-1, 0, 1, 0];
/** Road runs wider than this many cells (measured across the direction of travel) count as a junction. */
const MAX_ROAD_CELLS = 5;
const SCAN_LIMIT = MAX_ROAD_CELLS + 2;
const LANE_EASE_PX_PER_S = 36;
const SAFE_GAP_PX = 34;
const MAX_SUBSTEP_PX = 8;
const CAR_COLORS = ['#b7410e', '#2f5d8a', '#c9b037', '#3b7a57', '#8a8a8a', '#6b3fa0', '#d8d2c4', '#222831'];
export const POLICE_COLOR = '#1d3b8f';

const drivableAtCell = (city: City, col: number, row: number): boolean => isDrivable(city, col * CELL + CELL / 2, row * CELL + CELL / 2);

/** Count contiguous drivable cells from (col,row) stepping (sx,sy), excluding the start cell, up to SCAN_LIMIT. */
function run(city: City, col: number, row: number, sx: number, sy: number): number {
  let n = 0;
  while (n < SCAN_LIMIT && drivableAtCell(city, col + sx * (n + 1), row + sy * (n + 1))) n++;
  return n;
}

/**
 * Width of the drivable strip across the direction of travel through the cell at (x, y).
 * Returns the strip's edges in pixels, or null at a junction (the cross road is longer than a road is wide).
 */
function laneSpan(city: City, x: number, y: number, dir: number): { lo: number; hi: number } | null {
  const col = Math.floor(x / CELL), row = Math.floor(y / CELL);
  const horizontal = dir === 0 || dir === 2; // travelling along y, so measure across x
  const neg = horizontal ? run(city, col, row, -1, 0) : run(city, col, row, 0, -1);
  const pos = horizontal ? run(city, col, row, 1, 0) : run(city, col, row, 0, 1);
  if (neg + 1 + pos > MAX_ROAD_CELLS) return null;
  const base = horizontal ? col : row;
  return { lo: (base - neg) * CELL, hi: (base + pos + 1) * CELL };
}

/** Right-hand lane centre across the strip for a direction of travel. */
function laneCentre(span: { lo: number; hi: number }, dir: number): number {
  const w = span.hi - span.lo;
  const rightIsPositive = dir === 0 || dir === 1;
  return span.lo + w * (rightIsPositive ? 0.75 : 0.25);
}

interface Lists { drivable: number[]; bridge: number[] }
const listCache = new WeakMap<City, Lists>();
function lists(city: City): Lists {
  let l = listCache.get(city);
  if (!l) {
    l = { drivable: [], bridge: [] };
    for (let i = 0; i < city.kinds.length; i++) {
      const k = city.kinds[i];
      if (k === CellKind.ROAD || k === CellKind.BRIDGE) l.drivable.push(i);
      if (k === CellKind.BRIDGE) l.bridge.push(i);
    }
    listCache.set(city, l);
  }
  return l;
}

/** Which way a plain (non-junction) road cell runs: 0 for north-south, 1 for east-west, null at junctions and blobs. */
function roadAxis(city: City, col: number, row: number): 0 | 1 | null {
  const across = run(city, col, row, -1, 0) + 1 + run(city, col, row, 1, 0); // width seen along x
  const down = run(city, col, row, 0, -1) + 1 + run(city, col, row, 0, 1);
  if (across > MAX_ROAD_CELLS && down > MAX_ROAD_CELLS) return null;
  if (down <= MAX_ROAD_CELLS && across > down) return 1;
  if (across <= MAX_ROAD_CELLS && down > across) return 0;
  return null;
}

/**
 * Place `count` cars on road lanes. A quarter of them start on bridges so crossings happen; one in ten is police.
 * Cars keep at least 48 px apart where possible. Fewer than `count` cars are returned only if the city has no usable road.
 */
export function spawnTraffic(city: City, count: number, rand: () => number): Car[] {
  const cars: Car[] = [];
  const l = lists(city);
  if (!l.drivable.length) return cars;
  const bridgeCars = l.bridge.length ? Math.floor(count / 4) : 0;
  for (let n = 0; n < count; n++) {
    const onBridge = n < bridgeCars;
    const pool = onBridge ? l.bridge : l.drivable;
    for (let attempt = 0; attempt < 60; attempt++) {
      const i = pool[Math.floor(rand() * pool.length)];
      const col = i % city.cols, row = Math.floor(i / city.cols);
      const axis = roadAxis(city, col, row);
      if (axis === null) continue;
      const dir = (axis === 0 ? (rand() < 0.5 ? 0 : 2) : (rand() < 0.5 ? 1 : 3)) as 0 | 1 | 2 | 3;
      const cx = col * CELL + CELL / 2, cy = row * CELL + CELL / 2;
      const span = laneSpan(city, cx, cy, dir);
      if (!span) continue;
      const lane = laneCentre(span, dir);
      const x = axis === 0 ? lane : cx, y = axis === 0 ? cy : lane;
      if (!isDrivable(city, x, y)) continue;
      if (cars.some((c) => Math.hypot(c.x - x, c.y - y) < 48)) continue;
      const isPolice = (n + 1) % 10 === 0;
      const base = 70 + rand() * 50;
      cars.push({
        x, y, dir,
        speed: isPolice ? base * 1.25 : base,
        color: isPolice ? POLICE_COLOR : CAR_COLORS[Math.floor(rand() * CAR_COLORS.length)],
        isPolice,
      });
      break;
    }
  }
  return cars;
}

/** Distance along `dir` from coordinate `a` to the next cell centre strictly ahead. */
function toNextCentre(a: number, dir: number): number {
  const forward = dir === 2 || dir === 1;
  if (forward) {
    const k = Math.floor(a / CELL - 0.5 + 1e-9) + 1;
    return (k + 0.5) * CELL - a;
  }
  const k = Math.ceil(a / CELL - 0.5 - 1e-9) - 1;
  return a - (k + 0.5) * CELL;
}

/** Choose a new direction at a cell centre. Returns the (possibly unchanged) direction. */
function decide(car: Car, city: City, rand: () => number): 0 | 1 | 2 | 3 {
  const dir = car.dir;
  const col = Math.floor(car.x / CELL), row = Math.floor(car.y / CELL);
  const open = (d: number, depth: number): boolean => {
    for (let s = 1; s <= depth; s++) if (!drivableAtCell(city, col + DX[d] * s, row + DY[d] * s)) return false;
    return true;
  };
  const left = ((dir + 3) % 4) as 0 | 1 | 2 | 3, right = ((dir + 1) % 4) as 0 | 1 | 2 | 3;
  const fwd = open(dir, 1);
  const junction = laneSpan(city, car.x, car.y, dir) === null;
  const options: number[] = [];
  if (fwd) options.push(dir, dir);
  if (junction || !fwd) {
    if (open(left, 2)) options.push(left);
    if (open(right, 2)) options.push(right);
  }
  if (!options.length) return ((dir + 2) % 4) as 0 | 1 | 2 | 3; // dead end: turn round
  if (options.length === 1) return options[0] as 0 | 1 | 2 | 3;
  return options[Math.floor(rand() * options.length)] as 0 | 1 | 2 | 3;
}

/** Advance every car by dt seconds. Cars only ever move into drivable cells; a car never leaves the road. */
export function stepTraffic(cars: Car[], city: City, dt: number, rand: () => number): void {
  for (let ci = 0; ci < cars.length; ci++) {
    const car = cars[ci];
    // Car following: wait behind a car ahead in the same lane.
    let blocked = false;
    for (let oi = 0; oi < cars.length && !blocked; oi++) {
      if (oi === ci) continue;
      const o = cars[oi];
      if (o.dir !== car.dir) continue;
      const ahead = (o.x - car.x) * DX[car.dir] + (o.y - car.y) * DY[car.dir];
      const side = Math.abs((o.x - car.x) * DY[car.dir]) + Math.abs((o.y - car.y) * DX[car.dir]);
      if (ahead > 0 && ahead < SAFE_GAP_PX && side < 14) blocked = true;
    }
    if (blocked) continue;
    let rem = car.speed * dt;
    let guard = 64;
    while (rem > 1e-9 && guard-- > 0) {
      const alongX = car.dir === 1 || car.dir === 3;
      const along = alongX ? car.x : car.y;
      const toCentre = toNextCentre(along, car.dir);
      const step = Math.min(rem, toCentre, MAX_SUBSTEP_PX);
      const px = car.x, py = car.y;
      car.x += DX[car.dir] * step;
      car.y += DY[car.dir] * step;
      rem -= step;
      // Ease sideways toward the right-hand lane where the strip is a plain road and the path stays drivable.
      const span = laneSpan(city, px, py, car.dir);
      if (span) {
        const target = laneCentre(span, car.dir);
        const lat = alongX ? car.y : car.x;
        const diff = target - lat;
        if (Math.abs(diff) > 1e-6) {
          const move = Math.sign(diff) * Math.min(Math.abs(diff), LANE_EASE_PX_PER_S * (step / Math.max(car.speed, 1)));
          const nl = lat + move;
          const a = alongX ? car.x : car.y;
          const nextAlong = a + (DX[car.dir] + DY[car.dir]) * toNextCentre(a, car.dir);
          const hereOk = alongX ? isDrivable(city, car.x, nl) : isDrivable(city, nl, car.y);
          const endOk = alongX ? isDrivable(city, nextAlong, nl) : isDrivable(city, nl, nextAlong);
          if (hereOk && endOk) { if (alongX) car.y = nl; else car.x = nl; }
        }
      }
      if (!isDrivable(city, car.x, car.y)) { // safety net, should not happen
        car.x = px; car.y = py;
        car.dir = ((car.dir + 2) % 4) as 0 | 1 | 2 | 3;
        break;
      }
      if (step >= toCentre - 1e-9) {
        // Land exactly on the cell centre line, then pick a direction.
        if (alongX) car.x = Math.round((car.x - CELL / 2) / CELL) * CELL + CELL / 2;
        else car.y = Math.round((car.y - CELL / 2) / CELL) * CELL + CELL / 2;
        // A turn needs no repositioning: the car is on the centre line, so its old along-axis centre becomes
        // its lateral coordinate and its old lane becomes its position along the new road.
        car.dir = decide(car, city, rand);
      }
    }
  }
}
