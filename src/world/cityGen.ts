// Deterministic city generator: ground, bridges, unique buildings and signs, and the helpers the engine uses.
import { AREA_IDS, CELL, JFK_CARGO, RACKET_IDS, RACKET_INFO, RACKET_PLACEMENT, START_POINT } from './cityData.ts';
import type { AreaId, Pt } from './cityData.ts';
import { buildGround } from './city/ground.ts';
import type { Block } from './city/grid.ts';
import { CellKind, COLS, ROWS } from './city/kinds.ts';
import { makeSign, STOREFRONTS, STYLE_SETS } from './city/names.ts';
import { mulberry32 } from './city/rng.ts';

export { CellKind } from './city/kinds.ts';
export { mulberry32 } from './city/rng.ts';
export { STYLE_SETS } from './city/names.ts';

export interface Building { id: number; cx: number; cy: number; cw: number; ch: number; area: AreaId | null; style: string; palette: number; windows: number; storefront: string; roof: number; sign: string; racketId?: string }
export interface City { seed: number; cols: number; rows: number; kinds: Uint8Array; buildingAt: Int32Array; areaAt: Uint8Array; buildings: Building[]; lamps: Pt[] }

const K = CellKind;
const WALKABLE = new Uint8Array(16);
for (const k of [K.ROAD, K.SIDEWALK, K.ALLEY, K.PARK, K.PIER, K.PLAZA, K.BRIDGE]) WALKABLE[k] = 1;

/** What makes two buildings look the same: every discrete choice, never position or id. */
export function signatureOf(b: Building): string {
  return `${b.style}|${b.cw}x${b.ch}|${b.palette}|${b.windows}|${b.storefront}|${b.roof}|${b.sign}`;
}

/** Fixed looks for the 15 landmark rackets (style must belong to the racket's borough style set). */
const RACKET_LOOK: Record<string, { style: string; storefront: string }> = {
  racket_ravenite: { style: 'little_italy', storefront: 'social_club' },
  racket_fulton_fish: { style: 'financial', storefront: 'fishmonger' },
  racket_garment_trucking: { style: 'tenement', storefront: 'freight' },
  racket_redhook_pier14: { style: 'pier_shed', storefront: 'freight' },
  racket_bensonhurst_numbers: { style: 'brownstone', storefront: 'sports_book' },
  racket_gowanus_chop: { style: 'warehouse', storefront: 'garage' },
  racket_jfk_hangar7: { style: 'hangar', storefront: 'hangar_door' },
  racket_ozone_lounge: { style: 'lounge', storefront: 'lounge' },
  racket_aqueduct_wire: { style: 'rowhouse', storefront: 'sports_book' },
  racket_huntspoint_carting: { style: 'warehouse', storefront: 'sanitation' },
  racket_arthur_ave_imports: { style: 'arthur_shop', storefront: 'cafe' },
  racket_bronx_meat_market: { style: 'warehouse', storefront: 'cold_storage' },
  racket_concrete_club_hq: { style: 'tower', storefront: 'lobby' },
  racket_hellskitchen_local282: { style: 'tower', storefront: 'union_hall' },
  racket_times_square_velvet: { style: 'neon', storefront: 'arcade' },
};

function chooseStyle(area: AreaId, px: number, py: number, rand: () => number): string {
  const r = rand();
  switch (area) {
    case 'manhattan_south':
      if (py > 3380) return r < 0.55 ? 'financial' : 'tenement';
      if (py > 2950 && px > 1900 && px < 2300) return r < 0.6 ? 'little_italy' : 'tenement';
      return 'tenement';
    case 'midtown_concrete':
      if (Math.abs(py - 2312) < 224) return r < 0.5 ? 'neon' : r < 0.75 ? 'theatre' : 'tower';
      return r < 0.8 ? 'tower' : 'theatre';
    case 'uptown': return 'brownstone';
    case 'bronx_terminal':
      if (Math.hypot(px - 3672, py - 792) < 420) return r < 0.65 ? 'arthur_shop' : 'tenement';
      if ((px > 3800 && py > 1150) || Math.hypot(px - 3060, py - 1008) < 320) return r < 0.7 ? 'warehouse' : 'tenement';
      return r < 0.8 ? 'tenement' : 'warehouse';
    case 'brooklyn_docks':
      if (px < 2900 && py > 3100) return r < 0.35 ? 'pier_shed' : r < 0.65 ? 'warehouse' : 'brownstone';
      return r < 0.75 ? 'brownstone' : 'warehouse';
    case 'queens_cargo':
      if (px > JFK_CARGO.x - 96 && py > JFK_CARGO.y - 96) return 'hangar';
      return r < 0.15 ? 'lounge' : 'rowhouse';
    default: return 'small_house';
  }
}

const idx = (cx: number, cy: number): number => cy * COLS + cx;

export function generateCity(seed = 1984): City {
  const ground = buildGround();
  const { kinds, areaIdx, blocks } = ground;
  const rand = mulberry32(seed);
  const buildingAt = new Int32Array(COLS * ROWS).fill(-1);
  const buildings: Building[] = [];
  const usedSigs = new Set<string>();
  const usedSigns = new Set<string>(RACKET_IDS.map((id) => RACKET_INFO[id].name));

  const createBuilding = (cx: number, cy: number, cw: number, ch: number, racketId?: string): void => {
    const ai = areaIdx[idx(cx + (cw >> 1), cy + (ch >> 1))];
    const area: AreaId | null = ai === 255 ? null : AREA_IDS[ai];
    const px = (cx + cw / 2) * CELL, py = (cy + ch / 2) * CELL;
    const look = racketId ? RACKET_LOOK[racketId] : undefined;
    const style = look ? look.style : chooseStyle(area as AreaId, px, py, rand);
    for (let tries = 0; tries < 500; tries++) {
      const sf = STOREFRONTS[style] || ['none'];
      const storefront = look ? look.storefront : sf[Math.floor(rand() * sf.length)];
      const sign = racketId ? RACKET_INFO[racketId as keyof typeof RACKET_INFO].name : makeSign(style, storefront, rand);
      const b: Building = {
        id: buildings.length, cx, cy, cw, ch, area, style,
        palette: Math.floor(rand() * 8), windows: Math.floor(rand() * 6), storefront, roof: Math.floor(rand() * 8), sign,
      };
      if (racketId) b.racketId = racketId;
      const sig = signatureOf(b);
      if (usedSigs.has(sig) || (!racketId && usedSigns.has(sign))) continue;
      usedSigs.add(sig);
      usedSigns.add(sign);
      buildings.push(b);
      for (let y = cy; y < cy + ch; y++) for (let x = cx; x < cx + cw; x++) buildingAt[idx(x, y)] = b.id;
      return;
    }
    throw new Error('could not find a unique building look');
  };

  // Racket lots from the data module.
  const rackets = RACKET_IDS.map((id) => {
    const p = RACKET_PLACEMENT[id];
    return { id, col: p.x / CELL, row: p.y / CELL, w: p.width / CELL, h: p.height / CELL };
  }).filter((r) => r.w > 0);
  const racketBlock = new Map<Block, typeof rackets>();
  for (const r of rackets) {
    const blk = blocks.find((b) => b.by0 === r.row && b.by1 === r.row + r.h && b.x0 <= r.col && r.col + r.w <= b.x1);
    if (!blk) throw new Error(`racket ${r.id} does not sit on a block lot row`);
    for (let y = r.row; y < r.row + r.h; y++) for (let x = r.col; x < r.col + r.w; x++) {
      if (kinds[idx(x, y)] !== K.BUILDING) throw new Error(`racket ${r.id} lot is not free ground`);
    }
    if (!racketBlock.has(blk)) racketBlock.set(blk, []);
    racketBlock.get(blk)!.push(r);
  }

  const MINW = 2, MAXW = 4;
  for (const blk of blocks) {
    const ch = blk.by1 - blk.by0;
    const rk = (racketBlock.get(blk) || []).sort((a, b) => a.col - b.col);
    const colFree = (x: number): boolean => {
      for (let y = blk.by0; y < blk.by1; y++) if (kinds[idx(x, y)] !== K.BUILDING) return false;
      return true;
    };
    const cutSegment = (start: number, len: number): void => {
      let pos = start, rem = len;
      while (rem >= MINW) {
        let w = rem;
        if (rem > MAXW) {
          const opts: number[] = [];
          for (let c = MINW; c <= MAXW; c++) if (rem - c >= MINW) opts.push(c);
          w = opts[Math.floor(rand() * opts.length)];
        }
        createBuilding(pos, blk.by0, w, ch);
        pos += w; rem -= w;
        if (rem > MINW + 1 && rand() < 0.1) { kinds[idx(pos, blk.by0)] = K.BUILDING; for (let y = blk.by0; y < blk.by1; y++) kinds[idx(pos, y)] = K.ALLEY; pos++; rem--; }
      }
    };
    let x = blk.x0;
    let segStart = -1;
    const flush = (end: number): void => { if (segStart >= 0) { cutSegment(segStart, end - segStart); segStart = -1; } };
    while (x < blk.x1) {
      const r = rk.find((q) => q.col === x);
      if (r) { flush(x); createBuilding(r.col, r.row, r.w, r.h, r.id); x += r.w; continue; }
      if (colFree(x)) { if (segStart < 0) segStart = x; } else flush(x);
      x++;
    }
    flush(x);
  }
  // Ground left without a building becomes alley.
  for (let i = 0; i < kinds.length; i++) if (kinds[i] === K.BUILDING && buildingAt[i] < 0) kinds[i] = K.ALLEY;

  // George Washington Bridge: land cells near its span become a barrier.
  for (const c of ground.gwbCells) {
    const cx0 = c % COLS, cy0 = (c - cx0) / COLS;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const cx = cx0 + dx, cy = cy0 + dy;
      if (cx < 0 || cy < 0 || cx >= COLS || cy >= ROWS) continue;
      const i = idx(cx, cy);
      if (kinds[i] !== K.WATER && kinds[i] !== K.BRIDGE) kinds[i] = K.BARRIER;
    }
  }
  const gwb = new Set(ground.gwbCells);

  // Drop walkable pockets that cannot be reached from the main street network.
  const comp = new Int32Array(COLS * ROWS).fill(-1);
  const sizes: number[] = [];
  const stack: number[] = [];
  for (let s = 0; s < comp.length; s++) {
    if (comp[s] >= 0 || !WALKABLE[kinds[s]] || gwb.has(s)) continue;
    const id = sizes.length;
    let n = 0;
    comp[s] = id; stack.push(s);
    while (stack.length) {
      const c = stack.pop() as number;
      n++;
      const cx = c % COLS;
      const nb = [cx > 0 ? c - 1 : -1, cx < COLS - 1 ? c + 1 : -1, c >= COLS ? c - COLS : -1, c + COLS < comp.length ? c + COLS : -1];
      for (const q of nb) if (q >= 0 && comp[q] < 0 && WALKABLE[kinds[q]] && !gwb.has(q)) { comp[q] = id; stack.push(q); }
    }
    sizes.push(n);
  }
  let main = 0;
  for (let i = 1; i < sizes.length; i++) if (sizes[i] > sizes[main]) main = i;
  for (let i = 0; i < comp.length; i++) if (comp[i] >= 0 && comp[i] !== main) kinds[i] = K.OFFLIMITS;

  // Street lamps on sidewalks every few cells.
  const lamps: Pt[] = [];
  for (const blk of blocks) {
    for (let x = blk.x0 + 2; x < blk.x1; x += 5) if (kinds[idx(x, blk.sy)] === K.SIDEWALK) lamps.push({ x: x * CELL + CELL / 2, y: blk.sy * CELL + CELL / 2 });
    for (let y = blk.by0 + 1; y < blk.sy; y += 6) {
      if (kinds[idx(blk.x0 - 1, y)] === K.SIDEWALK) lamps.push({ x: (blk.x0 - 1) * CELL + CELL / 2, y: y * CELL + CELL / 2 });
    }
  }
  return { seed, cols: COLS, rows: ROWS, kinds, buildingAt, areaAt: areaIdx, buildings, lamps };
}

// ---- helpers (pixel coordinates) ----

export function kindAt(city: City, x: number, y: number): number {
  const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL);
  if (cx < 0 || cy < 0 || cx >= city.cols || cy >= city.rows) return K.WATER;
  return city.kinds[cy * city.cols + cx];
}
export function isWalkable(city: City, x: number, y: number): boolean { return WALKABLE[kindAt(city, x, y)] === 1; }
export function isDrivable(city: City, x: number, y: number): boolean {
  const k = kindAt(city, x, y);
  return k === K.ROAD || k === K.BRIDGE;
}
export function areaAtPoint(city: City, x: number, y: number): AreaId | null {
  const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL);
  if (cx < 0 || cy < 0 || cx >= city.cols || cy >= city.rows) return null;
  const a = city.areaAt[cy * city.cols + cx];
  return a === 255 ? null : AREA_IDS[a];
}

export function nearestWalkable(city: City, x: number, y: number, maxCells = 12): Pt | null {
  if (isWalkable(city, x, y)) return { x, y };
  const c0x = Math.floor(x / CELL), c0y = Math.floor(y / CELL);
  for (let r = 1; r <= maxCells; r++) {
    let best: Pt | null = null, bd = Infinity;
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      const cx = c0x + dx, cy = c0y + dy;
      if (cx < 0 || cy < 0 || cx >= city.cols || cy >= city.rows || !WALKABLE[city.kinds[cy * city.cols + cx]]) continue;
      const px = cx * CELL + CELL / 2, py = cy * CELL + CELL / 2;
      const d = (px - x) * (px - x) + (py - y) * (py - y);
      if (d < bd) { bd = d; best = { x: px, y: py }; }
    }
    if (best) return best;
  }
  return null;
}

const pickCache = new WeakMap<City, { side: number[][]; all: number[][] }>();
function pickLists(city: City): { side: number[][]; all: number[][] } {
  let c = pickCache.get(city);
  if (!c) {
    c = { side: AREA_IDS.map(() => []), all: AREA_IDS.map(() => []) };
    for (let i = 0; i < city.kinds.length; i++) {
      const a = city.areaAt[i];
      if (a === 255 || !WALKABLE[city.kinds[i]]) continue;
      c.all[a].push(i);
      if (city.kinds[i] === K.SIDEWALK) c.side[a].push(i);
    }
    pickCache.set(city, c);
  }
  return c;
}
/** A random walkable point in an area, sidewalks preferred. */
export function randomWalkableIn(city: City, area: AreaId, rand: () => number): Pt {
  const ai = AREA_IDS.indexOf(area);
  const lists = pickLists(city);
  const list = lists.side[ai].length ? lists.side[ai] : lists.all[ai];
  if (!list.length) return { x: START_POINT.x, y: START_POINT.y };
  const i = list[Math.floor(rand() * list.length)];
  return { x: (i % city.cols) * CELL + CELL / 2, y: Math.floor(i / city.cols) * CELL + CELL / 2 };
}

function blockedAt(city: City, px: number, py: number, r: number): boolean {
  const c0 = Math.floor((px - r) / CELL), c1 = Math.floor((px + r) / CELL);
  const r0 = Math.floor((py - r) / CELL), r1 = Math.floor((py + r) / CELL);
  for (let cy = r0; cy <= r1; cy++) for (let cx = c0; cx <= c1; cx++) {
    if (cx >= 0 && cy >= 0 && cx < city.cols && cy < city.rows && WALKABLE[city.kinds[cy * city.cols + cx]]) continue;
    const nx = Math.max(cx * CELL, Math.min(px, cx * CELL + CELL));
    const ny = Math.max(cy * CELL, Math.min(py, cy * CELL + CELL));
    if ((px - nx) * (px - nx) + (py - ny) * (py - ny) < r * r) return true;
  }
  return false;
}
/** Move a circle by (dx, dy), one axis at a time so it slides along walls. */
export function moveWithCollision(city: City, x: number, y: number, dx: number, dy: number, radius: number): Pt {
  const trapped = blockedAt(city, x, y, radius);
  let nx = x, ny = y;
  if (dx !== 0 && (trapped || !blockedAt(city, x + dx, y, radius))) nx = x + dx;
  if (dy !== 0 && (trapped || !blockedAt(city, nx, y + dy, radius))) ny = y + dy;
  return { x: nx, y: ny };
}
export function blocksBullet(city: City, x: number, y: number): boolean { return kindAt(city, x, y) === K.BUILDING; }
