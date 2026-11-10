/**
 * Code-drawn street figures: a Canvas 2D port of Mafia-game's `Character2DModelPreview`
 * `street-3q` mode (full body, three-quarter view, facing the camera, 100 × 120 box),
 * extended with the per-trait parts of its `portrait` mode so that every headgear, eyewear,
 * outfit, held item, build and facial-hair value has its own look.
 *
 * The default figure is turned a little toward the viewer's right (+x): the near shoulder,
 * near eye and nose sit on the right, the far ear and the far side's shade on the left.
 * Mirror with `ctx.scale(-1, 1)` at draw time to face left. Held props sit in the far hand,
 * so the near hand (FIGURE_GRIP) stays free for the engine's weapon.
 *
 * Pure module: no DOM access at load time; Node can import it.
 */
import { FAMILY_ACCENT, type CastFamily, type CharacterTraits } from './cast.ts';

export const FIGURE_W = 100;
export const FIGURE_H = 120;
/** Where the feet meet the ground, in the 100 × 120 box (anchor figures here). */
export const FIGURE_FOOT = Object.freeze({ x: 50, y: 108 });
/** Approximate near-hand position in the box for a normal build (the engine's weapon grip). */
export const FIGURE_GRIP = Object.freeze({ x: 76, y: 74 });

/** The subset of CanvasRenderingContext2D the figure uses. */
export interface Ctx2D {
  fillStyle: unknown;
  strokeStyle: unknown;
  lineWidth: number;
  lineCap: string;
  lineJoin: string;
  globalAlpha: number;
  save(): void;
  restore(): void;
  beginPath(): void;
  closePath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void;
  bezierCurveTo(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number): void;
  arc(x: number, y: number, r: number, a0: number, a1: number, ccw?: boolean): void;
  ellipse(x: number, y: number, rx: number, ry: number, rot: number, a0: number, a1: number, ccw?: boolean): void;
  rect(x: number, y: number, w: number, h: number): void;
  fill(): void;
  stroke(): void;
  clip(): void;
  fillRect(x: number, y: number, w: number, h: number): void;
  translate(x: number, y: number): void;
  scale(x: number, y: number): void;
  rotate(a: number): void;
  setLineDash(segments: number[]): void;
}

/** Anything canvas-shaped: HTMLCanvasElement, OffscreenCanvas, or a test fake. */
export interface CanvasLike {
  width: number;
  height: number;
  getContext(contextId: '2d'): Ctx2D | null;
}

// ---------------------------------------------------------------- colour helpers

const INK = '#08090C';
const NEUTRAL = '#6B7280';

/**
 * Pass as `accentHex` for people with no family (civilians): no family mark, neutral ties and
 * hat bands. Any other value that is not a hex colour behaves the same way.
 */
export const CIVILIAN_ACCENT = 'none';
const SKIN = '#D4A97D';
const SKIN_SHADE = '#B88A62';
const GOLD = '#FACC15';
const SILVER = '#CBD5E1';

function parseHex(c: unknown): [number, number, number] | null {
  if (typeof c !== 'string') return null;
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** A safe colour: the value itself if it is a hex colour, otherwise the fallback. */
function col(c: unknown, fallback: string): string {
  const p = parseHex(c);
  return p ? rgbHex(p[0], p[1], p[2]) : fallback;
}

/** k < 0 darkens toward black, k > 0 lightens toward white. */
function shade(c: string, k: number): string {
  const p = parseHex(c) ?? [85, 85, 85];
  const t = k < 0 ? 0 : 255;
  const a = Math.min(1, Math.abs(k));
  return rgbHex(p[0] + (t - p[0]) * a, p[1] + (t - p[1]) * a, p[2] + (t - p[2]) * a);
}

function mix(a: string, b: string, k: number): string {
  const p = parseHex(a) ?? [85, 85, 85];
  const q = parseHex(b) ?? p;
  return rgbHex(p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k, p[2] + (q[2] - p[2]) * k);
}

function luminance(c: string): number {
  const p = parseHex(c) ?? [85, 85, 85];
  return (0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2]) / 255;
}

/** An outline that stays visible on very dark garments. */
function edgeFor(fill: string): string {
  return luminance(fill) < 0.12 ? '#2E3440' : INK;
}

// Accent → family, so the family's signature mark can be drawn from the accent alone.
const ACCENT_FAMILY: ReadonlyMap<string, CastFamily> = new Map<string, CastFamily>([
  ...(Object.entries(FAMILY_ACCENT) as [CastFamily, string][]).map(([f, h]) => [h.toLowerCase(), f] as [string, CastFamily]),
  // Mafia-Wars' own family accents (nyc1984Data.ts) where they differ from Mafia-game's.
  ['#dc2626', 'corvini'],
  ['#d97706', 'bellini'],
]);

function familyOfAccent(accent: string): CastFamily | null {
  return ACCENT_FAMILY.get(accent.toLowerCase()) ?? null;
}

// ---------------------------------------------------------------- path helpers

function poly(ctx: Ctx2D, pts: number[]): void {
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath();
}

function rrect(ctx: Ctx2D, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function ell(ctx: Ctx2D, x: number, y: number, rx: number, ry: number, rot = 0): void {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot, 0, Math.PI * 2);
  ctx.closePath();
}

function circ(ctx: Ctx2D, x: number, y: number, r: number): void {
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.01, r), 0, Math.PI * 2);
  ctx.closePath();
}

function paint(ctx: Ctx2D, fill: string | null, stroke: string | null, lw = 1.5): void {
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.stroke();
  }
}

function line(ctx: Ctx2D, x0: number, y0: number, x1: number, y1: number, color: string, lw: number): void {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.stroke();
}

/** A limb as a round-capped thick line with an ink outline. */
function limb(ctx: Ctx2D, x0: number, y0: number, x1: number, y1: number, w: number, fill: string): void {
  ctx.lineCap = 'round';
  line(ctx, x0, y0, x1, y1, edgeFor(fill), w + 2.6);
  line(ctx, x0, y0, x1, y1, fill, w);
  ctx.lineCap = 'butt';
}

// ---------------------------------------------------------------- outfit table

type Len = 'long' | 'mid' | 'short' | 'tucked' | 'dress';
type Collar = 'lapel' | 'wide-lapel' | 'shawl' | 'turtle' | 'band' | 'open' | 'hood' | 'v' | 'none';
type Front = 'double' | 'single' | 'zip' | 'open' | 'none';
type Pattern = 'chalk' | 'houndstooth' | 'leopard' | 'velour' | 'sheen';
type Extra =
  | 'double-coats' | 'scarf' | 'racing' | 'tracksuit' | 'rivets' | 'nypd' | 'customs' | 'coveralls'
  | 'pearls' | 'sash' | 'bomber' | 'rumpled' | 'pockets' | 'yoke' | 'puffer' | 'disco' | 'tight' | 'knit';

interface OutfitSpec {
  len: Len;
  collar: Collar;
  front: Front;
  pattern?: Pattern;
  /** Trouser colour: dark by default. */
  legs?: 'match' | 'darker';
  /** Draw a skirt (female build only). */
  skirt?: boolean;
  /** Torso base colour when it is not the primary garment. */
  body?: 'secondary' | 'shirt';
  sleeves?: 'secondary' | 'shirt';
  /** A waistcoat panel in the primary colour over the body. */
  vest?: boolean;
  apron?: 'primary' | 'secondary' | 'white';
  bib?: boolean;
  belt?: 'self' | 'black';
  tie?: 'accent' | 'dark';
  bow?: boolean;
  chain?: boolean;
  /** Shawl collar in the secondary colour instead of a darker primary. */
  shawl2?: boolean;
  extra?: Extra;
}

const SHIRT_WHITE = '#E7E5E4';

const OUTFITS: Readonly<Record<string, OutfitSpec>> = {
  'chalk-overcoat': { len: 'long', collar: 'lapel', front: 'double', pattern: 'chalk' },
  'double-coats': { len: 'long', collar: 'wide-lapel', front: 'double', extra: 'double-coats' },
  'apron-waistcoat': { len: 'tucked', collar: 'open', front: 'none', body: 'shirt', sleeves: 'shirt', vest: true, apron: 'secondary' },
  'chalk-jacket': { len: 'mid', collar: 'lapel', front: 'single', pattern: 'chalk', legs: 'match', tie: 'accent' },
  'cardigan-tie': { len: 'mid', collar: 'v', front: 'single', tie: 'accent', extra: 'knit' },
  'tight-jacket': { len: 'short', collar: 'lapel', front: 'single', extra: 'tight' },
  'satin-bomber': { len: 'short', collar: 'band', front: 'zip', pattern: 'sheen', extra: 'bomber' },
  'tan-raincoat': { len: 'long', collar: 'wide-lapel', front: 'double', belt: 'self' },
  'white-linen': { len: 'mid', collar: 'lapel', front: 'single', legs: 'match' },
  'turtleneck-overcoat': { len: 'long', collar: 'turtle', front: 'open' },
  'camel-overcoat': { len: 'long', collar: 'lapel', front: 'single' },
  'white-club-jacket': { len: 'mid', collar: 'shawl', front: 'single', bow: true, shawl2: true },
  'rumpled-suit': { len: 'mid', collar: 'lapel', front: 'single', legs: 'match', tie: 'accent', extra: 'rumpled' },
  'leather-trench': { len: 'long', collar: 'wide-lapel', front: 'double', belt: 'self', pattern: 'sheen' },
  'amber-silk-shirt': { len: 'tucked', collar: 'open', front: 'single', pattern: 'sheen', chain: true, belt: 'black' },
  'canvas-work-jacket': { len: 'mid', collar: 'band', front: 'single', extra: 'pockets' },
  'amber-blazer-skirt': { len: 'short', collar: 'lapel', front: 'single', skirt: true },
  'emerald-windbreaker': { len: 'short', collar: 'band', front: 'zip', extra: 'yoke' },
  'houndstooth-scarf': { len: 'mid', collar: 'lapel', front: 'single', pattern: 'houndstooth', extra: 'scarf' },
  'racing-jacket': { len: 'short', collar: 'band', front: 'zip', pattern: 'sheen', extra: 'racing' },
  'emerald-tracksuit': { len: 'short', collar: 'band', front: 'zip', legs: 'match', pattern: 'velour', extra: 'tracksuit' },
  'hoodie-vest': { len: 'short', collar: 'hood', front: 'zip', sleeves: 'secondary', extra: 'puffer' },
  'customs-uniform': { len: 'tucked', collar: 'band', front: 'single', legs: 'darker', belt: 'black', extra: 'customs' },
  'emerald-skirt-suit': { len: 'short', collar: 'lapel', front: 'single', skirt: true },
  'riveted-peacoat': { len: 'mid', collar: 'wide-lapel', front: 'double', extra: 'rivets' },
  'mechanic-coveralls': { len: 'tucked', collar: 'band', front: 'zip', legs: 'match', belt: 'self', extra: 'coveralls' },
  'diner-apron': { len: 'dress', collar: 'band', front: 'none', apron: 'white', bib: true, skirt: true },
  'disco-leather': { len: 'short', collar: 'wide-lapel', front: 'open', pattern: 'sheen', chain: true, extra: 'disco' },
  'velour-cardigan': { len: 'mid', collar: 'shawl', front: 'single', pattern: 'velour' },
  'velour-jacket': { len: 'mid', collar: 'lapel', front: 'single', pattern: 'velour' },
  'pizza-apron': { len: 'tucked', collar: 'open', front: 'none', body: 'secondary', sleeves: 'secondary', apron: 'primary', bib: true },
  'velour-smoking': { len: 'mid', collar: 'shawl', front: 'none', pattern: 'velour', extra: 'sash', shawl2: true },
  'velour-overcoat': { len: 'long', collar: 'shawl', front: 'double', pattern: 'velour', shawl2: true },
  'velour-vest': { len: 'tucked', collar: 'open', front: 'none', body: 'secondary', sleeves: 'secondary', vest: true, pattern: 'velour' },
  'velour-matriarch': { len: 'dress', collar: 'shawl', front: 'none', pattern: 'velour', skirt: true, extra: 'pearls' },
  'nypd-uniform': { len: 'mid', collar: 'band', front: 'single', legs: 'match', belt: 'black', tie: 'dark', extra: 'nypd' },
  'leopard-blazer': { len: 'mid', collar: 'lapel', front: 'single', pattern: 'leopard', skirt: true },
  'black-peacoat': { len: 'mid', collar: 'wide-lapel', front: 'double' },
};
const DEFAULT_OUTFIT: OutfitSpec = OUTFITS['rumpled-suit'];

// ---------------------------------------------------------------- build / geometry

interface BuildSpec {
  sh: number; // shoulder half-width
  hip: number; // hip half-width
  belly: number;
  dy: number; // vertical shift of head and shoulders (tall is taller)
  limb: number; // limb thickness factor
  headW: number;
  hunch: number;
}

const BUILDS: Readonly<Record<string, BuildSpec>> = {
  stocky: { sh: 25, hip: 22, belly: 3, dy: 0, limb: 1.05, headW: 24, hunch: 0 },
  lean: { sh: 22, hip: 18, belly: 0, dy: -1, limb: 0.92, headW: 22.5, hunch: 0 },
  heavy: { sh: 28, hip: 27, belly: 7, dy: 0, limb: 1.2, headW: 25.5, hunch: 0 },
  tall: { sh: 23, hip: 19, belly: 0, dy: -6, limb: 0.98, headW: 23, hunch: 0 },
  frail: { sh: 20, hip: 17, belly: 0, dy: 2, limb: 0.8, headW: 22, hunch: 2 },
  female: { sh: 19, hip: 20, belly: 0, dy: 1, limb: 0.82, headW: 21.5, hunch: 0 },
};
const DEFAULT_BUILD: BuildSpec = BUILDS.stocky;

interface Geo {
  b: BuildSpec;
  female: boolean;
  shY: number;
  waistY: number;
  hipY: number;
  hemY: number;
  xL: number;
  xR: number;
  cx: number; // front line
  flare: number;
  pinch: number;
  hx: number;
  hy: number;
  hw: number; // head half-width
  hh: number; // head half-height
  farHand: [number, number];
  nearHand: [number, number];
  farLeg: number; // far leg centre x
  nearLeg: number;
  legW: number;
}

function geometry(t: CharacterTraits, o: OutfitSpec): Geo {
  const b = BUILDS[t.build] ?? DEFAULT_BUILD;
  const female = t.build === 'female';
  const shY = 41 + b.dy;
  const waistY = shY + 26 - b.dy * 0.3;
  const hipY = waistY + 7;
  const hemY = o.len === 'long' ? 95 : o.len === 'dress' ? 93 : o.len === 'mid' ? 83 : o.len === 'short' ? 76 : hipY;
  const xL = 50 - b.sh * 0.88;
  const xR = 50 + b.sh;
  const flare = o.len === 'long' ? 4 : o.len === 'dress' ? 6 : o.len === 'mid' ? 1.5 : 0;
  const hw = b.headW / 2;
  const hh = 12.5;
  const hy = shY - hh - 3.5 + b.hunch;
  const hx = 52.5 + b.hunch;
  const armLen = 30;
  return {
    b, female, shY, waistY, hipY, hemY, xL, xR, cx: 50 + b.sh * 0.18, flare,
    pinch: female ? 3 : 0,
    hx, hy, hw, hh,
    farHand: [xL - 2.5, shY + armLen],
    nearHand: [xR + 3.5, shY + armLen + 1],
    farLeg: 50 - b.hip * 0.42,
    nearLeg: 50 + b.hip * 0.42 + 1,
    legW: 9.5 * b.limb,
  };
}

function torsoPath(ctx: Ctx2D, g: Geo, o: OutfitSpec): void {
  const { xL, xR, shY, waistY, hemY, flare, pinch, b } = g;
  const tight = o.extra === 'tight' ? 1.5 : 0;
  ctx.beginPath();
  ctx.moveTo(xL + 5, shY - 1);
  ctx.quadraticCurveTo(xL - 1, shY, xL - 1 + tight, shY + 7);
  ctx.quadraticCurveTo(xL + pinch, waistY - 6, xL + pinch + 0.5, waistY);
  ctx.lineTo(xL - flare, hemY);
  ctx.quadraticCurveTo(50, hemY + 2.2, xR + flare, hemY);
  if (b.belly > 0) ctx.quadraticCurveTo(xR + b.belly + tight, waistY + 2, xR - pinch + 0.5, shY + 12);
  else ctx.lineTo(xR - pinch, waistY);
  ctx.quadraticCurveTo(xR + 1 - tight, shY + 3, xR - 5, shY - 1);
  ctx.quadraticCurveTo(50, shY - 4, xL + 5, shY - 1);
  ctx.closePath();
}

// ---------------------------------------------------------------- parts: body

interface Palette {
  primary: string;
  secondary: string;
  hair: string;
  accent: string;
  body: string;
  sleeve: string;
  trousers: string;
}

function palette(t: CharacterTraits, o: OutfitSpec, accent: string): Palette {
  const primary = col(t.primaryGarmentHex, '#334155');
  const secondary = col(t.secondaryGarmentHex, '#CBD5E1');
  const hair = col(t.hairColorHex, '#27272A');
  const body = o.body === 'secondary' ? secondary : o.body === 'shirt' ? SHIRT_WHITE : primary;
  const sleeve = o.sleeves === 'secondary' ? secondary : o.sleeves === 'shirt' ? SHIRT_WHITE : primary;
  const trousers =
    o.legs === 'match' ? primary : o.legs === 'darker' ? (luminance(primary) < luminance(secondary) ? primary : secondary) : '#1C1D24';
  return { primary, secondary, hair, accent, body, sleeve, trousers };
}

function drawLegs(ctx: Ctx2D, g: Geo, o: OutfitSpec, p: Palette): void {
  const skirt = g.female && !!o.skirt;
  const top = g.hipY - 4;
  const w = skirt ? g.legW * 0.62 : g.legW;
  const legFar = skirt ? '#B48C68' : shade(p.trousers, -0.25);
  const legNear = skirt ? '#C49A74' : p.trousers;
  const flare = o.extra === 'disco' ? 2.2 : 0;
  // far leg (behind), near leg (in front, a step lower)
  poly(ctx, [g.farLeg - w / 2, top, g.farLeg + w / 2, top, g.farLeg + w / 2 + flare * 0.5, 104, g.farLeg - w / 2 - flare, 104]);
  paint(ctx, legFar, edgeFor(legFar), 1.4);
  poly(ctx, [g.nearLeg - w / 2, top, g.nearLeg + w / 2, top, g.nearLeg + w / 2 + flare, 106, g.nearLeg - w / 2 - flare * 0.5, 106]);
  paint(ctx, legNear, edgeFor(legNear), 1.4);
  if (o.extra === 'tracksuit') {
    line(ctx, g.farLeg - w / 2 + 1.2, top + 4, g.farLeg - w / 2 + 0.6, 102, p.secondary, 1.6);
    line(ctx, g.nearLeg + w / 2 - 1.4, top + 4, g.nearLeg + w / 2 - 0.8, 104, p.secondary, 1.8);
  }
  // shoes, pointed toward the facing side
  const shoe = skirt ? '#111114' : '#0B0B0E';
  ell(ctx, g.farLeg + 2, 105, skirt ? 4.2 : 6, skirt ? 2.2 : 2.8);
  paint(ctx, shoe, INK, 1);
  ell(ctx, g.nearLeg + 2.6, 107.2, skirt ? 4.6 : 6.6, skirt ? 2.4 : 3);
  paint(ctx, shoe, INK, 1);
  ell(ctx, g.nearLeg + 4.5, 106.2, 1.8, 0.8);
  paint(ctx, '#4B5563', null);
}

function drawArm(ctx: Ctx2D, g: Geo, o: OutfitSpec, p: Palette, near: boolean, fam: CastFamily | null): void {
  const w = 8.6 * g.b.limb;
  const [hx, hy] = near ? g.nearHand : g.farHand;
  const sx = near ? g.xR - 3.5 : g.xL + 3.5;
  const sy = g.shY + 3;
  const ex = near ? (sx + hx) / 2 + 1.6 : (sx + hx) / 2 - 1.6;
  const ey = (sy + hy) / 2;
  const sleeve = near ? p.sleeve : shade(p.sleeve, -0.22);
  limb(ctx, sx, sy, ex, ey, w, sleeve);
  limb(ctx, ex, ey, hx, hy - 3, w * 0.94, sleeve);
  if (o.extra === 'tracksuit' || o.extra === 'racing') {
    line(ctx, sx + (near ? 2 : -2), sy + 2, hx + (near ? 2 : -2), hy - 5, p.secondary, 1.5);
  }
  if (fam === 'valenti') {
    // twin emerald sleeve stripes (street-3q)
    const off = near ? 1 : -1;
    line(ctx, sx + off * 2.6, sy + 4, ex + off * 2.6, ey + 4, '#10B981', 1.7);
    line(ctx, sx + off * 0.2, sy + 5, ex + off * 0.2, ey + 5, '#10B981', 1.7);
  }
  if (o.sleeves === 'shirt' || o.extra === 'coveralls') {
    // rolled cuffs
    line(ctx, ex - 3, ey + 1, ex + 3, ey + 1, shade(sleeve, -0.25), 2);
  }
  // cuff + hand
  circ(ctx, hx, hy, 3.5 * Math.max(0.9, g.b.limb));
  paint(ctx, near ? SKIN : SKIN_SHADE, INK, 1.3);
}

function drawPattern(ctx: Ctx2D, g: Geo, o: OutfitSpec, p: Palette): void {
  if (!o.pattern) return;
  ctx.save();
  torsoPath(ctx, g, o);
  ctx.clip();
  const x0 = g.xL - g.flare - 2;
  const x1 = g.xR + g.flare + 2;
  if (o.pattern === 'chalk') {
    ctx.globalAlpha = 0.5;
    for (let x = x0 + 3; x < x1; x += 4.2) line(ctx, x, g.shY - 2, x - 0.8, g.hemY + 3, '#A3AAB8', 0.6);
  } else if (o.pattern === 'houndstooth') {
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = shade(p.primary, -0.55);
    for (let y = g.shY; y < g.hemY + 3; y += 3.4) {
      for (let x = x0 + ((y / 3.4) % 2) * 1.7; x < x1; x += 3.4) {
        poly(ctx, [x, y, x + 1.7, y, x + 2.4, y + 1.7, x + 0.7, y + 1.7]);
        ctx.fill();
      }
    }
  } else if (o.pattern === 'leopard') {
    const spot = col(p.secondary, '#D97706');
    let k = 0;
    for (let y = g.shY + 2; y < g.hemY + 2; y += 5) {
      for (let x = x0 + (k++ % 2) * 2.5; x < x1; x += 5) {
        ell(ctx, x, y, 1.6, 1.2, 0.5);
        paint(ctx, spot, null);
        circ(ctx, x + 0.2, y, 0.55);
        paint(ctx, '#0A0A0A', null);
      }
    }
  } else {
    // velour / sheen: a soft highlight band on the lit (near) side
    ctx.globalAlpha = o.pattern === 'velour' ? 0.16 : 0.24;
    poly(ctx, [g.cx + 3, g.shY - 2, g.cx + 8, g.shY - 2, g.cx + 6, g.hemY + 3, g.cx + 1, g.hemY + 3]);
    paint(ctx, '#FFFFFF', null);
    if (o.pattern === 'sheen') {
      ctx.globalAlpha = 0.14;
      poly(ctx, [g.xR - 5, g.shY + 2, g.xR - 2.5, g.shY + 2, g.xR - 2, g.hemY, g.xR - 4.5, g.hemY]);
      paint(ctx, '#FFFFFF', null);
    }
  }
  ctx.restore();
}

/** Far-side shade, so the body reads as turned. */
function drawBodyShade(ctx: Ctx2D, g: Geo, o: OutfitSpec): void {
  ctx.save();
  torsoPath(ctx, g, o);
  ctx.clip();
  ctx.globalAlpha = 0.26;
  poly(ctx, [g.xL - 8, g.shY - 4, g.xL + (g.cx - g.xL) * 0.45, g.shY - 4, g.xL + (g.cx - g.xL) * 0.35, g.hemY + 4, g.xL - 8, g.hemY + 4]);
  paint(ctx, '#000000', null);
  ctx.restore();
}

function drawTorso(ctx: Ctx2D, g: Geo, o: OutfitSpec, p: Palette, fam: CastFamily | null): void {
  const { cx, shY, hemY, waistY, hipY } = g;
  const skirt = g.female && !!o.skirt;

  // skirt below a short jacket
  if (skirt && o.len !== 'dress' && o.len !== 'long') {
    const sk = o.pattern === 'leopard' ? p.primary : p.primary;
    poly(ctx, [g.xL + g.pinch, hipY - 6, g.xR - g.pinch, hipY - 6, g.xR + 3, 92, g.xL - 2, 92]);
    paint(ctx, shade(sk, -0.12), edgeFor(sk), 1.6);
  }
  // the second coat, peeking out below the first
  if (o.extra === 'double-coats') {
    poly(ctx, [g.xL - 2, waistY, g.xR + 2, waistY, g.xR + g.flare + 2, hemY + 4, g.xL - g.flare - 2, hemY + 4]);
    paint(ctx, p.secondary, edgeFor(p.secondary), 1.6);
  }

  torsoPath(ctx, g, o);
  paint(ctx, p.body, edgeFor(p.body), 2);
  drawPattern(ctx, g, o, p);

  // open coats show what is under them
  const inner = o.collar === 'turtle' ? p.secondary : o.front === 'open' ? p.secondary : null;
  if (inner) {
    poly(ctx, [cx - 6, shY - 1, cx + 5, shY - 1, cx + 3.5, hemY, cx - 4, hemY]);
    paint(ctx, inner, edgeFor(inner), 1.2);
    if (o.extra === 'disco') {
      // big pointed disco collar and an open chest
      poly(ctx, [cx - 3, shY, cx + 2, shY, cx - 0.5, shY + 9]);
      paint(ctx, SKIN_SHADE, null);
      poly(ctx, [cx - 4, shY - 1, cx - 9, shY + 9, cx - 1, shY + 4]);
      paint(ctx, inner, INK, 1);
      poly(ctx, [cx + 3, shY - 1, cx + 9, shY + 9, cx + 0.5, shY + 4]);
      paint(ctx, inner, INK, 1);
    }
  }

  // waistcoat panel
  if (o.vest) {
    const v = p.primary;
    poly(ctx, [g.xL + 4, shY + 1, cx - 3, shY + 1, cx, shY + 13, cx + 3, shY + 1, g.xR - 4, shY + 1, g.xR - 1, hipY - 1, cx, hipY + 2, g.xL + 2, hipY - 1]);
    paint(ctx, v, edgeFor(v), 1.4);
    for (let i = 0; i < 3; i++) {
      circ(ctx, cx + 0.3, shY + 16 + i * 4.2, 0.9);
      paint(ctx, GOLD, null);
    }
  }

  // puffer quilting
  if (o.extra === 'puffer') {
    ctx.save();
    torsoPath(ctx, g, o);
    ctx.clip();
    for (let y = shY + 7; y < hemY; y += 6) line(ctx, g.xL - 2, y, g.xR + 3, y + 1, shade(p.body, -0.35), 1);
    ctx.restore();
  }

  // shoulder yoke (windbreaker)
  if (o.extra === 'yoke') {
    ctx.save();
    torsoPath(ctx, g, o);
    ctx.clip();
    poly(ctx, [g.xL - 4, shY - 4, g.xR + 4, shY - 4, g.xR + 4, shY + 8, cx, shY + 10, g.xL - 4, shY + 8]);
    paint(ctx, p.secondary, INK, 1.2);
    ctx.restore();
  }

  // racing stripes
  if (o.extra === 'racing') {
    line(ctx, cx + 4.5, shY + 1, cx + 5, hemY - 1, p.secondary, 2.2);
    line(ctx, cx - 5.5, shY + 1, cx - 6, hemY - 1, p.secondary, 2.2);
    rrect(ctx, cx + 7, shY + 8, 6, 4, 1);
    paint(ctx, '#F8FAFC', INK, 0.8);
  }

  // apron
  if (o.apron) {
    const a = o.apron === 'white' ? '#F1F5F9' : o.apron === 'primary' ? p.primary : p.secondary;
    const top = o.bib ? shY + 6 : waistY + 1;
    poly(ctx, [cx - 8, top, cx + 7, top, cx + 8, waistY + 1, g.xR + 1, waistY + 2, g.xR + 3, 92, g.xL - 1, 92, g.xL + 1, waistY + 2, cx - 9, waistY + 1]);
    paint(ctx, a, edgeFor(a), 1.4);
    line(ctx, g.xL + 1, waistY + 2, g.xR + 1, waistY + 2, shade(a, -0.3), 1.6);
    if (o.bib) {
      line(ctx, cx - 7, top, cx - 10, shY - 1, shade(a, -0.3), 1.4);
      line(ctx, cx + 6, top, cx + 8, shY - 1, shade(a, -0.3), 1.4);
    }
    if (o.apron === 'white') {
      rrect(ctx, cx - 4, waistY + 8, 8, 6, 1);
      paint(ctx, null, p.secondary, 1);
    }
  }

  // collar
  drawCollar(ctx, g, o, p, fam);

  // buttons / zip
  const fy0 = o.collar === 'lapel' || o.collar === 'wide-lapel' || o.collar === 'shawl' || o.collar === 'v' ? shY + 15 : shY + 3;
  if (o.front === 'zip') {
    line(ctx, cx, shY + 2, cx, hemY - 1, '#9CA3AF', 1.1);
    rrect(ctx, cx - 1, shY + 6, 2, 3, 0.5);
    paint(ctx, SILVER, null);
  } else if (o.front === 'single' || o.front === 'double') {
    const n = o.len === 'long' ? 4 : o.len === 'tucked' ? 4 : 3;
    const step = (Math.min(hemY, hipY + 6) - fy0 - 2) / n;
    const bc = luminance(p.body) > 0.55 ? '#3F3F46' : '#9CA3AF';
    for (let i = 0; i < n; i++) {
      const y = fy0 + 1 + i * step;
      const wobble = o.extra === 'rumpled' ? (i % 2 ? 0.8 : -0.6) : 0;
      if (o.front === 'double') {
        circ(ctx, cx - 3.2, y, 1);
        paint(ctx, bc, null);
        circ(ctx, cx + 3.6, y, 1);
        paint(ctx, bc, null);
      } else {
        circ(ctx, cx + 0.4 + wobble, y, 0.95);
        paint(ctx, bc, null);
      }
      if (o.extra === 'tight') {
        line(ctx, cx - 4, y - 1, cx - 0.8, y, shade(p.body, -0.4), 0.8);
        line(ctx, cx + 1.6, y, cx + 4.6, y - 1, shade(p.body, -0.4), 0.8);
      }
    }
    if (o.front === 'single' && o.len !== 'tucked') line(ctx, cx + 1.6, fy0 - 2, cx + 1.2, hemY - 1, shade(p.body, -0.35), 0.8);
    if (o.front === 'double') line(ctx, cx + 5.4, fy0 - 2, cx + 5.2, hemY - 1, shade(p.body, -0.35), 0.8);
  }

  // belts and sashes
  if (o.belt || o.extra === 'sash') {
    const by = o.len === 'tucked' ? hipY - 2 : waistY + 1;
    const bcol = o.belt === 'black' ? '#111114' : o.extra === 'sash' ? p.secondary : shade(p.body, -0.22);
    poly(ctx, [g.xL + g.pinch - 0.5, by - 1.8, g.xR + (g.b.belly > 0 ? g.b.belly * 0.6 : 0) + 0.5, by - 1.8, g.xR + (g.b.belly > 0 ? g.b.belly * 0.6 : 0) + 0.5, by + 1.8, g.xL + g.pinch - 0.5, by + 1.8]);
    paint(ctx, bcol, INK, 1);
    if (o.extra === 'sash') {
      poly(ctx, [cx + 4, by, cx + 7, by + 11, cx + 3, by + 10]);
      paint(ctx, bcol, INK, 0.9);
    } else {
      rrect(ctx, cx - 2.2, by - 2.2, 4.4, 4.4, 0.8);
      paint(ctx, o.belt === 'black' ? SILVER : shade(bcol, -0.3), INK, 0.8);
    }
  }

  // pockets / patches / rivets / chains / pearls
  if (o.extra === 'pockets' || o.extra === 'coveralls') {
    rrect(ctx, g.xL + 3, shY + 9, 7, 6, 1);
    paint(ctx, null, shade(p.body, -0.4), 1);
    rrect(ctx, cx + 4, shY + 9, 7, 6, 1);
    paint(ctx, null, shade(p.body, -0.4), 1);
    if (o.extra === 'coveralls') {
      rrect(ctx, cx + 4.5, shY + 9.5, 6, 3.4, 0.8);
      paint(ctx, p.secondary, null);
      line(ctx, cx + 5.5, shY + 11.2, cx + 9.5, shY + 11.2, '#DC2626', 0.8);
    }
  }
  if (o.extra === 'nypd' || o.extra === 'customs') {
    // shoulder patch on the far arm side and a chest pocket
    ell(ctx, g.xL + 3.5, shY + 7, 2.6, 3.2);
    paint(ctx, o.extra === 'nypd' ? '#1E3A8A' : '#F8FAFC', GOLD, 0.9);
    line(ctx, g.xL + 4, shY + 0.5, g.xL + 10, shY - 0.5, shade(p.body, -0.4), 2.2); // epaulette
    line(ctx, g.xR - 10, shY - 0.5, g.xR - 4, shY + 0.5, shade(p.body, -0.4), 2.2);
    rrect(ctx, g.xL + 4, shY + 10, 7, 5, 1);
    paint(ctx, null, shade(p.body, -0.45), 0.9);
  }
  if (o.extra === 'rivets') {
    const rc = col(p.secondary, SILVER);
    for (const [x, y] of [[g.xL + 4, shY + 3], [g.xL + 9, shY + 1.5], [g.xR - 4, shY + 3], [g.xR - 9, shY + 1.5]]) {
      circ(ctx, x, y, 1.3);
      paint(ctx, rc, INK, 0.5);
    }
  }
  if (o.extra === 'scarf') {
    poly(ctx, [cx - 8, shY - 2, cx + 7, shY - 2, cx + 5, shY + 4, cx - 6, shY + 4]);
    paint(ctx, p.secondary, INK, 1.1);
    poly(ctx, [cx + 1, shY + 2, cx + 6, shY + 3, cx + 7, shY + 24, cx + 2.5, shY + 24]);
    paint(ctx, p.secondary, INK, 1.1);
    for (let i = 0; i < 3; i++) line(ctx, cx + 3 + i * 1.3, shY + 24, cx + 3 + i * 1.3, shY + 26.5, p.secondary, 0.9);
  }
  if (o.extra === 'bomber') {
    line(ctx, g.xL + 0.5, hemY - 2, g.xR - 0.5, hemY - 2, p.secondary, 3.2);
    for (let x = g.xL + 2; x < g.xR - 1; x += 2) line(ctx, x, hemY - 3.4, x, hemY - 0.6, shade(p.secondary, -0.35), 0.5);
  }
  if (o.extra === 'rumpled') {
    line(ctx, g.xL + 4, waistY - 4, g.xL + 9, waistY - 2, shade(p.body, -0.35), 0.8);
    line(ctx, g.xR - 9, waistY + 2, g.xR - 3, waistY, shade(p.body, -0.35), 0.8);
  }
  if (o.extra === 'knit') {
    for (let y = hemY - 4; y < hemY; y += 1.6) line(ctx, g.xL - 1, y, g.xR + 1, y, shade(p.body, -0.3), 0.5);
  }
  if (o.chain) {
    ctx.beginPath();
    ctx.moveTo(cx - 4.5, shY);
    ctx.quadraticCurveTo(cx - 0.5, shY + 8, cx + 3.5, shY);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 1.1;
    ctx.stroke();
    circ(ctx, cx - 0.4, shY + 5.5, 1.2);
    paint(ctx, GOLD, null);
  }
  if (o.extra === 'pearls') {
    for (let i = 0; i <= 6; i++) {
      const a = Math.PI * (0.15 + 0.7 * (i / 6));
      circ(ctx, cx - 0.5 + Math.cos(a) * 5.5, shY + Math.sin(a) * 5, 1);
      paint(ctx, '#F8FAFC', '#64748B', 0.3);
    }
  }

  // far-side shade last, so it darkens collars and details too
  drawBodyShade(ctx, g, o);
  drawRim(ctx, g, o);
}

/** A thin cool rim light down the near edge, so dark coats separate from a dark street. */
function drawRim(ctx: Ctx2D, g: Geo, o: OutfitSpec): void {
  ctx.save();
  torsoPath(ctx, g, o);
  ctx.clip();
  ctx.globalAlpha = 0.38;
  ctx.beginPath();
  ctx.moveTo(g.cx + 4, g.shY - 1.2);
  ctx.quadraticCurveTo(g.xR - 2, g.shY - 0.5, g.xR - 0.4, g.shY + 6);
  ctx.lineTo(g.xR + (g.b.belly > 0 ? g.b.belly * 0.6 : 0) - 0.6, g.waistY);
  ctx.lineTo(g.xR + g.flare - 0.8, g.hemY);
  ctx.strokeStyle = '#DCE3EE';
  ctx.lineWidth = 2.2;
  ctx.stroke();
  ctx.restore();
}

function drawCollar(ctx: Ctx2D, g: Geo, o: OutfitSpec, p: Palette, fam: CastFamily | null): void {
  const { cx, shY } = g;
  const vY = o.len === 'tucked' ? shY + 9 : shY + 16;
  const shirt = o.body === 'shirt' ? SHIRT_WHITE : p.secondary;
  const lapelCol = shade(p.body, -0.18);
  const edge = edgeFor(p.body);
  switch (o.collar) {
    case 'lapel':
    case 'wide-lapel': {
      const wide = o.collar === 'wide-lapel' ? 3 : 0;
      poly(ctx, [cx - 5.5, shY - 1, cx + 5, shY - 1, cx, vY]);
      paint(ctx, shirt, INK, 1);
      if (o.tie) drawTie(ctx, cx, shY, vY, o.tie === 'dark' ? '#111827' : shade(p.accent, -0.15), o.extra === 'rumpled');
      else if (o.bow) drawBow(ctx, cx, shY + 1.5, p.secondary);
      poly(ctx, [cx - 5.5, shY - 1.5, cx - 10 - wide, shY + 4, cx - 6 - wide, shY + 5, cx - 0.5, vY + 1]);
      paint(ctx, lapelCol, edge, 1.1);
      poly(ctx, [cx + 5, shY - 1.5, cx + 11 + wide, shY + 4, cx + 7 + wide, shY + 5, cx + 0.5, vY + 1]);
      paint(ctx, lapelCol, edge, 1.1);
      break;
    }
    case 'shawl': {
      const shawl = o.shawl2 ? p.secondary : shade(p.body, -0.25);
      poly(ctx, [cx - 5.5, shY - 1, cx + 5, shY - 1, cx, vY]);
      paint(ctx, shirt === p.secondary && shawl === p.secondary ? SHIRT_WHITE : shirt, INK, 1);
      if (o.bow) drawBow(ctx, cx, shY + 1.5, '#09090B');
      ctx.beginPath();
      ctx.moveTo(cx - 6, shY - 1.5);
      ctx.quadraticCurveTo(cx - 9, shY + 10, cx - 0.5, vY + 3);
      ctx.lineTo(cx + 0.5, vY + 3);
      ctx.quadraticCurveTo(cx + 10, shY + 10, cx + 5.5, shY - 1.5);
      ctx.lineTo(cx + 2.5, shY - 1);
      ctx.quadraticCurveTo(cx + 5, shY + 8, cx, vY - 1);
      ctx.quadraticCurveTo(cx - 4.5, shY + 8, cx - 3, shY - 1);
      ctx.closePath();
      paint(ctx, shawl, INK, 1.1);
      break;
    }
    case 'turtle':
      rrect(ctx, cx - 6, shY - 4, 11.5, 6, 2.5);
      paint(ctx, p.secondary, edgeFor(p.secondary), 1.1);
      // coat lapels folded back
      poly(ctx, [cx - 6, shY - 1, cx - 11, shY + 5, cx - 6, g.hemY - 6]);
      paint(ctx, lapelCol, edge, 1.1);
      poly(ctx, [cx + 5.5, shY - 1, cx + 11, shY + 5, cx + 5, g.hemY - 6]);
      paint(ctx, lapelCol, edge, 1.1);
      break;
    case 'band':
      rrect(ctx, cx - 6.5, shY - 3, 12.5, 4.5, 1.5);
      paint(ctx, o.extra === 'nypd' || o.extra === 'customs' || o.len === 'dress' ? p.secondary : shade(p.body, -0.15), edgeFor(p.body), 1);
      if (o.tie) {
        poly(ctx, [cx - 3, shY - 1, cx + 2.5, shY - 1, cx - 0.2, shY + 4]);
        paint(ctx, p.secondary, INK, 0.8);
        drawTie(ctx, cx, shY, shY + 16, o.tie === 'dark' ? '#111827' : shade(p.accent, -0.15), false);
      }
      break;
    case 'open':
      poly(ctx, [cx - 4.5, shY - 1, cx + 4, shY - 1, cx - 0.2, vY]);
      paint(ctx, o.body === 'shirt' || o.body === 'secondary' ? SKIN_SHADE : p.secondary, INK, 0.9);
      poly(ctx, [cx - 4.5, shY - 1.5, cx - 8, shY + 3, cx - 2, shY + 4]);
      paint(ctx, shade(o.body ? p.body : p.primary, 0.1), INK, 0.9);
      poly(ctx, [cx + 4, shY - 1.5, cx + 8, shY + 3, cx + 1.5, shY + 4]);
      paint(ctx, shade(o.body ? p.body : p.primary, 0.1), INK, 0.9);
      break;
    case 'v':
      poly(ctx, [cx - 6, shY - 1, cx + 5.5, shY - 1, cx, vY + 2]);
      paint(ctx, p.secondary, INK, 1.1);
      rrect(ctx, cx - 4, shY - 2.5, 7.5, 3, 1);
      paint(ctx, p.secondary, INK, 0.8);
      if (o.tie) drawTie(ctx, cx, shY, vY, shade(p.accent, -0.15), false);
      break;
    case 'hood':
      rrect(ctx, cx - 7, shY - 3, 13, 5, 2);
      paint(ctx, p.secondary, INK, 1);
      line(ctx, cx - 2, shY + 1, cx - 2.5, shY + 9, SILVER, 0.8);
      line(ctx, cx + 2, shY + 1, cx + 2.5, shY + 9, SILVER, 0.8);
      break;
    default:
      break;
  }
  // Rastelli purple velour trim along the collar
  if (fam === 'rastelli' && o.collar !== 'hood' && o.collar !== 'band') {
    ctx.beginPath();
    ctx.moveTo(cx - 7, shY - 1);
    ctx.quadraticCurveTo(cx - 8, shY + 10, cx, vY + 2);
    ctx.quadraticCurveTo(cx + 9, shY + 10, cx + 6.5, shY - 1);
    ctx.strokeStyle = '#9333EA';
    ctx.lineWidth = 2.2;
    ctx.stroke();
  }
}

function drawTie(ctx: Ctx2D, cx: number, shY: number, vY: number, color: string, crooked: boolean): void {
  const k = crooked ? 1.6 : 0;
  poly(ctx, [cx - 1.6, shY, cx + 1.6, shY, cx + 1, shY + 2.4]);
  paint(ctx, color, INK, 0.7);
  poly(ctx, [cx - 0.6, shY + 2.2, cx + 1.2, shY + 2.2, cx + 2.4 + k, vY - 1, cx + 0.4 + k, vY + 1, cx - 1.6 + k, vY - 1]);
  paint(ctx, color, INK, 0.7);
}

function drawBow(ctx: Ctx2D, cx: number, y: number, color: string): void {
  poly(ctx, [cx - 4, y - 2, cx, y, cx - 4, y + 2]);
  paint(ctx, color, INK, 0.6);
  poly(ctx, [cx + 4, y - 2, cx, y, cx + 4, y + 2]);
  paint(ctx, color, INK, 0.6);
}

// ---------------------------------------------------------------- family marks

function drawFamilyMark(ctx: Ctx2D, g: Geo, o: OutfitSpec, accent: string, fam: CastFamily | null): void {
  const mx = g.cx + 8.5;
  const my = g.shY + 7;
  switch (fam) {
    case 'corvini': // blood-red carnation in the lapel
      circ(ctx, mx, my, 3.4);
      paint(ctx, '#E03131', INK, 0.9);
      circ(ctx, mx - 1, my - 0.9, 1.4);
      paint(ctx, '#FF6B6B', null);
      line(ctx, mx, my + 3.2, mx - 0.8, my + 6.5, '#15803D', 1.2);
      break;
    case 'bellini': // gold collar chevron
      poly(ctx, [mx - 3.5, my + 2, mx, my - 3, mx + 3.5, my + 2, mx + 1.8, my + 2, mx, my - 0.6, mx - 1.8, my + 2]);
      paint(ctx, '#F59F00', INK, 0.6);
      poly(ctx, [mx - 2.4, my + 4.4, mx, my + 0.6, mx + 2.4, my + 4.4]);
      paint(ctx, '#FDE047', null);
      break;
    case 'valenti': // the sleeve stripes are drawn with the arms; add a gold chain
      ctx.beginPath();
      ctx.moveTo(g.cx - 5, g.shY);
      ctx.quadraticCurveTo(g.cx, g.shY + 7, g.cx + 4.5, g.shY);
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 1;
      ctx.stroke();
      break;
    case 'moretti': // steel rivets and a silver cargo chain
      if (o.extra !== 'rivets') {
        for (const [x, y] of [[g.xL + 4, g.shY + 3], [g.xR - 4, g.shY + 3]]) {
          circ(ctx, x, y, 1.3);
          paint(ctx, '#E2E8F0', INK, 0.5);
        }
      }
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(g.xL + 2, g.shY + 9);
      ctx.quadraticCurveTo(50, g.shY + 19, g.xR - 2, g.shY + 9);
      ctx.setLineDash([2.4, 1.6]);
      ctx.strokeStyle = SILVER;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      break;
    case 'rastelli': // collar trim is drawn with the collar; a purple pocket square
      poly(ctx, [mx - 2.5, my + 3, mx + 2.5, my + 3, mx + 1.8, my - 0.5, mx, my + 1, mx - 1.8, my - 0.5]);
      paint(ctx, '#A855F7', INK, 0.6);
      break;
    case 'outside': // brass shield
      poly(ctx, [mx - 3, my - 3, mx + 3, my - 3, mx + 3, my + 0.5, mx, my + 3.8, mx - 3, my + 0.5]);
      paint(ctx, GOLD, INK, 0.9);
      circ(ctx, mx, my - 0.3, 0.9);
      paint(ctx, '#A16207', null);
      break;
    default: // street-3q: family colour disc on the lapel
      circ(ctx, mx, my, 3.2);
      paint(ctx, accent, INK, 1);
  }
}

// ---------------------------------------------------------------- held items

function drawHeld(ctx: Ctx2D, g: Geo, t: CharacterTraits, accent: string): void {
  const [x, y] = g.farHand;
  switch (t.heldItem) {
    case 'brass-knuckles':
      rrect(ctx, x - 3.8, y - 2.2, 7.6, 3.4, 1.4);
      paint(ctx, '#EAB308', INK, 0.9);
      for (let i = 0; i < 3; i++) {
        circ(ctx, x - 2.4 + i * 2.4, y - 1.2, 0.7);
        paint(ctx, '#78350F', null);
      }
      break;
    case 'briefcase':
      line(ctx, x - 2, y + 1, x - 2, y + 3, INK, 1.2);
      line(ctx, x + 2, y + 1, x + 2, y + 3, INK, 1.2);
      rrect(ctx, x - 8, y + 3, 16, 11, 1.5);
      paint(ctx, '#3B2A1E', INK, 1.3);
      line(ctx, x - 8, y + 6.5, x + 8, y + 6.5, accent, 1.2);
      rrect(ctx, x - 1.5, y + 5.5, 3, 2, 0.4);
      paint(ctx, GOLD, null);
      break;
    case 'ledger-case':
      rrect(ctx, x - 6.5, y + 1, 13, 10, 1.2);
      paint(ctx, '#1F1A17', INK, 1.3);
      rrect(ctx, x - 6.5, y + 4, 13, 2.2, 0.3);
      paint(ctx, accent, null);
      rrect(ctx, x - 1.6, y + 3.6, 3.2, 3, 0.5);
      paint(ctx, '#D4A017', INK, 0.6);
      break;
    case 'blueprints':
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-0.5);
      rrect(ctx, -3, -11, 6, 22, 2.5);
      paint(ctx, '#2563EB', INK, 1.1);
      ell(ctx, 0, -11, 3, 1.4);
      paint(ctx, '#DBEAFE', INK, 0.7);
      line(ctx, -1.5, -6, -1.5, 8, '#93C5FD', 0.6);
      ctx.restore();
      break;
    case 'court-papers':
      rrect(ctx, x - 6, y - 1, 11, 14, 0.8);
      paint(ctx, '#C8A97E', INK, 1);
      rrect(ctx, x - 5, y - 2.5, 11, 13, 0.6);
      paint(ctx, '#F8FAFC', INK, 0.9);
      for (let i = 0; i < 4; i++) line(ctx, x - 3.5, y + 0.5 + i * 2.4, x + 4, y + 0.5 + i * 2.4, '#94A3B8', 0.6);
      line(ctx, x - 5, y + 4, x + 6, y + 4, '#B91C1C', 1.1);
      break;
    case 'clipboard':
      rrect(ctx, x - 5.5, y - 3, 11, 15, 1);
      paint(ctx, '#92400E', INK, 1.1);
      rrect(ctx, x - 4, y - 1, 8, 11.5, 0.5);
      paint(ctx, '#F8FAFC', null);
      rrect(ctx, x - 2, y - 4, 4, 2.4, 0.6);
      paint(ctx, SILVER, INK, 0.6);
      for (let i = 0; i < 3; i++) line(ctx, x - 3, y + 2 + i * 2.6, x + 3, y + 2 + i * 2.6, '#64748B', 0.6);
      break;
    case 'rubber-stamp':
      rrect(ctx, x - 1.6, y - 6, 3.2, 6, 1);
      paint(ctx, '#92400E', INK, 0.9);
      circ(ctx, x, y - 6.5, 2.2);
      paint(ctx, '#DC2626', INK, 0.8);
      rrect(ctx, x - 4, y + 1.5, 8, 3, 0.6);
      paint(ctx, '#1F2937', INK, 0.8);
      break;
    case 'wrench':
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(0.35);
      rrect(ctx, -1.4, -2, 2.8, 15, 1);
      paint(ctx, '#9CA3AF', INK, 0.9);
      circ(ctx, 0, 14.5, 3.2);
      paint(ctx, '#9CA3AF', INK, 0.9);
      rrect(ctx, -1.2, 13.5, 2.4, 5, 0.4);
      paint(ctx, '#1C1D24', null);
      ctx.restore();
      break;
    case 'cargo-hook':
      rrect(ctx, x - 5, y - 1.6, 10, 3.2, 1.4);
      paint(ctx, '#78350F', INK, 0.9);
      ctx.beginPath();
      ctx.moveTo(x, y + 1.5);
      ctx.lineTo(x, y + 9);
      ctx.quadraticCurveTo(x, y + 15, x + 5, y + 13);
      ctx.quadraticCurveTo(x + 7, y + 11, x + 6, y + 9);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.strokeStyle = SILVER;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      break;
    case 'two-cigars': // the second one is in the hand
      rrect(ctx, x - 1, y - 1.5, 9, 2.6, 1);
      paint(ctx, '#78350F', INK, 0.7);
      circ(ctx, x + 8, y - 0.2, 1.2);
      paint(ctx, '#F97316', null);
      break;
    case 'walking-cane':
      line(ctx, x + 0.5, y - 2, x + 3, 106, INK, 3);
      line(ctx, x + 0.5, y - 2, x + 3, 106, '#1C1917', 1.8);
      circ(ctx, x + 0.3, y - 2.5, 2.2);
      paint(ctx, SILVER, INK, 0.8);
      break;
    case 'coffee-badge':
      poly(ctx, [x - 3.4, y - 6, x + 3.4, y - 6, x + 2.6, y + 2, x - 2.6, y + 2]);
      paint(ctx, '#F8FAFC', INK, 0.9);
      line(ctx, x - 3.2, y - 3.5, x + 3.2, y - 3.5, '#1D4ED8', 1.4);
      rrect(ctx, x - 3.8, y - 7.4, 7.6, 1.8, 0.6);
      paint(ctx, '#E2E8F0', INK, 0.6);
      drawBeltBadge(ctx, g);
      break;
    case 'headphones-badge': // headphones are drawn with the head
      drawBeltBadge(ctx, g);
      ctx.beginPath();
      ctx.moveTo(g.hx - g.hw - 1, g.hy + 3);
      ctx.quadraticCurveTo(g.xL - 3, g.shY + 10, x, y - 2);
      ctx.strokeStyle = '#111114';
      ctx.lineWidth = 0.9;
      ctx.stroke();
      break;
    case 'nightstick-envelope':
      ctx.save();
      ctx.translate(g.xR - 2, g.hipY - 1);
      ctx.rotate(0.18);
      rrect(ctx, -1.6, 0, 3.2, 18, 1.2);
      paint(ctx, '#111114', '#3F3F46', 0.8);
      ctx.restore();
      rrect(ctx, x - 5.5, y - 1, 10, 6.5, 0.6);
      paint(ctx, '#F1F5F9', INK, 0.9);
      poly(ctx, [x - 5.5, y - 1, x - 0.5, y + 2.5, x + 4.5, y - 1]);
      paint(ctx, null, '#94A3B8', 0.7);
      break;
    case 'betting-slips':
      for (const [dx, rot, c] of [[-2, -0.4, '#FDE68A'], [0, 0, '#F8FAFC'], [2, 0.4, '#FBCFE8']] as const) {
        ctx.save();
        ctx.translate(x + dx * 0.6, y - 1);
        ctx.rotate(rot);
        rrect(ctx, -2, -8, 4, 8, 0.4);
        paint(ctx, c, INK, 0.6);
        line(ctx, -1, -6, 1, -6, '#475569', 0.5);
        ctx.restore();
      }
      break;
    default: // 'empty', mouth items, and any unknown value: nothing in the hand
      break;
  }
}

function drawBeltBadge(ctx: Ctx2D, g: Geo): void {
  const bx = g.cx + 7;
  const by = g.waistY + 3;
  poly(ctx, [bx - 2.6, by - 2.6, bx + 2.6, by - 2.6, bx + 2.6, by + 0.6, bx, by + 3.2, bx - 2.6, by + 0.6]);
  paint(ctx, GOLD, INK, 0.8);
}

// ---------------------------------------------------------------- head

function drawBackHair(ctx: Ctx2D, g: Geo, t: CharacterTraits, p: Palette, o: OutfitSpec): void {
  const { hx, hy, hw, hh } = g;
  const top = hy - hh;
  if (o.collar === 'hood') {
    rrect(ctx, hx - hw - 4, hy - 2, hw * 2 + 6, hh + 8, 6);
    paint(ctx, p.secondary, INK, 1.2);
  }
  switch (t.headgear) {
    case 'permed-hair':
    case 'bouffant':
    case 'feathered':
    case 'curly-hair': {
      const long = g.female ? 1 : 0;
      const drop = t.headgear === 'curly-hair' ? 4 + long * 4 : t.headgear === 'bouffant' ? 8 + long * 2 : 6 + long * 8;
      const puff = t.headgear === 'permed-hair' ? 4.5 : t.headgear === 'bouffant' ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(hx - hw - puff, hy + drop);
      ctx.quadraticCurveTo(hx - hw - puff - 2, top - 2, hx, top - 3);
      ctx.quadraticCurveTo(hx + hw + puff + 2, top - 2, hx + hw + puff, hy + drop);
      ctx.quadraticCurveTo(hx, hy + drop + 3, hx - hw - puff, hy + drop);
      ctx.closePath();
      paint(ctx, shade(p.hair, -0.12), INK, 1.3);
      break;
    }
    case 'grey-bun':
      circ(ctx, hx - 4, top - 3, 5);
      paint(ctx, p.hair, INK, 1.3);
      break;
    default:
      break;
  }
}

function drawHead(ctx: Ctx2D, g: Geo, t: CharacterTraits, p: Palette, accent: string, fam: CastFamily | null): void {
  const { hx, hy, hw, hh } = g;
  const top = hy - hh;
  const heavyJaw = t.build === 'heavy' ? 1.5 : 0;

  // neck
  rrect(ctx, hx - 4.5, hy + hh - 4, 9, 9, 2);
  paint(ctx, SKIN_SHADE, INK, 1.2);
  // far ear
  ell(ctx, hx - hw + 0.2, hy + 1.5, 2.2, 3.2);
  paint(ctx, SKIN_SHADE, INK, 1.1);
  // head: rounded, a little fuller on the near side (three-quarter)
  ctx.beginPath();
  ctx.moveTo(hx - hw + 2, top);
  ctx.quadraticCurveTo(hx, top - 1.5, hx + hw - 2, top);
  ctx.quadraticCurveTo(hx + hw + 0.5, top + 1, hx + hw + 0.5, hy - 2);
  ctx.quadraticCurveTo(hx + hw + 1, hy + 6, hx + hw - 2, hy + hh - 2);
  ctx.quadraticCurveTo(hx + 3, hy + hh + 1 + heavyJaw, hx - 3, hy + hh - 1);
  ctx.quadraticCurveTo(hx - hw - 0.5 - heavyJaw, hy + 6, hx - hw, hy - 2);
  ctx.quadraticCurveTo(hx - hw, top + 1, hx - hw + 2, top);
  ctx.closePath();
  paint(ctx, SKIN, INK, 1.6);
  // chiaroscuro: far side of the face in shadow
  ctx.save();
  ctx.clip();
  ctx.globalAlpha = 0.22;
  poly(ctx, [hx - hw - 2, top - 2, hx - 3.5, top - 2, hx - 2, hy + hh + 3, hx - hw - 2, hy + hh + 3]);
  paint(ctx, '#2A1A0E', null);
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.moveTo(hx + hw - 1.5, top + 1);
  ctx.quadraticCurveTo(hx + hw + 0.2, hy - 2, hx + hw - 0.6, hy + 6);
  ctx.strokeStyle = '#FFF3E0';
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.restore();

  drawFacial(ctx, g, t, p);

  // nose on the near side, brows, eyes
  poly(ctx, [hx + 4.6, hy - 1, hx + 7.6, hy + 4.4, hx + 4.4, hy + 4.8]);
  paint(ctx, SKIN_SHADE, null);
  line(ctx, hx + 7.6, hy + 4.4, hx + 4.6, hy + 4.9, '#7C5535', 0.8);

  drawEyes(ctx, g, t, p);

  // mouth items
  if (t.heldItem === 'cigar' || t.heldItem === 'two-cigars') {
    rrect(ctx, hx + 4, hy + 6.6, 8, 2.4, 0.9);
    paint(ctx, '#78350F', INK, 0.7);
    circ(ctx, hx + 12, hy + 7.8, 1.3);
    paint(ctx, '#F97316', null);
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.moveTo(hx + 12.5, hy + 6);
    ctx.quadraticCurveTo(hx + 16, hy + 1, hx + 13, hy - 4);
    ctx.quadraticCurveTo(hx + 11, hy - 8, hx + 14, hy - 12);
    ctx.strokeStyle = SILVER;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  } else if (t.heldItem === 'pipe') {
    ctx.beginPath();
    ctx.moveTo(hx + 4, hy + 7.4);
    ctx.lineTo(hx + 10, hy + 8.4);
    ctx.strokeStyle = '#451A03';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    rrect(ctx, hx + 9, hy + 4.2, 4.2, 5.4, 1.2);
    paint(ctx, '#5B2A0B', INK, 0.8);
  }

  drawHeadgear(ctx, g, t, p, accent, fam);

  if (t.heldItem === 'headphones-badge') {
    ctx.beginPath();
    ctx.moveTo(hx - hw - 1, hy + 1);
    ctx.quadraticCurveTo(hx, top - 8, hx + hw + 1, hy + 1);
    ctx.strokeStyle = '#111114';
    ctx.lineWidth = 2;
    ctx.stroke();
    rrect(ctx, hx - hw - 3, hy - 2, 4, 7, 1.5);
    paint(ctx, '#27272A', INK, 0.8);
    rrect(ctx, hx + hw - 1, hy - 2, 4, 7, 1.5);
    paint(ctx, '#27272A', INK, 0.8);
  }
}

function drawFacial(ctx: Ctx2D, g: Geo, t: CharacterTraits, p: Palette): void {
  const { hx, hy, hw, hh } = g;
  const mx0 = hx + 0.5;
  const mx1 = hx + 5.5;
  const my = hy + 7.6;
  switch (t.facialHairOrScar) {
    case 'beard':
    case 'red-beard': {
      const c = t.facialHairOrScar === 'red-beard' ? '#B45309' : p.hair;
      ctx.beginPath();
      ctx.moveTo(hx - hw + 0.5, hy + 1);
      ctx.quadraticCurveTo(hx - hw, hy + hh + 2, hx + 2, hy + hh + 2.5);
      ctx.quadraticCurveTo(hx + hw + 1, hy + hh + 1, hx + hw, hy + 1);
      ctx.lineTo(hx + hw - 2, hy + 3);
      ctx.quadraticCurveTo(hx + 5, hy + 5, hx + 3, hy + 5.5);
      ctx.quadraticCurveTo(hx - 3, hy + 5, hx - hw + 3, hy + 3);
      ctx.closePath();
      paint(ctx, c, INK, 1);
      line(ctx, mx0, my, mx1, my - 0.3, '#3B2416', 1.2);
      return;
    }
    case 'stubble':
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.moveTo(hx - hw + 1, hy + 2);
      ctx.quadraticCurveTo(hx - hw + 1, hy + hh, hx + 2, hy + hh);
      ctx.quadraticCurveTo(hx + hw, hy + hh - 1, hx + hw, hy + 2);
      ctx.quadraticCurveTo(hx + 2, hy + 6, hx - hw + 1, hy + 2);
      ctx.closePath();
      paint(ctx, shade(p.hair, -0.3), null);
      ctx.restore();
      break;
    case 'moustache':
      ctx.beginPath();
      ctx.moveTo(hx - 0.5, hy + 6.6);
      ctx.quadraticCurveTo(hx + 3, hy + 4.6, hx + 7, hy + 6.4);
      ctx.quadraticCurveTo(hx + 5, hy + 7.8, hx + 3, hy + 7.2);
      ctx.quadraticCurveTo(hx + 1, hy + 7.8, hx - 0.5, hy + 6.6);
      ctx.closePath();
      paint(ctx, p.hair, INK, 0.7);
      break;
    case 'scar':
      line(ctx, hx + 4.5, hy - 3, hx + 8, hy + 5, '#991B1B', 1.3);
      for (let i = 0; i < 3; i++) {
        const sx = hx + 5.3 + i * 1.1;
        const sy = hy - 1 + i * 2.5;
        line(ctx, sx - 1, sy + 0.5, sx + 1, sy - 0.5, '#B91C1C', 0.6);
      }
      break;
    default:
      break;
  }
  if (t.facialHairOrScar === 'lipstick') {
    ctx.beginPath();
    ctx.moveTo(mx0 + 0.5, my);
    ctx.quadraticCurveTo(hx + 3, my - 1.6, mx1 - 0.3, my - 0.2);
    ctx.quadraticCurveTo(hx + 3, my + 1.6, mx0 + 0.5, my);
    ctx.closePath();
    paint(ctx, '#E03131', null);
  } else {
    line(ctx, mx0, my, mx1, my - 0.3, '#3B2416', 1.2);
  }
}

function drawEyes(ctx: Ctx2D, g: Geo, t: CharacterTraits, p: Palette): void {
  const { hx, hy, hw } = g;
  const ey = hy - 0.5;
  const fx = hx - 3.6; // far eye
  const nx = hx + 3.4; // near eye
  const brow = luminance(p.hair) > 0.6 ? '#6B7280' : shade(p.hair, -0.2);
  const plainEyes = (dy = 0) => {
    circ(ctx, fx, ey + dy, 1.15);
    paint(ctx, '#09090B', null);
    circ(ctx, nx, ey + dy, 1.35);
    paint(ctx, '#09090B', null);
  };
  const brows = () => {
    line(ctx, fx - 2.4, ey - 3.2, fx + 1.8, ey - 2.8, brow, 1.4);
    line(ctx, nx - 2, ey - 2.8, nx + 2.8, ey - 3.2, brow, 1.5);
  };
  const temple = (c: string, lw: number) => line(ctx, fx - 2.8, ey, hx - hw + 0.5, ey + 0.5, c, lw);
  switch (t.eyewear) {
    case 'dark-shades':
    case 'amber-shades': {
      const lens = t.eyewear === 'amber-shades' ? '#D97706' : '#09090B';
      brows();
      rrect(ctx, fx - 2.9, ey - 2, 5.4, 4, 1.2);
      paint(ctx, lens, '#E2E8F0', 0.8);
      rrect(ctx, nx - 3, ey - 2.1, 6.4, 4.2, 1.2);
      paint(ctx, lens, '#E2E8F0', 0.8);
      line(ctx, fx + 2.5, ey - 0.6, nx - 3, ey - 0.6, '#F59F00', 1);
      temple('#E2E8F0', 0.8);
      break;
    }
    case 'green-aviators':
      brows();
      poly(ctx, [fx - 2.8, ey - 2, fx + 2.4, ey - 2, fx + 2, ey + 2.4, fx - 2.2, ey + 2]);
      paint(ctx, '#065F46', '#FBBF24', 0.8);
      poly(ctx, [nx - 2.8, ey - 2.2, nx + 3.4, ey - 2.2, nx + 2.8, ey + 2, nx - 2, ey + 2.6]);
      paint(ctx, '#065F46', '#FBBF24', 0.8);
      line(ctx, fx + 2.4, ey - 1.6, nx - 2.8, ey - 1.6, '#FBBF24', 0.8);
      temple('#FBBF24', 0.7);
      break;
    case 'oversized-glasses':
      brows();
      plainEyes();
      rrect(ctx, fx - 3.2, ey - 3, 6, 6.2, 1.8);
      paint(ctx, 'rgba(219,234,254,0.35)', '#3F2E21', 1);
      rrect(ctx, nx - 3.2, ey - 3.1, 7, 6.4, 1.8);
      paint(ctx, 'rgba(219,234,254,0.35)', '#3F2E21', 1);
      temple('#3F2E21', 0.9);
      break;
    case 'thick-black-glasses':
      brows();
      plainEyes();
      rrect(ctx, fx - 2.9, ey - 2.2, 5.4, 4.4, 0.8);
      paint(ctx, null, '#09090B', 1.6);
      rrect(ctx, nx - 2.8, ey - 2.3, 6.2, 4.6, 0.8);
      paint(ctx, null, '#09090B', 1.6);
      line(ctx, fx + 2.5, ey - 0.6, nx - 2.8, ey - 0.6, '#09090B', 1.4);
      temple('#09090B', 1.3);
      break;
    case 'round-glasses':
    case 'wire-glasses': {
      const c = t.eyewear === 'wire-glasses' ? '#CA8A04' : '#18181B';
      const lw = t.eyewear === 'wire-glasses' ? 0.7 : 1.1;
      brows();
      plainEyes();
      ell(ctx, fx, ey, 2.4, 2.6);
      paint(ctx, null, c, lw);
      ell(ctx, nx, ey, 2.9, 2.8);
      paint(ctx, null, c, lw);
      line(ctx, fx + 2.4, ey - 0.4, nx - 2.9, ey - 0.4, c, lw);
      temple(c, lw);
      break;
    }
    case 'half-moon-glasses':
    case 'reading-chain': {
      brows();
      plainEyes(-0.4);
      const c = t.eyewear === 'reading-chain' ? '#18181B' : '#CA8A04';
      const ly = ey + 1.6;
      ctx.beginPath();
      ctx.ellipse(fx, ly, 2.4, 1.9, 0, 0, Math.PI);
      ctx.closePath();
      paint(ctx, 'rgba(219,234,254,0.3)', c, 0.9);
      ctx.beginPath();
      ctx.ellipse(nx, ly, 2.9, 2.1, 0, 0, Math.PI);
      ctx.closePath();
      paint(ctx, 'rgba(219,234,254,0.3)', c, 0.9);
      line(ctx, fx + 2.4, ly, nx - 2.9, ly, c, 0.8);
      if (t.eyewear === 'reading-chain') {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(fx - 2.4, ly);
        ctx.quadraticCurveTo(hx - hw - 2, hy + 14, hx - 2, g.shY + 3);
        ctx.moveTo(nx + 2.9, ly);
        ctx.quadraticCurveTo(hx + hw + 2, hy + 12, hx + 4, g.shY + 3);
        ctx.setLineDash([0.9, 0.7]);
        ctx.strokeStyle = GOLD;
        ctx.lineWidth = 0.7;
        ctx.stroke();
        ctx.restore();
      }
      break;
    }
    case 'loupe':
      brows();
      circ(ctx, fx, ey, 1.15);
      paint(ctx, '#09090B', null);
      ell(ctx, nx + 1, ey, 3, 3.2);
      paint(ctx, '#18181B', INK, 0.9);
      ell(ctx, nx + 1.6, ey, 1.6, 1.8);
      paint(ctx, '#7DD3FC', null);
      break;
    default: // 'none' and unknown values
      brows();
      plainEyes();
      break;
  }
}

function drawHeadgear(ctx: Ctx2D, g: Geo, t: CharacterTraits, p: Palette, accent: string, fam: CastFamily | null): void {
  const { hx, hy, hw } = g;
  const top = hy - g.hh;
  const hair = p.hair;
  const hairEdge = INK;
  const sideburns = () => {
    poly(ctx, [hx - hw, top + 5, hx - hw + 3, top + 5, hx - hw + 2.5, hy + 2, hx - hw + 0.3, hy + 1]);
    paint(ctx, hair, null);
    poly(ctx, [hx + hw - 2.6, top + 5, hx + hw + 0.3, top + 5, hx + hw, hy + 0.5, hx + hw - 2, hy + 1.5]);
    paint(ctx, hair, null);
  };
  const capDome = (y0: number, rise: number) => {
    ctx.beginPath();
    ctx.moveTo(hx - hw - 0.8, y0);
    ctx.quadraticCurveTo(hx - hw - 1, top - rise, hx, top - rise);
    ctx.quadraticCurveTo(hx + hw + 1, top - rise, hx + hw + 0.8, y0);
    ctx.closePath();
  };
  switch (t.headgear) {
    case 'fedora-band':
    case 'white-fedora': {
      const white = t.headgear === 'white-fedora';
      const crown = white ? '#F1F5F9' : fam ? mix('#27272A', accent, 0.28) : '#27272A';
      const brim = white ? '#E2E8F0' : '#18181B';
      sideburns();
      // brim shadow on the brow
      ctx.save();
      ctx.globalAlpha = 0.3;
      ell(ctx, hx + 0.5, top + 5.5, hw + 1, 2.4);
      paint(ctx, '#000000', null);
      ctx.restore();
      ctx.beginPath();
      ctx.moveTo(hx - hw + 0.5, top + 4);
      ctx.lineTo(hx - hw + 2, top - 6.5);
      ctx.quadraticCurveTo(hx - 3, top - 9.5, hx, top - 7);
      ctx.quadraticCurveTo(hx + 4, top - 9.5, hx + hw - 1, top - 6.5);
      ctx.lineTo(hx + hw + 1, top + 4);
      ctx.closePath();
      paint(ctx, crown, white ? INK : '#3F3F46', 1.3);
      line(ctx, hx + 0.5, top - 6.5, hx + 1.5, top - 3, white ? '#CBD5E1' : '#3F3F46', 0.9); // pinch
      poly(ctx, [hx - hw + 0.8, top + 0.6, hx + hw + 0.7, top + 0.6, hx + hw + 1, top + 3.6, hx - hw + 0.5, top + 3.6]);
      paint(ctx, accent, null);
      ell(ctx, hx + 0.8, top + 4.6, hw + 6, 3.1, -0.05);
      paint(ctx, brim, white ? INK : '#3F3F46', 1.2);
      ctx.save();
      ctx.globalAlpha = 0.25;
      ell(ctx, hx + 4, top + 3.8, hw - 2, 1.1, -0.05);
      paint(ctx, '#FFFFFF', null);
      ctx.restore();
      break;
    }
    case 'bald':
      poly(ctx, [hx - hw - 0.3, top + 7, hx - hw + 2.4, top + 6, hx - hw + 2.2, hy + 1, hx - hw + 0.2, hy]);
      paint(ctx, hair, null);
      poly(ctx, [hx + hw - 2.2, top + 6, hx + hw + 0.4, top + 7, hx + hw, hy - 0.5, hx + hw - 2, hy]);
      paint(ctx, hair, null);
      ctx.save();
      ctx.globalAlpha = 0.45;
      ell(ctx, hx + 3.5, top + 2.5, 3.2, 1.6, -0.3);
      paint(ctx, '#FFF7ED', null);
      ctx.restore();
      break;
    case 'flatcap': {
      sideburns();
      const cap = '#4B4B52';
      ctx.beginPath();
      ctx.moveTo(hx - hw - 1, top + 5);
      ctx.quadraticCurveTo(hx - hw - 1.5, top - 4.5, hx - 1, top - 4.5);
      ctx.quadraticCurveTo(hx + hw + 2, top - 4.5, hx + hw + 3, top + 1.5);
      ctx.quadraticCurveTo(hx + hw + 6, top + 4, hx + hw + 3, top + 5.5);
      ctx.quadraticCurveTo(hx + 2, top + 7.5, hx - hw - 1, top + 5);
      ctx.closePath();
      paint(ctx, cap, INK, 1.3);
      ctx.save();
      ctx.globalAlpha = 0.5;
      for (let i = 0; i < 4; i++) line(ctx, hx - hw + 2 + i * 4.5, top - 2, hx - hw + 4 + i * 4.5, top + 3, '#71717A', 0.6);
      ctx.restore();
      line(ctx, hx - hw, top + 3.5, hx + hw + 3, top + 2.5, shade(cap, -0.4), 0.9);
      break;
    }
    case 'dock-cap':
      sideburns();
      capDome(top + 5.5, 5);
      paint(ctx, '#1D4ED8', INK, 1.3);
      rrect(ctx, hx - hw - 1.4, top + 1.5, hw * 2 + 2.8, 5, 1.6);
      paint(ctx, '#2563EB', INK, 1.1);
      ctx.save();
      ctx.globalAlpha = 0.35;
      for (let x = hx - hw + 1; x < hx + hw; x += 2.2) line(ctx, x, top + 2.2, x, top + 6, '#1E3A8A', 0.6);
      ctx.restore();
      break;
    case 'captain-cap':
    case 'police-cap': {
      sideburns();
      const police = t.headgear === 'police-cap';
      const crown = police ? '#172554' : '#1E3A8A';
      // crown, wider than the head
      ctx.beginPath();
      ctx.moveTo(hx - hw + 0.5, top + 4.5);
      ctx.lineTo(hx - hw - 2.5, top - 3.5);
      ctx.quadraticCurveTo(hx, top - 7, hx + hw + 3.5, top - 3.5);
      ctx.lineTo(hx + hw + 0.5, top + 4.5);
      ctx.closePath();
      paint(ctx, crown, INK, 1.3);
      poly(ctx, [hx - hw + 0.3, top + 1.2, hx + hw + 0.7, top + 1.2, hx + hw + 0.6, top + 4.6, hx - hw + 0.4, top + 4.6]);
      paint(ctx, police ? '#0B0B0E' : '#0F172A', null);
      if (!police) line(ctx, hx - hw + 0.5, top + 1.6, hx + hw + 0.5, top + 1.6, GOLD, 0.9);
      // visor toward the near side
      ctx.beginPath();
      ctx.moveTo(hx - hw + 1, top + 4.4);
      ctx.quadraticCurveTo(hx + 3, top + 8.6, hx + hw + 3.5, top + 5);
      ctx.lineTo(hx + hw, top + 4.2);
      ctx.closePath();
      paint(ctx, '#0B0B0E', '#3F3F46', 0.8);
      // badge
      poly(ctx, [hx + 0.5, top - 3.8, hx + 3, top - 2.2, hx + 2.6, top + 0.6, hx + 0.5, top + 1.4, hx - 1.6, top + 0.6, hx - 2, top - 2.2]);
      paint(ctx, GOLD, INK, 0.6);
      break;
    }
    case 'buzz-cut':
      ctx.save();
      ctx.globalAlpha = 0.85;
      capDome(top + 5, 1.6);
      paint(ctx, hair, null);
      ctx.restore();
      ctx.beginPath();
      ctx.moveTo(hx - hw - 0.6, top + 5);
      ctx.quadraticCurveTo(hx - hw - 1, top - 1.6, hx, top - 1.6);
      ctx.quadraticCurveTo(hx + hw + 1, top - 1.6, hx + hw + 0.6, top + 5);
      paint(ctx, null, hairEdge, 1);
      break;
    case 'comb-over':
      poly(ctx, [hx - hw - 0.3, top + 5, hx - hw + 2.6, top + 4, hx - hw + 2.2, hy + 1, hx - hw + 0.2, hy]);
      paint(ctx, hair, null);
      poly(ctx, [hx + hw - 2.2, top + 5, hx + hw + 0.4, top + 6, hx + hw, hy - 0.5, hx + hw - 2, hy]);
      paint(ctx, hair, null);
      ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(hx - hw + 1, top + 4.5 - i * 0.6);
        ctx.quadraticCurveTo(hx, top - 1.5 - i * 0.3 + i * 1.6, hx + hw - 0.5, top + 2 + i * 1.3);
        ctx.strokeStyle = hair;
        ctx.lineWidth = 1.1;
        ctx.stroke();
      }
      ctx.lineCap = 'butt';
      break;
    case 'slicked-grey':
      capDome(top + 5.5, 3);
      paint(ctx, hair, hairEdge, 1.2);
      ctx.save();
      ctx.globalAlpha = 0.45;
      for (let i = 0; i < 3; i++) line(ctx, hx - 4 + i * 4, top - 0.8, hx - 6 + i * 4, top + 4, '#FFFFFF', 0.7);
      ctx.restore();
      break;
    case 'grey-bun':
      capDome(top + 5, 2.4);
      paint(ctx, hair, hairEdge, 1.2);
      line(ctx, hx - 1, top - 2, hx + 2, top + 4.5, shade(hair, -0.3), 0.7);
      break;
    case 'blow-dried':
      ctx.beginPath();
      ctx.moveTo(hx - hw - 1.2, hy + 1);
      ctx.quadraticCurveTo(hx - hw - 3, top - 5, hx - 1, top - 5.5);
      ctx.quadraticCurveTo(hx + hw + 3, top - 6, hx + hw + 1.5, top + 3);
      ctx.lineTo(hx + hw + 0.5, hy - 2);
      ctx.quadraticCurveTo(hx + hw - 2, top + 3, hx - 1, top + 3.5);
      ctx.quadraticCurveTo(hx - hw + 1, top + 5, hx - hw + 1.5, hy + 1);
      ctx.closePath();
      paint(ctx, hair, hairEdge, 1.2);
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.moveTo(hx - 5, top - 3);
      ctx.quadraticCurveTo(hx + 2, top - 5, hx + 7, top);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
      break;
    case 'feathered':
      ctx.beginPath();
      ctx.moveTo(hx - hw - 1.5, hy + 4);
      ctx.quadraticCurveTo(hx - hw - 3, top - 4, hx - 0.5, top - 4);
      ctx.quadraticCurveTo(hx + hw + 3, top - 4, hx + hw + 1.5, hy + 3);
      ctx.lineTo(hx + hw - 1.5, hy - 1);
      ctx.quadraticCurveTo(hx + 4, top + 2, hx + 0.5, top + 4.5);
      ctx.quadraticCurveTo(hx - 3, top + 2, hx - hw + 1.5, hy);
      ctx.closePath();
      paint(ctx, hair, hairEdge, 1.2);
      line(ctx, hx - hw + 1, top + 5, hx - hw + 4, top + 1, shade(hair, 0.25), 0.8);
      line(ctx, hx + hw - 1, top + 5, hx + hw - 4, top + 1, shade(hair, 0.25), 0.8);
      break;
    case 'permed-hair':
    case 'curly-hair':
    case 'bouffant': {
      const r = t.headgear === 'permed-hair' ? 3.2 : t.headgear === 'curly-hair' ? 2.4 : 0;
      if (r > 0) {
        const n = 7;
        for (let i = 0; i < n; i++) {
          const a = Math.PI * (1.05 + (0.9 * i) / (n - 1));
          circ(ctx, hx + Math.cos(a) * (hw + 0.5), top + 4 + Math.sin(a) * 6.5, r);
          paint(ctx, hair, hairEdge, 0.9);
        }
        capDome(top + 4, 3);
        paint(ctx, hair, null);
      } else {
        // bouffant: a tall teased dome with a fringe sweep
        ctx.beginPath();
        ctx.moveTo(hx - hw - 2, hy - 1);
        ctx.quadraticCurveTo(hx - hw - 4, top - 10, hx, top - 10);
        ctx.quadraticCurveTo(hx + hw + 4, top - 10, hx + hw + 2, hy - 1);
        ctx.quadraticCurveTo(hx + hw - 1, top + 2, hx + 2, top + 3.5);
        ctx.quadraticCurveTo(hx - hw + 1, top + 4, hx - hw - 2, hy - 1);
        ctx.closePath();
        paint(ctx, hair, hairEdge, 1.2);
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.moveTo(hx - 6, top - 6);
        ctx.quadraticCurveTo(hx, top - 9, hx + 6, top - 6);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }
      break;
    }
    case 'red-crop':
      capDome(top + 4.5, 2.5);
      paint(ctx, hair, hairEdge, 1.2);
      for (let i = 0; i < 5; i++) {
        const x = hx - hw + 3 + i * (hw * 0.4);
        poly(ctx, [x - 1.6, top - 1, x + 0.4, top - 4.2, x + 1.8, top - 0.6]);
        paint(ctx, hair, null);
      }
      break;
    default: {
      // 'short-crop' and any unknown value
      capDome(top + 4.5, 2.8);
      paint(ctx, hair, hairEdge, 1.2);
      line(ctx, hx - 3, top - 2.2, hx - 1.5, top + 3, shade(hair, 0.3), 0.7); // side part
      break;
    }
  }
}

// ---------------------------------------------------------------- public API

/**
 * Draws one figure into the 0..FIGURE_W × 0..FIGURE_H box of `ctx` (feet at FIGURE_FOOT).
 * `accentHex` is the family colour: it tints the hat band, fedora crown and ties, and when it
 * is a known family accent (FAMILY_ACCENT, or Mafia-Wars' own family accents) it also picks
 * that family's signature mark (any other hex colour gets the street-3q lapel disc; a value
 * that is not a hex colour, such as CIVILIAN_ACCENT, gets no mark). Unknown trait values fall back to default parts; it never throws
 * on bad trait data, and every save is matched by a restore.
 */
export function drawCharacter(ctx: Ctx2D, traits: CharacterTraits, accentHex: string): void {
  const t = (traits ?? {}) as CharacterTraits;
  const markless = parseHex(accentHex) === null;
  const accent = col(accentHex, NEUTRAL);
  const fam = markless ? null : familyOfAccent(accent);
  const o = OUTFITS[t.outfit] ?? DEFAULT_OUTFIT;
  const g = geometry(t, o);
  const p = palette(t, o, accent);
  ctx.save();
  try {
    ctx.lineJoin = 'round';
    ctx.lineCap = 'butt';
    ctx.globalAlpha = 1;
    // wet cobblestone ground shadow
    ctx.save();
    ctx.globalAlpha = 0.6;
    ell(ctx, 50, 108.5, 23, 4.6);
    paint(ctx, '#050608', null);
    ctx.restore();

    drawBackHair(ctx, g, t, p, o);
    drawLegs(ctx, g, o, p);
    drawArm(ctx, g, o, p, false, fam);
    drawTorso(ctx, g, o, p, fam);
    if (!markless) drawFamilyMark(ctx, g, o, accent, fam);
    drawArm(ctx, g, o, p, true, fam);
    drawHeld(ctx, g, t, accent);
    drawHead(ctx, g, t, p, accent, fam);
  } finally {
    ctx.restore();
  }
}

/**
 * Bakes a figure into a new canvas of ceil(FIGURE_W·scale) × ceil(FIGURE_H·scale) pixels.
 * Returns null when `makeCanvas` returns null or the canvas has no 2D context
 * (the caller then draws directly and retries later).
 */
export function bakeCharacter(
  traits: CharacterTraits,
  accentHex: string,
  makeCanvas: (w: number, h: number) => CanvasLike | null,
  scale: number,
): CanvasLike | null {
  const s = Number.isFinite(scale) && scale > 0 ? scale : 1;
  const w = Math.max(1, Math.ceil(FIGURE_W * s));
  const h = Math.max(1, Math.ceil(FIGURE_H * s));
  let canvas: CanvasLike | null = null;
  try {
    canvas = makeCanvas(w, h);
  } catch {
    return null;
  }
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.save();
  ctx.scale(s, s);
  drawCharacter(ctx, traits, accentHex);
  ctx.restore();
  return canvas;
}

/** A stable key for a trait set (all nine traits; colours case-normalised). */
export function traitSignature(traits: CharacterTraits): string {
  const t = (traits ?? {}) as Partial<CharacterTraits>;
  const c = (v: unknown) => (typeof v === 'string' ? v.trim().toLowerCase() : String(v));
  return [t.headgear, t.eyewear, t.outfit, t.heldItem, t.build, t.facialHairOrScar].map((v) => String(v)).join('|') +
    '|' + [t.hairColorHex, t.primaryGarmentHex, t.secondaryGarmentHex].map(c).join('|');
}
