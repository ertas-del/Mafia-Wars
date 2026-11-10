// Ground stage two: ferry pads, bridge spans and their land ramps, piers. Everything here is seed independent.
import { BRIDGES, CELL, FERRY_TERMINALS, PIER_SPECS } from '../cityData.ts';
import type { Pt } from '../cityData.ts';
import { buildBase, LandId } from './grid.ts';
import type { Base } from './grid.ts';
import { CellKind as K, COLS, ROWS } from './kinds.ts';

export interface Ground extends Base {
  /** Indices of the George Washington Bridge span cells. */
  gwbCells: number[];
}

const inb = (cx: number, cy: number): boolean => cx >= 0 && cy >= 0 && cx < COLS && cy < ROWS;
const isLandId = (l: number): boolean => l >= LandId.MANHATTAN && l <= LandId.RANDALLS;

function samplePath(pts: Pt[], open: boolean): { path: Pt[]; i0: number; i1: number } {
  const STEP = 12, EXT = 700;
  const out: Pt[] = [];
  // Open bridges are extended past both ends so the ramp can reach the street grid.
  if (open) {
    const a = pts[0], c = pts[1];
    const len = Math.hypot(c.x - a.x, c.y - a.y);
    const ux = (a.x - c.x) / len, uy = (a.y - c.y) / len;
    for (let d = EXT; d > 0; d -= STEP) out.push({ x: a.x + ux * d, y: a.y + uy * d });
  }
  const i0 = out.length;
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i], c = pts[i + 1];
    const n = Math.max(1, Math.round(Math.hypot(c.x - a.x, c.y - a.y) / STEP));
    for (let k = 0; k < n; k++) out.push({ x: a.x + ((c.x - a.x) * k) / n, y: a.y + ((c.y - a.y) * k) / n });
  }
  out.push(pts[pts.length - 1]);
  const i1 = out.length - 1;
  if (open) {
    const a = pts[pts.length - 1], c = pts[pts.length - 2];
    const len = Math.hypot(a.x - c.x, a.y - c.y);
    const ux = (a.x - c.x) / len, uy = (a.y - c.y) / len;
    for (let d = STEP; d <= EXT; d += STEP) out.push({ x: a.x + ux * d, y: a.y + uy * d });
  }
  return { path: out, i0, i1 };
}

export function buildGround(seeds?: number[]): Ground {
  const base = buildBase(seeds);
  const { landId, kinds, areaIdx } = base;
  const gwbCells: number[] = [];

  // Ferry pads: 5x5 of pier over water, 3x3 over land, sidewalk around the land part.
  for (const t of [FERRY_TERMINALS.battery, FERRY_TERMINALS.stGeorge]) {
    const tx = Math.floor(t.x / CELL), ty = Math.floor(t.y / CELL);
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const cx = tx + dx, cy = ty + dy;
      if (!inb(cx, cy)) continue;
      const i = cy * COLS + cx;
      if (landId[i] === LandId.NONE) { kinds[i] = K.PIER; areaIdx[i] = 255; }
      else if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1 && isLandId(landId[i])) { kinds[i] = K.PIER; areaIdx[i] = 255; }
    }
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
      const cx = tx + dx, cy = ty + dy;
      if (!inb(cx, cy)) continue;
      const i = cy * COLS + cx;
      if (isLandId(landId[i]) && kinds[i] === K.BUILDING) kinds[i] = K.SIDEWALK;
    }
  }

  // Randall's Island: a small road junction where the three Triborough arms meet.
  {
    const cx0 = Math.floor(2968 / CELL), cy0 = Math.floor(1568 / CELL);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) kinds[(cy0 + dy) * COLS + cx0 + dx] = K.ROAD;
  }

  // Bridges.
  for (const b of BRIDGES) {
    const snap = kinds.slice();
    const { path, i0, i1 } = samplePath(b.points, b.open);
    const cellOf = (p: Pt): number => {
      const cx = Math.floor(p.x / CELL), cy = Math.floor(p.y / CELL);
      return inb(cx, cy) ? cy * COLS + cx : -1;
    };
    let first = -1, last = -1;
    for (let s = i0; s <= i1; s++) {
      const c = cellOf(path[s]);
      if (c >= 0 && landId[c] === LandId.NONE) { if (first < 0) first = s; last = s; }
    }
    if (first < 0) continue;
    const stamp = (c: number, water: boolean, land: boolean): void => {
      const cx0 = c % COLS, cy0 = (c - cx0) / COLS;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const cx = cx0 + dx, cy = cy0 + dy;
        if (!inb(cx, cy)) continue;
        const i = cy * COLS + cx;
        if (landId[i] === LandId.NONE) { if (water) { kinds[i] = K.BRIDGE; if (!b.open) gwbCells.push(i); } }
        else if (land && isLandId(landId[i])) kinds[i] = K.ROAD;
      }
    };
    for (let s = first; s <= last; s++) {
      const c = cellOf(path[s]);
      if (c < 0) continue;
      stamp(c, true, landId[c] !== LandId.NONE && b.open);
    }
    if (!b.open) continue;
    // Past the spans: keep bridging any remaining water, then ramp over land until a street is reached.
    const walk = (from: number, step: number): void => {
      let reaches = false;
      for (let s = from; s >= 0 && s < path.length; s += step) {
        const c = cellOf(path[s]);
        if (c < 0 || (landId[c] !== LandId.NONE && !isLandId(landId[c]))) break;
        if (landId[c] !== LandId.NONE) { reaches = true; break; }
      }
      if (!reaches) return;
      for (let s = from; s >= 0 && s < path.length; s += step) {
        const c = cellOf(path[s]);
        if (c < 0) break;
        if (landId[c] === LandId.NONE) { stamp(c, true, false); continue; }
        const done = snap[c] === K.ROAD;
        stamp(c, true, true);
        if (done) break;
      }
    };
    walk(first - 1, -1);
    walk(last + 1, 1);
  }

  // Piers.
  for (const spec of PIER_SPECS) {
    const lid = spec.landmass === 'manhattan' ? LandId.MANHATTAN : LandId.BROOKLYN;
    for (let y = spec.yFrom; y <= spec.yTo; y += spec.step) {
      const r0 = Math.floor(y / CELL);
      for (let r = r0; r < r0 + spec.thick; r++) {
        let cx0 = -1;
        if (spec.side === 'W') { for (let cx = 0; cx < COLS; cx++) if (landId[r * COLS + cx] === lid) { cx0 = cx; break; } }
        else { for (let cx = COLS - 1; cx >= 0; cx--) if (landId[r * COLS + cx] === lid) { cx0 = cx; break; } }
        if (cx0 < 0) continue;
        for (let k = 1; k <= spec.len; k++) {
          const nx = spec.side === 'W' ? cx0 - k : cx0 + k;
          if (!inb(nx, r)) break;
          const i = r * COLS + nx;
          if (kinds[i] !== K.WATER) break;
          kinds[i] = K.PIER;
          areaIdx[i] = areaIdx[r * COLS + cx0];
        }
      }
    }
  }

  return { ...base, gwbCells };
}
