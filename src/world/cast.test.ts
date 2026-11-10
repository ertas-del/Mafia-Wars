/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CAST, CAST_FAMILIES, FAMILY_ACCENT, HEADGEAR_STYLES, EYEWEAR_STYLES, OUTFIT_STYLES, HELD_ITEM_STYLES,
  BUILD_STYLES, FACIAL_STYLES, createCastPool, assignCast, genericTraits, castById,
  type CastFamily, type CharacterTraits,
} from './cast.ts';
import {
  drawCharacter, bakeCharacter, traitSignature, FIGURE_W, FIGURE_H, CIVILIAN_ACCENT,
  type CanvasLike, type Ctx2D,
} from './characterSprite.ts';
import { layoutTags, boxesOverlap, type TagRequest } from './tagLayout.ts';

// The DOM canvas must fit CanvasLike (checked by tsc; erased at run time).
type DomCanvasFits = HTMLCanvasElement extends CanvasLike ? true : false;
const domCanvasFits: DomCanvasFits = true;
void domCanvasFits;

const HEX = /^#[0-9A-Fa-f]{6}$/;

function assertTraitsAllowed(t: CharacterTraits, who: string): void {
  assert.ok((HEADGEAR_STYLES as readonly string[]).includes(t.headgear), `${who} headgear ${t.headgear}`);
  assert.ok((EYEWEAR_STYLES as readonly string[]).includes(t.eyewear), `${who} eyewear ${t.eyewear}`);
  assert.ok((OUTFIT_STYLES as readonly string[]).includes(t.outfit), `${who} outfit ${t.outfit}`);
  assert.ok((HELD_ITEM_STYLES as readonly string[]).includes(t.heldItem), `${who} heldItem ${t.heldItem}`);
  assert.ok((BUILD_STYLES as readonly string[]).includes(t.build), `${who} build ${t.build}`);
  assert.ok((FACIAL_STYLES as readonly string[]).includes(t.facialHairOrScar), `${who} facial ${t.facialHairOrScar}`);
  for (const k of ['hairColorHex', 'primaryGarmentHex', 'secondaryGarmentHex'] as const) assert.match(t[k], HEX, `${who} ${k}`);
}

// ---------------------------------------------------------------- AC-001

const DENYLIST = [
  'Vitale', 'Amato', 'Carbone', 'Santoro', 'Russo', 'Gigante', 'Gotti', 'Castellano', 'Persico', 'Indelicato',
  'Ruggiero', 'Casso', 'Gambino', 'Genovese', 'Lucchese', 'Bonanno', 'Colombo',
];

test('AC-001 the cast has 50 unique ids and 50 unique names', () => {
  assert.equal(CAST.length, 50);
  assert.equal(new Set(CAST.map((c) => c.id)).size, 50);
  assert.equal(new Set(CAST.map((c) => c.name)).size, 50);
  assert.deepEqual(CAST.map((c) => c.num), Array.from({ length: 50 }, (_, i) => i + 1));
  for (const c of CAST) {
    assert.equal(castById(c.id), c);
    for (const k of ['id', 'name', 'role', 'bio'] as const) assert.ok(c[k].length > 0, `${c.id} ${k}`);
  }
});

test('AC-001 the per-family counts are 10, 8, 8, 8, 8 and 8', () => {
  const counts: Record<string, number> = {};
  for (const c of CAST) counts[c.familyId] = (counts[c.familyId] ?? 0) + 1;
  assert.deepEqual(counts, { corvini: 10, bellini: 8, valenti: 8, moretti: 8, rastelli: 8, outside: 8 });
});

test('AC-001 every trait value is one of the allowed values', () => {
  for (const c of CAST) {
    assert.ok(CAST_FAMILIES.includes(c.familyId), c.id);
    assertTraitsAllowed(c.traits, c.id);
  }
});

test('AC-001 no name contains a surname from the denylist of real crime figures', () => {
  for (const c of CAST) {
    for (const s of DENYLIST) {
      assert.ok(!new RegExp(`\\b${s}\\b`, 'i').test(c.name), `${c.name} contains ${s}`);
      // stricter than the AC: ids and bios are clean too
      assert.ok(!c.id.toLowerCase().includes(s.toLowerCase()), `${c.id} contains ${s}`);
      assert.ok(!new RegExp(`\\b${s}\\b`, 'i').test(c.bio), `${c.id} bio contains ${s}`);
    }
  }
  const names = new Set(CAST.map((c) => c.name));
  for (const n of [
    'Lorenzo "The Ledger" Ravasi', 'Frankie "Photo Finish" Cardella', 'Johnny "Runway" Lomarco',
    'Gino "Velvet" Fiorella', 'Mikey "Nine Lives" Castagna',
  ]) assert.ok(names.has(n), n);
});

// ---------------------------------------------------------------- AC-002

interface Recorder extends Ctx2D {
  depth: number;
  saves: number;
  restores: number;
  ops: number;
  maxDepth: number;
}

/** A fake 2D context that records calls, checks save/restore balance and rejects bad numbers. */
function recordingContext(): Recorder {
  const r = {
    fillStyle: '#000' as unknown,
    strokeStyle: '#000' as unknown,
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    globalAlpha: 1,
    depth: 0,
    saves: 0,
    restores: 0,
    ops: 0,
    maxDepth: 0,
  } as Recorder;
  const nums = (name: string, args: unknown[]) => {
    for (const a of args) if (typeof a === 'number') assert.ok(Number.isFinite(a), `${name} got ${a}`);
    r.ops++;
  };
  r.save = () => {
    r.saves++;
    r.depth++;
    r.maxDepth = Math.max(r.maxDepth, r.depth);
  };
  r.restore = () => {
    r.restores++;
    r.depth--;
    assert.ok(r.depth >= 0, 'restore without a matching save');
  };
  for (const name of ['beginPath', 'closePath', 'fill', 'stroke', 'clip'] as const) r[name] = () => nums(name, []);
  for (const name of ['moveTo', 'lineTo', 'quadraticCurveTo', 'bezierCurveTo', 'rect', 'fillRect', 'translate', 'scale', 'rotate'] as const) {
    (r as unknown as Record<string, (...a: number[]) => void>)[name] = (...a: number[]) => nums(name, a);
  }
  r.arc = (x, y, rad, a0, a1) => {
    nums('arc', [x, y, rad, a0, a1]);
    assert.ok(rad >= 0, 'arc radius must not be negative');
  };
  r.ellipse = (x, y, rx, ry, rot, a0, a1) => {
    nums('ellipse', [x, y, rx, ry, rot, a0, a1]);
    assert.ok(rx >= 0 && ry >= 0, 'ellipse radii must not be negative');
  };
  r.setLineDash = (seg) => nums('setLineDash', seg);
  return r;
}

function drawBalanced(traits: CharacterTraits, accent: string, who: string): Recorder {
  const ctx = recordingContext();
  assert.doesNotThrow(() => drawCharacter(ctx, traits, accent), who);
  assert.equal(ctx.depth, 0, `${who}: save/restore unbalanced`);
  assert.equal(ctx.saves, ctx.restores, `${who}: ${ctx.saves} saves vs ${ctx.restores} restores`);
  assert.ok(ctx.ops > 50, `${who}: drew almost nothing (${ctx.ops} ops)`);
  return ctx;
}

const SEEDS = [0, 1, 2, 3, 7, 42, 99, 1984, 123456789, -5];

test('AC-002 every cast member draws without throwing and every save is matched by a restore', () => {
  for (const c of CAST) {
    drawBalanced(c.traits, FAMILY_ACCENT[c.familyId], c.id);
    drawBalanced(c.traits, '#DC2626', `${c.id} with a Mafia-Wars accent`);
  }
});

test('AC-002 unnamed civilian, officer, ally and player trait sets draw without throwing, balanced', () => {
  for (const s of SEEDS) {
    drawBalanced(genericTraits('civilian', s), CIVILIAN_ACCENT, `civilian ${s}`);
    drawBalanced(genericTraits('officer', s), FAMILY_ACCENT.outside, `officer ${s}`);
    for (const f of CAST_FAMILIES) {
      drawBalanced(genericTraits('ally', s, f), FAMILY_ACCENT[f], `ally ${f} ${s}`);
      drawBalanced(genericTraits('player', s, f), FAMILY_ACCENT[f], `player ${f} ${s}`);
    }
  }
});

test('AC-002 each cast member\'s trait tuple is unique', () => {
  const sigs = CAST.map((c) => traitSignature(c.traits));
  assert.equal(new Set(sigs).size, 50);
  const tuples = CAST.map((c) => JSON.stringify(Object.values(c.traits)));
  assert.equal(new Set(tuples).size, 50);
});

test('every single trait value draws, and unknown values and bad colours fall back without throwing', () => {
  const base = CAST[0].traits;
  const lists: [keyof CharacterTraits, readonly string[]][] = [
    ['headgear', HEADGEAR_STYLES], ['eyewear', EYEWEAR_STYLES], ['outfit', OUTFIT_STYLES],
    ['heldItem', HELD_ITEM_STYLES], ['build', BUILD_STYLES], ['facialHairOrScar', FACIAL_STYLES],
  ];
  for (const [k, values] of lists) {
    for (const v of values) for (const build of BUILD_STYLES) drawBalanced({ ...base, build, [k]: v } as CharacterTraits, '#E03131', `${k}=${v} ${build}`);
  }
  const junk = {
    headgear: 'top-hat', eyewear: 'monocle', outfit: 'spacesuit', heldItem: 'banana', build: 'giant',
    facialHairOrScar: 'tattoo', hairColorHex: 'red', primaryGarmentHex: '', secondaryGarmentHex: '#ZZZZZZ',
  } as unknown as CharacterTraits;
  drawBalanced(junk, 'not-a-colour', 'junk traits');
  drawBalanced(junk, '#123', 'junk traits, short hex accent');
  drawBalanced({} as CharacterTraits, '', 'empty traits');
});

test('bakeCharacter returns null when makeCanvas or getContext gives null, and bakes balanced otherwise', () => {
  const t = CAST[0].traits;
  assert.equal(bakeCharacter(t, '#E03131', () => null, 0.42), null);
  assert.equal(bakeCharacter(t, '#E03131', (w, h) => ({ width: w, height: h, getContext: () => null }), 0.42), null);
  assert.equal(bakeCharacter(t, '#E03131', () => { throw new Error('no canvas'); }, 0.42), null);
  const ctx = recordingContext();
  let asked: [number, number] | null = null;
  const canvas = bakeCharacter(t, '#E03131', (w, h) => {
    asked = [w, h];
    return { width: w, height: h, getContext: () => ctx };
  }, 0.42);
  assert.ok(canvas);
  assert.deepEqual(asked, [Math.ceil(FIGURE_W * 0.42), Math.ceil(FIGURE_H * 0.42)]);
  assert.equal(ctx.depth, 0);
  assert.equal(ctx.saves, ctx.restores);
});

// ---------------------------------------------------------------- AC-003

test('AC-003 the pool returns distinct members of the asked family until all are in use, then null', () => {
  for (const f of CAST_FAMILIES) {
    const pool = createCastPool();
    const size = CAST.filter((c) => c.familyId === f).length;
    const got = new Set<string>();
    for (let i = 0; i < size; i++) {
      const m = pool.take(f);
      assert.ok(m, `${f} #${i}`);
      assert.equal(m.familyId, f);
      assert.ok(!got.has(m.id), `${m.id} handed out twice`);
      got.add(m.id);
    }
    assert.equal(pool.take(f), null);
    assert.equal(pool.inUse().size, size);
  }
});

test('AC-003 the assignment returns distinct members of the asked family until all are in use, then a generic member', () => {
  for (const f of CAST_FAMILIES) {
    const pool = createCastPool();
    const size = CAST.filter((c) => c.familyId === f).length;
    const ids = new Set<string>();
    for (let i = 0; i < size; i++) {
      const a = assignCast(pool, f, i);
      assert.ok(a.castId, `${f} #${i} should be a cast member`);
      assert.equal(castById(a.castId)?.familyId, f);
      assert.equal(a.name, castById(a.castId)?.name);
      assert.ok(!ids.has(a.castId), `${a.castId} handed out twice`);
      ids.add(a.castId);
    }
    for (let i = 0; i < 3; i++) {
      const g = assignCast(pool, f, 100 + i);
      assert.equal(g.castId, null);
      assert.equal(g.name, null);
      assert.equal(g.familyId, f);
      assertTraitsAllowed(g.traits, `generic ${f}`);
    }
    // outside falls back to a uniformed officer, families to a made-man ally look
    const g = assignCast(pool, f, 7);
    if (f === 'outside') assert.equal(g.traits.outfit, 'nypd-uniform');
    else assert.deepEqual(g.traits, genericTraits('ally', 7, f));
  }
});

test('AC-003 a released member can be taken again, filters apply, and pools are independent', () => {
  const pool = createCastPool();
  const first = pool.take('moretti');
  assert.ok(first);
  assert.ok(pool.inUse().has(first.id));
  pool.release(first.id);
  assert.ok(!pool.inUse().has(first.id));
  pool.release('no-such-id');
  assert.equal(pool.take('moretti')?.id, first.id);
  const enforcer = pool.take('moretti', (m) => m.role.startsWith('Enforcer'));
  assert.ok(enforcer && enforcer.role.startsWith('Enforcer'));
  assert.equal(pool.take('moretti', () => false), null);
  const other = createCastPool();
  assert.equal(other.inUse().size, 0);
  assert.equal(other.take('moretti')?.id, first.id);
});

test('genericTraits is seeded, and civilians, officers, allies and players get their looks', () => {
  for (const s of SEEDS) {
    assert.deepEqual(genericTraits('civilian', s), genericTraits('civilian', s));
    const civ = genericTraits('civilian', s);
    assertTraitsAllowed(civ, `civilian ${s}`);
    assert.equal(civ.heldItem, 'empty');
    assert.notEqual(civ.outfit, 'nypd-uniform');
    assert.notEqual(civ.headgear, 'police-cap');
    const cop = genericTraits('officer', s);
    assertTraitsAllowed(cop, `officer ${s}`);
    assert.equal(cop.outfit, 'nypd-uniform');
    assert.equal(cop.headgear, 'police-cap');
    for (const f of CAST_FAMILIES) {
      const ally = genericTraits('ally', s, f);
      assertTraitsAllowed(ally, `ally ${f}`);
      const player = genericTraits('player', s, f);
      assertTraitsAllowed(player, `player ${f}`);
      assert.equal(player.headgear, 'fedora-band');
      assert.equal(player.secondaryGarmentHex, FAMILY_ACCENT[f]);
    }
  }
  const varied = new Set(SEEDS.map((s) => traitSignature(genericTraits('civilian', s))));
  assert.ok(varied.size >= 8, 'civilians should vary by seed');
  assertTraitsAllowed(genericTraits('ally', 1, 'nobody' as CastFamily), 'ally with unknown family');
});

// ---------------------------------------------------------------- AC-004

const TW = 72;
const TH = 14;
const req = (id: string, x: number, y: number, priority: number): TagRequest => ({ id, x, y, w: TW, h: TH, priority });

function assertNoOverlap(placed: { id: string; x: number; y: number }[], reqs: TagRequest[]): void {
  const size = new Map(reqs.map((r) => [r.id, r]));
  for (let i = 0; i < placed.length; i++) {
    for (let j = i + 1; j < placed.length; j++) {
      const a = { ...placed[i], w: size.get(placed[i].id)!.w, h: size.get(placed[i].id)!.h };
      const b = { ...placed[j], w: size.get(placed[j].id)!.w, h: size.get(placed[j].id)!.h };
      assert.ok(!boxesOverlap(a, b), `${a.id} overlaps ${b.id}`);
    }
  }
}

test('AC-004 ten tags requested at nearly the same spot come out with at most 4 shown and none overlapping', () => {
  const reqs = Array.from({ length: 10 }, (_, i) => req(`npc${i}`, 300 + (i % 3), 200 + (i % 2), i % 4));
  const out = layoutTags(reqs);
  assert.ok(out.length <= 4, `${out.length} shown`);
  assert.ok(out.length >= 2, 'a crowd should still show some tags');
  assert.equal(new Set(out.map((p) => p.id)).size, out.length);
  assertNoOverlap(out, reqs);
  for (const p of out) {
    const r = reqs.find((q) => q.id === p.id)!;
    assert.equal(p.x, r.x);
    assert.ok(p.y <= r.y, 'tags only move upward');
  }
  // the same with a larger max and with jittered sizes
  const big = layoutTags(reqs, 10);
  assertNoOverlap(big, reqs);
  assert.ok(big.length <= 10);
});

test('AC-004 engaged NPCs are kept ahead of the nearest-NPC tag', () => {
  const ENGAGED = 3;
  const NEAREST = 1;
  // nearest listed first: four engaged tags still win all four places
  const crowd = [req('nearest', 400, 300, NEAREST), ...[0, 1, 2, 3].map((i) => req(`engaged${i}`, 401 + i, 300, ENGAGED))];
  const out = layoutTags(crowd);
  assert.equal(out.length, 4);
  assert.ok(!out.some((p) => p.id === 'nearest'), 'nearest tag must yield to engaged tags');
  assertNoOverlap(out, crowd);
  // with room to spare, the engaged tag keeps its spot and the nearest tag moves out of its way
  const pair = [req('nearest', 400, 300, NEAREST), req('engaged', 402, 301, ENGAGED)];
  const two = layoutTags(pair);
  assert.equal(two.length, 2);
  assert.deepEqual(two[0], { id: 'engaged', x: 402, y: 301 });
  assert.equal(two[1].id, 'nearest');
  assert.ok(two[1].y < 300);
  assertNoOverlap(two, pair);
});

test('tag layout edge cases: empty input, zero max, far-apart tags stay put', () => {
  assert.deepEqual(layoutTags([]), []);
  assert.deepEqual(layoutTags([req('a', 0, 0, 1)], 0), []);
  const apart = [req('a', 0, 0, 1), req('b', 200, 0, 1), req('c', 0, 100, 1)];
  assert.deepEqual(layoutTags(apart), apart.map(({ id, x, y }) => ({ id, x, y })));
  const bad = [{ id: 'nan', x: NaN, y: 0, w: 10, h: 10, priority: 1 }, req('ok', 0, 0, 0)];
  assert.deepEqual(layoutTags(bad).map((p) => p.id), ['ok']);
});
