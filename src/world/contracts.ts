/**
 * Contracts and sit-downs: the whole rulebook, pure and DOM-free.
 *
 * Peace is the default. Hits and kills on a family's members build a grudge; at
 * CONTRACT_POINTS a contract goes out and that family attacks on sight. A contract
 * never times out: it ends only when its price is paid at a sit-down the player
 * requests. Time always comes in as `now` (ms) and randomness as `rand`.
 */

export type FamilyKey = 'corvini' | 'bellini' | 'valenti' | 'moretti' | 'rastelli';

export interface SitDown {
  meetAt: number;
  windowEnd: number;
  spot: { x: number; y: number; label: string };
}

export interface FamilyGrudge {
  points: number;
  contract: boolean;
  price: number;
  kills: number;
  sitDown: SitDown | null;
}

export interface ContractsState {
  v: 1;
  families: Record<FamilyKey, FamilyGrudge>;
}

export const CONTRACT_POINTS = 3;
export const HIT_POINTS = 1;
export const KILL_POINTS = 3;
export const BASE_PRICE = 5000;
export const HIT_PRICE = 1500;
export const KILL_PRICE = 4000;
export const BETRAYAL_PRICE = 2500;
export const MISSED_PRICE = 1000;
export const NYPD_HEAT_LINE = 55;
export const WINDOW_MS = 180000;
export const GRACE_MS = 30000;

/** Earliest and latest meeting time after a request (1 to 20 minutes). */
const MEET_MIN_MS = 60000;
const MEET_MAX_MS = 1200000;

export const FAMILY_KEYS: readonly FamilyKey[] = ['corvini', 'bellini', 'valenti', 'moretti', 'rastelli'];

export const isFamilyKey = (v: unknown): v is FamilyKey =>
  typeof v === 'string' && (FAMILY_KEYS as readonly string[]).includes(v);

const emptyGrudge = (): FamilyGrudge => ({ points: 0, contract: false, price: 0, kills: 0, sitDown: null });

export function emptyContracts(): ContractsState {
  return {
    v: 1,
    families: {
      corvini: emptyGrudge(),
      bellini: emptyGrudge(),
      valenti: emptyGrudge(),
      moretti: emptyGrudge(),
      rastelli: emptyGrudge(),
    },
  };
}

const cloneSitDown = (d: SitDown | null): SitDown | null =>
  d ? { meetAt: d.meetAt, windowEnd: d.windowEnd, spot: { x: d.spot.x, y: d.spot.y, label: d.spot.label } } : null;

const cloneGrudge = (g: FamilyGrudge): FamilyGrudge => ({ ...g, sitDown: cloneSitDown(g.sitDown) });

/** Returns a copy of the state with one family's grudge replaced. */
const withFamily = (s: ContractsState, family: FamilyKey, g: FamilyGrudge): ContractsState => {
  const families = {} as Record<FamilyKey, FamilyGrudge>;
  for (const k of FAMILY_KEYS) families[k] = k === family ? g : cloneGrudge(s.families[k]);
  return { v: 1, families };
};

// ---------------------------------------------------------------------------
// Saved data

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isCount = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;
const isFiniteNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

const parseSitDown = (raw: unknown): SitDown | null | undefined => {
  if (raw === null || raw === undefined) return null;
  if (!isObj(raw) || !isFiniteNum(raw.meetAt) || !isFiniteNum(raw.windowEnd) || !isObj(raw.spot)) return undefined;
  const spot = raw.spot;
  if (!isFiniteNum(spot.x) || !isFiniteNum(spot.y) || typeof spot.label !== 'string') return undefined;
  return { meetAt: raw.meetAt, windowEnd: raw.windowEnd, spot: { x: spot.x, y: spot.y, label: spot.label } };
};

const parseGrudge = (raw: unknown): FamilyGrudge | undefined => {
  if (!isObj(raw)) return undefined;
  if (!isCount(raw.points) || typeof raw.contract !== 'boolean' || !isCount(raw.price) || !isCount(raw.kills)) return undefined;
  const sitDown = parseSitDown(raw.sitDown);
  if (sitDown === undefined) return undefined;
  return { points: raw.points, contract: raw.contract, price: raw.price, kills: raw.kills, sitDown };
};

/**
 * Reads the saved `contracts` field. Never throws: anything malformed (wrong
 * version, wrong shape, a bad family entry) gives the empty state. A family
 * missing from an otherwise valid save starts with no grudge.
 */
export function parseContracts(raw: unknown): ContractsState {
  try {
    if (!isObj(raw) || raw.v !== 1 || !isObj(raw.families)) return emptyContracts();
    const out = emptyContracts();
    for (const k of FAMILY_KEYS) {
      const entry = raw.families[k];
      if (entry === undefined) continue;
      const g = parseGrudge(entry);
      if (!g) return emptyContracts();
      out.families[k] = g;
    }
    return out;
  } catch {
    return emptyContracts();
  }
}

// ---------------------------------------------------------------------------
// Grudges, contracts and prices

const wholeCount = (n: number): number => (Number.isFinite(n) && n > 0 ? Math.floor(n) : 0);

/**
 * Adds one finished attack's harm to a family's grudge. Hits are applied before
 * kills. Before the contract each hit adds HIT_POINTS and each kill KILL_POINTS;
 * reaching CONTRACT_POINTS sends the contract out at BASE_PRICE. While it is
 * active, each further hit adds HIT_PRICE and each kill KILL_PRICE. Points and
 * kills keep counting either way.
 */
export function recordHarm(
  s: ContractsState,
  family: FamilyKey,
  harm: { hits: number; kills: number }
): { state: ContractsState; contractStarted: boolean } {
  const g = cloneGrudge(s.families[family]);
  let contractStarted = false;
  const apply = (points: number, price: number) => {
    if (g.contract) {
      g.price += price;
      g.points += points;
    } else {
      g.points += points;
      if (g.points >= CONTRACT_POINTS) {
        g.contract = true;
        g.price = BASE_PRICE;
        contractStarted = true;
      }
    }
  };
  const hits = wholeCount(harm.hits);
  const kills = wholeCount(harm.kills);
  for (let i = 0; i < hits; i++) apply(HIT_POINTS, HIT_PRICE);
  for (let i = 0; i < kills; i++) {
    g.kills += 1;
    apply(KILL_POINTS, KILL_PRICE);
  }
  return { state: withFamily(s, family, g), contractStarted };
}

/**
 * Folds every hit of one attack (all pellets of a blast, every body one swing
 * catches) into per-family totals. Each NPC counts once; an NPC killed by the
 * attack counts as a kill only, never also as a hit. NPCs with no family are
 * ignored.
 */
export function tallyAttack(
  hits: { npcId: string; family: FamilyKey | null; killed: boolean }[]
): Partial<Record<FamilyKey, { hits: number; kills: number }>> {
  const perNpc = new Map<string, { family: FamilyKey | null; killed: boolean }>();
  for (const h of hits) {
    const seen = perNpc.get(h.npcId);
    if (seen) {
      seen.killed = seen.killed || h.killed;
      if (seen.family === null) seen.family = h.family;
    } else {
      perNpc.set(h.npcId, { family: h.family, killed: h.killed });
    }
  }
  const out: Partial<Record<FamilyKey, { hits: number; kills: number }>> = {};
  for (const { family, killed } of perNpc.values()) {
    if (!isFamilyKey(family)) continue;
    const t = out[family] ?? (out[family] = { hits: 0, kills: 0 });
    if (killed) t.kills += 1;
    else t.hits += 1;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Hostility

/**
 * The one hostility decision, checked at every attack step.
 * - Takeover guards the player started a fight with always attack (the one exception to peace).
 * - NYPD attack only at heat >= NYPD_HEAT_LINE.
 * - A family member attacks only while that family has a contract and no open
 *   sit-down window (safe passage). The player's own family follows the same rule.
 * - Couriers never attack (unarmed contraband runners); allies, civilians and
 *   anyone without a family never attack.
 */
export function isHostile(f: {
  role: string;
  familyId: string;
  playerFamily: string;
  isTakeoverGuard: boolean;
  heat: number;
  now: number;
  s: ContractsState;
}): boolean {
  if (f.role === 'ally') return false;
  if (f.isTakeoverGuard) return true;
  if (f.role === 'nypd' || f.familyId === 'nypd') return f.heat >= NYPD_HEAT_LINE;
  if (f.role === 'courier') return false;
  if (!isFamilyKey(f.familyId)) return false;
  const g = f.s.families[f.familyId];
  if (!g || !g.contract) return false;
  return windowState(f.s, f.familyId, f.now) !== 'open';
}

// ---------------------------------------------------------------------------
// Betrayal

/**
 * 25%, plus 5% per member killed since the grudge started, minus 1% per 100
 * respect XP (at most 20%), minus 10% with Street Ceasefire; held to 5%..75%.
 */
export function betrayalRisk(s: ContractsState, family: FamilyKey, p: { respectXp: number; ceasefire: boolean }): number {
  const kills = wholeCount(s.families[family].kills);
  const xp = Number.isFinite(p.respectXp) && p.respectXp > 0 ? p.respectXp : 0;
  const respectCut = Math.min(20, Math.floor(xp / 100));
  const pct = 25 + 5 * kills - respectCut - (p.ceasefire ? 10 : 0);
  return Math.min(75, Math.max(5, pct)) / 100;
}

/**
 * The amounts lost to a betrayal: 50% of cash, 25% of respect XP (never taking
 * it below 0), and half the unspent skill points rounded up. Cash and respect
 * are rounded to whole numbers.
 */
export function betrayalLosses(p: { cash: number; respectXp: number; skillPoints: number }): {
  cash: number;
  respectXp: number;
  skillPoints: number;
} {
  const pos = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);
  return {
    cash: Math.round(pos(p.cash) * 0.5),
    respectXp: Math.round(pos(p.respectXp) * 0.25),
    skillPoints: Math.ceil(Math.floor(pos(p.skillPoints)) / 2),
  };
}

// ---------------------------------------------------------------------------
// Sit-downs

export function windowState(s: ContractsState, family: FamilyKey, now: number): 'none' | 'waiting' | 'open' | 'lapsed' {
  const d = s.families[family]?.sitDown;
  if (!d) return 'none';
  if (now < d.meetAt) return 'waiting';
  if (now < d.windowEnd) return 'open';
  return 'lapsed';
}

/**
 * Asks a family with an active contract for a sit-down. The meeting is uniform
 * between 1 and 20 minutes after `now`, at `spot`, with a WINDOW_MS window. One
 * request per family at a time.
 */
export function requestSitDown(
  s: ContractsState,
  family: FamilyKey,
  now: number,
  rand: () => number,
  spot: { x: number; y: number; label: string }
): { state: ContractsState; ok: boolean; reason?: string } {
  const g = s.families[family];
  if (!g.contract) return { state: s, ok: false, reason: 'no-contract' };
  if (g.sitDown) return { state: s, ok: false, reason: 'pending' };
  if (!spot || !isFiniteNum(spot.x) || !isFiniteNum(spot.y) || typeof spot.label !== 'string') {
    return { state: s, ok: false, reason: 'spot' };
  }
  let r = rand();
  if (!Number.isFinite(r)) r = 0;
  r = Math.min(1, Math.max(0, r));
  const meetAt = now + MEET_MIN_MS + Math.round(r * (MEET_MAX_MS - MEET_MIN_MS));
  const sitDown: SitDown = { meetAt, windowEnd: meetAt + WINDOW_MS, spot: { x: spot.x, y: spot.y, label: spot.label } };
  return { state: withFamily(s, family, { ...cloneGrudge(g), sitDown }), ok: true };
}

/**
 * After the game was not running from `lastSeen` to `now`, any window that
 * opened or closed in that span opens fresh for WINDOW_MS from `now`. No price
 * is charged for those.
 */
export function resumeAfterAbsence(s: ContractsState, lastSeen: number, now: number): ContractsState {
  const from = Number.isFinite(lastSeen) ? lastSeen : -Infinity;
  let out = s;
  for (const k of FAMILY_KEYS) {
    const d = out.families[k].sitDown;
    if (!d) continue;
    const opened = d.meetAt > from && d.meetAt <= now;
    const closed = d.windowEnd > from && d.windowEnd <= now;
    if (!opened && !closed) continue;
    out = withFamily(out, k, {
      ...cloneGrudge(out.families[k]),
      sitDown: { meetAt: now, windowEnd: now + WINDOW_MS, spot: { ...d.spot } },
    });
  }
  return out;
}

/**
 * Lapses windows that closed while playing: each adds MISSED_PRICE to an active
 * contract and clears the sit-down so the player can request again.
 */
export function expireLapsed(s: ContractsState, now: number): { state: ContractsState; lapsed: FamilyKey[] } {
  const lapsed: FamilyKey[] = [];
  let out = s;
  for (const k of FAMILY_KEYS) {
    if (windowState(out, k, now) !== 'lapsed') continue;
    const g = cloneGrudge(out.families[k]);
    if (g.contract) g.price += MISSED_PRICE;
    g.sitDown = null;
    out = withFamily(out, k, g);
    lapsed.push(k);
  }
  return { state: out, lapsed };
}

/**
 * Sits down with a family. Refused outside the open window, when anyone hired
 * is near (not alone), or when the player cannot pay the price. Otherwise the
 * family betrays the player with probability betrayalRisk: the contract stays,
 * its price rises by BETRAYAL_PRICE and the sit-down is used up. If honoured,
 * the price is the cost and the family's grudge, contract, kills and sit-down
 * are cleared.
 */
export function attemptSitDown(
  s: ContractsState,
  family: FamilyKey,
  p: { now: number; cash: number; alone: boolean; respectXp: number; ceasefire: boolean; rand: () => number }
):
  | { outcome: 'refused'; reason: 'window' | 'cash' | 'alone' }
  | { outcome: 'honoured'; state: ContractsState; cost: number }
  | { outcome: 'betrayed'; state: ContractsState } {
  const g = s.families[family];
  if (!g.contract || windowState(s, family, p.now) !== 'open') return { outcome: 'refused', reason: 'window' };
  if (!p.alone) return { outcome: 'refused', reason: 'alone' };
  if (!(p.cash >= g.price)) return { outcome: 'refused', reason: 'cash' };
  const risk = betrayalRisk(s, family, { respectXp: p.respectXp, ceasefire: p.ceasefire });
  if (p.rand() < risk) {
    const next = cloneGrudge(g);
    next.price += BETRAYAL_PRICE;
    next.sitDown = null;
    return { outcome: 'betrayed', state: withFamily(s, family, next) };
  }
  return { outcome: 'honoured', state: withFamily(s, family, emptyGrudge()), cost: g.price };
}
