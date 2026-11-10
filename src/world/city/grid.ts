// Base ground: land raster, per-landmass street grid, parks, plazas and the coast sidewalk ring.
import { CELL, LAND, MANHATTAN_SPLIT_Y, PARKS, RAIL_YARDS, HUNTS_POINT_MARKET, JFK_APRON, AREA_IDS } from '../cityData.ts';
import type { Rect } from '../cityData.ts';
import { pointInPoly } from './geom.ts';
import { CellKind as K, COLS, ROWS } from './kinds.ts';
import { mulberry32 } from './rng.ts';

/** Land ids stored in Base.landId. */
export const LandId = { NONE: 0, MANHATTAN: 1, BRONX: 2, QUEENS: 3, BROOKLYN: 4, STATEN: 5, RANDALLS: 6, JERSEY: 7 } as const;

export interface Block {
  group: number;
  x0: number; x1: number; // interior columns [x0, x1)
  ay: number; // alley row
  by0: number; by1: number; // building rows [by0, by1)
  sy: number; // south sidewalk row
}

export interface Base {
  landId: Uint8Array;
  kinds: Uint8Array;
  areaIdx: Uint8Array;
  blocks: Block[];
}

const AREA_INDEX: Record<string, number> = {};
AREA_IDS.forEach((a, i) => { AREA_INDEX[a] = i; });

function areaIndexFor(landId: number, cy: number): number {
  switch (landId) {
    case LandId.MANHATTAN: {
      const y = cy * CELL + CELL / 2;
      return y < MANHATTAN_SPLIT_Y.uptownBelow ? AREA_INDEX.uptown : y < MANHATTAN_SPLIT_Y.midtownBelow ? AREA_INDEX.midtown_concrete : AREA_INDEX.manhattan_south;
    }
    case LandId.BRONX: return AREA_INDEX.bronx_terminal;
    case LandId.QUEENS: return AREA_INDEX.queens_cargo;
    case LandId.BROOKLYN: return AREA_INDEX.brooklyn_docks;
    case LandId.STATEN: return AREA_INDEX.staten_island;
    default: return 255;
  }
}

function rasterLand(): Uint8Array {
  const landId = new Uint8Array(COLS * ROWS);
  const polys: [number, typeof LAND.manhattan][] = [
    [LandId.JERSEY, LAND.new_jersey], [LandId.MANHATTAN, LAND.manhattan], [LandId.BRONX, LAND.bronx], [LandId.QUEENS, LAND.queens],
    [LandId.BROOKLYN, LAND.brooklyn], [LandId.STATEN, LAND.staten_island], [LandId.RANDALLS, LAND.randalls],
  ];
  for (let cy = 0; cy < ROWS; cy++) {
    for (let cx = 0; cx < COLS; cx++) {
      const x = cx * CELL + CELL / 2;
      const y = cy * CELL + CELL / 2;
      for (const [id, poly] of polys) {
        if (pointInPoly(x, y, poly)) { landId[cy * COLS + cx] = id; break; }
      }
    }
  }
  return landId;
}

// Axis roles
const X_SIDE = 1, X_ROAD = 2, X_INT = 3;
const Y_ROAD = 1, Y_ALLEY = 2, Y_BUILD = 3, Y_SIDE = 4;

interface Axes { xrole: Uint8Array; xblk: Int16Array; yrole: Uint8Array; yblk: Int16Array; xBlocks: [number, number][]; yBlocks: [number, number, number, number][] }

/** Lay out columns and rows of one landmass group. Seed independent so racket lots stay valid for every city seed. */
function layoutAxes(seed: number, c0: number, c1: number, r0: number, r1: number): Axes {
  const rng = mulberry32(seed);
  const xrole = new Uint8Array(COLS), yrole = new Uint8Array(ROWS);
  const xblk = new Int16Array(COLS).fill(-1), yblk = new Int16Array(ROWS).fill(-1);
  const xBlocks: [number, number][] = [];
  const yBlocks: [number, number, number, number][] = [];
  // columns: [side][road][side][interior]...
  let x = Math.max(0, c0 - 6 + Math.floor(rng() * 6));
  let every = 3 + Math.floor(rng() * 3), n = 0;
  while (x < Math.min(COLS, c1 + 12)) {
    const rw = n % every === every - 1 ? 3 : 2;
    n++;
    if (n % every === 0) every = 3 + Math.floor(rng() * 3);
    for (let i = 0; i < rw + 2 && x + i < COLS; i++) xrole[x + i] = i === 0 || i === rw + 1 ? X_SIDE : X_ROAD;
    x += rw + 2;
    const w = 6 + Math.floor(rng() * 5);
    const bi = xBlocks.length;
    xBlocks.push([x, Math.min(COLS, x + w)]);
    for (let i = 0; i < w && x + i < COLS; i++) { xrole[x + i] = X_INT; xblk[x + i] = bi; }
    x += w;
  }
  // rows: [road rows][alley][building rows][sidewalk]...
  let y = Math.max(0, r0 - 4 + Math.floor(rng() * 4));
  every = 3 + Math.floor(rng() * 3); n = 0;
  while (y < Math.min(ROWS, r1 + 10)) {
    const rh = n % every === every - 1 ? 3 : 2;
    n++;
    if (n % every === 0) every = 3 + Math.floor(rng() * 3);
    for (let i = 0; i < rh && y + i < ROWS; i++) yrole[y + i] = Y_ROAD;
    y += rh;
    const hb = 4 + Math.floor(rng() * 5);
    const bi = yBlocks.length;
    yBlocks.push([y, y + 1, y + 1 + hb, y + 1 + hb]);
    if (y < ROWS) { yrole[y] = Y_ALLEY; yblk[y] = bi; }
    for (let i = 0; i < hb && y + 1 + i < ROWS; i++) { yrole[y + 1 + i] = Y_BUILD; yblk[y + 1 + i] = bi; }
    if (y + 1 + hb < ROWS) { yrole[y + 1 + hb] = Y_SIDE; yblk[y + 1 + hb] = bi; }
    y += hb + 2;
  }
  return { xrole, xblk, yrole, yblk, xBlocks, yBlocks };
}

function fillRect(kinds: Uint8Array, landId: Uint8Array, r: Rect, ids: number[], from: number[], to: number): void {
  const c0 = Math.max(0, Math.floor(r.x / CELL)), c1 = Math.min(COLS - 1, Math.floor((r.x + r.w) / CELL));
  const r0 = Math.max(0, Math.floor(r.y / CELL)), r1 = Math.min(ROWS - 1, Math.floor((r.y + r.h) / CELL));
  for (let cy = r0; cy <= r1; cy++) {
    for (let cx = c0; cx <= c1; cx++) {
      const px = cx * CELL + CELL / 2, py = cy * CELL + CELL / 2;
      if (px < r.x || px > r.x + r.w || py < r.y || py > r.y + r.h) continue;
      const i = cy * COLS + cx;
      if (ids.includes(landId[i]) && from.includes(kinds[i])) kinds[i] = to;
    }
  }
}

/** Street-grid seeds per landmass group: Manhattan, Bronx, Queens plus Brooklyn, Staten Island. Fixed so racket lots stay valid for every city seed. */
export const GROUP_SEEDS: number[] = [2650, 252, 2252, 505];

export function buildBase(seeds: number[] = GROUP_SEEDS): Base {
  const landId = rasterLand();
  const kinds = new Uint8Array(COLS * ROWS);
  const areaIdx = new Uint8Array(COLS * ROWS).fill(255);
  const blocks: Block[] = [];
  const LANDS: number[] = [LandId.MANHATTAN, LandId.BRONX, LandId.QUEENS, LandId.BROOKLYN, LandId.STATEN];

  // Landmass groups sharing one street grid (Queens and Brooklyn are one landmass).
  const groups: { seed: number; ids: number[] }[] = [
    { seed: seeds[0], ids: [LandId.MANHATTAN] }, { seed: seeds[1], ids: [LandId.BRONX] },
    { seed: seeds[2], ids: [LandId.QUEENS, LandId.BROOKLYN] }, { seed: seeds[3], ids: [LandId.STATEN] },
  ];
  for (let gi = 0; gi < groups.length; gi++) {
    const g = groups[gi];
    let c0 = COLS, c1 = 0, r0 = ROWS, r1 = 0;
    for (let cy = 0; cy < ROWS; cy++) for (let cx = 0; cx < COLS; cx++) {
      if (g.ids.includes(landId[cy * COLS + cx])) { c0 = Math.min(c0, cx); c1 = Math.max(c1, cx); r0 = Math.min(r0, cy); r1 = Math.max(r1, cy); }
    }
    const ax = layoutAxes(g.seed, c0, c1, r0, r1);
    const used = new Set<string>();
    for (let cy = r0; cy <= r1; cy++) {
      for (let cx = c0; cx <= c1; cx++) {
        const i = cy * COLS + cx;
        if (!g.ids.includes(landId[i])) continue;
        const yr = ax.yrole[cy], xr = ax.xrole[cx];
        let k: number;
        if (yr === Y_ROAD) k = K.ROAD;
        else if (xr === X_ROAD) k = K.ROAD;
        else if (xr === X_SIDE) k = K.SIDEWALK;
        else if (yr === Y_ALLEY) k = K.ALLEY;
        else if (yr === Y_BUILD) k = K.BUILDING;
        else k = K.SIDEWALK;
        kinds[i] = k;
        if (xr === X_INT && ax.yblk[cy] >= 0) used.add(ax.xblk[cx] + ',' + ax.yblk[cy]);
      }
    }
    const keys = [...used].map((s) => s.split(',').map(Number) as [number, number]).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
    for (const [bx, by] of keys) {
      const xb = ax.xBlocks[bx], yb = ax.yBlocks[by];
      blocks.push({ group: gi, x0: xb[0], x1: xb[1], ay: yb[0], by0: yb[1], by1: yb[2], sy: yb[3] });
    }
  }

  for (let cy = 0; cy < ROWS; cy++) for (let cx = 0; cx < COLS; cx++) {
    const i = cy * COLS + cx;
    const l = landId[i];
    if (l === LandId.JERSEY) kinds[i] = K.OFFLIMITS;
    else if (l === LandId.RANDALLS) kinds[i] = K.PLAZA;
    else if (l === LandId.NONE) kinds[i] = K.WATER;
    areaIdx[i] = areaIndexFor(l, cy);
  }

  // Parks overwrite everything on land.
  for (const park of PARKS) {
    for (let cy = 0; cy < ROWS; cy++) for (let cx = 0; cx < COLS; cx++) {
      const i = cy * COLS + cx;
      if (!LANDS.includes(landId[i])) continue;
      if (pointInPoly(cx * CELL + CELL / 2, cy * CELL + CELL / 2, park.points)) kinds[i] = K.PARK;
    }
  }
  // Plazas keep the roads but pave everything else.
  const paved = [K.BUILDING, K.ALLEY, K.SIDEWALK];
  for (const y of RAIL_YARDS) fillRect(kinds, landId, y.rect, LANDS, paved, K.PLAZA);
  fillRect(kinds, landId, HUNTS_POINT_MARKET, LANDS, paved, K.PLAZA);
  for (const r of JFK_APRON) fillRect(kinds, landId, r, LANDS, paved, K.PLAZA);

  // Sidewalk ring along every coast (8-neighbour contact with water or New Jersey).
  const ring: number[] = [];
  for (let cy = 0; cy < ROWS; cy++) for (let cx = 0; cx < COLS; cx++) {
    const i = cy * COLS + cx;
    if (!LANDS.includes(landId[i]) || kinds[i] !== K.BUILDING) continue;
    let coast = false;
    for (let dy = -1; dy <= 1 && !coast; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) { coast = true; break; }
      const l = landId[ny * COLS + nx];
      if (l === LandId.NONE || l === LandId.JERSEY) { coast = true; break; }
    }
    if (coast) ring.push(i);
  }
  for (const i of ring) kinds[i] = K.SIDEWALK;

  return { landId, kinds, areaIdx, blocks };
}
