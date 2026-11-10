// City renderer: canvas 2D only, no images, no DOM access at module load.
//
// drawCityChunk paints one CHUNK x CHUNK piece in piece-local pixels (0..512) onto a canvas the caller owns.
// drawCityOverlay paints the per-frame glow (lamp pools, neon flicker) in WORLD coordinates, so the caller must
// already have translated the context by -camera before calling it.
import { CELL, NEIGHBOURHOOD_LABELS, WORLD_H, WORLD_W } from './cityData.ts';
import { CellKind as K, mulberry32 } from './cityGen.ts';
import type { Building, City } from './cityGen.ts';
import { CHUNK, MAX_CHUNKS } from './chunkCache.ts';

export { CHUNK, MAX_CHUNKS, createChunkCache } from './chunkCache.ts';

export const CHUNKS_X = Math.ceil(WORLD_W / CHUNK);
export const CHUNKS_Y = Math.ceil(WORLD_H / CHUNK);

/**
 * Pieces to keep ready for a view: the visible ones first (nearest the view centre first), then a ring of
 * `ring` pieces around them, nearest first, cut off so the list never exceeds `budget` (default MAX_CHUNKS).
 * Visible pieces are never cut off in favour of ring pieces.
 */
export function chunksForView(view: { x: number; y: number; w: number; h: number }, ring = 1, budget = MAX_CHUNKS): { cx: number; cy: number }[] {
  const clampX = (v: number): number => Math.max(0, Math.min(CHUNKS_X - 1, v));
  const clampY = (v: number): number => Math.max(0, Math.min(CHUNKS_Y - 1, v));
  const vx0 = clampX(Math.floor(view.x / CHUNK)), vx1 = clampX(Math.floor((view.x + view.w - 1) / CHUNK));
  const vy0 = clampY(Math.floor(view.y / CHUNK)), vy1 = clampY(Math.floor((view.y + view.h - 1) / CHUNK));
  const mx = view.x + view.w / 2, my = view.y + view.h / 2;
  const dist = (cx: number, cy: number): number => Math.hypot((cx + 0.5) * CHUNK - mx, (cy + 0.5) * CHUNK - my);
  const vis: { cx: number; cy: number; d: number }[] = [];
  const rng: { cx: number; cy: number; d: number }[] = [];
  for (let cy = clampY(vy0 - ring); cy <= clampY(vy1 + ring); cy++) {
    for (let cx = clampX(vx0 - ring); cx <= clampX(vx1 + ring); cx++) {
      const e = { cx, cy, d: dist(cx, cy) };
      if (cx >= vx0 && cx <= vx1 && cy >= vy0 && cy <= vy1) vis.push(e); else rng.push(e);
    }
  }
  vis.sort((a, b) => a.d - b.d);
  rng.sort((a, b) => a.d - b.d);
  return vis.concat(rng).slice(0, Math.max(budget, 0)).map((e) => ({ cx: e.cx, cy: e.cy }));
}

// ---------------------------------------------------------------- colour and noise helpers

function hash2(a: number, b: number, c = 0): number {
  let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 1274126177)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h = Math.imul(h ^ (h >>> 15), 2246822519);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const colCache = new Map<string, string>();
function parse(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}
const toHex = (r: number, g: number, b: number): string => {
  const f = (v: number): string => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${f(r)}${f(g)}${f(b)}`;
};
/** Multiply a colour by f (below 1 darkens, above 1 lightens). */
function shade(hex: string, f: number): string {
  const key = hex + f;
  let v = colCache.get(key);
  if (!v) { const [r, g, b] = parse(hex); v = toHex(r * f, g * f, b * f); colCache.set(key, v); }
  return v;
}
function mix(a: string, b: string, t: number): string {
  const key = a + b + t;
  let v = colCache.get(key);
  if (!v) { const p = parse(a), q = parse(b); v = toHex(p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t); colCache.set(key, v); }
  return v;
}
function rgba(hex: string, a: number): string {
  const [r, g, b] = parse(hex);
  return `rgba(${r},${g},${b},${a})`;
}

type Ctx = CanvasRenderingContext2D;
const fr = (ctx: Ctx, color: string | CanvasGradient, x: number, y: number, w: number, h: number): void => { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); };
function disc(ctx: Ctx, color: string, x: number, y: number, r: number): void {
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}
function vgrad(ctx: Ctx, x: number, y: number, h: number, stops: [number, string][]): CanvasGradient {
  const g = ctx.createLinearGradient(x, y, x, y + h);
  for (const [t, c] of stops) g.addColorStop(t, c);
  return g;
}
function glow(ctx: Ctx, x: number, y: number, r: number, color: string, a: number): void {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(color, a));
  g.addColorStop(0.45, rgba(color, a * 0.35));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

// ---------------------------------------------------------------- style tables

type FaceKind = 'brick' | 'stone' | 'glass' | 'dark' | 'corrugated' | 'siding' | 'stucco';
interface StyleDef {
  walls: readonly string[];
  face: FaceKind;
  roof: string;
  roofFrac: number;
  pitch: 'flat' | 'gable' | 'barrel' | 'tower';
  floorH: number;
}
const STYLE: Record<string, StyleDef> = {
  tenement: { walls: ['#6a3a2e', '#7c4a37', '#5a2f27', '#85604a', '#6f6858', '#7a3b34', '#4f3b35', '#8b6b4c'], face: 'brick', roof: '#2a2c30', roofFrac: 0.4, pitch: 'flat', floorH: 18 },
  little_italy: { walls: ['#8a5a45', '#a1764f', '#7f4f3f', '#9b8a6a', '#8f6a52', '#b08a5c', '#76503f', '#a0684f'], face: 'stucco', roof: '#35302b', roofFrac: 0.4, pitch: 'flat', floorH: 18 },
  financial: { walls: ['#8e8a7c', '#7c7f80', '#9a9484', '#6f7378', '#a39d8c', '#85807a', '#74786f', '#8b8e92'], face: 'stone', roof: '#3a3c40', roofFrac: 0.36, pitch: 'flat', floorH: 18 },
  tower: { walls: ['#4f5d70', '#3f4e5e', '#5c6670', '#49576b', '#6a7078', '#38495a', '#566a78', '#505a66'], face: 'glass', roof: '#2f343b', roofFrac: 0.34, pitch: 'tower', floorH: 14 },
  theatre: { walls: ['#6b2d3a', '#4a2f5c', '#2f4a5a', '#7a5a2e', '#5a2e2e', '#3a3560', '#6a3f2a', '#2f5a4a'], face: 'stone', roof: '#2a2a30', roofFrac: 0.36, pitch: 'flat', floorH: 20 },
  neon: { walls: ['#2a2733', '#232a36', '#312530', '#26302f', '#2d2b25', '#1f2230', '#352a2a', '#2a2a38'], face: 'dark', roof: '#1e2025', roofFrac: 0.36, pitch: 'flat', floorH: 18 },
  brownstone: { walls: ['#5d3b2b', '#6b4533', '#4e3328', '#7a5239', '#58372a', '#6a4a3c', '#473026', '#7b5a40'], face: 'stone', roof: '#26272b', roofFrac: 0.4, pitch: 'flat', floorH: 20 },
  arthur_shop: { walls: ['#7a4a38', '#8a6a4a', '#6a4033', '#9a7a58', '#704a40', '#85583f', '#8f7a5f', '#6a5040'], face: 'brick', roof: '#2d2b29', roofFrac: 0.4, pitch: 'flat', floorH: 18 },
  warehouse: { walls: ['#4a3d36', '#555a5c', '#5b4636', '#3f4549', '#6a5a46', '#4a4f4a', '#5a3f38', '#44484f'], face: 'brick', roof: '#3a3d40', roofFrac: 0.42, pitch: 'flat', floorH: 22 },
  pier_shed: { walls: ['#4d5a58', '#5e5648', '#46525e', '#5a4f44', '#4b5750', '#625d52', '#3f4d56', '#575045'], face: 'corrugated', roof: '#4a4f4c', roofFrac: 0.5, pitch: 'gable', floorH: 24 },
  rowhouse: { walls: ['#6f7a80', '#8a7a62', '#7a5a4c', '#6a7a6a', '#8a8070', '#5e6a78', '#80665a', '#79806a'], face: 'siding', roof: '#3a3030', roofFrac: 0.46, pitch: 'gable', floorH: 20 },
  hangar: { walls: ['#7b8186', '#6b7378', '#8a8f90', '#5f686e', '#767b74', '#6d747d', '#848a86', '#5d646a'], face: 'corrugated', roof: '#8a9096', roofFrac: 0.5, pitch: 'barrel', floorH: 26 },
  lounge: { walls: ['#3a2f3f', '#2d3a3f', '#40302e', '#2e3144', '#3c3a2f', '#33303f', '#2f403a', '#44323a'], face: 'dark', roof: '#232328', roofFrac: 0.4, pitch: 'flat', floorH: 20 },
  small_house: { walls: ['#7b8a8e', '#8a7a6a', '#6e8470', '#8f8573', '#76798c', '#9a8466', '#6a7f8a', '#87746a'], face: 'siding', roof: '#443a36', roofFrac: 0.5, pitch: 'gable', floorH: 20 },
};
const AWNING = ['#8a1c1c', '#1f5a3a', '#1d3f7a', '#8a6414', '#6b1f6b', '#cfc7b2', '#a23a14', '#14606a'];
const NEON_COLORS = ['#ff2e88', '#34e3ff', '#ffb020', '#46ff8a', '#ff3b30', '#b36bff'];

type Cat = 'shop' | 'neon' | 'grand' | 'marquee' | 'industrial' | 'hangar' | 'none';
const CAT: Record<string, Cat> = {
  none: 'none',
  bakery: 'shop', deli: 'shop', pharmacy: 'shop', laundromat: 'shop', cafe: 'shop', butcher: 'shop', tailor: 'shop', barber: 'shop',
  hardware: 'shop', florist: 'shop', restaurant: 'shop', fishmonger: 'shop', social_club: 'shop', chandler: 'shop', sports_book: 'shop',
  bar: 'neon', pawn: 'neon', arcade: 'neon', diner: 'neon', lounge: 'neon',
  bank: 'grand', lobby: 'grand', office: 'grand', brokerage: 'grand', union_hall: 'grand',
  theatre: 'marquee', cinema: 'marquee',
  loading_dock: 'industrial', garage: 'industrial', cold_storage: 'industrial', freight: 'industrial', sanitation: 'industrial',
  hangar_door: 'hangar',
};
const catOf = (b: Building): Cat => CAT[b.storefront] || 'shop';

// ---------------------------------------------------------------- building layout shared by the chunk and the overlay

interface Layout {
  x: number; y: number; W: number; H: number;
  F: number; R: number; fy: number; G: number; signH: number; signY: number;
  lines: string[]; fs: number; cat: Cat; st: StyleDef; wall: string;
}
const layoutCache = new WeakMap<Building, Layout>();
const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

function wrapSign(text: string, avail: number): { lines: string[]; fs: number } {
  const per = 0.58;
  const one = text.length * 6.5 * per;
  if (one <= avail * 1.2) return { lines: [text], fs: 6.5 };
  const mid = text.length / 2;
  let best = -1;
  for (let i = 0; i < text.length; i++) if (text[i] === ' ' && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
  if (best < 0) return { lines: [text], fs: 6 };
  return { lines: [text.slice(0, best), text.slice(best + 1)], fs: 6 };
}

function layoutOf(b: Building): Layout {
  let L = layoutCache.get(b);
  if (L) return L;
  const st = STYLE[b.style] || STYLE.tenement;
  const x = b.cx * CELL, y = b.cy * CELL, W = b.cw * CELL, H = b.ch * CELL;
  const F = clamp(Math.round(H * (1 - st.roofFrac)), 40, H - 24);
  const R = H - F;
  const cat = catOf(b);
  const G = clamp(Math.round(F * 0.38), 20, cat === 'hangar' ? 40 : 30);
  const wrapped = wrapSign(b.sign, W - 8);
  const signH = wrapped.lines.length === 2 ? 14 : 9;
  const signY = y + H - G - signH;
  L = { x, y, W, H, F, R, fy: y + R, G, signH, signY, lines: wrapped.lines, fs: wrapped.fs, cat, st, wall: st.walls[b.palette % st.walls.length] };
  layoutCache.set(b, L);
  return L;
}

interface NeonSrc { x: number; y: number; rx: number; ry: number; color: string; phase: number; rate: number; b: number }
const NEON_CATS = new Set<Cat>(['neon', 'marquee']);
function neonOf(b: Building): NeonSrc | null {
  const L = layoutOf(b);
  const on = NEON_CATS.has(L.cat) || b.style === 'neon' || b.style === 'theatre' || b.style === 'lounge' || !!b.racketId;
  if (!on) return null;
  const color = NEON_COLORS[Math.floor(hash2(b.id, 11) * NEON_COLORS.length)];
  return { x: L.x + L.W / 2, y: L.signY + L.signH / 2, rx: L.W / 2 + 40, ry: 54, color, phase: hash2(b.id, 12) * 20, rate: 2 + hash2(b.id, 13) * 5, b: hash2(b.id, 14) };
}

// ---------------------------------------------------------------- per-city indexes (chunk buckets for lamps and neon)

interface Index { lamps: Map<number, { x: number; y: number; i: number }[]>; neon: Map<number, NeonSrc[]> }
const indexCache = new WeakMap<City, Index>();
function indexOf(city: City): Index {
  let ix = indexCache.get(city);
  if (!ix) {
    ix = { lamps: new Map(), neon: new Map() };
    const bucket = (x: number, y: number): number => Math.floor(y / CHUNK) * 64 + Math.floor(x / CHUNK);
    city.lamps.forEach((l, i) => {
      const k = bucket(l.x, l.y);
      const a = ix!.lamps.get(k);
      if (a) a.push({ x: l.x, y: l.y, i }); else ix!.lamps.set(k, [{ x: l.x, y: l.y, i }]);
    });
    for (const b of city.buildings) {
      const n = neonOf(b);
      if (!n) continue;
      const k = bucket(n.x, n.y);
      const a = ix.neon.get(k);
      if (a) a.push(n); else ix.neon.set(k, [n]);
    }
    indexCache.set(city, ix);
  }
  return ix;
}

// ---------------------------------------------------------------- ground tiles

const kd = (city: City, cx: number, cy: number): number =>
  cx < 0 || cy < 0 || cx >= city.cols || cy >= city.rows ? K.WATER : city.kinds[cy * city.cols + cx];
const roadLike = (k: number): boolean => k === K.ROAD || k === K.BRIDGE || k === K.BARRIER;

function inLittleItaly(x: number, y: number): boolean {
  return y > 2950 && y < 3380 && x > 1900 && x < 2300;
}

function run(city: City, cx: number, cy: number, dx: number, dy: number): number {
  let n = 0;
  while (n < 5 && roadLike(kd(city, cx + dx * (n + 1), cy + dy * (n + 1)))) n++;
  return n;
}
/** orient 1 = horizontal band, 2 = vertical band, 0 = junction or plain. */
function band(city: City, cx: number, cy: number): { orient: number; r: number; n: number } {
  const u = run(city, cx, cy, 0, -1), d = run(city, cx, cy, 0, 1), l = run(city, cx, cy, -1, 0), r = run(city, cx, cy, 1, 0);
  const v = u + d + 1, h = l + r + 1;
  if (v <= 4 && h > v) return { orient: 1, r: u, n: v };
  if (h <= 4 && v > h) return { orient: 2, r: l, n: h };
  return { orient: 0, r: 0, n: 0 };
}

function drawWater(ctx: Ctx, city: City, cx: number, cy: number, px: number, py: number): void {
  const h = hash2(cx, cy, 1);
  const t = 0.5 + 0.5 * Math.sin(px * 0.0031 + py * 0.0047) * 0.6 + (h - 0.5) * 0.25;
  fr(ctx, mix('#08162a', '#0f2740', clamp(t, 0, 1)), px, py, CELL, CELL);
  // wave strokes
  ctx.strokeStyle = `rgba(130,180,220,${0.07 + h * 0.08})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 2; i++) {
    const wx = px + 3 + hash2(cx, cy, 2 + i) * 18, wy = py + 6 + hash2(cx, cy, 5 + i) * 20;
    ctx.moveTo(wx, wy);
    ctx.quadraticCurveTo(wx + 5, wy - 2, wx + 10, wy);
    ctx.quadraticCurveTo(wx + 15, wy + 2, wx + 20, wy);
  }
  ctx.stroke();
  // shoreline foam toward each neighbouring land cell
  const nb: [number, number, number, number][] = [[0, -1, 0, 0], [0, 1, 0, CELL - 6], [-1, 0, 0, 0], [1, 0, CELL - 6, 0]];
  for (const [dx, dy, ox, oy] of nb) {
    const k = kd(city, cx + dx, cy + dy);
    if (k === K.WATER) continue;
    const horiz = dx === 0;
    const g = horiz
      ? vgrad(ctx, px, py + oy, 6, dy < 0 ? [[0, 'rgba(150,200,230,0.34)'], [1, 'rgba(150,200,230,0)']] : [[0, 'rgba(150,200,230,0)'], [1, 'rgba(150,200,230,0.34)']])
      : null;
    if (g) { ctx.fillStyle = g; ctx.fillRect(px, py + oy, CELL, 6); }
    else {
      const gx = ctx.createLinearGradient(px + ox, py, px + ox + 6, py);
      gx.addColorStop(dx < 0 ? 0 : 1, 'rgba(150,200,230,0.34)');
      gx.addColorStop(dx < 0 ? 1 : 0, 'rgba(150,200,230,0)');
      ctx.fillStyle = gx; ctx.fillRect(px + ox, py, 6, CELL);
    }
  }
  // warm reflections of the shore lights, strongest just off the coast
  const up = kd(city, cx, cy - 1), dn = kd(city, cx, cy + 1);
  if ((up !== K.WATER && up !== K.OFFLIMITS) || (dn !== K.WATER && dn !== K.OFFLIMITS) || (up === K.OFFLIMITS || dn === K.OFFLIMITS)) {
    if (h > 0.35) fr(ctx, 'rgba(255,170,70,0.10)', px + h * 20, py + 2, 2, 12 + h * 10);
    if (h < 0.5) fr(ctx, 'rgba(255,210,140,0.07)', px + 6 + h * 12, py + 14, 1.5, 12);
  }
}

function drawOfflimits(ctx: Ctx, city: City, cx: number, cy: number, px: number, py: number): void {
  const h = hash2(cx, cy, 3);
  fr(ctx, mix('#101216', '#171a1d', h), px, py, CELL, CELL);
  ctx.strokeStyle = 'rgba(255,255,255,0.025)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(px, py + CELL); ctx.lineTo(px + CELL, py); ctx.stroke();
  // distant lights of a skyline you cannot reach
  for (let i = 0; i < 3; i++) {
    const r = hash2(cx, cy, 20 + i);
    if (r < 0.55) disc(ctx, r < 0.3 ? 'rgba(255,184,106,0.75)' : 'rgba(210,225,255,0.5)', px + hash2(cx, cy, 30 + i) * CELL, py + hash2(cx, cy, 40 + i) * CELL, 0.9 + r);
  }
  if (kd(city, cx, cy + 1) === K.WATER || kd(city, cx + 1, cy) === K.WATER) {
    ctx.strokeStyle = 'rgba(90,90,96,0.5)';
    ctx.beginPath(); ctx.moveTo(px, py + CELL - 1); ctx.lineTo(px + CELL, py + CELL - 1); ctx.stroke();
  }
}

function drawRoadBase(ctx: Ctx, cx: number, cy: number, px: number, py: number): void {
  const h = hash2(cx, cy, 4);
  if (inLittleItaly(px, py)) {
    fr(ctx, '#2b2824', px, py, CELL, CELL);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 5; c++) {
        const hh = hash2(cx * 5 + c, cy * 4 + r, 6);
        fr(ctx, mix('#4a4640', '#625c52', hh), px + c * 8 - (r % 2 ? 4 : 0) + 0.5, py + r * 8 + 0.5, 7, 7);
      }
    }
    return;
  }
  fr(ctx, mix('#1e1f25', '#272830', h), px, py, CELL, CELL);
  if (h > 0.55) disc(ctx, 'rgba(255,255,255,0.035)', px + h * 28, py + (1 - h) * 28, 1.2);
  if (h < 0.12) fr(ctx, 'rgba(0,0,0,0.25)', px + 6, py + 10, 14, 5); // oil stain
  // tyre wear
  fr(ctx, 'rgba(255,255,255,0.018)', px, py + 8, CELL, 4);
  fr(ctx, 'rgba(255,255,255,0.018)', px, py + 20, CELL, 4);
}

function drawRoadMarks(ctx: Ctx, city: City, cx: number, cy: number, px: number, py: number): void {
  const b = band(city, cx, cy);
  const yellow = 'rgba(224,170,40,0.85)', white = 'rgba(225,225,215,0.7)';
  if (b.orient === 1 || b.orient === 2) {
    const hz = b.orient === 1;
    const dash = (off: number, color: string): void => { // dashed line across this cell at offset along the minor axis
      ctx.fillStyle = color;
      for (let s = 0; s < CELL; s += 16) {
        if (hz) ctx.fillRect(px + s + 2, py + off, 10, 2); else ctx.fillRect(px + off, py + s + 2, 2, 10);
      }
    };
    const solid = (off: number, color: string): void => { ctx.fillStyle = color; if (hz) ctx.fillRect(px, py + off, CELL, 2); else ctx.fillRect(px + off, py, 2, CELL); };
    if (b.n === 2) { if (b.r === 0) dash(CELL - 1, white); }
    else if (b.n === 3) { if (b.r === 1) { solid(12, yellow); solid(18, yellow); } }
    else if (b.n === 4) { if (b.r === 1) { solid(CELL - 4, yellow); solid(CELL - 1, yellow); } }
    // zebra crossing where a band meets a junction
    const near = [-1, 1];
    for (const s of near) {
      const nx = hz ? cx + s : cx, ny = hz ? cy : cy + s;
      if (roadLike(kd(city, nx, ny)) && band(city, nx, ny).orient === 0) {
        ctx.fillStyle = 'rgba(220,220,210,0.55)';
        for (let i = 0; i < 4; i++) {
          if (hz) ctx.fillRect(px + (s < 0 ? 2 : CELL - 8), py + 3 + i * 8, 6, 4); else ctx.fillRect(px + 3 + i * 8, py + (s < 0 ? 2 : CELL - 8), 4, 6);
        }
      }
    }
  }
}

function drawSidewalk(ctx: Ctx, city: City, cx: number, cy: number, px: number, py: number): void {
  const h = hash2(cx, cy, 5);
  const flag = inLittleItaly(px, py);
  fr(ctx, flag ? mix('#4a443d', '#57504a', h) : mix('#363940', '#41444c', h), px, py, CELL, CELL);
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.fillRect(px + 15, py, 1, CELL);
  ctx.fillRect(px, py + 15, CELL, 1);
  if (h > 0.9) fr(ctx, 'rgba(255,255,255,0.05)', px + 3, py + 3, 10, 10);
  // curbs
  const up = kd(city, cx, cy - 1), dn = kd(city, cx, cy + 1), lf = kd(city, cx - 1, cy), rt = kd(city, cx + 1, cy);
  const curb = '#707378';
  if (roadLike(up)) { fr(ctx, curb, px, py, CELL, 3); fr(ctx, 'rgba(0,0,0,0.4)', px, py + 3, CELL, 1); }
  if (roadLike(dn)) { fr(ctx, curb, px, py + CELL - 3, CELL, 3); }
  if (roadLike(lf)) { fr(ctx, curb, px, py, 3, CELL); }
  if (roadLike(rt)) { fr(ctx, curb, px + CELL - 3, py, 3, CELL); }
  // foot of a building wall
  if (up === K.BUILDING) fr(ctx, vgrad(ctx, px, py, 9, [[0, 'rgba(0,0,0,0.5)'], [1, 'rgba(0,0,0,0)']]), px, py, CELL, 9);
  if (dn === K.BUILDING) fr(ctx, 'rgba(0,0,0,0.25)', px, py + CELL - 3, CELL, 3);
}

function drawAlley(ctx: Ctx, cx: number, cy: number, px: number, py: number): void {
  const h = hash2(cx, cy, 6);
  fr(ctx, mix('#141519', '#1b1c21', h), px, py, CELL, CELL);
  fr(ctx, 'rgba(0,0,0,0.3)', px, py + 20, CELL, 12);
  if (h > 0.7) { fr(ctx, 'rgba(70,100,130,0.22)', px + 4 + h * 6, py + 12, 14, 5); fr(ctx, 'rgba(180,200,230,0.08)', px + 6 + h * 6, py + 13, 5, 1); }
}

function drawPark(ctx: Ctx, cx: number, cy: number, px: number, py: number): void {
  const h = hash2(cx, cy, 7);
  fr(ctx, mix('#0e2417', '#143222', h), px, py, CELL, CELL);
  ctx.strokeStyle = 'rgba(80,150,90,0.18)';
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const gx = px + hash2(cx, cy, 50 + i) * CELL, gy = py + hash2(cx, cy, 60 + i) * CELL;
    ctx.moveTo(gx, gy); ctx.lineTo(gx + 1, gy - 3);
  }
  ctx.stroke();
}

function drawTree(ctx: Ctx, cx: number, cy: number): void {
  const px = cx * CELL, py = cy * CELL;
  const h = hash2(cx, cy, 8);
  if (h < 0.5) return;
  const x = px + 6 + hash2(cx, cy, 9) * 20, y = py + 8 + hash2(cx, cy, 10) * 18;
  const r = 9 + h * 6;
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.beginPath(); ctx.arc(x + 4, y + 6, r, 0, Math.PI * 2); ctx.fill();
  disc(ctx, '#0b3a22', x, y, r);
  disc(ctx, '#145a34', x - 2, y - 3, r * 0.75);
  disc(ctx, '#1f7646', x - 4, y - 5, r * 0.4);
  for (let i = 0; i < 4; i++) disc(ctx, 'rgba(0,0,0,0.22)', x + (hash2(cx, cy, 70 + i) - 0.5) * r, y + (hash2(cx, cy, 80 + i) - 0.2) * r, 1.6);
}

function drawPier(ctx: Ctx, city: City, cx: number, cy: number, px: number, py: number): void {
  const h = hash2(cx, cy, 11);
  fr(ctx, mix('#3f301f', '#52402b', h), px, py, CELL, CELL);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  for (let i = 0; i < 8; i++) ctx.fillRect(px, py + i * 4, CELL, 1);
  const edges: [number, number, number, number][] = [[0, -1, 0, 0], [0, 1, 0, 1], [-1, 0, 1, 0], [1, 0, 1, 1]];
  for (const [dx, dy, vert, far] of edges) {
    if (kd(city, cx + dx, cy + dy) !== K.WATER) continue;
    ctx.fillStyle = '#20170d';
    for (let i = 0; i < 4; i++) {
      if (vert) ctx.fillRect(px + (far ? CELL - 4 : 0), py + i * 8 + 1, 4, 5); else ctx.fillRect(px + i * 8 + 1, py + (far ? CELL - 4 : 0), 5, 4);
    }
  }
  if (h > 0.93) { disc(ctx, '#15110c', px + 16, py + 16, 3); disc(ctx, '#5a4b38', px + 16, py + 15, 2); }
}

function drawPlaza(ctx: Ctx, city: City, cx: number, cy: number, px: number, py: number): void {
  const h = hash2(cx, cy, 12);
  fr(ctx, mix('#403d38', '#4d4a43', h), px, py, CELL, CELL);
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(px + 16.5, py); ctx.lineTo(px + 16.5, py + CELL);
  ctx.moveTo(px, py + 16.5); ctx.lineTo(px + CELL, py + 16.5);
  ctx.stroke();
  const area = city.areaAt[cy * city.cols + cx];
  if (area === 1) { // midtown squares: colourful sign spill
    const c = NEON_COLORS[Math.floor(h * 6) % 6];
    fr(ctx, rgba(c, 0.08), px, py, CELL, CELL);
  }
  if (kd(city, cx, cy - 1) === K.BUILDING) fr(ctx, vgrad(ctx, px, py, 8, [[0, 'rgba(0,0,0,0.45)'], [1, 'rgba(0,0,0,0)']]), px, py, CELL, 8);
}

function drawBridge(ctx: Ctx, city: City, cx: number, cy: number, px: number, py: number): void {
  const h = hash2(cx, cy, 13);
  fr(ctx, mix('#25272b', '#2c2e33', h), px, py, CELL, CELL);
  ctx.fillStyle = 'rgba(255,255,255,0.045)';
  ctx.fillRect(px + 15, py, 1, CELL);
  ctx.fillRect(px, py + 15, CELL, 1);
  // railings and girders toward open water
  const sides: [number, number][] = [[0, -1], [0, 1], [-1, 0], [1, 0]];
  for (const [dx, dy] of sides) {
    const k = kd(city, cx + dx, cy + dy);
    if (k !== K.WATER && k !== K.OFFLIMITS) continue;
    ctx.fillStyle = '#6a5a44';
    if (dy < 0) ctx.fillRect(px, py, CELL, 3); else if (dy > 0) ctx.fillRect(px, py + CELL - 3, CELL, 3);
    else if (dx < 0) ctx.fillRect(px, py, 3, CELL); else ctx.fillRect(px + CELL - 3, py, 3, CELL);
    ctx.fillStyle = '#a8946e';
    for (let i = 0; i < CELL; i += 8) {
      if (dy !== 0) ctx.fillRect(px + i, dy < 0 ? py : py + CELL - 3, 2, 3); else ctx.fillRect(dx < 0 ? px : px + CELL - 3, py + i, 3, 2);
    }
    // the deck's shadow on the river
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    if (dy < 0) ctx.fillRect(px, py - 5, CELL, 5); else if (dy > 0) ctx.fillRect(px, py + CELL, CELL, 5);
    else if (dx < 0) ctx.fillRect(px - 5, py, 5, CELL); else ctx.fillRect(px + CELL, py, 5, CELL);
  }
}

function drawBarrier(ctx: Ctx, cx: number, cy: number, px: number, py: number): void {
  fr(ctx, '#1d1e23', px, py, CELL, CELL);
  fr(ctx, '#1a1a1a', px + 2, py + 8, CELL - 4, 16);
  ctx.save();
  ctx.beginPath(); ctx.rect(px + 2, py + 8, CELL - 4, 16); ctx.clip();
  ctx.fillStyle = '#d9a21b';
  for (let i = -2; i < 6; i++) { ctx.beginPath(); ctx.moveTo(px + i * 9, py + 24); ctx.lineTo(px + i * 9 + 5, py + 24); ctx.lineTo(px + i * 9 + 13, py + 8); ctx.lineTo(px + i * 9 + 8, py + 8); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  disc(ctx, 'rgba(255,60,40,0.9)', px + 16 + (hash2(cx, cy, 14) - 0.5) * 8, py + 6, 1.8);
}

function drawGroundCell(ctx: Ctx, city: City, cx: number, cy: number): void {
  const px = cx * CELL, py = cy * CELL;
  switch (kd(city, cx, cy)) {
    case K.WATER: drawWater(ctx, city, cx, cy, px, py); break;
    case K.OFFLIMITS: drawOfflimits(ctx, city, cx, cy, px, py); break;
    case K.ROAD: drawRoadBase(ctx, cx, cy, px, py); drawRoadMarks(ctx, city, cx, cy, px, py); break;
    case K.SIDEWALK: drawSidewalk(ctx, city, cx, cy, px, py); break;
    case K.ALLEY: drawAlley(ctx, cx, cy, px, py); break;
    case K.PARK: drawPark(ctx, cx, cy, px, py); break;
    case K.PIER: drawPier(ctx, city, cx, cy, px, py); break;
    case K.PLAZA: drawPlaza(ctx, city, cx, cy, px, py); break;
    case K.BRIDGE: drawBridge(ctx, city, cx, cy, px, py); break;
    case K.BARRIER: drawBarrier(ctx, cx, cy, px, py); break;
    default: fr(ctx, '#17181c', px, py, CELL, CELL); // BUILDING: covered by its building, alley-dark under it
  }
}

/** Small street furniture on sidewalks and roads, after the ground. */
function drawFurniture(ctx: Ctx, city: City, cx: number, cy: number): void {
  const k = kd(city, cx, cy);
  const px = cx * CELL, py = cy * CELL;
  const h = hash2(cx, cy, 15);
  if (k === K.ROAD && h < 0.02 && band(city, cx, cy).orient !== 0) {
    disc(ctx, '#0d0d10', px + 16, py + 16, 5.5); disc(ctx, '#2a2b30', px + 16, py + 16, 4.5);
    ctx.strokeStyle = '#18181c'; ctx.beginPath(); ctx.moveTo(px + 12, py + 16); ctx.lineTo(px + 20, py + 16); ctx.moveTo(px + 16, py + 12); ctx.lineTo(px + 16, py + 20); ctx.stroke();
  }
  if (k === K.SIDEWALK) {
    if (h > 0.97) { // hydrant
      fr(ctx, '#7a1b16', px + 14, py + 14, 5, 6); fr(ctx, '#a02a20', px + 13, py + 13, 7, 2); disc(ctx, '#7a1b16', px + 16.5, py + 13, 2.5);
    } else if (h < 0.02) { // trash cans
      fr(ctx, '#2a2e2c', px + 10, py + 12, 7, 8); fr(ctx, '#4a4f4c', px + 10, py + 11, 7, 2); fr(ctx, '#2a2e2c', px + 19, py + 14, 6, 7);
    } else if (h > 0.94 && h < 0.955) { // grate
      fr(ctx, '#17181b', px + 8, py + 10, 16, 8); ctx.fillStyle = '#3b3d42'; for (let i = 0; i < 4; i++) ctx.fillRect(px + 10 + i * 4, py + 10, 1, 8);
    }
  }
  if (k === K.ALLEY) {
    if (h > 0.9) { fr(ctx, '#1b3328', px + 5, py + 8, 22, 14); fr(ctx, '#2a4a3a', px + 5, py + 7, 22, 3); }
    else if (h < 0.06) { fr(ctx, '#6b5a3c', px + 8, py + 10, 8, 8); fr(ctx, '#7c6a48', px + 14, py + 14, 8, 8); }
  }
}

// ---------------------------------------------------------------- buildings

function drawFace(ctx: Ctx, kind: FaceKind, x: number, y: number, w: number, h: number, wall: string, rnd: () => number): void {
  fr(ctx, wall, x, y, w, h);
  ctx.lineWidth = 1;
  if (kind === 'brick' || kind === 'stucco') {
    ctx.strokeStyle = kind === 'brick' ? shade(wall, 0.72) : shade(wall, 0.88);
    ctx.beginPath();
    for (let r = 4; r < h; r += 4) { ctx.moveTo(x, y + r + 0.5); ctx.lineTo(x + w, y + r + 0.5); }
    if (kind === 'brick') {
      for (let r = 0; r < h; r += 4) for (let c = (r / 4) % 2 ? 3 : 0; c < w; c += 8) { ctx.moveTo(x + c + 0.5, y + r); ctx.lineTo(x + c + 0.5, y + r + 4); }
    }
    ctx.stroke();
    // weathering blotches
    for (let i = 0; i < 4; i++) fr(ctx, `rgba(0,0,0,${0.05 + rnd() * 0.07})`, x + rnd() * w, y + rnd() * h * 0.7, 6 + rnd() * 12, 4 + rnd() * 8);
  } else if (kind === 'stone') {
    ctx.strokeStyle = shade(wall, 0.78);
    ctx.beginPath();
    for (let r = 7; r < h; r += 8) { ctx.moveTo(x, y + r + 0.5); ctx.lineTo(x + w, y + r + 0.5); }
    for (let r = 0; r < h; r += 8) for (let c = (r / 8) % 2 ? 8 : 16; c < w; c += 24) { ctx.moveTo(x + c + 0.5, y + r); ctx.lineTo(x + c + 0.5, y + r + 8); }
    ctx.stroke();
  } else if (kind === 'glass') {
    ctx.fillStyle = vgrad(ctx, x, y, h, [[0, shade(wall, 1.25)], [1, shade(wall, 0.7)]]);
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    for (let c = 0; c < w; c += 8) { ctx.moveTo(x + c + 0.5, y); ctx.lineTo(x + c + 0.5, y + h); }
    ctx.stroke();
  } else if (kind === 'corrugated') {
    ctx.strokeStyle = shade(wall, 0.78);
    ctx.beginPath();
    for (let c = 2; c < w; c += 3) { ctx.moveTo(x + c + 0.5, y); ctx.lineTo(x + c + 0.5, y + h); }
    ctx.stroke();
    for (let i = 0; i < 3; i++) fr(ctx, 'rgba(120,70,40,0.14)', x + rnd() * w, y + rnd() * h, 3 + rnd() * 6, 8 + rnd() * 14);
  } else if (kind === 'siding') {
    ctx.strokeStyle = shade(wall, 0.8);
    ctx.beginPath();
    for (let r = 3; r < h; r += 3) { ctx.moveTo(x, y + r + 0.5); ctx.lineTo(x + w, y + r + 0.5); }
    ctx.stroke();
  } else {
    fr(ctx, vgrad(ctx, x, y, h, [[0, shade(wall, 1.3)], [1, shade(wall, 0.8)]]), x, y, w, h);
  }
}

function drawWindow(ctx: Ctx, wx: number, wy: number, ww: number, wh: number, pat: number, lit: number, trim: string, rnd: () => number): void {
  // lit: 0 dark, 1 warm, 2 cool tv, 3 warm with curtain
  const glass = lit === 0 ? '#0f141b' : lit === 2 ? '#6d9fcb' : '#f0b45a';
  const arched = pat === 1;
  fr(ctx, trim, wx - 1, wy - 1, ww + 2, wh + 2 + (pat === 0 || pat === 4 ? 1 : 0));
  if (arched) {
    ctx.fillStyle = trim; ctx.beginPath(); ctx.arc(wx + ww / 2, wy, ww / 2 + 1, Math.PI, 0); ctx.fill();
    ctx.fillStyle = glass; ctx.beginPath(); ctx.arc(wx + ww / 2, wy, ww / 2, Math.PI, 0); ctx.fill();
  }
  ctx.fillStyle = vgrad(ctx, wx, wy, wh, lit === 0 ? [[0, '#16202b'], [1, '#090c11']] : [[0, glass], [1, shade(glass, 0.72)]]);
  ctx.fillRect(wx, wy, ww, wh);
  if (lit === 0) { ctx.fillStyle = 'rgba(120,160,200,0.14)'; ctx.beginPath(); ctx.moveTo(wx + 1, wy + wh - 1); ctx.lineTo(wx + ww * 0.55, wy + 1); ctx.lineTo(wx + ww * 0.8, wy + 1); ctx.lineTo(wx + ww * 0.3, wy + wh - 1); ctx.closePath(); ctx.fill(); }
  if (lit === 3) fr(ctx, 'rgba(120,40,40,0.55)', wx, wy, ww * 0.45, wh);
  if (lit === 1 && rnd() < 0.5) fr(ctx, 'rgba(60,30,10,0.55)', wx + ww * 0.3, wy + wh * 0.35, ww * 0.35, wh * 0.65); // a figure or furniture
  if (pat === 0 || pat === 2 || pat === 5) { fr(ctx, trim, wx + ww / 2 - 0.5, wy, 1, wh); }
  if (pat === 4) { fr(ctx, trim, wx + ww / 2 - 0.5, wy, 1, wh); fr(ctx, trim, wx, wy + wh * 0.4, ww, 1); }
  fr(ctx, shade(trim, 1.15), wx - 2, wy + wh, ww + 4, 2); // sill
}

function litState(rnd: () => number, bias: number): number {
  const r = rnd();
  if (r < 0.34 * bias) return 1;
  if (r < 0.40 * bias) return 2;
  if (r < 0.47 * bias) return 3;
  return 0;
}

function drawUpperWindows(ctx: Ctx, b: Building, L: Layout, rnd: () => number): void {
  const { x, W, st } = L;
  const top = L.fy + 8;
  const bottom = L.signY - 3;
  const avail = bottom - top;
  if (avail < 8) return;
  const floors = Math.max(1, Math.floor(avail / st.floorH));
  const fh = avail / floors;
  const pat = b.windows;
  const trim = shade(L.wall, 1.45);
  let ww = 9, wh = Math.min(13, fh - 6), gap = 7;
  if (pat === 2) { ww = 10; wh = Math.min(10, fh - 6); gap = 8; }
  if (pat === 3) { ww = 20; wh = Math.min(9, fh - 6); gap = 4; }
  if (pat === 4) { ww = 6; wh = Math.min(14, fh - 5); gap = 4; }
  if (pat === 5) { ww = 7; wh = Math.min(8, fh - 6); gap = 8; }
  if (b.style === 'tower') { ww = 8; wh = Math.min(9, fh - 4); gap = 3; }
  if (b.style === 'financial') { ww = 8; wh = Math.min(15, fh - 5); gap = 9; }
  if (wh < 4) wh = 4;
  const cols = Math.max(1, Math.floor((W - 8 + gap) / (ww + gap)));
  const used = cols * ww + (cols - 1) * gap;
  const x0 = x + (W - used) / 2;
  const bias = b.style === 'neon' || b.style === 'theatre' ? 0.7 : b.style === 'tower' ? 1.3 : 1;
  const fire = (b.style === 'tenement' || b.style === 'little_italy' || b.style === 'arthur_shop') && hash2(b.id, 21) < 0.7;
  const fireCol = cols > 2 ? Math.floor(hash2(b.id, 22) * (cols - 1)) : 0;
  for (let f = 0; f < floors; f++) {
    const wy = top + f * fh + (fh - wh) / 2;
    for (let c = 0; c < cols; c++) {
      const wx = x0 + c * (ww + gap);
      drawWindow(ctx, wx, wy, ww, wh, pat, litState(rnd, bias), trim, rnd);
    }
    // string course between floors on stone fronts
    if (st.face === 'stone' && f > 0) fr(ctx, 'rgba(255,255,255,0.08)', x, top + f * fh - 1, W, 1);
  }
  if (fire) { // black iron fire escape in front of two window columns
    const fx = x0 + fireCol * (ww + gap) - 3, fw = ww * 2 + gap + 6;
    ctx.strokeStyle = 'rgba(8,8,10,0.9)'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let f = 0; f < floors; f++) {
      const gy = top + f * fh + fh - 3;
      ctx.moveTo(fx, gy); ctx.lineTo(fx + fw, gy);
      ctx.moveTo(fx, gy - 4); ctx.lineTo(fx + fw, gy - 4);
      if (f < floors - 1) { ctx.moveTo(fx + fw - 2, gy); ctx.lineTo(fx + 3, gy + fh - 3); }
    }
    ctx.stroke();
    ctx.lineWidth = 1;
  }
  if (b.style === 'brownstone') { // heavy cornice shadow and bay
    fr(ctx, 'rgba(0,0,0,0.18)', x, L.fy + 6, W, 4);
  }
}

function signText(ctx: Ctx, L: Layout, cx: number, cy: number, maxW: number, color: string, shadow?: string): void {
  const { lines, fs } = L;
  ctx.font = `bold ${fs}px "Plus Jakarta Sans", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lh = fs + 1;
  lines.forEach((ln, i) => {
    const yy = cy + (i - (lines.length - 1) / 2) * lh;
    const est = ln.length * fs * 0.6;
    const sx = est > maxW ? Math.max(0.55, maxW / est) : 1;
    ctx.save();
    ctx.translate(cx, yy);
    ctx.scale(sx, 1);
    if (shadow) { ctx.shadowColor = shadow; ctx.shadowBlur = 5; }
    ctx.fillStyle = color;
    ctx.fillText(ln, 0, 0);
    ctx.restore();
  });
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'rgba(0,0,0,0)';
}

function drawStorefront(ctx: Ctx, b: Building, L: Layout, rnd: () => number): void {
  const { x, W, H, G } = L;
  const y = L.y + H - G;
  const accent = AWNING[(b.palette + b.windows + b.roof) % AWNING.length];
  const neon = NEON_COLORS[Math.floor(hash2(b.id, 11) * NEON_COLORS.length)];
  const dw = L.cat === 'grand' ? 12 : 10;
  const doorLeft = rnd() < 0.5;
  const dx = doorLeft ? x + 6 : x + W - 6 - dw;
  const trim = shade(L.wall, 1.4);
  const signBg = (c: string): void => { fr(ctx, c, x + 2, L.signY, W - 4, L.signH); fr(ctx, 'rgba(255,255,255,0.12)', x + 2, L.signY, W - 4, 1); fr(ctx, 'rgba(0,0,0,0.4)', x + 2, L.signY + L.signH - 1, W - 4, 1); };
  const shopWindow = (wx: number, ww: number, warm: string): void => {
    fr(ctx, trim, wx - 1, y + 3, ww + 2, G - 3);
    ctx.fillStyle = vgrad(ctx, wx, y + 4, G - 5, [[0, warm], [1, shade(warm, 0.45)]]);
    ctx.fillRect(wx, y + 4, ww, G - 6);
    fr(ctx, 'rgba(0,0,0,0.35)', wx, y + G - 9, ww, 5); // goods in the window
    for (let i = 0; i < ww - 4; i += 5) fr(ctx, 'rgba(255,230,180,0.4)', wx + 2 + i, y + G - 11, 2, 2);
  };
  fr(ctx, shade(L.wall, 0.8), x, y, W, G);
  const winX = doorLeft ? dx + dw + 4 : x + 4;
  const winW = W - dw - 14;
  const doorCol = shade(accent, 0.7);
  const door = (lit: string): void => {
    fr(ctx, trim, dx - 1, y + 3, dw + 2, G - 3);
    fr(ctx, doorCol, dx, y + 4, dw, G - 4);
    fr(ctx, lit, dx + 2, y + 6, dw - 4, 7);
    fr(ctx, '#d8b868', dx + dw - 3, y + G / 2 + 2, 1.5, 2);
  };
  switch (L.cat) {
    case 'shop': {
      shopWindow(winX, winW, rnd() < 0.5 ? '#f2c36d' : '#e8a95a');
      door('#f0c070');
      signBg(shade(accent, 0.55));
      signText(ctx, L, x + W / 2, L.signY + L.signH / 2, W - 10, '#f3e6c4');
      // striped awning under the sign
      for (let i = 0; i < Math.ceil((W - 4) / 6); i++) fr(ctx, i % 2 ? '#e9e1cf' : accent, x + 2 + i * 6, y + 2, Math.min(6, W - 4 - i * 6), 5);
      for (let i = 0; i < Math.ceil((W - 4) / 6); i++) disc(ctx, i % 2 ? '#e9e1cf' : accent, x + 5 + i * 6, y + 7, 3);
      fr(ctx, 'rgba(0,0,0,0.3)', x + 2, y + 10, W - 4, 2);
      break;
    }
    case 'neon': {
      shopWindow(winX, winW, '#3a2a3a');
      fr(ctx, rgba(neon, 0.25), winX, y + 4, winW, G - 6);
      ctx.strokeStyle = neon; ctx.lineWidth = 1.4; ctx.shadowColor = neon; ctx.shadowBlur = 6;
      ctx.strokeRect(winX + 1.5, y + 5.5, winW - 3, G - 9);
      ctx.shadowBlur = 0; ctx.lineWidth = 1;
      door(rgba(neon, 0.85));
      signBg('#0b0b10');
      signText(ctx, L, x + W / 2, L.signY + L.signH / 2, W - 10, neon, neon);
      break;
    }
    case 'grand': {
      fr(ctx, shade(L.wall, 1.25), x, y, W, G);
      const cols = Math.max(2, Math.floor(W / 24));
      for (let i = 0; i <= cols; i++) fr(ctx, shade(L.wall, 1.55), x + (W - 5) * (i / cols), y, 5, G);
      fr(ctx, '#0c1118', x + W / 2 - 10, y + 5, 20, G - 5);
      fr(ctx, 'rgba(240,200,120,0.7)', x + W / 2 - 8, y + 7, 16, G - 9);
      fr(ctx, '#b99a52', x + W / 2 - 0.5, y + 7, 1, G - 9);
      fr(ctx, shade(L.wall, 1.7), x, y + G - 3, W, 3); // steps
      signBg(shade(L.wall, 0.6));
      signText(ctx, L, x + W / 2, L.signY + L.signH / 2, W - 10, '#d9bd72');
      break;
    }
    case 'marquee': {
      fr(ctx, '#15121a', x, y, W, G);
      fr(ctx, '#2b1d30', x + 4, y + 8, W - 8, G - 8);
      const posters = Math.max(2, Math.floor(W / 22));
      for (let i = 0; i < posters; i++) fr(ctx, NEON_COLORS[(b.id + i) % 6], x + 8 + i * ((W - 16) / posters), y + 10, 9, G - 14);
      const mh = L.signH + 3;
      fr(ctx, '#2a0f14', x + 1, L.signY - 2, W - 2, mh);
      fr(ctx, '#f6e2a8', x + 3, L.signY, W - 6, L.signH - 1);
      signText(ctx, L, x + W / 2, L.signY + L.signH / 2 - 0.5, W - 10, '#6b1218');
      ctx.fillStyle = '#ffe38a';
      for (let i = 0; i < W - 4; i += 5) { ctx.fillRect(x + 2 + i, L.signY - 2, 2, 2); ctx.fillRect(x + 2 + i, L.signY + L.signH, 2, 2); }
      // vertical blade
      const bx = doorLeft ? x + W - 9 : x + 2;
      fr(ctx, '#2a0f14', bx, L.fy + 8, 7, L.signY - L.fy - 8);
      for (let yy = L.fy + 10; yy < L.signY - 2; yy += 5) fr(ctx, yy % 10 === 0 ? neon : '#ffe38a', bx + 2, yy, 3, 3);
      break;
    }
    case 'industrial': {
      fr(ctx, shade(L.wall, 0.7), x, y, W, G);
      const bays = W >= 96 ? 2 : 1;
      const bw = (W - 8 - (bays - 1) * 4) / bays;
      for (let i = 0; i < bays; i++) {
        const bx = x + 4 + i * (bw + 4);
        fr(ctx, '#2b2f34', bx, y + 3, bw, G - 3);
        ctx.fillStyle = vgrad(ctx, bx, y + 3, G - 3, [[0, '#59606a'], [1, '#3a4047']]);
        ctx.fillRect(bx + 1, y + 4, bw - 2, G - 5 - rnd() * 7);
        ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath();
        for (let r = 6; r < G; r += 3) { ctx.moveTo(bx + 1, y + r + 0.5); ctx.lineTo(bx + bw - 1, y + r + 0.5); }
        ctx.stroke();
        fr(ctx, '#d9a21b', bx - 1, y + G - 6, 2, 6); fr(ctx, '#d9a21b', bx + bw - 1, y + G - 6, 2, 6);
      }
      fr(ctx, '#2c2f34', x, y + G - 2, W, 2);
      signBg('#202326');
      signText(ctx, L, x + W / 2, L.signY + L.signH / 2, W - 10, '#e5ddc6');
      fr(ctx, 'rgba(255,210,120,0.6)', x + W / 2 - 2, L.signY - 3, 4, 2); // caged work lamp
      break;
    }
    case 'hangar': {
      fr(ctx, '#2a3036', x + 3, y + 2, W - 6, G - 2);
      ctx.fillStyle = vgrad(ctx, x + 4, y + 3, G - 4, [[0, '#7c848c'], [1, '#434a52']]);
      ctx.fillRect(x + 4, y + 3, W - 8, G - 4);
      ctx.fillStyle = '#d9a21b';
      for (let i = 0; i < W - 12; i += 12) { ctx.beginPath(); ctx.moveTo(x + 6 + i, y + G - 1); ctx.lineTo(x + 12 + i, y + G - 1); ctx.lineTo(x + 18 + i, y + G - 7); ctx.lineTo(x + 12 + i, y + G - 7); ctx.closePath(); ctx.fill(); }
      fr(ctx, 'rgba(0,0,0,0.5)', x + W / 2 - 0.5, y + 3, 1, G - 4);
      signBg('#d9d4c6');
      signText(ctx, L, x + W / 2, L.signY + L.signH / 2, W - 10, '#1d2a3a');
      break;
    }
    default: { // 'none': a doorway, stoop, and a small name plate
      const win = (wx: number): void => { fr(ctx, trim, wx - 1, y + 4, 10, 11); fr(ctx, rnd() < 0.5 ? '#f0b45a' : '#10151c', wx, y + 5, 8, 9); ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.beginPath(); ctx.moveTo(wx + 4, y + 5); ctx.lineTo(wx + 4, y + 14); ctx.stroke(); };
      if (W >= 96) win(doorLeft ? dx + dw + 8 : x + 6);
      win(doorLeft ? x + W - 16 : x + 8 + (W >= 96 ? 22 : 0) * 0 + (W >= 96 ? 22 : 0));
      door('#f0c070');
      fr(ctx, shade(L.wall, 1.6), dx - 3, y + G - 3, dw + 6, 3); // stoop
      fr(ctx, shade(L.wall, 1.35), dx - 1, y + G - 6, dw + 2, 3);
      signBg(shade(L.wall, 0.55));
      signText(ctx, L, x + W / 2, L.signY + L.signH / 2, W - 10, '#cfc4a8');
    }
  }
  // racket landmark: gold sconces and a brass diamond over the door
  if (b.racketId) {
    for (const sx of [dx - 4, dx + dw + 3]) { disc(ctx, '#ffd36a', sx, y + 8, 1.8); }
    ctx.fillStyle = '#e8c35a'; ctx.beginPath();
    ctx.moveTo(dx + dw / 2, y - 2); ctx.lineTo(dx + dw / 2 + 3, y + 1); ctx.lineTo(dx + dw / 2, y + 4); ctx.lineTo(dx + dw / 2 - 3, y + 1); ctx.closePath(); ctx.fill();
  }
}

function drawRoofItems(ctx: Ctx, b: Building, L: Layout, rnd: () => number): void {
  const { x, y, W, R } = L;
  const flat = L.st.pitch === 'flat' || L.st.pitch === 'tower';
  const set = b.roof % 8;
  const iy = y + 8, ih = R - 14;
  if (ih < 8) return;
  const placeX = (w: number): number => x + 5 + rnd() * Math.max(0, W - 10 - w);
  const box = (bx: number, by: number, w: number, h: number, c: string): void => {
    fr(ctx, 'rgba(0,0,0,0.3)', bx + 2, by + h, w, 2);
    fr(ctx, shade(c, 0.8), bx, by + 3, w, h - 3); fr(ctx, c, bx, by, w, 4);
  };
  if (!flat) { // pitched roofs carry chimneys, vents and antennas
    const k = set % 3;
    const cx0 = placeX(8);
    if (k === 0) { box(cx0, y + 4, 6, 9, '#6a3a2e'); fr(ctx, '#1a1010', cx0 + 1, y + 4, 4, 2); }
    else if (k === 1) { disc(ctx, '#8d9298', cx0 + 4, y + 10, 3.5); disc(ctx, '#31353a', cx0 + 4, y + 10, 1.6); }
    else { ctx.strokeStyle = '#111'; ctx.beginPath(); ctx.moveTo(cx0 + 3, y + 12); ctx.lineTo(cx0 + 3, y + 2); ctx.moveTo(cx0, y + 5); ctx.lineTo(cx0 + 6, y + 5); ctx.moveTo(cx0 + 1, y + 8); ctx.lineTo(cx0 + 5, y + 8); ctx.stroke(); }
    return;
  }
  switch (set) {
    case 0: { // water tower on stilts, with a stair bulkhead
      const tx = placeX(16);
      fr(ctx, 'rgba(0,0,0,0.3)', tx + 3, iy + ih - 2, 14, 4);
      ctx.strokeStyle = '#2b1f16'; ctx.beginPath(); ctx.moveTo(tx + 2, iy + ih); ctx.lineTo(tx + 4, iy + 8); ctx.moveTo(tx + 14, iy + ih); ctx.lineTo(tx + 12, iy + 8); ctx.stroke();
      fr(ctx, '#6b4b36', tx, iy - 2, 16, 12); fr(ctx, '#3a2a1e', tx, iy + 2, 16, 1); fr(ctx, '#3a2a1e', tx, iy + 6, 16, 1);
      ctx.fillStyle = '#7d5a41'; ctx.beginPath(); ctx.moveTo(tx - 1, iy - 2); ctx.lineTo(tx + 8, iy - 8); ctx.lineTo(tx + 17, iy - 2); ctx.closePath(); ctx.fill();
      break;
    }
    case 1: { // air conditioning units
      const n = 2 + (rnd() < 0.5 ? 1 : 0);
      for (let i = 0; i < n; i++) { const bx = placeX(14); box(bx, iy + rnd() * (ih - 12), 14, 10, '#8f949b'); disc(ctx, '#3b3f45', bx + 7, iy + 5, 3); }
      break;
    }
    case 2: { // skylights and vents
      const sx = placeX(18);
      fr(ctx, '#2a3b4a', sx, iy + 1, 18, 10); fr(ctx, 'rgba(130,190,230,0.45)', sx + 1, iy + 2, 16, 8); fr(ctx, 'rgba(255,255,255,0.15)', sx + 3, iy + 2, 3, 8);
      const vx = placeX(6); disc(ctx, '#8d9298', vx + 3, iy + ih - 3, 3);
      break;
    }
    case 3: { // antennas and a dish
      const ax = placeX(14);
      ctx.strokeStyle = '#0d0d10'; ctx.lineWidth = 1; ctx.beginPath();
      ctx.moveTo(ax + 5, iy + ih); ctx.lineTo(ax + 5, iy - 3); ctx.moveTo(ax, iy + 3); ctx.lineTo(ax + 10, iy + 3); ctx.moveTo(ax + 1, iy + 7); ctx.lineTo(ax + 9, iy + 7);
      ctx.stroke();
      disc(ctx, '#c9ccd0', ax + 16, iy + 6, 4); disc(ctx, '#7c8187', ax + 16, iy + 6, 2);
      break;
    }
    case 4: { // brick chimneys
      const cx0 = placeX(14);
      box(cx0, iy, 6, 10, '#6a3a2e'); box(cx0 + 9, iy + 2, 6, 9, '#7a4636');
      fr(ctx, '#140d0b', cx0 + 1, iy, 4, 2);
      break;
    }
    case 5: { // rooftop billboard
      const bx = placeX(26);
      fr(ctx, '#17191d', bx, iy - 1, 26, 10);
      const c = NEON_COLORS[Math.floor(hash2(b.id, 31) * 6)];
      fr(ctx, shade(c, 0.45), bx + 1, iy, 24, 8); fr(ctx, c, bx + 3, iy + 2, 12, 2); fr(ctx, 'rgba(255,255,255,0.7)', bx + 3, iy + 5, 8, 1);
      break;
    }
    case 6: { // clothesline and tarp
      const lx = x + 5;
      ctx.strokeStyle = 'rgba(220,220,210,0.5)'; ctx.beginPath(); ctx.moveTo(lx, iy + 4); ctx.lineTo(x + W - 5, iy + 4); ctx.stroke();
      for (let i = 0; i < 4; i++) fr(ctx, ['#c9c2b0', '#8a1c1c', '#1d3f7a', '#cfae4a'][i], lx + 6 + i * ((W - 24) / 4), iy + 4, 6, 7);
      fr(ctx, '#2f4a3a', placeX(14), iy + ih - 8, 14, 7);
      break;
    }
    default: { // stair bulkhead with pipes and a puddle
      const bx = placeX(16);
      box(bx, iy, 16, 12, '#5e6064'); fr(ctx, '#17191d', bx + 11, iy + 5, 4, 7);
      ctx.strokeStyle = '#2b2e33'; ctx.beginPath(); ctx.moveTo(x + 4, iy + ih - 2); ctx.lineTo(x + W - 4, iy + ih - 2); ctx.stroke();
      fr(ctx, 'rgba(110,150,190,0.2)', placeX(18), iy + ih - 6, 18, 4);
    }
  }
}

function drawRoof(ctx: Ctx, b: Building, L: Layout, rnd: () => number): void {
  const { x, y, W, R, st } = L;
  const tone = shade(st.roof, 0.85 + (b.palette % 4) * 0.1);
  if (st.pitch === 'gable') {
    const shingle = mix(L.wall, st.roof, 0.65);
    fr(ctx, shade(shingle, 1.12), x, y, W, R / 2);
    fr(ctx, shade(shingle, 0.78), x, y + R / 2, W, R / 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath();
    for (let r = 4; r < R; r += 4) { ctx.moveTo(x, y + r + 0.5); ctx.lineTo(x + W, y + r + 0.5); }
    ctx.stroke();
    fr(ctx, 'rgba(255,230,190,0.28)', x, y + R / 2 - 1, W, 1.5); // ridge
    fr(ctx, 'rgba(0,0,0,0.35)', x, y, 1, R); fr(ctx, 'rgba(0,0,0,0.35)', x + W - 1, y, 1, R);
  } else if (st.pitch === 'barrel') {
    ctx.fillStyle = vgrad(ctx, x, y, R, [[0, shade(st.roof, 1.15)], [0.45, shade(st.roof, 1.3)], [1, shade(st.roof, 0.6)]]);
    ctx.fillRect(x, y, W, R);
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath();
    for (let c = 8; c < W; c += 10) { ctx.moveTo(x + c + 0.5, y); ctx.lineTo(x + c + 0.5, y + R); }
    ctx.stroke();
    fr(ctx, 'rgba(255,255,255,0.12)', x, y + R * 0.3, W, 2);
  } else {
    fr(ctx, shade(L.wall, 1.1), x, y, W, R); // parapet
    fr(ctx, tone, x + 3, y + 3, W - 6, R - 7);
    fr(ctx, 'rgba(0,0,0,0.35)', x + 3, y + 3, W - 6, 2);
    for (let i = 0; i < 14; i++) fr(ctx, 'rgba(255,255,255,0.05)', x + 4 + rnd() * (W - 9), y + 5 + rnd() * (R - 11), 1.5, 1.5); // gravel
    if (st.pitch === 'tower') { // setback crown
      const m = Math.max(8, W * 0.2);
      fr(ctx, shade(L.wall, 0.8), x + m, y + 6, W - m * 2, R - 14);
      fr(ctx, shade(L.wall, 1.15), x + m, y + 6, W - m * 2, 2);
      fr(ctx, 'rgba(0,0,0,0.3)', x + m, y + R - 8, W - m * 2, 2);
      ctx.strokeStyle = '#111'; ctx.beginPath(); ctx.moveTo(x + W / 2, y + 7); ctx.lineTo(x + W / 2, y - 0); ctx.stroke();
      disc(ctx, '#ff3b30', x + W / 2, y + 1, 1.2);
    } else drawRoofItems(ctx, b, L, rnd);
  }
}

function drawBuilding(ctx: Ctx, b: Building): void {
  const L = layoutOf(b);
  const rnd = mulberry32(Math.imul(b.id + 1, 2654435761) >>> 0);
  const { x, y, W, H, st } = L;
  // roof on top
  drawRoof(ctx, b, L, rnd);
  // front face below
  const fy = L.fy;
  drawFace(ctx, st.face, x, fy, W, L.F, L.wall, rnd);
  // lamp-warm wash toward the street, cooler and darker higher up
  ctx.fillStyle = vgrad(ctx, x, fy, L.F, [[0, 'rgba(6,10,26,0.34)'], [0.55, 'rgba(6,10,26,0.08)'], [1, 'rgba(255,160,70,0.14)']]);
  ctx.fillRect(x, fy, W, L.F);
  // cornice between roof and front
  fr(ctx, shade(L.wall, 1.5), x, fy, W, 4);
  fr(ctx, 'rgba(255,255,255,0.22)', x, fy, W, 1);
  fr(ctx, 'rgba(0,0,0,0.45)', x, fy + 4, W, 2);
  if (b.style === 'financial' || b.style === 'brownstone' || b.style === 'theatre') for (let c = 2; c < W - 3; c += 6) fr(ctx, shade(L.wall, 1.65), x + c, fy + 4, 3, 2);
  drawUpperWindows(ctx, b, L, rnd);
  drawStorefront(ctx, b, L, rnd);
  // party wall seams
  fr(ctx, 'rgba(0,0,0,0.45)', x, y, 1, H);
  fr(ctx, 'rgba(0,0,0,0.45)', x + W - 1, y, 1, H);
  fr(ctx, 'rgba(0,0,0,0.6)', x, y + H - 1, W, 1);
  if (b.racketId) { // landmark trim
    ctx.strokeStyle = 'rgba(232,195,90,0.85)'; ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 0.75, y + 0.75, W - 1.5, H - 1.5);
    ctx.lineWidth = 1;
  }
}

function drawNeonBake(ctx: Ctx, b: Building): void {
  const n = neonOf(b);
  if (!n) return;
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, n.x, n.y + 6, Math.max(n.rx * 0.6, 38), n.color, 0.22);
  ctx.globalCompositeOperation = 'source-over';
}

// ---------------------------------------------------------------- lamps

function drawLampPool(ctx: Ctx, x: number, y: number): void {
  glow(ctx, x, y + 4, 78, '#ffaa46', 0.15);
}
function drawLampPost(ctx: Ctx, x: number, y: number): void {
  fr(ctx, 'rgba(0,0,0,0.35)', x - 3, y, 8, 3);
  fr(ctx, '#17181b', x - 1, y - 14, 2, 15);
  fr(ctx, '#17181b', x - 3, y - 16, 7, 3);
  disc(ctx, '#ffd9a0', x + 0.5, y - 14, 2.2);
  glow(ctx, x + 0.5, y - 14, 9, '#ffb86a', 0.7);
}

// ---------------------------------------------------------------- the chunk

export function drawCityChunk(ctx: CanvasRenderingContext2D, city: City, chunkX: number, chunkY: number): void {
  const ox = chunkX * CHUNK, oy = chunkY * CHUNK;
  const c0x = Math.floor(ox / CELL), c1x = Math.ceil((ox + CHUNK) / CELL) - 1;
  const c0y = Math.floor(oy / CELL), c1y = Math.ceil((oy + CHUNK) / CELL) - 1;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, CHUNK, CHUNK);
  ctx.clip();
  ctx.translate(-ox, -oy);

  // 1 ground
  for (let cy = c0y; cy <= c1y; cy++) for (let cx = c0x; cx <= c1x; cx++) drawGroundCell(ctx, city, cx, cy);
  for (let cy = c0y; cy <= c1y; cy++) for (let cx = c0x; cx <= c1x; cx++) drawFurniture(ctx, city, cx, cy);

  // 2 lamp pools lie on the ground, under buildings
  const ix = indexOf(city);
  const bx = (cx: number, cy: number): number => cy * 64 + cx;
  const near = <T>(map: Map<number, T[]>): T[] => {
    const out: T[] = [];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const cx = chunkX + dx, cy = chunkY + dy;
      if (cx < 0 || cy < 0) continue;
      const a = map.get(bx(cx, cy));
      if (a) for (const v of a) out.push(v);
    }
    return out;
  };
  const lamps = near(ix.lamps);
  for (const l of lamps) if (l.x > ox - 90 && l.x < ox + CHUNK + 90 && l.y > oy - 90 && l.y < oy + CHUNK + 90) drawLampPool(ctx, l.x, l.y);

  // 3 buildings overlapping this piece (with a margin for glow), each drawn whole and clipped by the piece
  const seen = new Set<number>();
  const buildings: Building[] = [];
  for (let cy = c0y - 2; cy <= c1y + 2; cy++) {
    for (let cx = c0x - 2; cx <= c1x + 2; cx++) {
      if (cx < 0 || cy < 0 || cx >= city.cols || cy >= city.rows) continue;
      const id = city.buildingAt[cy * city.cols + cx];
      if (id < 0 || seen.has(id)) continue;
      seen.add(id);
      buildings.push(city.buildings[id]);
    }
  }
  buildings.sort((a, b) => a.cy + a.ch - (b.cy + b.ch));
  for (const b of buildings) {
    const x = b.cx * CELL, y = b.cy * CELL, w = b.cw * CELL, h = b.ch * CELL;
    if (x + w < ox || x > ox + CHUNK || y + h < oy || y > oy + CHUNK) continue;
    drawBuilding(ctx, b);
  }
  // street-level shadow cast on the sidewalk below each building
  for (const b of buildings) {
    const x = b.cx * CELL, y = (b.cy + b.ch) * CELL, w = b.cw * CELL;
    if (x + w < ox || x > ox + CHUNK || y + 8 < oy || y > oy + CHUNK) continue;
    ctx.fillStyle = vgrad(ctx, x, y, 8, [[0, 'rgba(0,0,0,0.38)'], [1, 'rgba(0,0,0,0)']]);
    ctx.fillRect(x, y, w, 8);
  }
  for (const b of buildings) drawNeonBake(ctx, b);

  // 4 trees overhang their cells, so draw them after the ground and the buildings' neighbours
  for (let cy = c0y - 1; cy <= c1y + 1; cy++) for (let cx = c0x - 1; cx <= c1x + 1; cx++) if (kd(city, cx, cy) === K.PARK) drawTree(ctx, cx, cy);

  // 5 lamp posts
  for (const l of lamps) if (l.x > ox - 12 && l.x < ox + CHUNK + 12 && l.y > oy - 4 && l.y < oy + CHUNK + 20) drawLampPost(ctx, l.x, l.y);

  // 6 faint neighbourhood names painted across the streets
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 30px Cinzel, Georgia, serif';
  for (const lab of NEIGHBOURHOOD_LABELS) {
    const half = lab.name.length * 11 + 20;
    if (lab.x + half < ox || lab.x - half > ox + CHUNK || lab.y + 30 < oy || lab.y - 30 > oy + CHUNK) continue;
    ctx.fillStyle = 'rgba(255,226,170,0.10)';
    ctx.fillText(lab.name, lab.x, lab.y);
  }
  ctx.restore();
}

// ---------------------------------------------------------------- the per-frame overlay

/**
 * Lamp pools and neon flicker for the visible rectangle only. `view` is in world pixels and the context must
 * already be translated so that world coordinates land on screen. Uses additive blending and restores state.
 */
export function drawCityOverlay(ctx: CanvasRenderingContext2D, city: City, view: { x: number; y: number; w: number; h: number }, timeSec: number): void {
  const ix = indexOf(city);
  const pad = 130;
  const cx0 = Math.max(0, Math.floor((view.x - pad) / CHUNK)), cx1 = Math.floor((view.x + view.w + pad) / CHUNK);
  const cy0 = Math.max(0, Math.floor((view.y - pad) / CHUNK)), cy1 = Math.floor((view.y + view.h + pad) / CHUNK);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  // one gradient, reused for every lamp through translate and scale
  const lampG = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  lampG.addColorStop(0, 'rgba(255,170,70,0.27)');
  lampG.addColorStop(0.4, 'rgba(255,150,50,0.08)');
  lampG.addColorStop(1, 'rgba(255,140,40,0)');
  const R = 96;
  for (let cy = cy0; cy <= cy1; cy++) {
    for (let cx = cx0; cx <= cx1; cx++) {
      const lamps = ix.lamps.get(cy * 64 + cx);
      if (!lamps) continue;
      for (const l of lamps) {
        if (l.x < view.x - R || l.x > view.x + view.w + R || l.y < view.y - R || l.y > view.y + view.h + R) continue;
        const buzz = l.i % 11 === 0 ? 0.8 + 0.2 * Math.sin(timeSec * 31 + l.i) * (Math.sin(timeSec * 1.7 + l.i) > 0.6 ? 1 : 0.2) : 1;
        ctx.save();
        ctx.translate(l.x, l.y + 4);
        ctx.scale(R, R * 0.8);
        ctx.globalAlpha = buzz;
        ctx.fillStyle = lampG;
        ctx.fillRect(-1, -1, 2, 2);
        ctx.restore();
      }
    }
  }
  for (let cy = cy0; cy <= cy1; cy++) {
    for (let cx = cx0; cx <= cx1; cx++) {
      const list = ix.neon.get(cy * 64 + cx);
      if (!list) continue;
      for (const n of list) {
        if (n.x < view.x - n.rx || n.x > view.x + view.w + n.rx || n.y < view.y - n.ry || n.y > view.y + view.h + n.ry) continue;
        // steady hum, a fast flutter, and a rare blackout for the tired signs
        let a = 0.78 + 0.18 * Math.sin(timeSec * n.rate + n.phase);
        if (n.b > 0.7) { const t = (timeSec * 0.9 + n.phase) % 6; if (t < 0.18) a = 0.1; else if (t < 0.5) a *= 0.5 + 0.5 * Math.sin(timeSec * 40); }
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
        g.addColorStop(0, rgba(n.color, 0.5));
        g.addColorStop(0.4, rgba(n.color, 0.16));
        g.addColorStop(1, rgba(n.color, 0));
        ctx.save();
        ctx.translate(n.x, n.y + 10);
        ctx.scale(n.rx, n.ry);
        ctx.globalAlpha = clamp(a, 0, 1);
        ctx.fillStyle = g;
        ctx.fillRect(-1, -1, 2, 2);
        ctx.restore();
      }
    }
  }
  ctx.restore();
}
