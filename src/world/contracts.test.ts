/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  BASE_PRICE,
  BETRAYAL_PRICE,
  CONTRACT_POINTS,
  HIT_PRICE,
  KILL_PRICE,
  MISSED_PRICE,
  NYPD_HEAT_LINE,
  WINDOW_MS,
  attemptSitDown,
  betrayalLosses,
  betrayalRisk,
  emptyContracts,
  expireLapsed,
  isHostile,
  parseContracts,
  recordHarm,
  requestSitDown,
  resumeAfterAbsence,
  tallyAttack,
  windowState,
  type ContractsState,
  type FamilyKey,
} from './contracts.ts';

const MIN = 60000;
const SPOT = { x: 3100, y: 1200, label: 'Arthur Ave Pastry Social' };
const T0 = 1_700_000_000_000;

const hits = (s: ContractsState, family: FamilyKey, n: number) => recordHarm(s, family, { hits: n, kills: 0 }).state;
const contracted = (family: FamilyKey = 'rastelli') => hits(emptyContracts(), family, 3);
const scheduled = (family: FamilyKey = 'rastelli', r = 0.3) => {
  const res = requestSitDown(contracted(family), family, T0, () => r, SPOT);
  assert.equal(res.ok, true);
  return res.state;
};
const hostile = (s: ContractsState, o: Partial<Parameters<typeof isHostile>[0]> = {}) =>
  isHostile({ role: 'soldato', familyId: 'rastelli', playerFamily: 'corvini', isTakeoverGuard: false, heat: 0, now: T0, s, ...o });

// ---------------------------------------------------------------- AC-001

test('AC-001 three hits start a contract; two hits do not', () => {
  let s = emptyContracts();
  let r = recordHarm(s, 'rastelli', { hits: 1, kills: 0 });
  assert.equal(r.contractStarted, false);
  r = recordHarm(r.state, 'rastelli', { hits: 1, kills: 0 });
  assert.equal(r.contractStarted, false);
  assert.equal(r.state.families.rastelli.contract, false);
  assert.equal(r.state.families.rastelli.points, 2);
  r = recordHarm(r.state, 'rastelli', { hits: 1, kills: 0 });
  assert.equal(r.contractStarted, true);
  assert.equal(r.state.families.rastelli.contract, true);
  assert.equal(r.state.families.rastelli.points, CONTRACT_POINTS);
  assert.equal(r.state.families.rastelli.price, BASE_PRICE);
  // Other families are untouched.
  assert.equal(r.state.families.bellini.contract, false);
  s = r.state;
  assert.equal(recordHarm(s, 'rastelli', { hits: 1, kills: 0 }).contractStarted, false, 'only reported once');
});

test('AC-001 one kill starts a contract', () => {
  const r = recordHarm(emptyContracts(), 'valenti', { hits: 0, kills: 1 });
  assert.equal(r.contractStarted, true);
  assert.equal(r.state.families.valenti.points, 3);
  assert.equal(r.state.families.valenti.kills, 1);
  assert.equal(r.state.families.valenti.price, BASE_PRICE);
});

test('AC-001 one shotgun blast scores one hit; a kill scores 3 in total', () => {
  // Five pellets of one blast into the same soldier.
  const blast = Array.from({ length: 5 }, () => ({ npcId: 'n1', family: 'rastelli' as FamilyKey, killed: false }));
  assert.deepEqual(tallyAttack(blast), { rastelli: { hits: 1, kills: 0 } });
  // One swing catching two people scores one hit on each.
  assert.deepEqual(
    tallyAttack([
      { npcId: 'a', family: 'moretti', killed: false },
      { npcId: 'b', family: 'moretti', killed: false },
    ]),
    { moretti: { hits: 2, kills: 0 } }
  );
  // The pellet that killed counts as a kill only, not a kill plus a hit.
  const killingBlast = [
    { npcId: 'n1', family: 'rastelli' as FamilyKey, killed: false },
    { npcId: 'n1', family: 'rastelli' as FamilyKey, killed: true },
    { npcId: 'n1', family: 'rastelli' as FamilyKey, killed: false },
  ];
  const t = tallyAttack(killingBlast);
  assert.deepEqual(t, { rastelli: { hits: 0, kills: 1 } });
  const s = recordHarm(emptyContracts(), 'rastelli', t.rastelli!).state;
  assert.equal(s.families.rastelli.points, 3);
  // People with no family (civilians, NYPD) add no grudge.
  assert.deepEqual(tallyAttack([{ npcId: 'c', family: null, killed: true }]), {});
});

test('AC-001 hostility: a family with and without a contract', () => {
  const peace = emptyContracts();
  for (const role of ['soldato', 'brawler', 'capo', 'citizen']) {
    assert.equal(hostile(peace, { role }), false, `${role} without contract`);
    assert.equal(hostile(contracted(), { role }), true, `${role} with contract`);
  }
  // Another family stays peaceful.
  assert.equal(hostile(contracted('rastelli'), { familyId: 'bellini' }), false);
});

test("AC-001 hostility: the player's own family follows the same rules", () => {
  assert.equal(hostile(emptyContracts(), { familyId: 'corvini', playerFamily: 'corvini' }), false);
  assert.equal(hostile(contracted('corvini'), { familyId: 'corvini', playerFamily: 'corvini' }), true);
});

test('AC-001 hostility: a courier attacks only under its family contract, outside safe passage', () => {
  assert.equal(hostile(emptyContracts(), { role: 'courier' }), false, 'no contract');
  assert.equal(hostile(contracted(), { role: 'courier' }), true, 'under contract');
  assert.equal(hostile(contracted('bellini'), { role: 'courier' }), false, 'another family contract');
  const s = scheduled('rastelli');
  assert.equal(hostile(s, { role: 'courier', now: s.families.rastelli.sitDown!.meetAt }), false, 'safe passage');
});

test('AC-001 hostility: a takeover guard attacks', () => {
  assert.equal(hostile(emptyContracts(), { role: 'capo', isTakeoverGuard: true }), true);
  assert.equal(hostile(emptyContracts(), { role: 'brawler', isTakeoverGuard: true }), true);
});

test('AC-001 hostility: a person just hit does not attack', () => {
  const s = hits(emptyContracts(), 'rastelli', 1);
  assert.equal(hostile(s), false);
  assert.equal(hostile(hits(s, 'rastelli', 1)), false);
});

test('AC-001 hostility: NYPD at heat 54 and 55', () => {
  assert.equal(NYPD_HEAT_LINE, 55);
  const s = contracted();
  assert.equal(hostile(s, { role: 'nypd', familyId: 'nypd', heat: 54 }), false);
  assert.equal(hostile(s, { role: 'nypd', familyId: 'nypd', heat: 55 }), true);
});

test('AC-001 hostility: a family during its safe-passage window holds fire', () => {
  const s = scheduled('rastelli');
  const d = s.families.rastelli.sitDown!;
  assert.equal(hostile(s, { now: d.meetAt - 1 }), true, 'waiting: still a contract');
  assert.equal(hostile(s, { now: d.meetAt }), false, 'window open');
  assert.equal(hostile(s, { now: d.windowEnd - 1 }), false, 'window open');
  assert.equal(hostile(s, { now: d.windowEnd }), true, 'window over');
  // Allies and civilians never.
  assert.equal(hostile(s, { role: 'ally', familyId: 'player' }), false);
  assert.equal(hostile(s, { role: 'citizen', familyId: 'civilian' }), false);
});

test('AC-001 the price follows the stated numbers', () => {
  let s = contracted();
  assert.equal(s.families.rastelli.price, 5000);
  s = hits(s, 'rastelli', 1);
  assert.equal(s.families.rastelli.price, 5000 + HIT_PRICE);
  s = recordHarm(s, 'rastelli', { hits: 0, kills: 1 }).state;
  assert.equal(s.families.rastelli.price, 5000 + 1500 + KILL_PRICE);
  assert.equal(s.families.rastelli.price, 10500);
  // Two hits after the contract: the $8,000 example.
  assert.equal(hits(contracted(), 'rastelli', 2).families.rastelli.price, 8000);
});

test('AC-001 the price rises by the betrayal and missed-window increases', () => {
  const s = scheduled();
  const d = s.families.rastelli.sitDown!;
  const b = attemptSitDown(s, 'rastelli', { now: d.meetAt, cash: 1e6, alone: true, respectXp: 0, ceasefire: false, rand: () => 0 });
  assert.equal(b.outcome, 'betrayed');
  if (b.outcome === 'betrayed') assert.equal(b.state.families.rastelli.price, BASE_PRICE + BETRAYAL_PRICE);
  const m = expireLapsed(s, d.windowEnd);
  assert.equal(m.state.families.rastelli.price, BASE_PRICE + MISSED_PRICE);
});

test('AC-001 the risk formula matches the numbers and stays within 5-75%', () => {
  const base = contracted();
  assert.equal(betrayalRisk(base, 'rastelli', { respectXp: 0, ceasefire: false }), 0.25);
  assert.equal(betrayalRisk(base, 'rastelli', { respectXp: 120, ceasefire: false }), 0.24);
  assert.equal(betrayalRisk(base, 'rastelli', { respectXp: 1000, ceasefire: false }), 0.15);
  assert.equal(betrayalRisk(base, 'rastelli', { respectXp: 5000, ceasefire: false }), 0.05, 'respect cut capped at 20%');
  assert.equal(betrayalRisk(base, 'rastelli', { respectXp: 5000, ceasefire: true }), 0.05, 'floor 5%');
  assert.equal(betrayalRisk(base, 'rastelli', { respectXp: 0, ceasefire: true }), 0.15);
  const twoKills = recordHarm(emptyContracts(), 'rastelli', { hits: 0, kills: 2 }).state;
  assert.equal(betrayalRisk(twoKills, 'rastelli', { respectXp: 0, ceasefire: false }), 0.35);
  const manyKills = recordHarm(emptyContracts(), 'rastelli', { hits: 0, kills: 20 }).state;
  assert.equal(betrayalRisk(manyKills, 'rastelli', { respectXp: 0, ceasefire: false }), 0.75, 'ceiling 75%');
  for (let k = 0; k < 30; k++) {
    for (const xp of [0, 50, 120, 999, 3000]) {
      for (const c of [false, true]) {
        const s = recordHarm(emptyContracts(), 'rastelli', { hits: 0, kills: k }).state;
        const r = betrayalRisk(s, 'rastelli', { respectXp: xp, ceasefire: c });
        assert.ok(r >= 0.05 && r <= 0.75, `risk ${r}`);
      }
    }
  }
});

// ---------------------------------------------------------------- AC-002

test('AC-002 a request schedules a meeting 1 to 20 minutes out at a valid spot', () => {
  for (const r of [0, 0.25, 0.5, 0.999999]) {
    const res = requestSitDown(contracted(), 'rastelli', T0, () => r, SPOT);
    assert.equal(res.ok, true);
    const d = res.state.families.rastelli.sitDown!;
    assert.ok(d.meetAt >= T0 + MIN && d.meetAt <= T0 + 20 * MIN, `meetAt ${d.meetAt - T0}`);
    assert.equal(d.windowEnd - d.meetAt, WINDOW_MS);
    assert.deepEqual(d.spot, SPOT);
    assert.equal(windowState(res.state, 'rastelli', T0), 'waiting');
  }
  assert.equal(requestSitDown(contracted(), 'rastelli', T0, () => 0, SPOT).state.families.rastelli.sitDown!.meetAt, T0 + MIN);
  // Uniform: the midpoint draw lands mid-range.
  assert.equal(requestSitDown(contracted(), 'rastelli', T0, () => 0.5, SPOT).state.families.rastelli.sitDown!.meetAt, T0 + MIN + 570000);
  // No contract, nothing to sit down about; a bad spot is refused.
  assert.equal(requestSitDown(emptyContracts(), 'rastelli', T0, () => 0, SPOT).ok, false);
  assert.equal(requestSitDown(contracted(), 'rastelli', T0, () => 0, { x: NaN, y: 0, label: 'x' }).ok, false);
});

test('AC-002 a second request for the same family is refused', () => {
  const s = scheduled();
  const again = requestSitDown(s, 'rastelli', T0 + 1000, () => 0.9, SPOT);
  assert.equal(again.ok, false);
  assert.equal(again.state, s);
  // Another family may still request.
  const other = hits(s, 'bellini', 3);
  assert.equal(requestSitDown(other, 'bellini', T0, () => 0, SPOT).ok, true);
});

test('AC-002 the sit-down is refused outside the window, when short of cash, and when an ally is near', () => {
  const s = scheduled();
  const d = s.families.rastelli.sitDown!;
  const p = { now: d.meetAt, cash: 1e6, alone: true, respectXp: 120, ceasefire: false, rand: () => 0.99 };
  assert.deepEqual(attemptSitDown(s, 'rastelli', { ...p, now: d.meetAt - 1 }), { outcome: 'refused', reason: 'window' });
  assert.deepEqual(attemptSitDown(s, 'rastelli', { ...p, now: d.windowEnd }), { outcome: 'refused', reason: 'window' });
  assert.deepEqual(attemptSitDown(s, 'rastelli', { ...p, cash: BASE_PRICE - 1 }), { outcome: 'refused', reason: 'cash' });
  assert.deepEqual(attemptSitDown(s, 'rastelli', { ...p, alone: false }), { outcome: 'refused', reason: 'alone' });
  assert.deepEqual(attemptSitDown(contracted(), 'rastelli', p), { outcome: 'refused', reason: 'window' }, 'nothing scheduled');
  assert.equal(attemptSitDown(s, 'rastelli', { ...p, cash: BASE_PRICE }).outcome, 'honoured', 'exact cash is enough');
});

test('AC-002 the honoured outcome clears the family', () => {
  let s = recordHarm(emptyContracts(), 'rastelli', { hits: 2, kills: 1 }).state;
  s = requestSitDown(s, 'rastelli', T0, () => 0.1, SPOT).state;
  s = hits(s, 'bellini', 1);
  const d = s.families.rastelli.sitDown!;
  const price = s.families.rastelli.price;
  const r = attemptSitDown(s, 'rastelli', { now: d.meetAt + 1, cash: 50000, alone: true, respectXp: 120, ceasefire: false, rand: () => 0.99 });
  assert.equal(r.outcome, 'honoured');
  if (r.outcome !== 'honoured') return;
  assert.equal(r.cost, price);
  assert.deepEqual(r.state.families.rastelli, { points: 0, contract: false, price: 0, kills: 0, sitDown: null });
  assert.equal(r.state.families.bellini.points, 1, 'other families untouched');
  assert.equal(hostile(r.state, { now: d.meetAt + 1 }), false);
  // Original state not mutated.
  assert.equal(s.families.rastelli.contract, true);
});

test('AC-002 the betrayed outcome returns the stated losses and raises the price', () => {
  const s = scheduled();
  const d = s.families.rastelli.sitDown!;
  const p = { now: d.meetAt, cash: 20000, alone: true, respectXp: 120, ceasefire: false };
  const risk = betrayalRisk(s, 'rastelli', p);
  assert.equal(attemptSitDown(s, 'rastelli', { ...p, rand: () => risk }).outcome, 'honoured', 'roll at the risk is honoured');
  const r = attemptSitDown(s, 'rastelli', { ...p, rand: () => risk - 0.001 });
  assert.equal(r.outcome, 'betrayed');
  if (r.outcome !== 'betrayed') return;
  const g = r.state.families.rastelli;
  assert.equal(g.contract, true, 'the contract stays');
  assert.equal(g.price, BASE_PRICE + BETRAYAL_PRICE);
  assert.equal(g.points, s.families.rastelli.points);
  assert.equal(g.sitDown, null, 'the sit-down is used up; a new one can be requested');
  assert.equal(requestSitDown(r.state, 'rastelli', d.meetAt, () => 0, SPOT).ok, true);
  // Losses: 50% cash, 25% respect XP, half the unspent skill points rounded up.
  assert.deepEqual(betrayalLosses({ cash: 20000, respectXp: 120, skillPoints: 3 }), { cash: 10000, respectXp: 30, skillPoints: 2 });
  assert.deepEqual(betrayalLosses({ cash: 9001, respectXp: 400, skillPoints: 4 }), { cash: 4501, respectXp: 100, skillPoints: 2 });
  assert.deepEqual(betrayalLosses({ cash: 0, respectXp: 0, skillPoints: 0 }), { cash: 0, respectXp: 0, skillPoints: 0 });
  assert.deepEqual(betrayalLosses({ cash: 100, respectXp: 0, skillPoints: 1 }), { cash: 50, respectXp: 0, skillPoints: 1 });
  const neg = betrayalLosses({ cash: -50, respectXp: -10, skillPoints: -2 });
  assert.deepEqual(neg, { cash: 0, respectXp: 0, skillPoints: 0 }, 'respect never driven below 0');
});

test('AC-002 a lapsed window adds $1,000', () => {
  const s = scheduled();
  const d = s.families.rastelli.sitDown!;
  assert.deepEqual(expireLapsed(s, d.windowEnd - 1).lapsed, [], 'still open');
  assert.equal(windowState(s, 'rastelli', d.windowEnd), 'lapsed');
  const m = expireLapsed(s, d.windowEnd);
  assert.deepEqual(m.lapsed, ['rastelli']);
  assert.equal(m.state.families.rastelli.price, s.families.rastelli.price + 1000);
  assert.equal(m.state.families.rastelli.sitDown, null);
  assert.equal(m.state.families.rastelli.contract, true);
  assert.equal(expireLapsed(m.state, d.windowEnd + MIN).lapsed.length, 0, 'charged once');
  assert.equal(requestSitDown(m.state, 'rastelli', d.windowEnd, () => 0, SPOT).ok, true, 'can request again');
});

test('AC-002 a window that opened or closed while away reopens for 3 minutes, uncharged', () => {
  const s = scheduled();
  const d = s.families.rastelli.sitDown!;
  // Closed while away: opens fresh.
  const back = d.windowEnd + 60 * MIN;
  const r1 = resumeAfterAbsence(s, T0, back);
  assert.deepEqual(r1.families.rastelli.sitDown, { meetAt: back, windowEnd: back + WINDOW_MS, spot: SPOT });
  assert.equal(windowState(r1, 'rastelli', back), 'open');
  assert.deepEqual(expireLapsed(r1, back).lapsed, []);
  assert.equal(r1.families.rastelli.price, BASE_PRICE);
  // Opened while away and still open: opens fresh for the full window.
  const r2 = resumeAfterAbsence(s, T0, d.meetAt + 10);
  assert.equal(r2.families.rastelli.sitDown!.windowEnd, d.meetAt + 10 + WINDOW_MS);
  // Neither opened nor closed while away: unchanged.
  assert.equal(resumeAfterAbsence(s, T0, d.meetAt - 1), s);
  assert.equal(resumeAfterAbsence(s, d.meetAt + 1, d.meetAt + 2), s);
  // Lapsed while playing (before lastSeen): left for expireLapsed to charge.
  assert.equal(resumeAfterAbsence(s, d.windowEnd + 5, d.windowEnd + 10), s);
});

// ---------------------------------------------------------------- AC-003

test('AC-003 the state survives serialising and reloading', () => {
  let s = recordHarm(emptyContracts(), 'rastelli', { hits: 4, kills: 1 }).state;
  s = requestSitDown(s, 'rastelli', T0, () => 0.42, SPOT).state;
  s = hits(s, 'moretti', 2);
  const back = parseContracts(JSON.parse(JSON.stringify(s)));
  assert.deepEqual(back, s);
  assert.deepEqual(parseContracts(JSON.parse(JSON.stringify({ save: { contracts: s } })).save.contracts), s);
});

test('AC-003 an old save with no contracts field loads with empty state', () => {
  const oldSave: Record<string, unknown> = { cash: 1200, skillPoints: 2, respectXp: 120 };
  assert.deepEqual(parseContracts(oldSave.contracts), emptyContracts());
  assert.deepEqual(parseContracts(undefined), emptyContracts());
  assert.deepEqual(parseContracts(null), emptyContracts());
});

test('AC-003 malformed contracts data loads empty and never throws', () => {
  const bad: unknown[] = [
    42,
    'x',
    [],
    { v: 2, families: {} },
    { v: 1 },
    { v: 1, families: [] },
    { v: 1, families: { rastelli: { points: 'a', contract: true, price: 0, kills: 0, sitDown: null } } },
    { v: 1, families: { rastelli: { points: 3, contract: 'yes', price: 5000, kills: 0, sitDown: null } } },
    { v: 1, families: { rastelli: { points: 3, contract: true, price: NaN, kills: 0, sitDown: null } } },
    { v: 1, families: { rastelli: 'grudge' } },
    {
      v: 1,
      get families() {
        throw new Error('boom');
      },
    },
  ];
  for (const b of bad) assert.deepEqual(parseContracts(b), emptyContracts());
  // A family missing from a valid save starts clean.
  const partial = parseContracts({ v: 1, families: { rastelli: { points: 3, contract: true, price: 5000, kills: 0, sitDown: null } } });
  assert.equal(partial.families.rastelli.contract, true);
  assert.deepEqual(partial.families.bellini, emptyContracts().families.bellini);
});

test('AC-003 saved values load consistently: contract price floor, bad sit-downs dropped, counts floored', () => {
  const sd = { meetAt: T0 + MIN, windowEnd: T0 + MIN + WINDOW_MS, spot: SPOT };
  const s = parseContracts({
    v: 1,
    families: {
      // An active contract priced below BASE_PRICE loads at BASE_PRICE; no contract keeps its price (floored at 0).
      rastelli: { points: 3.7, contract: true, price: 1200, kills: 1.9, sitDown: sd },
      bellini: { points: -2, contract: false, price: -40, kills: -1, sitDown: { ...sd, windowEnd: sd.meetAt } },
      valenti: { points: 4, contract: true, price: 9000, kills: 0, sitDown: { ...sd, windowEnd: sd.meetAt - 1 } },
      moretti: { points: 3, contract: true, price: 5000, kills: 0, sitDown: { meetAt: Infinity, windowEnd: Infinity, spot: SPOT } },
      corvini: { points: 3, contract: true, price: 5000, kills: 0, sitDown: { ...sd, spot: { x: 1, y: NaN, label: 'x' } } },
    },
  });
  assert.deepEqual(s.families.rastelli, { points: 3, contract: true, price: BASE_PRICE, kills: 1, sitDown: sd });
  assert.deepEqual(s.families.bellini, { points: 0, contract: false, price: 0, kills: 0, sitDown: null });
  assert.equal(s.families.valenti.price, 9000);
  assert.equal(s.families.valenti.sitDown, null, 'window ends before it opens');
  assert.equal(s.families.moretti.sitDown, null, 'non-finite times');
  assert.equal(s.families.corvini.sitDown, null, 'non-finite spot');
  assert.equal(s.families.corvini.contract, true, 'the rest of the entry is kept');
});

test('AC-002 NaN guards: a NaN roll counts as 0.5, non-finite respect XP as 0', () => {
  const r = requestSitDown(contracted(), 'rastelli', T0, () => NaN, SPOT);
  assert.equal(r.state.families.rastelli.sitDown!.meetAt, T0 + MIN + 570000);
  const s = scheduled();
  const now = s.families.rastelli.sitDown!.meetAt;
  for (const xp of [NaN, Infinity, -Infinity]) {
    assert.equal(betrayalRisk(s, 'rastelli', { respectXp: xp, ceasefire: false }), 0.25);
    const out = attemptSitDown(s, 'rastelli', { now, cash: 1e6, alone: true, respectXp: xp, ceasefire: false, rand: () => NaN });
    assert.equal(out.outcome, 'honoured', '0.5 is above a 25% risk');
  }
  const risky = recordHarm(scheduled(), 'rastelli', { hits: 0, kills: 10 }).state;
  const out = attemptSitDown(risky, 'rastelli', { now, cash: 1e6, alone: true, respectXp: 0, ceasefire: false, rand: () => NaN });
  assert.equal(out.outcome, 'betrayed', '0.5 is below a 75% risk');
});
