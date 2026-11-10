/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { AREA_IDS, BRIDGES, CELL, CONTACT_BOROUGH, CONTACT_IDS, CONTACT_PLACEMENT, FERRY_TERMINALS, LAND, RACKET_IDS, RACKET_INFO, RACKET_PLACEMENT, START_POINT, STATIONS, WORLD_H, WORLD_W, boroughOutline } from './cityData.ts';
import type { AreaId, Pt } from './cityData.ts';
import { CellKind, areaAtPoint, blocksBullet, generateCity, isDrivable, isWalkable, kindAt, lookOf, mulberry32, moveWithCollision, nearestWalkable, randomWalkableIn, signatureOf } from './cityGen.ts';
import type { City } from './cityGen.ts';
import { distToSegment, pointInPoly } from './city/geom.ts';

const city = generateCity();
const cellOf = (c: City, p: Pt): number => Math.floor(p.y / CELL) * c.cols + Math.floor(p.x / CELL);
const centre = (c: City, i: number): Pt => ({ x: (i % c.cols) * CELL + CELL / 2, y: Math.floor(i / c.cols) * CELL + CELL / 2 });

/** Cells reachable on foot from a point (4-neighbour walk over walkable cells). */
function reach(c: City, from: Pt): Uint8Array {
  const seen = new Uint8Array(c.kinds.length);
  const stack = [cellOf(c, from)];
  seen[stack[0]] = 1;
  while (stack.length) {
    const i = stack.pop() as number;
    const x = i % c.cols;
    for (const n of [x > 0 ? i - 1 : -1, x < c.cols - 1 ? i + 1 : -1, i - c.cols, i + c.cols]) {
      if (n >= 0 && n < seen.length && !seen[n] && isWalkable(c, centre(c, n).x, centre(c, n).y)) { seen[n] = 1; stack.push(n); }
    }
  }
  return seen;
}

test('AC-001 size and determinism', () => {
  assert.equal(city.cols * CELL, WORLD_W);
  assert.equal(city.rows, Math.ceil(WORLD_H / CELL));
  assert.equal(city.kinds.length, city.cols * city.rows);
  const again = generateCity();
  assert.deepEqual(again.kinds, city.kinds);
  assert.deepEqual(again.buildings, city.buildings);
  assert.deepEqual(again.lamps, city.lamps);
  assert.notDeepEqual(generateCity(7).buildings.map(signatureOf), city.buildings.map(signatureOf));
});

test('AC-002 water, stations and no building on water', () => {
  const water: Pt[] = [{ x: 1700, y: 1880 }, { x: 2868, y: 1960 }, { x: 2860, y: 1000 }, { x: 2160, y: 3780 }, { x: 5000, y: 4060 }, { x: 5160, y: 1500 }];
  for (const p of water) assert.equal(kindAt(city, p.x, p.y), CellKind.WATER, `${p.x},${p.y}`);
  for (const id of Object.keys(STATIONS) as (keyof typeof STATIONS)[]) {
    assert.ok(isWalkable(city, STATIONS[id].x, STATIONS[id].y), id);
    assert.equal(areaAtPoint(city, STATIONS[id].x, STATIONS[id].y), id);
  }
  assert.ok(isWalkable(city, START_POINT.x, START_POINT.y));
  const land = [LAND.manhattan, LAND.bronx, LAND.queens, LAND.brooklyn, LAND.staten_island];
  for (const b of city.buildings) {
    for (let y = b.cy; y < b.cy + b.ch; y++) for (let x = b.cx; x < b.cx + b.cw; x++) {
      assert.ok(land.some((p) => pointInPoly(x * CELL + 16, y * CELL + 16, p)), `building ${b.id} on water`);
      assert.equal(city.kinds[y * city.cols + x], CellKind.BUILDING);
    }
  }
});

test('AC-002 bridges join their shores, the George Washington Bridge is blocked', () => {
  const bridgeCells: number[] = [];
  city.kinds.forEach((k, i) => { if (k === CellKind.BRIDGE) bridgeCells.push(i); });
  const dist = (i: number, p: Pt): number => Math.hypot(centre(city, i).x - p.x, centre(city, i).y - p.y);
  for (const b of BRIDGES.filter((q) => q.open)) {
    const p0 = b.points[0], p1 = b.points[b.points.length - 1];
    const mid = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
    const start = bridgeCells.reduce((a, c) => (dist(c, mid) < dist(a, mid) ? c : a));
    const seen = new Set<number>([start]);
    const stack = [start];
    while (stack.length) {
      const i = stack.pop() as number;
      for (const n of [i - 1, i + 1, i - city.cols, i + city.cols]) if (!seen.has(n) && city.kinds[n] === CellKind.BRIDGE) { seen.add(n); stack.push(n); }
    }
    const shore: number[] = [];
    for (const i of seen) for (const n of [i - 1, i + 1, i - city.cols, i + city.cols]) if (city.kinds[n] === CellKind.ROAD) shore.push(n);
    for (const p of [p0, p1]) assert.ok([...seen].some((i) => dist(i, p) < 224) && shore.some((n) => dist(n, p) < 224), `${b.id} joins its shore near ${p.x},${p.y}`);
  }
  const gwb = BRIDGES.find((q) => !q.open) as (typeof BRIDGES)[number];
  const span: number[] = [];
  city.kinds.forEach((k, i) => { if (k === CellKind.BARRIER && distToSegment(centre(city, i).x, centre(city, i).y, gwb.points[0], gwb.points[1]) < 64) span.push(i); });
  assert.ok(span.length > 10);
  const barrier = [-2, -1, 0, 1, 2].some((d) => kindAt(city, gwb.points[0].x + d * CELL, gwb.points[0].y) === CellKind.BARRIER);
  assert.ok(barrier, 'barrier cells at the Manhattan end');
  const seen = reach(city, STATIONS.midtown_concrete);
  assert.ok(span.every((i) => !seen[i]), 'nobody walks onto the closed bridge');
  assert.ok(bridgeCells.length > 0 && bridgeCells.every((i) => seen[i]), 'every bridge cell is reachable from a station');
});

test('AC-003 every station reaches every other station and Staten Island; ferries are walkable', () => {
  const si = AREA_IDS.indexOf('staten_island');
  for (const from of Object.values(STATIONS)) {
    const seen = reach(city, from);
    for (const to of Object.values(STATIONS)) assert.ok(seen[cellOf(city, to)], `${from.x},${from.y} -> ${to.x},${to.y}`);
    assert.ok(seen.some((v, i) => v && city.areaAt[i] === si), 'Staten Island reached');
  }
  for (const t of [FERRY_TERMINALS.battery, FERRY_TERMINALS.stGeorge]) assert.ok(isWalkable(city, t.x, t.y));
});

test('AC-004 unique look signatures and sign names, signatures hold no position or id', () => {
  const sigs = new Set(city.buildings.map(signatureOf));
  const signs = new Set(city.buildings.map((b) => b.sign));
  assert.equal(sigs.size, city.buildings.length);
  assert.equal(new Set(city.buildings.map(lookOf)).size, city.buildings.length, 'looks differ even with the sign name removed');
  assert.equal(signs.size, city.buildings.length);
  const b = city.buildings[10];
  assert.equal(signatureOf({ ...b, id: 99999, cx: 1, cy: 2 }), signatureOf(b));
});

test('AC-005 racket lots, contacts and spawn picks', () => {
  for (const id of RACKET_IDS) {
    const r = RACKET_PLACEMENT[id];
    const b = city.buildings.find((q) => q.racketId === id);
    assert.ok(b, id);
    assert.deepEqual([b.cx * CELL, b.cy * CELL, b.cw * CELL, b.ch * CELL], [r.x, r.y, r.width, r.height]);
    assert.equal(b.sign, RACKET_INFO[id].name);
    const outline = boroughOutline(RACKET_INFO[id].boroughId);
    const corners: [number, number][] = [[r.x, r.y], [r.x + r.width, r.y], [r.x, r.y + r.height], [r.x + r.width, r.y + r.height]];
    for (const [x, y] of corners) assert.ok(pointInPoly(x, y, outline), `${id} corner ${x},${y}`);
    for (let y = b.cy; y < b.cy + b.ch; y++) for (let x = b.cx; x < b.cx + b.cw; x++) {
      assert.equal(city.buildingAt[y * city.cols + x], b.id);
      assert.equal(AREA_IDS[city.areaAt[y * city.cols + x]], RACKET_INFO[id].boroughId, `${id} cell ${x},${y} borough`);
    }
    assert.equal(kindAt(city, (b.cx + (b.cw >> 1)) * CELL + 16, (b.cy + b.ch) * CELL + 16), CellKind.SIDEWALK, `${id} door`);
  }
  for (const id of CONTACT_IDS) {
    const p = CONTACT_PLACEMENT[id];
    assert.ok(isWalkable(city, p.x, p.y), id);
    assert.equal(areaAtPoint(city, p.x, p.y), CONTACT_BOROUGH[id]);
  }
  const rand = mulberry32(5);
  for (const area of AREA_IDS as readonly AreaId[]) {
    for (let k = 0; k < 40; k++) {
      const p = randomWalkableIn(city, area, rand);
      assert.ok(isWalkable(city, p.x, p.y) && areaAtPoint(city, p.x, p.y) === area, area);
    }
  }
});

test('density: buildings fill at least 38 percent of each area and meet the per-area counts', () => {
  const least: Record<AreaId, number> = { manhattan_south: 16, midtown_concrete: 15, uptown: 22, bronx_terminal: 60, brooklyn_docks: 80, queens_cargo: 100, staten_island: 20 };
  for (const area of AREA_IDS) {
    const ai = AREA_IDS.indexOf(area);
    let built = 0, land = 0;
    for (let i = 0; i < city.kinds.length; i++) {
      const k = city.kinds[i];
      if (city.areaAt[i] !== ai || k === CellKind.PARK || k === CellKind.PLAZA || k === CellKind.PIER) continue;
      land++;
      if (k === CellKind.BUILDING) built++;
    }
    assert.ok(built / land >= 0.38, `${area} fraction ${built / land}`);
    assert.ok(city.buildings.filter((b) => b.area === area).length >= least[area], `${area} count`);
  }
});

test('streets: stations reach their rackets on foot without big detours, and the grid has junctions', () => {
  for (const id of Object.keys(STATIONS) as (keyof typeof STATIONS)[]) {
    const sx = Math.floor(STATIONS[id].x / CELL), sy = Math.floor(STATIONS[id].y / CELL);
    const dist = new Int32Array(city.kinds.length).fill(-1);
    const queue = [sy * city.cols + sx];
    dist[queue[0]] = 0;
    for (let h = 0; h < queue.length; h++) {
      const i = queue[h], x = i % city.cols;
      for (const n of [x > 0 ? i - 1 : -1, x < city.cols - 1 ? i + 1 : -1, i - city.cols, i + city.cols]) {
        if (n >= 0 && n < dist.length && dist[n] < 0 && isWalkable(city, centre(city, n).x, centre(city, n).y)) { dist[n] = dist[i] + 1; queue.push(n); }
      }
    }
    for (const b of city.buildings.filter((q) => q.racketId && RACKET_INFO[q.racketId as keyof typeof RACKET_INFO].boroughId === id)) {
      const dx = b.cx + (b.cw >> 1), dy = b.cy + b.ch;
      const walk = dist[dy * city.cols + dx];
      assert.ok(walk >= 0 && walk <= 3 * Math.hypot(dx - sx, dy - sy) + 12, `${id} to ${b.racketId}: ${walk} steps`);
    }
  }
  const drive = (x: number, y: number): boolean => isDrivable(city, x * CELL + 16, y * CELL + 16);
  const run = (x: number, y: number, ax: number, ay: number): number => {
    let n = 1;
    for (let s = 1; s < 40 && drive(x + ax * s, y + ay * s); s++) n++;
    for (let s = 1; s < 40 && drive(x - ax * s, y - ay * s); s++) n++;
    return n;
  };
  let junctions = 0;
  for (let y = 0; y < city.rows; y++) for (let x = 0; x < city.cols; x++) {
    if (city.kinds[y * city.cols + x] === CellKind.ROAD && run(x, y, 1, 0) >= 6 && run(x, y, 0, 1) >= 6) junctions++;
  }
  assert.ok(junctions >= 150, `junction cells ${junctions}`);
});

test('helpers: nearestWalkable, sliding collision, bullets', () => {
  const b = city.buildings[0];
  const inside = { x: (b.cx + 1) * CELL, y: (b.cy + 1) * CELL };
  assert.ok(blocksBullet(city, inside.x, inside.y));
  const p = nearestWalkable(city, inside.x, inside.y) as Pt;
  assert.ok(p && isWalkable(city, p.x, p.y));
  const door = { x: (b.cx + 1) * CELL + 16, y: (b.cy + b.ch) * CELL + 16 };
  const m = moveWithCollision(city, door.x, door.y, 6, -40, 8);
  assert.ok(m.y >= door.y - 40 && m.x > door.x, 'blocked upward by the wall, slid sideways');
});

test('game data ids and boroughs match the tuples and tables here', () => {
  const text = readFileSync(new URL('../data/nyc1984Data.ts', import.meta.url), 'utf8');
  const rows = (prefix: string): string[][] => [...text.matchAll(new RegExp(`id: '(${prefix}_\\w+)'[\\s\\S]*?boroughId: '(\\w+)'`, 'g'))].map((m) => [m[1], m[2]]);
  assert.deepEqual(rows('racket').map((r) => r[0]), [...RACKET_IDS]);
  assert.deepEqual(rows('contact').map((r) => r[0]), [...CONTACT_IDS]);
  for (const [id, borough] of rows('racket')) assert.equal(RACKET_INFO[id as keyof typeof RACKET_INFO].boroughId, borough);
  for (const [id, borough] of rows('contact')) assert.equal(CONTACT_BOROUGH[id as keyof typeof CONTACT_BOROUGH], borough);
});
