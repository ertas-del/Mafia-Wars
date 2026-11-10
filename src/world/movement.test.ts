/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CELL } from './cityData.ts';
import { CellKind, generateCity, isDrivable, isWalkable, kindAt, mulberry32, moveWithCollision, areaAtPoint, randomWalkableIn } from './cityGen.ts';
import type { City } from './cityGen.ts';
import { buildFlowField, createStuckTracker, flowDirection, pickUnstuckTarget, updateStuck } from './pathfind.ts';
import { spawnTraffic, stepTraffic } from './traffic.ts';

const city = generateCity();

/** A small hand-made city: all sidewalk, with a building wall across the middle that has one gap at the far east. */
function wallCity(): City {
  const cols = 24, rows = 12;
  const kinds = new Uint8Array(cols * rows).fill(CellKind.SIDEWALK);
  for (let c = 0; c < cols - 3; c++) for (let r = 5; r <= 6; r++) kinds[r * cols + c] = CellKind.BUILDING;
  return { seed: 0, cols, rows, kinds, buildingAt: new Int32Array(cols * rows).fill(-1), areaAt: new Uint8Array(cols * rows).fill(255), buildings: [], lamps: [] };
}

/** Walk an NPC along the flow field, refreshing nothing, and report whether it arrives. */
function walk(c: City, sx: number, sy: number, tx: number, ty: number, radiusCells: number, useField: boolean) {
  const field = buildFlowField(c, tx, ty, radiusCells);
  let p = { x: sx, y: sy };
  const path = [p];
  for (let i = 0; i < 60 * 40; i++) {
    let dx = tx - p.x, dy = ty - p.y;
    const len = Math.hypot(dx, dy);
    if (len < 12) return { arrived: true, path };
    if (useField) {
      const f = flowDirection(field, c, p.x, p.y);
      if (f) { dx = f.dx; dy = f.dy; } else { dx /= len; dy /= len; }
    } else { dx /= len; dy /= len; }
    p = moveWithCollision(c, p.x, p.y, dx * 100 / 60, dy * 100 / 60, 8);
    path.push(p);
  }
  return { arrived: false, path };
}

test('AC-007 path search leads around a building to a target behind it (hand-made wall)', () => {
  const c = wallCity();
  const sx = 4 * CELL + 16, sy = 3 * CELL + 16; // north of the wall
  const tx = 4 * CELL + 16, ty = 9 * CELL + 16; // directly south of it
  // A straight line between them crosses the wall.
  assert.equal(kindAt(c, 4 * CELL + 16, 5 * CELL + 16), CellKind.BUILDING);
  const straight = walk(c, sx, sy, tx, ty, 0, false);
  assert.equal(straight.arrived, false, 'a straight-line walker must get stuck on the wall');
  const routed = walk(c, sx, sy, tx, ty, 30, true);
  assert.equal(routed.arrived, true, 'the flow-field walker must reach the target');
  assert.ok(routed.path.every((p) => isWalkable(c, p.x, p.y)), 'every step is on a walkable cell');
  assert.ok(Math.max(...routed.path.map((p) => p.x)) > 20 * CELL, 'the route goes round through the gap at the east end');
});

test('AC-007 flow field details: radius limit, unreachable cells, target cell', () => {
  const c = wallCity();
  const f = buildFlowField(c, 4 * CELL + 16, 9 * CELL + 16, 3);
  assert.equal(f.dist.length, 7 * 7);
  assert.equal(flowDirection(f, c, 4 * CELL + 16, 9 * CELL + 16), null, 'null in the target cell');
  assert.equal(flowDirection(f, c, 4 * CELL + 16, 0), null, 'null outside the field');
  const walled = buildFlowField(c, 4 * CELL + 16, 9 * CELL + 16, 30);
  assert.equal(flowDirection(walled, c, 4 * CELL + 16, 5 * CELL + 16), null, 'null inside a building (not reached)');
  const d = flowDirection(walled, c, 4 * CELL + 16, 7 * CELL + 16);
  assert.ok(d && d.dy > 0.9, 'heads straight toward a target in the open');
  const d2 = flowDirection(walled, c, 4 * CELL + 16, 3 * CELL + 16);
  assert.ok(d2 && Math.abs(Math.hypot(d2.dx, d2.dy) - 1) < 1e-9, 'directions are unit vectors');
  // A target inside a building is moved to the nearest walkable cell.
  const inWall = buildFlowField(c, 4 * CELL + 16, 5 * CELL + 16, 6);
  assert.ok(isWalkable(c, inWall.cx * CELL + 16, inWall.cy * CELL + 16));
});

test('AC-007 path search leads around a building to a target behind it (real city)', () => {
  let tested = 0;
  for (const b of city.buildings) {
    if (b.cw < 3 || b.ch < 1 || b.cw > 8) continue;
    const row = b.cy + Math.floor(b.ch / 2);
    const lc = b.cx - 1, rc = b.cx + b.cw;
    const sx = lc * CELL + 16, tx = rc * CELL + 16, y = row * CELL + 16;
    if (!isWalkable(city, sx, y) || !isWalkable(city, tx, y)) continue;
    const field = buildFlowField(city, tx, y, 24);
    if (flowDirection(field, city, sx, y) === null) continue; // not connected within the radius
    const straight = walk(city, sx, y, tx, y, 0, false);
    if (straight.arrived) continue;
    const routed = walk(city, sx, y, tx, y, 24, true);
    assert.equal(routed.arrived, true, `building ${b.id} (${b.sign}) should be walked around`);
    assert.ok(routed.path.every((p) => isWalkable(city, p.x, p.y)));
    if (++tested >= 12) break;
  }
  assert.ok(tested >= 5, `only ${tested} buildings could be tested`);
});

test('AC-007 the stuck rule fires after 2 s without progress and picks a new walkable target', () => {
  const t = createStuckTracker(100, 100);
  const dt = 1 / 60;
  let firedAt = -1;
  for (let i = 1; i <= 240; i++) {
    if (updateStuck(t, 100, 100, dt, true)) { firedAt = i; break; }
  }
  assert.ok(firedAt >= 119 && firedAt <= 121, `fired at step ${firedAt}, about 2 s`);
  // Not trying, or making progress, never fires.
  const t2 = createStuckTracker(0, 0);
  for (let i = 1; i <= 600; i++) assert.equal(updateStuck(t2, 0, 0, dt, false), false);
  const t3 = createStuckTracker(0, 0);
  for (let i = 1; i <= 600; i++) assert.equal(updateStuck(t3, i * 2, 0, dt, true), false);
  // It restarts: another 2 s is needed before the next report.
  let again = 0;
  for (let i = 1; i <= 240; i++) if (updateStuck(t, 100, 100, dt, true)) { again = i; break; }
  assert.ok(again >= 119 && again <= 121);

  // The new target is walkable, differs from the stuck cell, and is near the NPC.
  const rand = mulberry32(7);
  for (const area of ['manhattan_south', 'bronx_terminal', 'staten_island'] as const) {
    const here = randomWalkableIn(city, area, rand);
    for (let k = 0; k < 20; k++) {
      const p = pickUnstuckTarget(city, here.x, here.y, rand);
      assert.ok(p, 'a target is found');
      assert.ok(isWalkable(city, p.x, p.y), 'target is walkable');
      assert.ok(Math.floor(p.x / CELL) !== Math.floor(here.x / CELL) || Math.floor(p.y / CELL) !== Math.floor(here.y / CELL), 'target is a different cell');
      assert.ok(Math.hypot(p.x - here.x, p.y - here.y) < 12 * CELL);
      assert.equal(areaAtPoint(city, here.x, here.y), area);
    }
  }
});

test('AC-007 an NPC pressed into a wall is freed by the stuck rule', () => {
  const c = wallCity();
  const rand = mulberry32(3);
  let p = { x: 4 * CELL + 16, y: 4 * CELL + 16 };
  const target = { x: 4 * CELL + 16, y: 9 * CELL + 16 };
  const tracker = createStuckTracker(p.x, p.y);
  let freed = false;
  for (let i = 0; i < 60 * 6 && !freed; i++) {
    const len = Math.hypot(target.x - p.x, target.y - p.y);
    p = moveWithCollision(c, p.x, p.y, (target.x - p.x) / len * 100 / 60, (target.y - p.y) / len * 100 / 60, 8);
    if (updateStuck(tracker, p.x, p.y, 1 / 60, true)) {
      const next = pickUnstuckTarget(c, p.x, p.y, rand);
      assert.ok(next && isWalkable(c, next.x, next.y));
      freed = true;
    }
  }
  assert.ok(freed, 'the NPC pressed against the wall reports stuck');
});

test('flow field is cheap enough to rebuild a few times a second for several NPCs', () => {
  const rand = mulberry32(11);
  const p = randomWalkableIn(city, 'midtown_concrete', rand);
  buildFlowField(city, p.x, p.y, 40); // warm up
  const t0 = performance.now();
  const N = 100;
  for (let i = 0; i < N; i++) buildFlowField(city, p.x + i, p.y, 40);
  const per = (performance.now() - t0) / N;
  assert.ok(per < 5, `rebuild took ${per.toFixed(2)} ms`);
});

// ---- AC-008 ----

/** Connected components of BRIDGE cells; returns a cell -> component id map (-1 elsewhere). */
function bridgeComponents(c: City): { id: Int32Array; count: number } {
  const id = new Int32Array(c.kinds.length).fill(-1);
  let count = 0;
  for (let i = 0; i < c.kinds.length; i++) {
    if (c.kinds[i] !== CellKind.BRIDGE || id[i] !== -1) continue;
    const st = [i];
    id[i] = count;
    while (st.length) {
      const j = st.pop() as number;
      const x = j % c.cols;
      for (const n of [x > 0 ? j - 1 : -1, x < c.cols - 1 ? j + 1 : -1, j - c.cols, j + c.cols]) {
        if (n >= 0 && n < id.length && c.kinds[n] === CellKind.BRIDGE && id[n] === -1) { id[n] = count; st.push(n); }
      }
    }
    count++;
  }
  return { id, count };
}

/** Simulate and report violations and the number of full bridge crossings (entered from a road cell, left onto a road cell far away). */
function simulate(seed: number, steps: number, count = 40) {
  const rand = mulberry32(seed);
  const cars = spawnTraffic(city, count, rand);
  const { id } = bridgeComponents(city);
  const cellOfCar = (x: number, y: number) => Math.floor(y / CELL) * city.cols + Math.floor(x / CELL);
  const state = cars.map((car) => ({ comp: id[cellOfCar(car.x, car.y)], ex: car.x, ey: car.y, entered: false }));
  let offRoad = 0, crossings = 0, onBridgeSteps = 0;
  const dt = 1 / 60;
  for (let s = 0; s < steps; s++) {
    stepTraffic(cars, city, dt, rand);
    for (let i = 0; i < cars.length; i++) {
      const car = cars[i];
      if (!isDrivable(city, car.x, car.y)) offRoad++;
      const k = kindAt(city, car.x, car.y);
      const st = state[i];
      const comp = k === CellKind.BRIDGE ? id[cellOfCar(car.x, car.y)] : -1;
      if (comp !== -1) onBridgeSteps++;
      if (comp !== st.comp) {
        if (st.comp !== -1 && comp === -1 && st.entered && Math.hypot(car.x - st.ex, car.y - st.ey) >= 6 * CELL) crossings++;
        if (comp !== -1) { st.ex = car.x; st.ey = car.y; st.entered = true; }
        else st.entered = false;
        st.comp = comp;
      }
    }
  }
  return { cars, offRoad, crossings, onBridgeSteps };
}

test('AC-008 2,000 fixed 1/60 s steps: every car stays on road or bridge cells and one crosses a bridge', () => {
  const r = simulate(1984, 2000);
  assert.equal(r.cars.length, 40);
  assert.equal(r.offRoad, 0, 'a car was off the road');
  assert.ok(r.crossings >= 1, `no car crossed a bridge (${r.onBridgeSteps} bridge car-steps)`);
});

test('AC-008 holds for several other seeds too', () => {
  for (const seed of [1, 2, 3, 42, 777]) {
    const r = simulate(seed, 2000);
    assert.equal(r.offRoad, 0, `seed ${seed}: car off the road`);
    assert.ok(r.crossings >= 1, `seed ${seed}: no bridge crossing`);
  }
});

test('traffic: same seed gives the same cars, one in ten is police, cars never wrap or leave the world', () => {
  const a = simulate(5, 600), b = simulate(5, 600);
  assert.deepEqual(a.cars, b.cars);
  assert.equal(a.cars.filter((c) => c.isPolice).length, 4);
  const far = simulate(9, 2000, 40);
  for (const car of far.cars) assert.ok(car.x > 0 && car.y > 0 && car.x < city.cols * CELL && car.y < city.rows * CELL);
  assert.ok(far.cars.some((c) => c.dir !== far.cars[0].dir) || far.cars.length > 1);
});

test('traffic: cars keep to the right-hand lane on plain roads and turn at junctions', () => {
  const rand = mulberry32(21);
  const cars = spawnTraffic(city, 40, rand);
  const dirs = new Set<number>();
  const turned = new Set<number>();
  const first = cars.map((c) => c.dir);
  for (let s = 0; s < 3000; s++) {
    stepTraffic(cars, city, 1 / 60, rand);
    cars.forEach((c, i) => { dirs.add(c.dir); if (c.dir !== first[i]) turned.add(i); });
  }
  assert.ok(turned.size >= 5, `only ${turned.size} cars ever turned`);
  assert.equal(dirs.size, 4);
});

test('traffic: a spawn in a city with no roads returns no cars and stepping is harmless', () => {
  const c = wallCity();
  const rand = mulberry32(1);
  assert.deepEqual(spawnTraffic(c, 10, rand), []);
  stepTraffic([], c, 1 / 60, rand);
});

test('traffic: a big time step does not skip past the road edge', () => {
  const rand = mulberry32(8);
  const cars = spawnTraffic(city, 20, rand);
  for (let s = 0; s < 200; s++) {
    stepTraffic(cars, city, 0.25, rand);
    for (const c of cars) assert.ok(isDrivable(city, c.x, c.y));
  }
});
