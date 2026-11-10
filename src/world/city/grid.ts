// Base ground: land raster, per-landmass street grid, parks, plazas and the coast sidewalk ring.
import { CELL, LAND, MANHATTAN_SPLIT_Y, PARKS, PROMENADES, RAIL_YARDS, SQUARES, HUNTS_POINT_MARKET, JFK_APRON, AREA_IDS } from '../cityData.ts';
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

/** A run of rows laid out with its own seed: bands never cross a sector edge, so each Manhattan district can be tuned alone. */
interface Sector { from: number; to: number; seed: number; depths: number[]; plan?: SectorPlan }
/** An explicit street plan for a short district: [cross street width, building rows] per band, and where the one inner avenue goes (0..1 across the strip, null for none). */
export interface SectorPlan { bands: [number, number][]; avenue?: number | null; avSeed?: number }
/** Hand-fitted plans, by seed slot (Uptown 0, Midtown 1, Lower Manhattan 2, Bronx 3, Queens and Brooklyn 4, Staten Island 5); a slot with no plan is laid out from its seed. */
export const SECTOR_PLANS: (SectorPlan | undefined)[] = [
  { bands: [[4, 8], [2, 8], [2, 8], [2, 8]], avenue: 0.9 },
  { bands: [[2, 10], [2, 3]], avenue: 0.7 },
  { bands: [[2, 7], [2, 8], [2, 8]], avenue: 0.8 },
  { bands: [[3, 8], [2, 8], [2, 6], [2, 3], [2, 8]], avSeed: 95 },
  { bands: [[2, 4], [3, 7], [2, 6], [2, 5], [2, 8], [2, 6], [2, 8], [2, 6]], avSeed: 105 },
  { bands: [[4, 8], [2, 8]], avSeed: 334 },
];
interface Band { ay: number; by0: number; by1: number; sy: number; lo: number; hi: number; roads: { x: number; rw: number }[] }

/**
 * Cross streets (2 cells, 3 every few) between bands of [alley][building rows][sidewalk], then per band the vertical
 * roads: none to two across Manhattan's strip, one every 22 to 30 cells elsewhere, so building rows run long.
 * Seed independent, so racket lots stay valid for every city seed.
 */
function layoutBands(sectors: Sector[], strip: boolean, avenueSeed: number, landId: Uint8Array, ids: number[], c0: number, c1: number): { bands: Band[]; roadRow: Uint8Array } {
  const roadRow = new Uint8Array(ROWS);
  const bands: Band[] = [];
  const arng = mulberry32(sectors[0].plan?.avSeed ?? avenueSeed);
  const avenues: { x: number; rw: number }[] = [];
  if (!strip) {
    // An avenue (3 cells) or a side street (2 cells) every 14 to 22 columns, straight through every band.
    let x = c0 + 6 + Math.floor(arng() * 8), k = 0;
    while (x < c1 - 6) { avenues.push({ x, rw: k % 2 === 0 ? 3 : 2 }); k++; x += 14 + Math.floor(arng() * 9); }
  }
  for (const sec of sectors) {
    const rng = mulberry32(sec.seed);
    if (sec.plan) {
      let y = sec.from;
      for (const [rh, hb] of sec.plan.bands) {
        for (let i = 0; i < rh; i++) roadRow[y + i] = 1;
        y += rh;
        const band: Band = { ay: y, by0: y + 1, by1: y + 1 + hb, sy: y + 1 + hb, lo: COLS, hi: -1, roads: [] };
        for (let cy = band.by0; cy < band.by1; cy++) for (let cx = 0; cx < COLS; cx++) {
          if (ids.includes(landId[cy * COLS + cx])) { band.lo = Math.min(band.lo, cx); band.hi = Math.max(band.hi, cx); }
        }
        if (band.hi >= 0) {
          const span = band.hi - band.lo + 1;
          if (typeof sec.plan.avenue === 'number') band.roads.push({ x: band.lo + Math.round(span * sec.plan.avenue) - 1, rw: span >= 17 ? 3 : 2 });
          else if (sec.plan.avenue === undefined && !strip) for (const v of avenues) if (v.x - band.lo >= 6 && band.hi - (v.x + v.rw) >= 6) band.roads.push(v);
          bands.push(band);
        }
        y += hb + 2;
      }
      for (let r = y; r < sec.to; r++) roadRow[r] = 1;
      continue;
    }
    let y = Math.max(0, sec.from + Math.floor(rng() * 2));
    let every = 5 + Math.floor(rng() * 3), n = 0;
    while (y < Math.min(ROWS, sec.to)) {
      const rh = n % every === every - 1 ? 3 : 2;
      n++;
      if (n % every === 0) every = 5 + Math.floor(rng() * 3);
      for (let i = 0; i < rh && y + i < sec.to; i++) roadRow[y + i] = 1;
      y += rh;
      let hb = Math.min(sec.depths[Math.floor(rng() * sec.depths.length)], sec.to - y - 2);
      if (sec.to - (y + hb + 2) < 7) hb = Math.min(8, sec.to - y - 2); // no room for another band: use the rows here
      if (hb < 3) { for (let r = y; r < sec.to && r < ROWS; r++) roadRow[r] = 1; break; }
      const band: Band = { ay: y, by0: y + 1, by1: y + 1 + hb, sy: y + 1 + hb, lo: COLS, hi: -1, roads: [] };
      for (let cy = band.by0; cy < band.by1 && cy < ROWS; cy++) for (let cx = 0; cx < COLS; cx++) {
        if (ids.includes(landId[cy * COLS + cx])) { band.lo = Math.min(band.lo, cx); band.hi = Math.max(band.hi, cx); }
      }
      if (band.hi >= 0) {
        const span = band.hi - band.lo + 1;
        if (strip) {
          const inner = span <= 21 ? 0 : span <= 30 ? 1 : 2;
          for (let i = 1; i <= inner; i++) band.roads.push({ x: band.lo + Math.round((span * i) / (inner + 1)) - 1, rw: i === 1 ? 3 : 2 });
        } else {
          for (const v of avenues) if (v.x - band.lo >= 6 && band.hi - (v.x + v.rw) >= 6) band.roads.push(v);
        }
        bands.push(band);
      }
      y += hb + 2;
    }
  }
  return { bands, roadRow };
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

/** Street-grid seeds: Uptown, Midtown, Lower Manhattan, the Bronx, Queens plus Brooklyn, Staten Island. Fixed so racket lots stay valid for every city seed. */
export const GROUP_SEEDS: number[] = [1, 1, 1, 5, 1, 45];

export function buildBase(seeds: number[] = GROUP_SEEDS): Base {
  const landId = rasterLand();
  const kinds = new Uint8Array(COLS * ROWS);
  const areaIdx = new Uint8Array(COLS * ROWS).fill(255);
  const blocks: Block[] = [];
  const LANDS: number[] = [LandId.MANHATTAN, LandId.BRONX, LandId.QUEENS, LandId.BROOKLYN, LandId.STATEN];

  // Landmass groups sharing one street grid (Queens and Brooklyn are one landmass).
  const groups: { ids: number[] }[] = [
    { ids: [LandId.MANHATTAN] }, { ids: [LandId.BRONX] }, { ids: [LandId.QUEENS, LandId.BROOKLYN] }, { ids: [LandId.STATEN] },
  ];
  const wide = [5, 6, 6], shallow = [4, 4, 5];
  for (let gi = 0; gi < groups.length; gi++) {
    const g = groups[gi];
    let c0 = COLS, c1 = 0, r0 = ROWS, r1 = 0;
    for (let cy = 0; cy < ROWS; cy++) for (let cx = 0; cx < COLS; cx++) {
      if (g.ids.includes(landId[cy * COLS + cx])) { c0 = Math.min(c0, cx); c1 = Math.max(c1, cx); r0 = Math.min(r0, cy); r1 = Math.max(r1, cy); }
    }
    const lo = Math.max(0, r0 - 4), hi = Math.min(ROWS, r1 + 10);
    const sectors: Sector[] = gi === 0
      ? [{ from: lo, to: 56, seed: seeds[0], depths: shallow, plan: SECTOR_PLANS[0] }, { from: 56, to: 77, seed: seeds[1], depths: shallow, plan: SECTOR_PLANS[1] }, { from: 77, to: hi, seed: seeds[2], depths: wide, plan: SECTOR_PLANS[2] }]
      : [{ from: lo, to: hi, seed: seeds[gi + 2], depths: gi === 3 ? [7, 8, 8] : [5, 5, 6, 6], plan: SECTOR_PLANS[gi + 2] }];
    const { bands, roadRow } = layoutBands(sectors, gi === 0, 7000 + gi, landId, g.ids, c0, c1);
    const bandOf = new Int16Array(ROWS).fill(-1);
    bands.forEach((bd, bi) => { for (let cy = bd.ay; cy <= bd.sy && cy < ROWS; cy++) bandOf[cy] = bi; });
    for (let cy = r0; cy <= r1; cy++) {
      const bd = bandOf[cy] >= 0 ? bands[bandOf[cy]] : null;
      for (let cx = c0; cx <= c1; cx++) {
        const i = cy * COLS + cx;
        if (!g.ids.includes(landId[i])) continue;
        let k: number = K.ROAD;
        if (!roadRow[cy] && bd) {
          const rd = bd.roads.find((q) => cx >= q.x - 1 && cx <= q.x + q.rw);
          if (rd) k = cx === rd.x - 1 || cx === rd.x + rd.rw ? K.SIDEWALK : K.ROAD;
          else k = cy === bd.ay ? K.ALLEY : cy === bd.sy ? K.SIDEWALK : K.BUILDING;
        }
        kinds[i] = k;
      }
    }
    for (const bd of bands) {
      // interior pieces between the vertical roads
      let x0 = bd.lo;
      const cuts = bd.roads.map((q) => [q.x - 1, q.x + q.rw + 1] as [number, number]);
      cuts.push([bd.hi + 1, bd.hi + 1]);
      for (const [from, to] of cuts) {
        if (from - x0 >= 2) blocks.push({ group: gi, x0, x1: from, ay: bd.ay, by0: bd.by0, by1: bd.by1, sy: bd.sy });
        x0 = to;
      }
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
  for (const q of SQUARES) fillRect(kinds, landId, q.rect, LANDS, paved, K.PLAZA);
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
  const promenadeId: Record<string, number> = { manhattan: LandId.MANHATTAN, bronx: LandId.BRONX, queens: LandId.QUEENS, brooklyn: LandId.BROOKLYN, staten_island: LandId.STATEN };
  for (const i of ring) {
    const y = Math.floor(i / COLS) * CELL + CELL / 2;
    const walk = PROMENADES.some((p) => promenadeId[p.landmass] === landId[i] && y >= p.yFrom && y <= p.yTo);
    kinds[i] = walk ? K.PLAZA : K.SIDEWALK;
  }

  return { landId, kinds, areaIdx, blocks };
}
