import React, { useEffect, useRef } from 'react';
import {
  BoroughId,
  FamilyId,
  NYC_BOROUGHS,
  RacketBuilding,
  SocialContact,
  WEAPON_ARSENAL,
  WeaponId,
} from '../data/nyc1984Data';
import { soundEngine } from '../audio/soundEngine';
import { installTouchMode, isTouchMode } from '../input/touchMode';
import {
  STICK_RADIUS,
  clearSticks,
  createTwinSticks,
  getAim,
  getMove,
  touchEnd,
  touchMove,
  touchStart,
} from '../input/touchSticks';
import { pulse } from '../input/haptics';
import type { ContractsBridge, ContractsCallbacks, ContractsView, InteractPrompt } from '../world/bridgeTypes';
import {
  FAMILY_KEYS,
  NYPD_HEAT_LINE,
  betrayalRisk,
  emptyContracts,
  isFamilyKey,
  isHostile,
  tallyAttack,
  windowState,
} from '../world/contracts';
import type { ContractsState, FamilyKey } from '../world/contracts';
import { CELL, FERRY_TERMINALS, START_POINT, STATIONS, WORLD_H, WORLD_W } from '../world/cityData';
import type { AreaId, GameBoroughId, Pt } from '../world/cityData';
import {
  CellKind,
  areaAtPoint,
  generateCity,
  kindAt,
  moveWithCollision,
  blocksBullet,
  nearestWalkable,
  randomWalkableIn,
} from '../world/cityGen';
import type { City } from '../world/cityGen';
import { buildFlowField, createStuckTracker, flowDirection, pickUnstuckTarget, updateStuck } from '../world/pathfind';
import type { FlowField, StuckTracker } from '../world/pathfind';
import { spawnTraffic, stepTraffic } from '../world/traffic';
import type { Car } from '../world/traffic';
import { CHUNK, MAX_CHUNKS, chunksForView, createChunkCache, drawCityChunk, drawCityOverlay } from '../world/cityRender';
import { CAST, FAMILY_ACCENT, assignCast, createCastPool, genericTraits } from '../world/cast';
import type { CastFamily, CastMember, CharacterTraits } from '../world/cast';
import { CIVILIAN_ACCENT, FIGURE_FOOT, FIGURE_GRIP, bakeCharacter, drawCharacter, traitSignature } from '../world/characterSprite';
import type { CanvasLike, Ctx2D } from '../world/characterSprite';
import { layoutTags } from '../world/tagLayout';
import type { TagRequest } from '../world/tagLayout';

/** A figure's look: its traits, the family accent it is drawn with, and the figure-cache key for both. */
interface FigureLook {
  traits: CharacterTraits;
  accent: string;
  key: string;
}

const lookOf = (traits: CharacterTraits, accent: string): FigureLook => ({
  traits,
  accent,
  key: `${traitSignature(traits)}#${accent}`,
});

export interface WorldNpc {
  id: string;
  name: string;
  role: 'soldato' | 'brawler' | 'capo' | 'courier' | 'nypd' | 'citizen' | 'ally';
  familyId: FamilyId | 'nypd' | 'civilian' | 'player';
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  angle: number;
  state: 'patrol' | 'windup' | 'attack' | 'cooldown' | 'flee';
  stateTimer: number;
  patrolOriginX: number;
  patrolOriginY: number;
  /** The cast member this body is wearing (src/world/cast.ts); unset for unnamed people. */
  castId?: string;
  look: FigureLook;
  /** Second line of the name tag (family or affiliation) and the tag's accent colour. */
  tagFamily: string;
  tagColor: string;
  /** Draw-time state: +1 faces right, -1 left; cached tag width. */
  facing?: number;
  tagW?: number;
  hitFlashTimer: number;
  squash: number;
  cashDrop: number;
  contrabandDrop: number;
  racketGuardId?: string;
  /** Uptown and Staten Island civilians respawn inside this area. */
  homeArea?: AreaId;
  /** Patrol point being walked to, and the seconds left to get there. */
  goalX?: number;
  goalY?: number;
  goalT?: number;
  /** Unstuck detour point and the seconds left on it, plus the stuck rule's tracker. */
  detX?: number;
  detY?: number;
  detT?: number;
  stuck?: StuckTracker;
  /** Cached flow-field direction, refreshed about ten times a second. */
  flowDx?: number;
  flowDy?: number;
  flowOk?: boolean;
  flowT?: number;
  /** Set on a contract hit squad's members: the family that sent them. */
  squadFamily?: FamilyKey;
  /** Allies only: a permanent Enforcer bodyguard, or a hired (temporary) hit squad member. */
  allyKind?: 'bodyguard' | 'hired';
  /** The last attack that hit this NPC; a death is credited to it. */
  lastAttackId?: number;
  /** Bodyguards only: seconds spent holding back during a sit-down window. */
  holdT?: number;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  fromPlayer: boolean;
  life: number;
  color: string;
  /** Player and ally shots: the attack (one trigger pull or one ally shot) these pellets belong to. */
  attackId?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  isShell?: boolean;
}

interface FloatingText {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

/** The contracts callbacks (bridgeTypes.ts) are optional, so App type-checks with or without them. */
export interface WorldCallbacks extends Partial<ContractsCallbacks> {
  onEarnResources: (cash: number, contraband: number, respectXp: number, heatDelta: number, reason?: string) => void;
  onCollectRacketEnvelope: (racketId: string) => void;
  onOpenRacketModal: (racketId: string) => void;
  onOpenContactSitDown: (contactId: string) => void;
  onPlayerDamaged: (damage: number, attackerName: string) => void;
  onBoroughChanged: (boroughId: BoroughId) => void;
  onSelectWeapon: (weaponId: WeaponId) => void;
  onNearInteractableChange: (prompt: InteractPrompt | null) => void;
  onTurfCapoDefeated: (racketId: string) => void;
}

export interface LiveSimulationBridge extends Partial<ContractsBridge> {
  teleportToBorough: (boroughId: BoroughId) => void;
  teleportToCoords: (x: number, y: number) => void;
  spawnTurfDefenseWave: (racket: RacketBuilding) => void;
  spawnAlliedHitSquad: () => void;
  triggerHealEffect: (text: string) => void;
  takeFerry: () => void;
  getPlayerPosition: () => { x: number; y: number; boroughId: BoroughId };
}

interface NycWorldCanvasProps {
  isTitleScreen: boolean;
  isPaused: boolean;
  playerFamily: FamilyId;
  equippedWeapon: WeaponId;
  unlockedWeapons: WeaponId[];
  rackets: RacketBuilding[];
  contacts: SocialContact[];
  playerHp: number;
  playerMaxHp: number;
  damageMultiplier: number;
  speedMultiplier: number;
  fireRateMultiplier: number;
  hasAlliedBodyguards: boolean;
  hasStreetCeasefire: boolean;
  policeHeat: number;
  /** Contracts state. Undefined means peace with no contracts: heat comes from policeHeat. */
  contracts?: ContractsView;
  callbacks: WorldCallbacks;
  bridgeRef: React.MutableRefObject<LiveSimulationBridge | null>;
}

const WORLD_WIDTH = WORLD_W;
const WORLD_HEIGHT = WORLD_H;

// The city is generated once per page (deterministic) and shared by every mount of the canvas.
let cityCache: City | null = null;
const getCity = (): City => (cityCache ??= generateCity());

const UNCLAIMED_AREAS: readonly AreaId[] = ['uptown', 'staten_island'];
const CIVILIANS_PER_AREA = 6;
const TRAFFIC_COUNT = 40;
/** Chasers share one flow field around the player, rebuilt about twice a second. */
const FLOW_RADIUS_CELLS = 40;
const FLOW_REFRESH_S = 0.5;
const CHASE_SPEED = 110;
const PATROL_SPEED = 55;
/** Ring pieces bake only when the previous frame took less than this. */
const RING_BAKE_MAX_FRAME_MS = 20;

const FERRY_PROMPT_RANGE = 110;
const FERRY_BOARD_RANGE = 200;

interface TourHook {
  teleport: (x: number, y: number) => void;
  frameTimeMs: () => number;
  slowestChunkMs: number;
  /** Contracts test hooks: the first three go to App through onContractsDebug; spawnSquad acts here. */
  setHeat: (value: number) => void;
  addGrudge: (family: FamilyKey, points: number) => void;
  advanceClock: (ms: number) => void;
  spawnSquad: (family: FamilyKey) => boolean;
}

// ---- Contracts on the street (src/world/contracts.ts decides; the engine only asks)
const NO_CONTRACTS: ContractsState = emptyContracts();
/** A hit NPC with no contract on the player backs away for this long. */
const FLEE_S = 1.4;
const FLEE_SPEED = 125;
/** Squads every 90 to 150 s of play per contracted family; members hunt from this far. */
const SQUAD_MIN_S = 90;
const SQUAD_MAX_S = 150;
const SQUAD_HUNT_RANGE = 1400;
/** Squads that end up this far away, or this far once their contract is paid, are sent home. */
const SQUAD_LOST_RANGE = 2400;
const SQUAD_PAID_RANGE = 640;
const squadDelay = () => SQUAD_MIN_S + Math.random() * (SQUAD_MAX_S - SQUAD_MIN_S);
/** The sit-down prompt shows within this range of the spot during the window. */
const SITDOWN_RANGE = 60;
/** A hired hit squad member this close refuses the sit-down. */
const ALONE_RANGE = 400;
/** Enforcer bodyguards hold back at least this far during an open window. */
const HOLD_BACK_PX = 520;
const HOLD_BACK_SNAP_S = 2.5;
/** Unarmed couriers shove like a brawler, more weakly. */
const isMeleeRole = (role: WorldNpc['role']) => role === 'brawler' || role === 'courier';
const meleeDamage = (role: WorldNpc['role']) => (role === 'courier' ? 10 : 18);
const clockText = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

// ---- Street figures (src/world/characterSprite.ts): baked once per look, drawn anchored at the feet.
/** Bake scale: about 43 px from hat to feet. */
const FIG_SCALE = 0.42;
const FIG_FOOT_X = Math.round(FIGURE_FOOT.x * FIG_SCALE);
const FIG_FOOT_Y = Math.round(FIGURE_FOOT.y * FIG_SCALE);
/** Near-hand offset from the feet (facing right). */
const GRIP_DX = (FIGURE_GRIP.x - FIGURE_FOOT.x) * FIG_SCALE;
const GRIP_DY = (FIGURE_GRIP.y - FIGURE_FOOT.y) * FIG_SCALE;
/** Head top above the feet. */
const FIG_TOP = Math.round((FIGURE_FOOT.y - 6) * FIG_SCALE);
/** Tracers are drawn at hand height so they leave the gun (the simulation is unchanged). */
const SHOT_LIFT = Math.round(-GRIP_DY);
const MAX_FIGURES = 160;
const FIGURE_RETRY_FRAMES = 30;
/** Seed ranges for unnamed looks; they bound how many different figures can be cached. */
const CIVILIAN_LOOKS = 64;
const GENERIC_LOOKS = 16;
const PLAYER_LOOK_SEED = 1984;

// ---- Name tags (src/world/tagLayout.ts)
const TAG_MAX = 4;
const NEAREST_TAG_RANGE = 160;
const TAG_NAME_FONT = '600 10px "Plus Jakarta Sans", sans-serif';
const TAG_FAMILY_FONT = '700 8px "JetBrains Mono", monospace';
const TAG_H = 28;
const TAG_H_BAR = 34;

// ---- Who wears the 50 (src/world/cast.ts)
/** The two outside-the-families cops head NYPD squads; the other six outside characters are named citizens. */
const COP_IDS: ReadonlySet<string> = new Set(CAST.filter((m) => m.familyId === 'outside' && /\bNYPD\b/.test(m.role)).map((m) => m.id));
const isCopCast = (m: CastMember) => COP_IDS.has(m.id);
const isCitizenCast = (m: CastMember) => !COP_IDS.has(m.id);
/** Turf-wave Capos prefer a Capo or Underboss; street soldati and brawlers prefer the lower ranks. */
const isTurfCapoCast = (m: CastMember) => /^(Capo|Underboss)\b/.test(m.role);
const isStreetRankCast = (m: CastMember) => !/^(Capo|Underboss|Consigliere|The Don)\b/.test(m.role);

const WEAPON_NONE = 0;
const WEAPON_KNUCKLES = 1;
const WEAPON_PISTOL = 2;
const WEAPON_SHOTGUN = 3;
const WEAPON_TOMMY = 4;
const npcWeapon = (role: WorldNpc['role']): number =>
  role === 'brawler' ? WEAPON_KNUCKLES : role === 'capo' ? WEAPON_TOMMY : role === 'soldato' || role === 'nypd' || role === 'ally' ? WEAPON_PISTOL : WEAPON_NONE;
const playerWeapon = (id: WeaponId): number =>
  id === 'knuckles' ? WEAPON_KNUCKLES : id === 'shotgun' ? WEAPON_SHOTGUN : id === 'tommy' ? WEAPON_TOMMY : WEAPON_PISTOL;

const FAMILY_COAT_COLORS: Record<
  string,
  { coat: string; hat: string; accent: string; symbol: string; shortFamily: string; traitTag: string }
> = {
  corvini: {
    coat: '#7F1D1D',
    hat: '#991B1B',
    accent: '#EF4444',
    symbol: '♠',
    shortFamily: 'CORVINI',
    traitTag: 'RED CARNATION',
  },
  bellini: {
    coat: '#78350F',
    hat: '#B45309',
    accent: '#F59E0B',
    symbol: '◆',
    shortFamily: 'BELLINI',
    traitTag: 'BRASS LEDGER',
  },
  valenti: {
    coat: '#064E3B',
    hat: '#047857',
    accent: '#10B981',
    symbol: '✦',
    shortFamily: 'VALENTI',
    traitTag: 'AVIATOR SHADES',
  },
  moretti: {
    coat: '#1E3A8A',
    hat: '#1D4ED8',
    accent: '#3B82F6',
    symbol: '⚓',
    shortFamily: 'MORETTI',
    traitTag: 'IRON HOOK SASH',
  },
  rastelli: {
    coat: '#4C1D95',
    hat: '#6D28D9',
    accent: '#A855F7',
    symbol: '♛',
    shortFamily: 'RASTELLI',
    traitTag: 'CUBAN CIGAR',
  },
  nypd: {
    coat: '#172554',
    hat: '#38BDF8',
    accent: '#38BDF8',
    symbol: '🛡',
    shortFamily: 'NYPD',
    traitTag: 'PRECINCT BADGE',
  },
  civilian: {
    coat: '#3F3F46',
    hat: '#71717A',
    accent: '#A1A1AA',
    symbol: '•',
    shortFamily: 'CITIZEN',
    traitTag: 'MERCHANT',
  },
  player: {
    coat: '#1C1917',
    hat: '#D97706',
    accent: '#10B981',
    symbol: '★',
    shortFamily: 'YOUR CREW',
    traitTag: 'GOLD SIGNET',
  },
};

const familyTag = (fam: FamilyId): string => {
  const v = FAMILY_COAT_COLORS[fam];
  return v ? `${v.symbol} ${v.shortFamily}` : fam.toUpperCase();
};
const familyName = (fam: FamilyId): string => fam.charAt(0).toUpperCase() + fam.slice(1);

export const NycWorldCanvas: React.FC<NycWorldCanvasProps> = ({
  isTitleScreen,
  isPaused,
  playerFamily,
  equippedWeapon,
  unlockedWeapons,
  rackets,
  contacts,
  playerHp,
  playerMaxHp,
  damageMultiplier,
  speedMultiplier,
  fireRateMultiplier,
  hasAlliedBodyguards,
  hasStreetCeasefire,
  policeHeat,
  contracts,
  callbacks,
  bridgeRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Mutable ref mirror of props so the 60fps loop never restarts when React state changes
  const stateRef = useRef({
    isTitleScreen,
    isPaused,
    playerFamily,
    equippedWeapon,
    unlockedWeapons,
    rackets,
    contacts,
    playerHp,
    playerMaxHp,
    damageMultiplier,
    speedMultiplier,
    fireRateMultiplier,
    hasAlliedBodyguards,
    hasStreetCeasefire,
    policeHeat,
    contracts,
    callbacks,
  });

  useEffect(() => {
    stateRef.current = {
      isTitleScreen,
      isPaused,
      playerFamily,
      equippedWeapon,
      unlockedWeapons,
      rackets,
      contacts,
      playerHp,
      playerMaxHp,
      damageMultiplier,
      speedMultiplier,
      fireRateMultiplier,
      hasAlliedBodyguards,
      hasStreetCeasefire,
      policeHeat,
      contracts,
      callbacks,
    };
  }, [
    isTitleScreen,
    isPaused,
    playerFamily,
    equippedWeapon,
    unlockedWeapons,
    rackets,
    contacts,
    playerHp,
    playerMaxHp,
    damageMultiplier,
    speedMultiplier,
    fireRateMultiplier,
    hasAlliedBodyguards,
    hasStreetCeasefire,
    policeHeat,
    contracts,
    callbacks,
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const city = getCity();
    // Borough the player is in; snap() falls back to its subway station when nothing walkable is near.
    const home = { borough: 'manhattan_south' as GameBoroughId };
    const snap = (x: number, y: number, maxCells = 12): Pt => {
      const near = nearestWalkable(city, x, y, maxCells);
      if (near) return near;
      const a = areaAtPoint(city, x, y);
      const id: GameBoroughId = a && a !== 'uptown' && a !== 'staten_island' ? a : home.borough;
      const st = STATIONS[id];
      return { x: st.x, y: st.y };
    };
    const startPos = snap(START_POINT.x, START_POINT.y);

    // Player physical state
    const player = {
      x: startPos.x,
      y: startPos.y,
      vx: 0,
      vy: 0,
      angle: 0,
      radius: 16,
      attackCooldown: 0,
      hitFlash: 0,
      squash: 1,
      walkCycle: 0,
      currentBorough: 'manhattan_south' as BoroughId,
    };

    const camera = {
      x: startPos.x,
      y: startPos.y,
      shake: 0,
      panAngle: 0,
    };

    let hitstopTimer = 0;

    // Input state: continuous held vs edge-triggered justPressed
    const heldKeys = new Set<string>();
    const justPressedKeys = new Set<string>();
    const mouse = {
      screenX: 0,
      screenY: 0,
      worldX: startPos.x,
      worldY: startPos.y,
      isDown: false,
      justClicked: false,
    };

    // Twin-stick touch input (active only in touch mode)
    installTouchMode();
    const sticks = createTwinSticks();

    const npcs: WorldNpc[] = [];
    const bullets: Bullet[] = [];
    const particles: Particle[] = [];
    const floatingTexts: FloatingText[] = [];
    let streetCars: Car[] = [];

    // Raindrops for gritty 1984 neo-noir atmosphere
    const raindrops = Array.from({ length: 110 }, () => ({
      x: Math.random() * 1600,
      y: Math.random() * 1000,
      len: 10 + Math.random() * 12,
      speed: 520 + Math.random() * 240,
    }));

    const spawnParticles = (x: number, y: number, color: string, count: number, speed: number = 140, isShell = false) => {
      for (let i = 0; i < count; i++) {
        if (particles.length > 260) particles.shift();
        const a = Math.random() * Math.PI * 2;
        const spd = (0.3 + Math.random() * 0.7) * speed;
        particles.push({
          x,
          y,
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd,
          life: 0,
          maxLife: isShell ? 0.65 : 0.25 + Math.random() * 0.25,
          size: isShell ? 3.5 : 2 + Math.random() * 3,
          color,
          isShell,
        });
      }
    };

    const addFloatingText = (x: number, y: number, text: string, color: string) => {
      if (floatingTexts.length > 40) floatingTexts.shift();
      floatingTexts.push({
        x,
        y: y - 14,
        vy: -42,
        text,
        color,
        life: 0,
        maxLife: 1.05,
      });
    };

    // One cast pool per mount: no two living bodies wear the same cast member.
    const pool = createCastPool();
    interface Dress {
      name: string;
      castId?: string;
      look: FigureLook;
      tagFamily: string;
      tagColor: string;
    }
    const seedOf = (range: number) => Math.floor(Math.random() * range);
    const fromMember = (m: CastMember, fam: CastFamily, tagFamily: string, tagColor: string): Dress => ({
      name: m.name,
      castId: m.id,
      look: lookOf(m.traits, FAMILY_ACCENT[fam]),
      tagFamily,
      tagColor,
    });
    /** A distinct member of `fam` (preferring `prefer`), or a generic made man of that family once all are in use. */
    const familyDress = (fam: FamilyId, fallbackName: string, prefer?: (m: CastMember) => boolean): Dress => {
      const m = (prefer && pool.take(fam, prefer)) || pool.take(fam);
      if (m) return fromMember(m, fam, familyTag(fam), FAMILY_ACCENT[fam]);
      const a = assignCast(pool, fam, seedOf(GENERIC_LOOKS), 'ally');
      return { name: fallbackName, look: lookOf(a.traits, FAMILY_ACCENT[fam]), tagFamily: familyTag(fam), tagColor: FAMILY_ACCENT[fam] };
    };
    const civilianDress = (name: string): Dress => ({
      name,
      look: lookOf(genericTraits('civilian', seedOf(CIVILIAN_LOOKS)), CIVILIAN_ACCENT),
      tagFamily: 'CITIZEN',
      tagColor: '#A1A1AA',
    });
    /** Game-borough citizens are the six outside non-cop characters while any is free. */
    const citizenDress = (fallbackName: string): Dress => {
      const m = pool.take('outside', isCitizenCast);
      return m ? fromMember(m, 'outside', 'INDEPENDENT', '#CBD5E1') : civilianDress(fallbackName);
    };
    /** The two outside cops lead NYPD squads; further officers are generic. */
    const officerDress = (): Dress => {
      const m = pool.take('outside', isCopCast);
      if (m) return fromMember(m, 'outside', 'NYPD', '#38BDF8');
      return {
        name: 'NYPD Organized Crime Task Force',
        look: lookOf(genericTraits('officer', seedOf(GENERIC_LOOKS)), FAMILY_ACCENT.outside),
        tagFamily: 'NYPD',
        tagColor: '#38BDF8',
      };
    };
    const courierDress = (fam: FamilyId, name: string): Dress => ({
      name,
      look: lookOf(genericTraits('ally', seedOf(GENERIC_LOOKS), fam), FAMILY_ACCENT[fam]),
      tagFamily: `${familyTag(fam)} · COURIER`,
      tagColor: '#F59E0B',
    });
    const allyDress = (name: string): Dress => {
      const fam = stateRef.current.playerFamily;
      return {
        name,
        look: lookOf(genericTraits('ally', seedOf(GENERIC_LOOKS), fam), FAMILY_ACCENT[fam]),
        tagFamily: 'YOUR CREW',
        tagColor: '#10B981',
      };
    };
    const releaseCast = (npc: WorldNpc) => {
      if (npc.castId) pool.release(npc.castId);
    };

    const makeCivilian = (area: AreaId): WorldNpc => {
      const spot = randomWalkableIn(city, area, Math.random);
      return {
        id: `civ_${area}_${Math.random().toString(36).slice(2, 8)}`,
        ...civilianDress(area === 'uptown' ? '1984 Uptown Resident' : '1984 Ferry Commuter'),
        role: 'citizen',
        familyId: 'civilian',
        x: spot.x,
        y: spot.y,
        vx: 0,
        vy: 0,
        hp: 60,
        maxHp: 60,
        angle: Math.random() * Math.PI * 2,
        state: 'patrol',
        stateTimer: 1 + Math.random() * 3,
        patrolOriginX: spot.x,
        patrolOriginY: spot.y,
        hitFlashTimer: 0,
        squash: 1,
        cashDrop: 300,
        contrabandDrop: 1,
        homeArea: area,
      };
    };

    // Populate living 1984 NYC NPCs across all 5 boroughs
    const initWorldNpcs = () => {
      for (const n of npcs) releaseCast(n);
      npcs.length = 0;

      NYC_BOROUGHS.forEach((b) => {
        const count = 8;
        for (let i = 0; i < count; i++) {
          const isCourier = i === 0;
          const isCitizen = i === 1;
          const isBrawler = i % 2 === 0 && !isCourier;
          const spot = randomWalkableIn(city, b.id as GameBoroughId, Math.random);
          const px = spot.x;
          const py = spot.y;
          const fam = isCitizen ? 'civilian' : b.controllingFamilyDefault;
          const tierScale = 1 + (b.riskTier - 1) * 0.35;
          const dress = isCourier
            ? courierDress(b.controllingFamilyDefault, `${b.name.split(' ')[0]} Contraband Runner`)
            : isCitizen
            ? citizenDress('1984 Garment Merchant')
            : familyDress(
                b.controllingFamilyDefault,
                `${familyName(b.controllingFamilyDefault)} ${isBrawler ? 'Enforcer' : 'Soldato'}`,
                isStreetRankCast
              );

          npcs.push({
            id: `npc_${b.id}_${i}_${Math.random().toString(36).slice(2, 6)}`,
            ...dress,
            role: isCourier ? 'courier' : isCitizen ? 'citizen' : isBrawler ? 'brawler' : 'soldato',
            familyId: fam,
            x: px,
            y: py,
            vx: 0,
            vy: 0,
            hp: Math.round((isCourier ? 95 : isCitizen ? 60 : 110) * tierScale),
            maxHp: Math.round((isCourier ? 95 : isCitizen ? 60 : 110) * tierScale),
            angle: Math.random() * Math.PI * 2,
            state: 'patrol',
            stateTimer: 1 + Math.random() * 3,
            patrolOriginX: px,
            patrolOriginY: py,
            hitFlashTimer: 0,
            squash: 1,
            cashDrop: Math.round((isCourier ? 1800 : isCitizen ? 450 : 950) * b.rewardMultiplier),
            contrabandDrop: isCourier ? Math.round(6 * b.contrabandMultiplier) : Math.round(2 * b.contrabandMultiplier),
          });
        }
      });

      // Uptown and Staten Island belong to no family: six civilians each, who respawn in their own area.
      for (const area of UNCLAIMED_AREAS) {
        for (let i = 0; i < CIVILIANS_PER_AREA; i++) npcs.push(makeCivilian(area));
      }

      // About 40 lane-keeping cars on road and bridge cells, one in ten police (see src/world/traffic.ts).
      streetCars = spawnTraffic(city, TRAFFIC_COUNT, Math.random);
    };

    initWorldNpcs();

    // Every teleport lands on a walkable cell and snaps the camera.
    const teleportPlayer = (x: number, y: number) => {
      const p = snap(x, y);
      player.x = p.x;
      player.y = p.y;
      camera.x = p.x;
      camera.y = p.y;
      flow = null;
    };

    // Moves a non-player body through the city so nobody walks through buildings or water.
    const stepBody = (body: { x: number; y: number }, dx: number, dy: number, radius = 11) => {
      const p = moveWithCollision(city, body.x, body.y, dx, dy, radius);
      body.x = p.x;
      body.y = p.y;
    };

    // One flow field for every chaser: walking distances to the player, rebuilt about twice a second.
    let flow: FlowField | null = null;
    let flowAge = FLOW_REFRESH_S;
    const getFlow = (): FlowField => {
      if (!flow || flowAge >= FLOW_REFRESH_S) {
        flow = buildFlowField(city, player.x, player.y, FLOW_RADIUS_CELLS);
        flowAge = 0;
      }
      return flow;
    };

    // True when no building lies on the straight line between the two points (sampled every 16 px).
    const clearShot = (ax: number, ay: number, bx: number, by: number): boolean => {
      const dx = bx - ax;
      const dy = by - ay;
      const n = Math.ceil(Math.hypot(dx, dy) / 16);
      for (let k = 1; k < n; k++) {
        const t = k / n;
        if (blocksBullet(city, ax + dx * t, ay + dy * t)) return false;
      }
      return true;
    };

    // Walk one step toward a point. With useFlow the target must be the player: the direction comes from the shared
    // flow field (refreshed about ten times a second per body) and falls back to a straight line when it has none.
    const walkToward = (npc: WorldNpc, tx: number, ty: number, speed: number, dt: number, useFlow: boolean) => {
      let dx = tx - npc.x;
      let dy = ty - npc.y;
      if (useFlow) {
        npc.flowT = (npc.flowT ?? 0) - dt;
        if (npc.flowT <= 0) {
          npc.flowT = 0.1;
          const f = flowDirection(getFlow(), city, npc.x, npc.y);
          npc.flowOk = f !== null;
          if (f) {
            npc.flowDx = f.dx;
            npc.flowDy = f.dy;
          }
        }
        if (npc.flowOk) {
          dx = npc.flowDx ?? dx;
          dy = npc.flowDy ?? dy;
        }
      }
      const len = Math.hypot(dx, dy);
      if (len < 1e-6) {
        npc.vx = 0;
        npc.vy = 0;
        return;
      }
      npc.vx = (dx / len) * speed;
      npc.vy = (dy / len) * speed;
      npc.angle = Math.atan2(npc.vy, npc.vx);
      stepBody(npc, npc.vx * dt, npc.vy * dt);
    };

    // Stuck rule: after 2 s of trying without progress, head for a new walkable point for a moment.
    const trackStuck = (npc: WorldNpc, dt: number, trying: boolean) => {
      if (!npc.stuck) npc.stuck = createStuckTracker(npc.x, npc.y);
      if (updateStuck(npc.stuck, npc.x, npc.y, dt, trying)) {
        const t = pickUnstuckTarget(city, npc.x, npc.y, Math.random);
        if (t) {
          npc.detX = t.x;
          npc.detY = t.y;
          npc.detT = 1.5;
        }
      }
    };

    // While an unstuck detour is active, walk it and return true.
    const followDetour = (npc: WorldNpc, dt: number, speed: number): boolean => {
      if ((npc.detT ?? 0) <= 0) return false;
      npc.detT = (npc.detT ?? 0) - dt;
      walkToward(npc, npc.detX ?? npc.x, npc.detY ?? npc.y, speed, dt, false);
      return true;
    };

    // Chase the player around buildings (flow field), or walk the unstuck detour while one is active.
    const chase = (npc: WorldNpc, dt: number, speed: number) => {
      const away = Math.hypot(player.x - npc.x, player.y - npc.y) > 30;
      if (followDetour(npc, dt, speed)) {
        // detour in progress
      } else if (away) {
        walkToward(npc, player.x, player.y, speed, dt, true);
      }
      trackStuck(npc, dt, away);
    };

    // A new patrol point on a sidewalk (or other non-road ground) within five cells of the NPC's origin.
    const pickPatrolGoal = (npc: WorldNpc) => {
      let gx = npc.patrolOriginX;
      let gy = npc.patrolOriginY;
      for (let attempt = 0; attempt < 6; attempt++) {
        const px = npc.patrolOriginX + (Math.random() * 2 - 1) * 5 * CELL;
        const py = npc.patrolOriginY + (Math.random() * 2 - 1) * 5 * CELL;
        const p = nearestWalkable(city, px, py, 3);
        if (!p) continue;
        gx = p.x;
        gy = p.y;
        const k = kindAt(city, p.x, p.y);
        if (k !== CellKind.ROAD && k !== CellKind.BRIDGE) break;
      }
      npc.goalX = gx;
      npc.goalY = gy;
      npc.goalT = 5 + Math.random() * 3;
    };

    // Racket doors sit on the sidewalk below the lot.
    const doorCache = new Map<string, Pt>();
    const doorOf = (r: RacketBuilding): Pt => {
      const key = `${r.id}:${r.x}:${r.y}:${r.width}:${r.height}`;
      let d = doorCache.get(key);
      if (!d) {
        d = snap(r.x + r.width / 2, r.y + r.height + 15, 6);
        doorCache.set(key, d);
      }
      return d;
    };

    // ---- Contracts. Every hostility decision is isHostile() from src/world/contracts.ts.
    // The frame context is refreshed at the top of every frame (and by bridge calls made between frames).
    const fc = { s: NO_CONTRACTS, now: 0, heat: 0, graceUntil: 0, anyOpen: false };
    const refreshContracts = () => {
      const st = stateRef.current;
      const v = st.contracts;
      const off = v && Number.isFinite(v.nowOffsetMs) ? v.nowOffsetMs : 0;
      fc.s = v?.state ?? NO_CONTRACTS;
      fc.now = Date.now() + off;
      fc.heat = v ? v.heat : st.policeHeat;
      fc.graceUntil = v && Number.isFinite(v.graceUntil) ? v.graceUntil : 0;
      fc.anyOpen = false;
      for (const f of FAMILY_KEYS) if (windowState(fc.s, f, fc.now) === 'open') fc.anyOpen = true;
    };
    const hostile = (npc: WorldNpc): boolean =>
      isHostile({
        role: npc.role,
        familyId: npc.familyId,
        playerFamily: stateRef.current.playerFamily,
        isTakeoverGuard: npc.racketGuardId !== undefined,
        heat: fc.heat,
        now: fc.now,
        s: fc.s,
      });

    // A hit NPC that is hostile winds up (as before); anyone else backs away and never fights back.
    const reactToHit = (npc: WorldNpc, windup: number) => {
      if (hostile(npc)) {
        if (npc.state === 'patrol' || npc.state === 'flee') {
          npc.state = 'windup';
          npc.stateTimer = windup;
        }
      } else {
        npc.state = 'flee';
        npc.stateTimer = FLEE_S;
        npc.goalT = 0;
        npc.detT = 0;
      }
    };

    // Attack tally: every swing, trigger pull or ally shot is one attack. Its hits are reported once, through
    // tallyAttack, after the frame in which its last pellet is gone and its deaths have been processed.
    type AttackHit = { npcId: string; family: FamilyKey | null; killed: boolean };
    const openAttacks = new Map<number, AttackHit[]>();
    let nextAttackId = 1;
    const beginAttack = (): number => {
      const id = nextAttackId++;
      openAttacks.set(id, []);
      return id;
    };
    const familyOf = (npc: WorldNpc): FamilyKey | null => (isFamilyKey(npc.familyId) ? npc.familyId : null);
    const noteHit = (attackId: number | undefined, npc: WorldNpc) => {
      if (attackId === undefined) return;
      const hits = openAttacks.get(attackId);
      if (!hits) return;
      hits.push({ npcId: npc.id, family: familyOf(npc), killed: false });
      npc.lastAttackId = attackId;
    };
    const noteKill = (npc: WorldNpc) => {
      const hits = npc.lastAttackId !== undefined ? openAttacks.get(npc.lastAttackId) : undefined;
      if (hits) hits.push({ npcId: npc.id, family: familyOf(npc), killed: true });
    };
    const settleAttacks = () => {
      if (openAttacks.size === 0) return;
      const cb = stateRef.current.callbacks;
      for (const [id, hits] of openAttacks) {
        let live = false;
        for (let k = 0; k < bullets.length; k++) {
          if (bullets[k].attackId === id) {
            live = true;
            break;
          }
        }
        if (live) continue;
        openAttacks.delete(id);
        if (hits.length === 0) continue;
        const tally = tallyAttack(hits);
        for (const f of FAMILY_KEYS) {
          const h = tally[f];
          if (h && (h.hits > 0 || h.kills > 0)) cb.onFamilyHarmed?.(f, { hits: h.hits, kills: h.kills });
        }
      }
    };

    // Hit squads: 2 or 3 members of a contracted family, spawned just off screen; at most one per family.
    const squadWait = {} as Record<FamilyKey, number>;
    for (const f of FAMILY_KEYS) squadWait[f] = squadDelay();
    const squadAlive = (f: FamilyKey) => npcs.some((n) => n.squadFamily === f);
    const spawnSquad = (f: FamilyKey): boolean => {
      if (squadAlive(f)) return false;
      const size = Math.random() < 0.5 ? 2 : 3;
      const reach = Math.min(1100, Math.hypot(canvas.width, canvas.height) / 2 + 90);
      const a = Math.random() * Math.PI * 2;
      const base = snap(player.x + Math.cos(a) * reach, player.y + Math.sin(a) * reach);
      for (let i = 0; i < size; i++) {
        const spot = snap(base.x + (i - 1) * 34, base.y + (i % 2) * 26, 6);
        npcs.push({
          id: `squad_${f}_${Date.now()}_${i}`,
          ...familyDress(f, `${familyName(f)} Hit Man`, isStreetRankCast),
          role: i === 1 ? 'brawler' : 'soldato',
          familyId: f,
          x: spot.x,
          y: spot.y,
          vx: 0,
          vy: 0,
          hp: 130,
          maxHp: 130,
          angle: 0,
          state: 'patrol',
          stateTimer: 0,
          patrolOriginX: spot.x,
          patrolOriginY: spot.y,
          hitFlashTimer: 0,
          squash: 1,
          cashDrop: 900,
          contrabandDrop: 2,
          squadFamily: f,
        });
      }
      const vis = FAMILY_COAT_COLORS[f];
      addFloatingText(player.x, player.y - 40, `${vis.symbol} ${vis.shortFamily} HIT SQUAD ON YOUR TRAIL`, vis.accent);
      return true;
    };
    // Per frame of play: count down for each contracted family with no open window, no grace and no squad out;
    // send home squads that are lost far away or whose contract has been paid.
    const stepSquads = (dt: number) => {
      for (const f of FAMILY_KEYS) {
        const g = fc.s.families[f];
        if (!g || !g.contract) {
          squadWait[f] = squadDelay();
          continue;
        }
        if (windowState(fc.s, f, fc.now) === 'open' || fc.now < fc.graceUntil || squadAlive(f)) continue;
        squadWait[f] -= dt;
        if (squadWait[f] <= 0) {
          spawnSquad(f);
          squadWait[f] = squadDelay();
        }
      }
      for (let i = npcs.length - 1; i >= 0; i--) {
        const n = npcs[i];
        if (!n.squadFamily) continue;
        const d = Math.hypot(n.x - player.x, n.y - player.y);
        const paid = !fc.s.families[n.squadFamily]?.contract;
        if (d > SQUAD_LOST_RANGE || (paid && d > SQUAD_PAID_RANGE)) {
          releaseCast(n);
          npcs.splice(i, 1);
        }
      }
    };

    // Sit-downs: the open window whose spot is nearest the player, within SITDOWN_RANGE.
    const openSitDownNear = (): { family: FamilyKey; price: number; label: string } | null => {
      let best: { family: FamilyKey; price: number; label: string } | null = null;
      let bestD = SITDOWN_RANGE;
      for (const f of FAMILY_KEYS) {
        const g = fc.s.families[f];
        if (!g?.contract || !g.sitDown || windowState(fc.s, f, fc.now) !== 'open') continue;
        const d = Math.hypot(player.x - g.sitDown.spot.x, player.y - g.sitDown.spot.y);
        if (d < bestD) {
          bestD = d;
          best = { family: f, price: g.price, label: g.sitDown.spot.label };
        }
      }
      return best;
    };
    // A hired (temporary) hit squad member. Enforcer bodyguards never count; the same rule both refuses
    // the sit-down and sends the crew home, so a crew that blocks a sit-down can always be dismissed.
    const isHiredAlly = (n: WorldNpc) => n.role === 'ally' && n.allyKind !== 'bodyguard';
    // Alone: no hired ally within ALONE_RANGE.
    const isAlone = () => !npcs.some((n) => isHiredAlly(n) && Math.hypot(n.x - player.x, n.y - player.y) < ALONE_RANGE);
    // PATCH-001: dismiss every hired ally for good, wherever it is, releasing its cast member.
    const sendCrewHome = () => {
      let sent = 0;
      for (let i = npcs.length - 1; i >= 0; i--) {
        if (!isHiredAlly(npcs[i])) continue;
        const n = npcs[i];
        spawnParticles(n.x, n.y, '#10B981', 8, 70);
        releaseCast(n);
        npcs.splice(i, 1);
        sent++;
      }
      if (sent > 0) addFloatingText(player.x, player.y - 24, 'CREW SENT HOME', '#10B981');
    };
    // E at the spot, or the HUD tap through the bridge. With a hired crew near, the press sends the crew home
    // and does not sit; otherwise the engine names the family and the player sits down alone.
    const chooseSitDown = (): boolean => {
      const st = stateRef.current;
      if (st.isPaused || st.isTitleScreen) return false;
      refreshContracts();
      const sd = openSitDownNear();
      if (!sd) return false;
      if (!isAlone()) {
        sendCrewHome();
        return true;
      }
      st.callbacks.onSitDownChosen?.(sd.family, true);
      return true;
    };

    // Ferry: fade out, move to the other terminal, fade in.
    const ferry = { t: 0, active: false, moved: false, dest: { x: 0, y: 0 }, label: '' };
    const nearestTerminal = (): { id: 'battery' | 'st_george'; d: number } => {
      const db = Math.hypot(player.x - FERRY_TERMINALS.battery.x, player.y - FERRY_TERMINALS.battery.y);
      const ds = Math.hypot(player.x - FERRY_TERMINALS.stGeorge.x, player.y - FERRY_TERMINALS.stGeorge.y);
      return db <= ds ? { id: 'battery', d: db } : { id: 'st_george', d: ds };
    };
    const takeFerry = () => {
      if (ferry.active) return;
      const near = nearestTerminal();
      if (near.d > FERRY_BOARD_RANGE) return;
      const toStaten = near.id === 'battery';
      const target = toStaten ? FERRY_TERMINALS.stGeorge : FERRY_TERMINALS.battery;
      ferry.active = true;
      ferry.moved = false;
      ferry.t = 0;
      ferry.dest = snap(target.x, target.y);
      ferry.label = toStaten ? 'STATEN ISLAND FERRY: ST. GEORGE' : 'STATEN ISLAND FERRY: BATTERY';
      soundEngine.playUiClick();
    };

    // Expose imperative bridge for React UI actions
    bridgeRef.current = {
      teleportToBorough: (boroughId: BoroughId) => {
        const b = NYC_BOROUGHS.find((zone) => zone.id === boroughId);
        if (b) {
          const st0 = STATIONS[b.id as GameBoroughId] ?? b.spawnPoint;
          teleportPlayer(st0.x, st0.y);
          addFloatingText(player.x, player.y - 20, `ARRIVED: ${b.name.toUpperCase()}`, '#F59E0B');
        }
      },
      teleportToCoords: (x: number, y: number) => {
        teleportPlayer(x, y);
      },
      takeFerry,
      spawnTurfDefenseWave: (racket: RacketBuilding) => {
        const b = NYC_BOROUGHS.find((z) => z.id === racket.boroughId) || NYC_BOROUGHS[0];
        const waveFamily: FamilyId = racket.ownerFamily === 'player' ? 'corvini' : racket.ownerFamily;
        const tierMult = 1 + (racket.defenseDifficulty - 1) * 0.4;
        // Teleport player just outside the racket entrance if far away
        const dist = Math.hypot(player.x - (racket.x + racket.width / 2), player.y - (racket.y + racket.height + 55));
        if (dist > 360) {
          teleportPlayer(racket.x + racket.width / 2, racket.y + racket.height + 65);
        }
        const capoSpot = snap(racket.x + racket.width / 2, racket.y + racket.height + 28);
        const guardSpots = [
          snap(racket.x - 24, racket.y + racket.height + 20),
          snap(racket.x + racket.width + 24, racket.y + racket.height + 20),
        ];
        const guardOrigin = snap(racket.x + racket.width / 2, racket.y + racket.height + 25);
        // Remove existing guards for this racket first
        for (let i = npcs.length - 1; i >= 0; i--) {
          if (npcs[i].racketGuardId === racket.id) {
            releaseCast(npcs[i]);
            npcs.splice(i, 1);
          }
        }
        // Spawn 1 Turf Capo + 2 Enforcers, all members of the racket owner's family
        npcs.push({
          id: `capo_${racket.id}_${Date.now()}`,
          ...familyDress(waveFamily, `Capo defending ${racket.name.split(' ')[0]}`, isTurfCapoCast),
          role: 'capo',
          familyId: racket.ownerFamily === 'player' ? 'corvini' : racket.ownerFamily,
          x: capoSpot.x,
          y: capoSpot.y,
          vx: 0,
          vy: 0,
          hp: Math.round(240 * tierMult),
          maxHp: Math.round(240 * tierMult),
          angle: Math.PI / 2,
          state: 'windup',
          stateTimer: 0.5,
          patrolOriginX: capoSpot.x,
          patrolOriginY: capoSpot.y,
          hitFlashTimer: 0,
          squash: 1,
          cashDrop: Math.round(3500 * b.rewardMultiplier),
          contrabandDrop: Math.round(8 * b.contrabandMultiplier),
          racketGuardId: racket.id,
        });
        for (let g = 0; g < 2; g++) {
          npcs.push({
            id: `guard_${racket.id}_${g}_${Date.now()}`,
            ...familyDress(waveFamily, `${racket.ownerFamily.toUpperCase()} Button Man`, isStreetRankCast),
            role: g === 0 ? 'brawler' : 'soldato',
            familyId: racket.ownerFamily === 'player' ? 'corvini' : racket.ownerFamily,
            x: guardSpots[g].x,
            y: guardSpots[g].y,
            vx: 0,
            vy: 0,
            hp: Math.round(130 * tierMult),
            maxHp: Math.round(130 * tierMult),
            angle: Math.PI / 2,
            state: 'patrol',
            stateTimer: 0.3,
            patrolOriginX: guardOrigin.x,
            patrolOriginY: guardOrigin.y,
            hitFlashTimer: 0,
            squash: 1,
            cashDrop: Math.round(1200 * b.rewardMultiplier),
            contrabandDrop: 3,
            racketGuardId: racket.id,
          });
        }
        camera.shake = 10;
        addFloatingText(racket.x + racket.width / 2, racket.y, 'TURF WAR: DEFEAT THE CAPO!', '#EF4444');
      },
      spawnAlliedHitSquad: () => {
        for (let i = 0; i < 2; i++) {
          const allySpot = snap(player.x + (i === 0 ? -40 : 40), player.y + 30);
          npcs.push({
            id: `ally_${Date.now()}_${i}`,
            ...allyDress('Corvini Cadillac Enforcer'),
            role: 'ally',
            allyKind: 'hired',
            familyId: 'player',
            x: allySpot.x,
            y: allySpot.y,
            vx: 0,
            vy: 0,
            hp: 220,
            maxHp: 220,
            angle: 0,
            state: 'patrol',
            stateTimer: 1,
            patrolOriginX: player.x,
            patrolOriginY: player.y,
            hitFlashTimer: 0,
            squash: 1,
            cashDrop: 0,
            contrabandDrop: 0,
          });
        }
        addFloatingText(player.x, player.y - 25, 'CADILLAC HIT SQUAD ARRIVED', '#10B981');
      },
      triggerHealEffect: (text: string) => {
        addFloatingText(player.x, player.y - 24, text, '#10B981');
        spawnParticles(player.x, player.y, '#10B981', 14, 90);
      },
      getPlayerPosition: () => ({
        x: player.x,
        y: player.y,
        boroughId: player.currentBorough,
      }),
      chooseSitDown: () => {
        if (chooseSitDown()) soundEngine.playUiClick();
      },
      // After a betrayal or a death under contract: wake at (x, y) with nobody mid-attack and no squad on the trail.
      wakeAt: (x: number, y: number) => {
        ferry.active = false;
        teleportPlayer(x, y);
        for (let i = bullets.length - 1; i >= 0; i--) if (!bullets[i].fromPlayer) bullets.splice(i, 1);
        for (let i = npcs.length - 1; i >= 0; i--) {
          const n = npcs[i];
          if (n.squadFamily) {
            releaseCast(n);
            npcs.splice(i, 1);
          } else if (n.role === 'ally') {
            const back = snap(player.x + (i % 2 === 0 ? -42 : 42), player.y + 36);
            n.x = back.x;
            n.y = back.y;
          } else if (n.state !== 'patrol') {
            n.state = 'patrol';
            n.stateTimer = 1;
          }
        }
        player.hitFlash = 0;
        addFloatingText(player.x, player.y - 24, 'YOU WAKE UP AT THE STATION', '#F59E0B');
      },
    };

    // Tour hook for the CI city tour: present only when the URL has ?tour.
    const tourWin = window as unknown as { __cityTour?: TourHook };
    const frameSamples: number[] = [];
    let tourHook: TourHook | null = null;
    try {
      if (new URLSearchParams(window.location.search).has('tour')) {
        const debug: NonNullable<WorldCallbacks['onContractsDebug']> = (a) => stateRef.current.callbacks.onContractsDebug?.(a);
        tourHook = {
          teleport: (x: number, y: number) => teleportPlayer(x, y),
          frameTimeMs: () => (frameSamples.length ? frameSamples.reduce((a, b) => a + b, 0) / frameSamples.length : 0),
          slowestChunkMs: 0,
          setHeat: (value: number) => debug({ type: 'heat', value }),
          addGrudge: (family: FamilyKey, points: number) => {
            if (isFamilyKey(family)) debug({ type: 'grudge', family, points });
          },
          advanceClock: (ms: number) => debug({ type: 'clock', ms }),
          spawnSquad: (family: FamilyKey) => isFamilyKey(family) && spawnSquad(family),
        };
        tourWin.__cityTour = tourHook;
      }
    } catch {
      tourHook = null;
    }

    // City pieces: 512 px canvases drawn once, at most one new piece per frame.
    interface Piece {
      key: number;
      cv: HTMLCanvasElement;
    }
    const baked = new Set<number>();
    const livePieces = new Set<Piece>();
    const failedUntil = new Map<number, number>();
    const req: { x0: number; x1: number; y0: number; y1: number; list: { cx: number; cy: number }[]; visible: boolean[] } = {
      x0: -1e9,
      x1: -1e9,
      y0: -1e9,
      y1: -1e9,
      list: [],
      visible: [],
    };
    let frameNo = 0;
    const pieces = createChunkCache<Piece>(
      MAX_CHUNKS,
      (cx, cy) => {
        const cv = document.createElement('canvas');
        cv.width = CHUNK;
        cv.height = CHUNK;
        const piece = { key: cy * 1000 + cx, cv };
        livePieces.add(piece);
        return piece;
      },
      (p) => {
        baked.delete(p.key);
        livePieces.delete(p);
        p.cv.width = 0;
        p.cv.height = 0;
      }
    );
    const clampCam = (v: number, view: number, world: number) =>
      world <= view ? world / 2 : Math.max(view / 2, Math.min(world - view / 2, v));

    // Resize listener
    const handleResize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // Input listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const code = e.code;
      if (!heldKeys.has(code)) {
        justPressedKeys.add(code);
      }
      heldKeys.add(code);

      // Weapon hotkeys 1 - 4
      if (code === 'Digit1') stateRef.current.callbacks.onSelectWeapon('knuckles');
      if (code === 'Digit2') stateRef.current.callbacks.onSelectWeapon('revolver');
      if (code === 'Digit3') stateRef.current.callbacks.onSelectWeapon('shotgun');
      if (code === 'Digit4') stateRef.current.callbacks.onSelectWeapon('tommy');
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      heldKeys.delete(e.code);
    };

    const handleBlur = () => {
      heldKeys.clear();
      justPressedKeys.clear();
      mouse.isDown = false;
      clearSticks(sticks);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.screenX = e.clientX;
      mouse.screenY = e.clientY;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        mouse.isDown = true;
        mouse.justClicked = true;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        mouse.isDown = false;
      }
    };

    // Touch listeners: preventDefault on every canvas touch event so no
    // synthesized mouse events, scroll, zoom or long-press menu follow.
    const canStartSticks = () => !stateRef.current.isPaused && !stateRef.current.isTitleScreen;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (!canStartSticks()) return;
      const rect = canvas.getBoundingClientRect();
      for (const t of Array.from(e.changedTouches)) {
        if (t.target !== canvas) continue;
        touchStart(sticks, t.identifier, t.clientX - rect.left, t.clientY - rect.top, rect.width);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      for (const t of Array.from(e.changedTouches)) {
        touchMove(sticks, t.identifier, t.clientX - rect.left, t.clientY - rect.top);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      for (const t of Array.from(e.changedTouches)) {
        touchEnd(sticks, t.identifier);
      }
    };

    const handleTouchCancel = (e: TouchEvent) => {
      e.preventDefault();
      clearSticks(sticks);
    };

    const touchOpts: AddEventListenerOptions = { passive: false };
    canvas.addEventListener('touchstart', handleTouchStart, touchOpts);
    canvas.addEventListener('touchmove', handleTouchMove, touchOpts);
    canvas.addEventListener('touchend', handleTouchEnd, touchOpts);
    canvas.addEventListener('touchcancel', handleTouchCancel, touchOpts);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    let lastInteractionLabel = '';

    // Perform player attack
    const triggerPlayerAttack = () => {
      const st = stateRef.current;
      const weapon = WEAPON_ARSENAL.find((w) => w.id === st.equippedWeapon) || WEAPON_ARSENAL[0];
      const cooldownSec = (weapon.cooldownMs / 1000) / st.fireRateMultiplier;
      if (player.attackCooldown > 0) return;

      player.attackCooldown = cooldownSec;
      player.squash = 1.24;

      if (weapon.id === 'knuckles') {
        soundEngine.playMeleeHit(true);
        camera.shake = Math.max(camera.shake, 4.5);
        const reachX = player.x + Math.cos(player.angle) * 44;
        const reachY = player.y + Math.sin(player.angle) * 44;
        spawnParticles(reachX, reachY, '#F59E0B', 7, 110);

        // Hit any NPC within melee arc; one swing is one attack however many it catches
        const attackId = beginAttack();
        for (let i = npcs.length - 1; i >= 0; i--) {
          const npc = npcs[i];
          if (npc.role === 'ally' || npc.hp <= 0) continue;
          const dist = Math.hypot(npc.x - reachX, npc.y - reachY);
          if (dist <= weapon.range) {
            const dmg = Math.round(weapon.damage * st.damageMultiplier * (0.9 + Math.random() * 0.25));
            npc.hp -= dmg;
            npc.hitFlashTimer = 0.14;
            npc.squash = 1.3;
            npc.vx += Math.cos(player.angle) * 190;
            npc.vy += Math.sin(player.angle) * 190;
            hitstopTimer = 0.045; // 45ms heavy hitstop
            pulse('heavyHit');
            spawnParticles(npc.x, npc.y, '#DC2626', 10, 150);
            addFloatingText(npc.x, npc.y, `-${dmg}`, '#F87171');
            noteHit(attackId, npc);
            reactToHit(npc, 0.35);
          }
        }
      } else {
        // Firearm attack
        soundEngine.playGunshot(weapon.id);
        camera.shake = Math.max(camera.shake, weapon.id === 'shotgun' ? 9 : 4.5);

        const muzzleX = player.x + Math.cos(player.angle) * 22;
        const muzzleY = player.y + Math.sin(player.angle) * 22;
        spawnParticles(muzzleX, muzzleY, '#FBBF24', 5, 90, true);

        // Every pellet of one trigger pull belongs to one attack
        const attackId = beginAttack();
        for (let p = 0; p < weapon.pellets; p++) {
          const spread = (Math.random() - 0.5) * weapon.spreadAngle;
          const shotAngle = player.angle + spread;
          const speed = weapon.id === 'shotgun' ? 680 : 820;
          bullets.push({
            x: muzzleX,
            y: muzzleY,
            vx: Math.cos(shotAngle) * speed,
            vy: Math.sin(shotAngle) * speed,
            damage: Math.round(weapon.damage * st.damageMultiplier),
            fromPlayer: true,
            life: weapon.range / speed,
            color: '#FDE047',
            attackId,
          });
        }
        st.callbacks.onEarnResources(0, 0, 0, weapon.heatPerShot);
      }
    };

    // ---- Figures: each look is baked once, lazily, into a small canvas; at most MAX_FIGURES are kept.
    interface Figure {
      img: HTMLCanvasElement | null;
      white: HTMLCanvasElement | null;
      red: HTMLCanvasElement | null;
      retryAt: number;
      used: number;
    }
    const figures = new Map<string, Figure>();
    const makeFigureCanvas = (w: number, h: number): CanvasLike | null => {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      return c as unknown as CanvasLike;
    };
    const freeCanvas = (c: HTMLCanvasElement | null) => {
      if (c) {
        c.width = 0;
        c.height = 0;
      }
    };
    const figureFor = (look: FigureLook): Figure => {
      let f = figures.get(look.key);
      if (!f) {
        if (figures.size >= MAX_FIGURES) {
          // Evict the look drawn longest ago.
          let oldKey = '';
          let old: Figure | null = null;
          for (const [k, v] of figures) {
            if (!old || v.used < old.used) {
              old = v;
              oldKey = k;
            }
          }
          if (old) {
            freeCanvas(old.img);
            freeCanvas(old.white);
            freeCanvas(old.red);
            figures.delete(oldKey);
          }
        }
        f = { img: null, white: null, red: null, retryAt: 0, used: frameNo };
        figures.set(look.key, f);
      }
      f.used = frameNo;
      if (!f.img && frameNo >= f.retryAt) {
        let img: CanvasLike | null = null;
        try {
          img = bakeCharacter(look.traits, look.accent, makeFigureCanvas, FIG_SCALE);
        } catch {
          img = null;
        }
        f.img = img as unknown as HTMLCanvasElement | null;
        if (!f.img) f.retryAt = frameNo + FIGURE_RETRY_FRAMES;
      }
      return f;
    };
    // Hit flash: a white (NPC) or red (player) silhouette of the baked figure, made on the first hit.
    const tintOf = (f: Figure, red: boolean): HTMLCanvasElement | null => {
      const have = red ? f.red : f.white;
      if (have || !f.img) return have;
      try {
        const c = document.createElement('canvas');
        c.width = f.img.width;
        c.height = f.img.height;
        const tctx = c.getContext('2d');
        if (!tctx) return null;
        tctx.drawImage(f.img, 0, 0);
        tctx.globalCompositeOperation = 'source-atop';
        tctx.fillStyle = red ? '#EF4444' : '#FFFFFF';
        tctx.fillRect(0, 0, c.width, c.height);
        if (red) f.red = c;
        else f.white = c;
        return c;
      } catch {
        return null;
      }
    };
    // Feet at (x, y); mirrored to face left when facing < 0; squash and stretch about the feet.
    const drawFigure = (look: FigureLook, x: number, y: number, facing: number, squash: number, flash: 0 | 1 | 2) => {
      const f = figureFor(look);
      const sq = Math.abs(squash - 1) < 0.01 ? 1 : squash;
      ctx.save();
      ctx.translate(Math.round(x), Math.round(y));
      if (facing < 0 || sq !== 1) ctx.scale(facing < 0 ? -sq : sq, 2 - sq);
      if (f.img) {
        ctx.drawImage(f.img, -FIG_FOOT_X, -FIG_FOOT_Y);
        if (flash) {
          const t = tintOf(f, flash === 2);
          if (t) {
            ctx.globalAlpha = 0.85;
            ctx.drawImage(t, -FIG_FOOT_X, -FIG_FOOT_Y);
          }
        }
      } else {
        // The bake failed: draw this frame directly (the bake is retried later).
        ctx.translate(-FIGURE_FOOT.x * FIG_SCALE, -FIGURE_FOOT.y * FIG_SCALE);
        ctx.scale(FIG_SCALE, FIG_SCALE);
        try {
          drawCharacter(ctx as unknown as Ctx2D, look.traits, look.accent);
        } catch {
          // never block the frame
        }
      }
      ctx.restore();
    };
    // The held weapon, from the near hand along the aim; flipped when aiming left so it stays upright.
    const drawWeapon = (gx: number, gy: number, angle: number, kind: number) => {
      if (kind === WEAPON_NONE) return;
      ctx.save();
      ctx.translate(gx, gy);
      ctx.rotate(angle);
      if (Math.cos(angle) < 0) ctx.scale(1, -1);
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#08090C';
      if (kind === WEAPON_KNUCKLES) {
        ctx.fillStyle = '#E5C07B';
        ctx.fillRect(-0.5, -3, 4.5, 6);
        ctx.strokeRect(-0.5, -3, 4.5, 6);
      } else {
        const len = kind === WEAPON_PISTOL ? 9 : kind === WEAPON_TOMMY ? 13 : 16;
        if (kind !== WEAPON_PISTOL) {
          ctx.fillStyle = '#7C4A21';
          ctx.fillRect(-6, -1.5, 6, 3.5);
          ctx.strokeRect(-6, -1.5, 6, 3.5);
        }
        ctx.fillStyle = '#A1A1AA';
        ctx.fillRect(0, -1.8, len, 3.2);
        ctx.strokeRect(0, -1.8, len, 3.2);
        ctx.fillStyle = '#3F3F46';
        ctx.fillRect(0.5, 1.4, 2.6, 3.4);
        if (kind === WEAPON_TOMMY) {
          ctx.beginPath();
          ctx.arc(5.5, 3.4, 2.7, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      }
      ctx.restore();
    };
    const facingOf = (npc: WorldNpc): number => {
      // Toward movement while walking, toward the aim when engaged or standing.
      let f = npc.facing ?? 1;
      const c = Math.cos(npc.angle);
      if (npc.state === 'patrol' && Math.abs(npc.vx) > 4) f = npc.vx > 0 ? 1 : -1;
      else if (Math.abs(c) > 0.2) f = c > 0 ? 1 : -1;
      npc.facing = f;
      return f;
    };
    const drawNpcFigure = (npc: WorldNpc) => {
      const facing = facingOf(npc);
      const sq = npc.squash;
      const kind = npcWeapon(npc.role);
      const gx = npc.x + facing * GRIP_DX * sq;
      const gy = npc.y + GRIP_DY * (2 - sq);
      const behind = Math.sin(npc.angle) < -0.5;
      if (behind) drawWeapon(gx, gy, npc.angle, kind);
      drawFigure(npc.look, npc.x, npc.y, facing, sq, npc.hitFlashTimer > 0 ? 1 : 0);
      if (!behind) drawWeapon(gx, gy, npc.angle, kind);
    };

    // ---- The player: a figure in the chosen family's look, with a gold ring underfoot.
    const playerLook: { fam: FamilyId | null; look: FigureLook | null } = { fam: null, look: null };
    const playerLookFor = (fam: FamilyId): FigureLook => {
      if (playerLook.fam !== fam || !playerLook.look) {
        playerLook.fam = fam;
        playerLook.look = lookOf(genericTraits('player', PLAYER_LOOK_SEED, fam), FAMILY_ACCENT[fam]);
      }
      return playerLook.look;
    };
    let playerFacing = 1;
    const drawPlayerRing = () => {
      const px = Math.round(player.x);
      const py = Math.round(player.y) + 1;
      ctx.save();
      ctx.fillStyle = 'rgba(250, 204, 21, 0.16)';
      ctx.strokeStyle = '#FACC15';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(px, py, 17, 6.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Aim notch on the ring (keyboard/mouse and touch aim alike)
      ctx.translate(px, py);
      ctx.scale(1, 6.5 / 17);
      const a = player.angle;
      ctx.fillStyle = '#FACC15';
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 25, Math.sin(a) * 25);
      ctx.lineTo(Math.cos(a - 0.3) * 18, Math.sin(a - 0.3) * 18);
      ctx.lineTo(Math.cos(a + 0.3) * 18, Math.sin(a + 0.3) * 18);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };
    const drawPlayerFigure = (fam: FamilyId, weapon: WeaponId) => {
      const c = Math.cos(player.angle);
      if (Math.abs(c) > 0.2) playerFacing = c > 0 ? 1 : -1;
      const sq = player.squash;
      const gx = player.x + playerFacing * GRIP_DX * sq;
      const gy = player.y + GRIP_DY * (2 - sq);
      const kind = playerWeapon(weapon);
      const behind = Math.sin(player.angle) < -0.5;
      if (behind) drawWeapon(gx, gy, player.angle, kind);
      drawFigure(playerLookFor(fam), player.x, player.y, playerFacing, sq, player.hitFlash > 0 ? 2 : 0);
      if (!behind) drawWeapon(gx, gy, player.angle, kind);
    };

    // ---- Draw list and name tags: arrays reused every frame.
    const drawList: WorldNpc[] = [];
    const tagPool: TagRequest[] = [];
    const tagReqs: TagRequest[] = [];
    const tagNpcs: WorldNpc[] = [];
    const tagBars: boolean[] = [];
    const pushTag = (npc: WorldNpc, priority: number, bar: boolean) => {
      const i = tagReqs.length;
      let r = tagPool[i];
      if (!r) {
        r = { id: '', x: 0, y: 0, w: 0, h: 0, priority: 0 };
        tagPool[i] = r;
      }
      if (npc.tagW === undefined) {
        ctx.font = TAG_NAME_FONT;
        const nameW = ctx.measureText(npc.name).width;
        ctx.font = TAG_FAMILY_FONT;
        const famW = ctx.measureText(npc.tagFamily).width;
        npc.tagW = Math.ceil(Math.max(nameW, famW, 40)) + 12;
      }
      const h = bar ? TAG_H_BAR : TAG_H;
      r.id = npc.id;
      r.w = npc.tagW;
      r.h = h;
      r.x = Math.round(npc.x - npc.tagW / 2);
      r.y = Math.round(npc.y - FIG_TOP - h - 3);
      r.priority = priority;
      tagReqs.push(r);
      tagNpcs[i] = npc;
      tagBars[i] = bar;
    };
    // Tags for engaged, damaged, Capo and courier NPCs, plus the nearest other named NPC within 160 px.
    // Unnamed people (generic citizens, officers and allies) get a tag only while engaged.
    const buildTags = (titleScreen: boolean) => {
      tagReqs.length = 0;
      tagNpcs.length = 0;
      tagBars.length = 0;
      let nearest: WorldNpc | null = null;
      let nearestD = NEAREST_TAG_RANGE;
      for (let k = 0; k < drawList.length; k++) {
        const n = drawList[k];
        const engaged = n.state !== 'patrol';
        const quiet = n.castId === undefined && (n.role === 'citizen' || n.role === 'ally' || n.role === 'nypd');
        const d = Math.hypot(n.x - player.x, n.y - player.y);
        let pri = 0;
        if (n.role === 'capo') pri = 5;
        else if (engaged) pri = 4;
        else if (!quiet && n.hp < n.maxHp) pri = 3;
        else if (n.role === 'courier') pri = 2;
        if (pri > 0) {
          // Within a class, nearer NPCs are placed first.
          pushTag(n, pri + 0.5 * (1 - Math.min(d, 1000) / 1000), true);
        } else if (!quiet && !titleScreen && d < nearestD) {
          nearestD = d;
          nearest = n;
        }
      }
      if (nearest) pushTag(nearest, 1, nearest.hp < nearest.maxHp);
    };
    const drawTags = () => {
      if (tagReqs.length === 0) return;
      const placed = layoutTags(tagReqs, TAG_MAX);
      if (placed.length === 0) return;
      ctx.save();
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      for (let p = 0; p < placed.length; p++) {
        const pt = placed[p];
        let idx = 0;
        while (idx < tagReqs.length && tagReqs[idx].id !== pt.id) idx++;
        if (idx >= tagReqs.length) continue;
        const r = tagReqs[idx];
        const n = tagNpcs[idx];
        const x = pt.x;
        const y = pt.y;
        if (y < r.y) {
          // Lifted clear of another tag: a thin leader line down to the head.
          const lx = Math.round(n.x) + 0.5;
          ctx.strokeStyle = 'rgba(228, 228, 231, 0.5)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(lx, y + r.h);
          ctx.lineTo(lx, r.y + r.h + 2);
          ctx.stroke();
        }
        ctx.fillStyle = 'rgba(9, 9, 11, 0.85)';
        ctx.fillRect(x, y, r.w, r.h);
        ctx.fillStyle = n.tagColor;
        ctx.fillRect(x, y, 2, r.h);
        ctx.font = TAG_NAME_FONT;
        ctx.fillStyle = '#F4F4F5';
        ctx.fillText(n.name, x + 6, y + 4);
        ctx.font = TAG_FAMILY_FONT;
        ctx.fillStyle = n.tagColor;
        ctx.fillText(n.tagFamily, x + 6, y + 17);
        if (tagBars[idx]) {
          const bw = r.w - 12;
          const pct = Math.max(0, Math.min(1, n.hp / n.maxHp));
          ctx.fillStyle = 'rgba(63, 63, 70, 0.95)';
          ctx.fillRect(x + 6, y + r.h - 7, bw, 3);
          ctx.fillStyle = n.role === 'ally' ? '#10B981' : n.role === 'courier' ? '#F59E0B' : n.tagColor;
          ctx.fillRect(x + 6, y + r.h - 7, bw * pct, 3);
        }
      }
      ctx.restore();
    };

    let animId = 0;
    let lastTime = performance.now();

    const loop = (now: number) => {
      animId = requestAnimationFrame(loop);
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      // Clamped delta time per 60fps simulation guideline
      const dt = Math.min(rawDt, 0.05);
      if (tourHook && rawDt > 0 && rawDt < 1) {
        frameSamples.push(rawDt * 1000);
        if (frameSamples.length > 60) frameSamples.shift();
      }
      const st = stateRef.current;
      refreshContracts();
      // The ferry timer and its teleport wait while paused or on the title screen.
      if (ferry.active && !st.isPaused && !st.isTitleScreen) {
        ferry.t += dt;
        if (!ferry.moved && ferry.t >= 0.25) {
          ferry.moved = true;
          teleportPlayer(ferry.dest.x, ferry.dest.y);
          addFloatingText(player.x, player.y - 24, ferry.label, '#38BDF8');
        }
        if (ferry.t >= 0.5) ferry.active = false;
      }

      const touchActive = isTouchMode();
      if (st.isPaused || st.isTitleScreen) clearSticks(sticks);

      // Hitstop simulation pause for weighty impacts
      if (hitstopTimer > 0) {
        hitstopTimer -= dt;
      } else if (!st.isPaused) {
        if (st.isTitleScreen) {
          // Live atmospheric camera pan across 1984 NYC on the Title Screen
          camera.panAngle += dt * 0.18;
          camera.x = 2900 + Math.cos(camera.panAngle) * 1200;
          camera.y = 2500 + Math.sin(camera.panAngle * 0.7) * 800;
        } else {
          // Player movement
          let moveX = 0;
          let moveY = 0;
          let isSprinting = false;
          if (touchActive) {
            // Analog stick: magnitude 0..1 from deflection beyond the dead zone (not normalized)
            const stickMove = getMove(sticks);
            moveX = stickMove.x;
            moveY = stickMove.y;
            if (moveX !== 0 || moveY !== 0) player.walkCycle += dt * 12;
            isSprinting = stickMove.sprint;
          } else {
            if (heldKeys.has('KeyW') || heldKeys.has('ArrowUp')) moveY -= 1;
            if (heldKeys.has('KeyS') || heldKeys.has('ArrowDown')) moveY += 1;
            if (heldKeys.has('KeyA') || heldKeys.has('ArrowLeft')) moveX -= 1;
            if (heldKeys.has('KeyD') || heldKeys.has('ArrowRight')) moveX += 1;

            if (moveX !== 0 || moveY !== 0) {
              const len = Math.hypot(moveX, moveY);
              moveX /= len;
              moveY /= len;
              player.walkCycle += dt * 12;
            }

            isSprinting = heldKeys.has('ShiftLeft') || heldKeys.has('ShiftRight');
          }
          const baseSpeed = (isSprinting ? 295 : 220) * st.speedMultiplier;
          player.vx = moveX * baseSpeed;
          player.vy = moveY * baseSpeed;

          const moved = moveWithCollision(city, player.x, player.y, player.vx * dt, player.vy * dt, player.radius);
          player.x = Math.max(20, Math.min(WORLD_WIDTH - 20, moved.x));
          player.y = Math.max(20, Math.min(WORLD_HEIGHT - 20, moved.y));

          // Update mouse world position and player facing angle
          mouse.worldX = camera.x - canvas.width / 2 + mouse.screenX;
          mouse.worldY = camera.y - canvas.height / 2 + mouse.screenY;
          const aim = getAim(sticks);
          if (touchActive) {
            // Aim stick sets facing; the last facing is kept after release
            if (aim.angle !== null) player.angle = aim.angle;
          } else {
            player.angle = Math.atan2(mouse.worldY - player.y, mouse.worldX - player.x);
          }

          if (player.attackCooldown > 0) player.attackCooldown -= dt;
          if (player.hitFlash > 0) player.hitFlash -= dt;
          player.squash += (1 - player.squash) * Math.min(1, dt * 14);

          // Attack via Space or Left Mouse; in touch mode via the aim stick (mouse ignored)
          if (touchActive) {
            if (aim.attack) triggerPlayerAttack();
          } else if (heldKeys.has('Space') || mouse.isDown || mouse.justClicked) {
            triggerPlayerAttack();
          }

          // Detect current borough by outline; Uptown and Staten Island never fire the callback
          const areaHere = areaAtPoint(city, player.x, player.y);
          if (areaHere && areaHere !== 'uptown' && areaHere !== 'staten_island' && player.currentBorough !== areaHere) {
            const b = NYC_BOROUGHS.find((z) => z.id === areaHere);
            if (b) {
              player.currentBorough = b.id;
              home.borough = b.id as GameBoroughId;
              st.callbacks.onBoroughChanged(b.id);
              const famVisual = FAMILY_COAT_COLORS[b.controllingFamilyDefault];
              if (famVisual) {
                addFloatingText(
                  player.x,
                  player.y - 36,
                  `${famVisual.symbol} ${famVisual.shortFamily} TURF · NPC TRAIT: ${famVisual.traitTag}`,
                  famVisual.accent
                );
              }
            }
          }

          // Auto-collect uncollected Racket cash envelopes when walking near owned rackets
          for (const r of st.rackets) {
            if (r.ownerFamily === 'player' && r.uncollectedCash >= 50) {
              const cx = r.x + r.width / 2;
              const cy = r.y + r.height + 18;
              if (Math.hypot(player.x - cx, player.y - cy) < 68) {
                const amount = Math.round(r.uncollectedCash);
                st.callbacks.onCollectRacketEnvelope(r.id);
                soundEngine.playCashCollect();
                addFloatingText(cx, cy - 10, `+$${amount.toLocaleString()} TRIBUTE`, '#10B981');
                spawnParticles(cx, cy, '#10B981', 12, 100);
              }
            }
          }

          // Check nearest interactable (Racket door, Social Contact, or Courier shakedown)
          let nearestPrompt: InteractPrompt | null = null;
          let minDist = 115;

          for (const c of st.contacts) {
            const d = Math.hypot(player.x - c.worldX, player.y - c.worldY);
            if (d < minDist) {
              minDist = d;
              nearestPrompt = {
                type: 'contact',
                label: `[E] Sit-Down with ${c.name}`,
                sublabel: `${c.title} · Respect ${c.respect}/100`,
                id: c.id,
              };
            }
          }

          for (const r of st.rackets) {
            const door = doorOf(r);
            const d = Math.hypot(player.x - door.x, player.y - door.y);
            if (d < minDist) {
              minDist = d;
              nearestPrompt = {
                type: 'racket',
                label: r.ownerFamily === 'player' ? `[E] Manage ${r.name} (Lv.${r.level})` : `[E] Extort / Seize ${r.name}`,
                sublabel:
                  r.ownerFamily === 'player'
                    ? `Generating $${r.baseIncomePerHour.toLocaleString()}/hr`
                    : `Held by ${r.ownerFamily.toUpperCase()} · Takeover $${r.takeoverCostCash.toLocaleString()}`,
                id: r.id,
              };
            }
          }

          const term = nearestTerminal();
          if (!ferry.active && term.d < FERRY_PROMPT_RANGE && term.d < minDist) {
            const toStaten = term.id === 'battery';
            nearestPrompt = {
              type: 'ferry',
              label: toStaten ? '[E] Take the ferry to Staten Island' : '[E] Take the ferry to Manhattan',
              sublabel: toStaten ? 'Staten Island Ferry · Battery terminal' : 'Staten Island Ferry · St. George terminal',
              id: term.id,
            };
          }

          // A sit-down spot during its window wins over everything within SITDOWN_RANGE.
          const sit = openSitDownNear();
          if (sit) {
            const risk = betrayalRisk(fc.s, sit.family, {
              respectXp: st.contracts?.respectXp ?? 0,
              ceasefire: st.contracts?.ceasefire ?? false,
            });
            const terms = `$${sit.price.toLocaleString('en-US')} · ${Math.round(risk * 100)}% risk`;
            // The sublabel is the short price-and-risk line the HUD keeps whole on the phone (PATCH-001).
            nearestPrompt = isAlone()
              ? { type: 'sitdown', label: `[E] Sit down with the ${familyName(sit.family)} family`, sublabel: terms, id: sit.family }
              : { type: 'sitdown', label: '[E] Send your crew home', sublabel: terms, id: sit.family };
          }

          const promptKey = nearestPrompt
            ? `${nearestPrompt.type}:${nearestPrompt.id}:${nearestPrompt.label}:${nearestPrompt.sublabel}`
            : '';
          if (promptKey !== lastInteractionLabel) {
            lastInteractionLabel = promptKey;
            st.callbacks.onNearInteractableChange(nearestPrompt);
          }

          if (justPressedKeys.has('KeyE') && nearestPrompt) {
            soundEngine.playUiClick();
            if (nearestPrompt.type === 'contact') {
              st.callbacks.onOpenContactSitDown(nearestPrompt.id);
            } else if (nearestPrompt.type === 'racket') {
              st.callbacks.onOpenRacketModal(nearestPrompt.id);
            } else if (nearestPrompt.type === 'ferry') {
              takeFerry();
            } else if (nearestPrompt.type === 'sitdown') {
              chooseSitDown();
            }
          }

          // Smooth camera follow with decaying directional shake
          camera.x += (player.x - camera.x) * Math.min(1, dt * 8.5);
          camera.y += (player.y - camera.y) * Math.min(1, dt * 8.5);
          if (camera.shake > 0) {
            camera.shake = Math.max(0, camera.shake - dt * 28);
          }
        }
        camera.x = clampCam(camera.x, canvas.width, WORLD_WIDTH);
        camera.y = clampCam(camera.y, canvas.height, WORLD_HEIGHT);

        // Ensure Allied Bodyguards exist if unlocked
        if (st.hasAlliedBodyguards) {
          const allyCount = npcs.filter((n) => n.role === 'ally').length;
          if (allyCount < 2) {
            const skillSpot = snap(player.x + (allyCount === 0 ? -38 : 38), player.y + 32);
            npcs.push({
              id: `ally_skill_${Date.now()}_${allyCount}`,
              ...allyDress('Made Bodyguard'),
              role: 'ally',
              allyKind: 'bodyguard',
              familyId: 'player',
              x: skillSpot.x,
              y: skillSpot.y,
              vx: 0,
              vy: 0,
              hp: 250,
              maxHp: 250,
              angle: 0,
              state: 'patrol',
              stateTimer: 1,
              patrolOriginX: player.x,
              patrolOriginY: player.y,
              hitFlashTimer: 0,
              squash: 1,
              cashDrop: 0,
              contrabandDrop: 0,
            });
          }
        }

        // Spawn NYPD Squad while heat is at or above the NYPD line
        if (fc.heat >= NYPD_HEAT_LINE && npcs.filter((n) => n.role === 'nypd').length < 3 && Math.random() < dt * 0.35) {
          const spawnAngle = Math.random() * Math.PI * 2;
          const nypdSpot = snap(player.x + Math.cos(spawnAngle) * 420, player.y + Math.sin(spawnAngle) * 420);
          npcs.push({
            id: `nypd_${Date.now()}`,
            ...officerDress(),
            role: 'nypd',
            familyId: 'nypd',
            x: nypdSpot.x,
            y: nypdSpot.y,
            vx: 0,
            vy: 0,
            hp: 150,
            maxHp: 150,
            angle: 0,
            state: 'patrol',
            stateTimer: 0.4,
            patrolOriginX: player.x,
            patrolOriginY: player.y,
            hitFlashTimer: 0,
            squash: 1,
            cashDrop: 800,
            contrabandDrop: 2,
          });
        }

        // Update bullets
        for (let i = bullets.length - 1; i >= 0; i--) {
          const b = bullets[i];
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          b.life -= dt;
          if (b.life <= 0 || blocksBullet(city, b.x, b.y) || blocksBullet(city, b.x - b.vx * dt * 0.5, b.y - b.vy * dt * 0.5)) {
            bullets.splice(i, 1);
            continue;
          }

          if (b.fromPlayer) {
            for (let j = npcs.length - 1; j >= 0; j--) {
              const npc = npcs[j];
              if (npc.role === 'ally' || npc.hp <= 0) continue;
              if (Math.hypot(b.x - npc.x, b.y - npc.y) < 18) {
                npc.hp -= b.damage;
                npc.hitFlashTimer = 0.12;
                npc.squash = 1.25;
                npc.vx += (b.vx / 800) * 95;
                npc.vy += (b.vy / 800) * 95;
                spawnParticles(npc.x, npc.y, '#DC2626', 7, 130);
                addFloatingText(npc.x, npc.y, `-${b.damage}`, '#FCA5A5');
                noteHit(b.attackId, npc);
                reactToHit(npc, 0.4);
                bullets.splice(i, 1);
                break;
              }
            }
          } else if (!st.isTitleScreen) {
            if (Math.hypot(b.x - player.x, b.y - player.y) < 16) {
              player.hitFlash = 0.18;
              camera.shake = Math.max(camera.shake, 6);
              spawnParticles(player.x, player.y, '#EF4444', 8, 120);
              st.callbacks.onPlayerDamaged(b.damage, 'Rival Gunman');
              bullets.splice(i, 1);
            }
          }
        }

        // Update NPCs & handle death / drops
        flowAge += dt;
        for (let i = npcs.length - 1; i >= 0; i--) {
          const npc = npcs[i];
          if (npc.hitFlashTimer > 0) npc.hitFlashTimer -= dt;
          npc.squash += (1 - npc.squash) * Math.min(1, dt * 12);

          if (npc.hp <= 0) {
            // NPC eliminated! The kill is credited to the attack that last hit it.
            noteKill(npc);
            hitstopTimer = npc.role === 'capo' ? 0.075 : 0.035;
            // Turf Capo takedowns get the longer capo pulse from App instead.
            if (!(npc.role === 'capo' && npc.racketGuardId)) pulse('heavyHit');
            camera.shake = Math.max(camera.shake, npc.role === 'capo' ? 11 : 5);
            soundEngine.playCashCollect();
            spawnParticles(npc.x, npc.y, '#DC2626', 16, 170);
            spawnParticles(npc.x, npc.y, '#10B981', 8, 110);

            if (npc.cashDrop > 0 || npc.contrabandDrop > 0) {
              addFloatingText(
                npc.x,
                npc.y - 12,
                `+$${npc.cashDrop.toLocaleString()} · +${npc.contrabandDrop} CRATES`,
                '#10B981'
              );
              st.callbacks.onEarnResources(
                npc.cashDrop,
                npc.contrabandDrop,
                npc.role === 'capo' ? 35 : 12,
                npc.role === 'nypd' ? 12 : 4,
                `Eliminated ${npc.name}`
              );
            }

            if (npc.role === 'capo' && npc.racketGuardId) {
              soundEngine.playTurfCaptured();
              st.callbacks.onTurfCapoDefeated(npc.racketGuardId);
            }

            const guardId = npc.racketGuardId;
            npcs.splice(i, 1);

            // Respawn regular street NPCs elsewhere in their borough so NYC stays alive
            if (!guardId && npc.homeArea) {
              // Uptown and Staten Island keep their six civilians: the replacement appears in the same area.
              npcs.push(makeCivilian(npc.homeArea));
            } else if (!guardId && !npc.squadFamily && npc.role !== 'ally' && npc.role !== 'nypd') {
              const b = NYC_BOROUGHS[Math.floor(Math.random() * NYC_BOROUGHS.length)];
              const respawnSpot = randomWalkableIn(city, b.id as GameBoroughId, Math.random);
              // The replacement is dressed before the dead member is released, so it is never the same person.
              const fam = b.controllingFamilyDefault;
              const dress =
                npc.role === 'citizen'
                  ? citizenDress('1984 Garment Merchant')
                  : npc.role === 'courier'
                  ? courierDress(fam, `${b.name.split(' ')[0]} Contraband Runner`)
                  : familyDress(fam, `${familyName(fam)} ${npc.role === 'brawler' ? 'Enforcer' : 'Soldato'}`, isStreetRankCast);
              npcs.push({
                id: `npc_respawn_${Date.now()}_${Math.random()}`,
                ...dress,
                role: npc.role,
                familyId: npc.role === 'citizen' ? 'civilian' : b.controllingFamilyDefault,
                x: respawnSpot.x,
                y: respawnSpot.y,
                vx: 0,
                vy: 0,
                hp: npc.maxHp,
                maxHp: npc.maxHp,
                angle: 0,
                state: 'patrol',
                stateTimer: 2,
                patrolOriginX: respawnSpot.x,
                patrolOriginY: respawnSpot.y,
                hitFlashTimer: 0,
                squash: 1,
                cashDrop: npc.cashDrop,
                contrabandDrop: npc.contrabandDrop,
              });
            }
            releaseCast(npc);
            continue;
          }

          // Allied Bodyguard AI
          if (npc.role === 'ally') {
            const targetFollowX = player.x + (i % 2 === 0 ? -42 : 42);
            const targetFollowY = player.y + 36;
            const distToPlayer = Math.hypot(targetFollowX - npc.x, targetFollowY - npc.y);
            const fromPlayer = Math.hypot(player.x - npc.x, player.y - npc.y);
            // Enforcer bodyguards hold back during any open sit-down window (they never block it).
            const holdBack = npc.allyKind === 'bodyguard' && fc.anyOpen && !st.isTitleScreen;
            let allyMoved = false;
            if (holdBack) {
              npc.holdT = (npc.holdT ?? 0) + dt;
              if (fromPlayer < HOLD_BACK_PX) {
                const away = fromPlayer > 1 ? Math.atan2(npc.y - player.y, npc.x - player.x) : (i % 2 === 0 ? Math.PI : 0);
                if (npc.holdT > HOLD_BACK_SNAP_S) {
                  // Could not walk clear: step out of the way at once, trying the away side first, then around.
                  for (let k = 0; k < 8; k++) {
                    const a = away + (k % 2 === 0 ? 1 : -1) * Math.ceil(k / 2) * (Math.PI / 4);
                    const r = HOLD_BACK_PX + 80;
                    const out = nearestWalkable(city, player.x + Math.cos(a) * r, player.y + Math.sin(a) * r, 4);
                    if (out && Math.hypot(out.x - player.x, out.y - player.y) >= HOLD_BACK_PX) {
                      npc.x = out.x;
                      npc.y = out.y;
                      break;
                    }
                  }
                  npc.holdT = 0;
                } else if (!followDetour(npc, dt, 200)) {
                  walkToward(npc, npc.x + Math.cos(away) * 80, npc.y + Math.sin(away) * 80, 200, dt, false);
                }
                trackStuck(npc, dt, true);
                allyMoved = true;
              } else {
                npc.holdT = 0;
                npc.vx = 0;
                npc.vy = 0;
                trackStuck(npc, dt, false);
              }
            } else if (distToPlayer > 24) {
              npc.holdT = 0;
              // Follow along the shared flow field; fall back to a straight line, or an unstuck detour.
              if (!followDetour(npc, dt, 200)) walkToward(npc, targetFollowX, targetFollowY, 200, dt, true);
              trackStuck(npc, dt, true);
              allyMoved = true;
            } else {
              npc.vx *= 0.8;
              npc.vy *= 0.8;
              trackStuck(npc, dt, false);
            }
            if (!holdBack && fromPlayer > 900) {
              const back = snap(player.x + (i % 2 === 0 ? -42 : 42), player.y + 36);
              npc.x = back.x;
              npc.y = back.y;
            }
            if (!allyMoved) stepBody(npc, npc.vx * dt, npc.vy * dt);

            // Shoot nearest hostile NPC
            npc.stateTimer -= dt;
            if (npc.stateTimer <= 0) {
              // Allies only shoot people who are hostile to the player.
              const target = st.isTitleScreen
                ? undefined
                : npcs.find((other) => other.hp > 0 && Math.hypot(other.x - npc.x, other.y - npc.y) < 320 && hostile(other));
              if (target) {
                npc.stateTimer = 0.55;
                const aim = Math.atan2(target.y - npc.y, target.x - npc.x);
                npc.angle = aim;
                bullets.push({
                  x: npc.x + Math.cos(aim) * 16,
                  y: npc.y + Math.sin(aim) * 16,
                  vx: Math.cos(aim) * 720,
                  vy: Math.sin(aim) * 720,
                  damage: 26,
                  fromPlayer: true,
                  life: 0.45,
                  color: '#34D399',
                  attackId: beginAttack(),
                });
              } else {
                npc.stateTimer = 0.25;
              }
            }
            continue;
          }

          // Hostile / Neutral NPC AI. Hostility comes only from isHostile and is checked again at every step:
          // anyone who stops being hostile (a paid contract, an open sit-down window, heat below the line)
          // goes straight back to patrol, even mid-windup.
          const distToPlayer = Math.hypot(player.x - npc.x, player.y - npc.y);
          const isHostileNow = !st.isTitleScreen && hostile(npc);
          const melee = isMeleeRole(npc.role);

          npc.stateTimer -= dt;

          if (npc.state !== 'patrol' && npc.state !== 'flee' && !isHostileNow) {
            npc.state = 'patrol';
            npc.stateTimer = 0.5 + Math.random();
            npc.goalT = 0;
          }

          if (npc.state === 'flee') {
            if (isHostileNow) {
              // A contract went out while backing away: turn and fight.
              npc.state = 'patrol';
              npc.stateTimer = 0;
            } else {
              const away = distToPlayer > 1 ? Math.atan2(npc.y - player.y, npc.x - player.x) : npc.angle;
              if (!followDetour(npc, dt, FLEE_SPEED)) {
                walkToward(npc, npc.x + Math.cos(away) * 60, npc.y + Math.sin(away) * 60, FLEE_SPEED, dt, false);
              }
              trackStuck(npc, dt, true);
              if (npc.stateTimer <= 0) {
                npc.state = 'patrol';
                npc.stateTimer = 1 + Math.random() * 2;
                npc.vx = 0;
                npc.vy = 0;
              }
            }
          } else if (npc.state === 'patrol') {
            const chaseRange = npc.squadFamily ? SQUAD_HUNT_RANGE : npc.role === 'nypd' ? 640 : 240;
            if (isHostileNow && distToPlayer < chaseRange) {
              if (distToPlayer < 240 && clearShot(npc.x, npc.y, player.x, player.y)) {
                npc.state = 'windup';
                npc.stateTimer = melee ? 0.48 : 0.6;
              } else {
                // No clear line to the player: walk around the buildings to get one.
                chase(npc, dt, CHASE_SPEED);
              }
            } else if (followDetour(npc, dt, PATROL_SPEED)) {
              trackStuck(npc, dt, true);
            } else if ((npc.goalT ?? 0) > 0) {
              // Walking to a patrol point on the sidewalks near the origin.
              npc.goalT = (npc.goalT ?? 0) - dt;
              const gx = npc.goalX ?? npc.x;
              const gy = npc.goalY ?? npc.y;
              if (Math.hypot(gx - npc.x, gy - npc.y) < 8) {
                npc.goalT = 0;
                npc.vx = 0;
                npc.vy = 0;
                npc.stateTimer = 0.8 + Math.random() * 2.2;
                trackStuck(npc, dt, false);
              } else {
                walkToward(npc, gx, gy, PATROL_SPEED, dt, false);
                trackStuck(npc, dt, true);
              }
            } else {
              npc.vx = 0;
              npc.vy = 0;
              trackStuck(npc, dt, false);
              if (npc.stateTimer <= 0) pickPatrolGoal(npc);
            }
          } else if (npc.state === 'windup') {
            // Visible windup telegraph before attack!
            npc.angle = Math.atan2(player.y - npc.y, player.x - npc.x);
            if (melee) {
              // Slowly step in during windup, along the flow field
              chase(npc, dt, 65);
              npc.angle = Math.atan2(player.y - npc.y, player.x - npc.x);
            }
            if (npc.stateTimer <= 0 && !melee && npc.role !== 'citizen' && !clearShot(npc.x, npc.y, player.x, player.y)) {
              // A building is in the way: do not shoot the wall, go around it.
              npc.state = 'patrol';
              npc.stateTimer = 0;
            } else if (npc.stateTimer <= 0) {
              npc.state = 'attack';
              npc.stateTimer = 0.25;
              if (melee) {
                // Heavy brass-knuckle dash lunge (an unarmed courier shoves the same way, more weakly)
                npc.vx = Math.cos(npc.angle) * 380;
                npc.vy = Math.sin(npc.angle) * 380;
                if (distToPlayer < 85 && !st.isTitleScreen && clearShot(npc.x, npc.y, player.x, player.y)) {
                  player.hitFlash = 0.2;
                  camera.shake = Math.max(camera.shake, 7);
                  st.callbacks.onPlayerDamaged(meleeDamage(npc.role), npc.name);
                  soundEngine.playMeleeHit(false);
                }
              } else if (npc.role !== 'citizen') {
                // Fire telegraphed burst
                const shots = npc.role === 'capo' ? 3 : 1;
                for (let s = 0; s < shots; s++) {
                  const spread = (s - (shots - 1) / 2) * 0.14;
                  bullets.push({
                    x: npc.x + Math.cos(npc.angle) * 18,
                    y: npc.y + Math.sin(npc.angle) * 18,
                    vx: Math.cos(npc.angle + spread) * 520,
                    vy: Math.sin(npc.angle + spread) * 520,
                    damage: npc.role === 'capo' ? 16 : 11,
                    fromPlayer: false,
                    life: 0.65,
                    color: '#F87171',
                  });
                }
              }
            }
          } else if (npc.state === 'attack') {
            stepBody(npc, npc.vx * dt, npc.vy * dt);
            npc.vx *= 0.88;
            npc.vy *= 0.88;
            if (npc.stateTimer <= 0) {
              npc.state = 'cooldown';
              npc.stateTimer = npc.role === 'capo' ? 0.65 : 0.95;
            }
          } else if (npc.state === 'cooldown') {
            const sees = clearShot(npc.x, npc.y, player.x, player.y);
            if (sees || npc.role === 'citizen') {
              // Reposition slightly
              const strafeAngle = Math.atan2(player.y - npc.y, player.x - npc.x) + Math.PI / 2;
              stepBody(npc, Math.cos(strafeAngle) * 70 * dt, Math.sin(strafeAngle) * 70 * dt);
              npc.angle = Math.atan2(player.y - npc.y, player.x - npc.x);
            } else {
              chase(npc, dt, CHASE_SPEED);
            }
            if (npc.stateTimer <= 0) {
              if (distToPlayer >= 360 || (!sees && npc.role === 'citizen')) {
                npc.state = 'patrol';
                npc.stateTimer = 0.58;
              } else if (sees) {
                npc.state = 'windup';
                npc.stateTimer = melee ? 0.45 : 0.58;
              } else {
                npc.stateTimer = 0.4; // still no line to the player: keep walking round
              }
            }
          }
        }

        // Report every attack whose last pellet is gone (its deaths were processed above), once, as one tally.
        settleAttacks();
        if (!st.isTitleScreen) stepSquads(dt);

        // Update ambient 1984 NYC traffic: lanes, junction turns, bridges (src/world/traffic.ts)
        stepTraffic(streetCars, city, dt, Math.random);

        // Update particles
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vx *= 0.92;
          p.vy *= 0.92;
          p.life += dt;
          if (p.life >= p.maxLife) particles.splice(i, 1);
        }

        // Update floating combat/tribute numbers
        for (let i = floatingTexts.length - 1; i >= 0; i--) {
          const ft = floatingTexts[i];
          ft.y += ft.vy * dt;
          ft.life += dt;
          if (ft.life >= ft.maxLife) floatingTexts.splice(i, 1);
        }
      }

      // Clear edge-triggered input flags after simulation step
      justPressedKeys.clear();
      mouse.justClicked = false;

      // ================== RENDERING ==================
      ctx.fillStyle = '#09090B';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      camera.x = clampCam(camera.x, canvas.width, WORLD_WIDTH);
      camera.y = clampCam(camera.y, canvas.height, WORLD_HEIGHT);
      ctx.save();
      const shakeX = (Math.random() - 0.5) * camera.shake * 2;
      const shakeY = (Math.random() - 0.5) * camera.shake * 2;
      const originX = Math.round(canvas.width / 2 - camera.x + shakeX);
      const originY = Math.round(canvas.height / 2 - camera.y + shakeY);
      ctx.translate(originX, originY);

      // City ground: cached 512 px pieces. The request list is rebuilt only when the view's piece range changes.
      const view = { x: -originX, y: -originY, w: canvas.width, h: canvas.height };
      const rx0 = Math.floor(view.x / CHUNK);
      const rx1 = Math.floor((view.x + view.w - 1) / CHUNK);
      const ry0 = Math.floor(view.y / CHUNK);
      const ry1 = Math.floor((view.y + view.h - 1) / CHUNK);
      if (rx0 !== req.x0 || rx1 !== req.x1 || ry0 !== req.y0 || ry1 !== req.y1) {
        req.x0 = rx0;
        req.x1 = rx1;
        req.y0 = ry0;
        req.y1 = ry1;
        req.list = chunksForView(view, 1, MAX_CHUNKS);
        req.visible = req.list.map((w) => w.cx >= rx0 && w.cx <= rx1 && w.cy >= ry0 && w.cy <= ry1);
      }
      const wanted = req.list;
      for (let k = wanted.length - 1; k >= 0; k--) {
        if (baked.has(wanted[k].cy * 1000 + wanted[k].cx)) pieces.get(wanted[k].cx, wanted[k].cy);
      }
      // Bake at most one piece per frame. Visible pieces always; ring pieces only when the last frame was quick.
      // A piece whose bake throws or yields no context is skipped (and retried after a short pause), not blocking others.
      frameNo++;
      const ringOk = rawDt * 1000 < RING_BAKE_MAX_FRAME_MS;
      for (let k = 0; k < wanted.length; k++) {
        const w = wanted[k];
        if (!req.visible[k] && !ringOk) break;
        const key = w.cy * 1000 + w.cx;
        if (baked.has(key) || (failedUntil.get(key) ?? 0) > frameNo) continue;
        const t0 = performance.now();
        let ok = false;
        try {
          const piece = pieces.get(w.cx, w.cy);
          const pctx = piece.cv.getContext('2d');
          if (pctx) {
            pctx.clearRect(0, 0, CHUNK, CHUNK);
            drawCityChunk(pctx, city, w.cx, w.cy);
            baked.add(key);
            failedUntil.delete(key);
            ok = true;
          }
        } catch {
          ok = false;
        }
        if (tourHook) tourHook.slowestChunkMs = Math.max(tourHook.slowestChunkMs, performance.now() - t0);
        if (ok) break;
        failedUntil.set(key, frameNo + 30);
      }
      for (let k = 0; k < wanted.length; k++) {
        const w = wanted[k];
        const px = w.cx * CHUNK;
        const py = w.cy * CHUNK;
        if (px + CHUNK < view.x || px > view.x + view.w || py + CHUNK < view.y || py > view.y + view.h) continue;
        const key = w.cy * 1000 + w.cx;
        if (baked.has(key)) {
          ctx.drawImage(pieces.get(w.cx, w.cy).cv, px, py);
        } else {
          ctx.fillStyle = '#0A1018';
          ctx.fillRect(px, py, CHUNK, CHUNK);
        }
      }
      drawCityOverlay(ctx, city, view, now / 1000);

      // Draw 1984 Street Cars, turned to face their direction of travel (0 north, 1 east, 2 south, 3 west)
      for (let ci = 0; ci < streetCars.length; ci++) {
        const car = streetCars[ci];
        if (car.x < view.x - 120 || car.x > view.x + view.w + 120 || car.y < view.y - 120 || car.y > view.y + view.h + 120) continue;
        ctx.save();
        ctx.translate(car.x, car.y);
        ctx.rotate((car.dir - 1) * (Math.PI / 2));
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(-24, -10, 48, 24);
        ctx.fillStyle = car.color;
        ctx.fillRect(-22, -11, 44, 22);
        if (car.isPolice) {
          // Black-and-white livery: white doors and hood stripe, roof light bar
          ctx.fillStyle = '#F5F5F4';
          ctx.fillRect(-12, -11, 24, 4);
          ctx.fillRect(-12, 7, 24, 4);
          ctx.fillRect(12, -3, 10, 6);
        }
        ctx.fillStyle = '#09090B';
        ctx.fillRect(-10, -9, 20, 18);
        // Headlight beams
        ctx.fillStyle = 'rgba(254, 240, 138, 0.16)';
        ctx.beginPath();
        ctx.moveTo(22, -8);
        ctx.lineTo(95, -28);
        ctx.lineTo(95, 28);
        ctx.lineTo(22, 8);
        ctx.closePath();
        ctx.fill();
        if (car.isPolice) {
          const redPhase = Math.floor(now / 180) % 2 === 0;
          ctx.fillStyle = redPhase ? '#EF4444' : '#1E3A8A';
          ctx.fillRect(-4, -9, 8, 9);
          ctx.fillStyle = redPhase ? '#3B82F6' : '#EF4444';
          ctx.fillRect(-4, 0, 8, 9);
        }
        ctx.restore();
      }

      // Draw all 15 Historical Racket Buildings
      for (const r of st.rackets) {
        const isPlayerOwned = r.ownerFamily === 'player';
        const rFamVis = FAMILY_COAT_COLORS[r.ownerFamily] || FAMILY_COAT_COLORS.corvini;
        // The city draws the building itself; the engine adds an ownership strip and a plaque
        ctx.fillStyle = isPlayerOwned ? '#10B981' : rFamVis.accent;
        ctx.fillRect(r.x, r.y + r.height - 4, r.width, 4);
        ctx.fillStyle = 'rgba(9, 9, 11, 0.72)';
        ctx.fillRect(r.x + r.width / 2 - 92, r.y + r.height - 44, 184, 36);

        ctx.fillStyle = '#F5F0E6';
        ctx.font = '700 12px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(r.name, r.x + r.width / 2, r.y + r.height - 28);

        ctx.fillStyle = isPlayerOwned ? '#6EE7B7' : '#FBBF24';
        ctx.font = '600 10px "JetBrains Mono", monospace';
        ctx.fillText(
          isPlayerOwned
            ? `★ YOUR TURF · LV.${r.level} ($${(r.baseIncomePerHour * r.level).toLocaleString()}/HR)`
            : `${rFamVis.symbol} ${r.ownerFamily.toUpperCase()} TURF · LV.${r.level}`,
          r.x + r.width / 2,
          r.y + r.height - 14
        );

        // Floating Uncollected Cash Envelope indicator
        if (isPlayerOwned && r.uncollectedCash >= 50) {
          const bob = Math.sin(now / 220) * 4;
          const envX = r.x + r.width / 2;
          const envY = r.y + r.height + 22 + bob;
          ctx.fillStyle = '#10B981';
          ctx.fillRect(envX - 16, envY - 10, 32, 20);
          ctx.strokeStyle = '#ECFDF5';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(envX - 16, envY - 10, 32, 20);
          ctx.fillStyle = '#064E3B';
          ctx.font = '700 10px "JetBrains Mono", monospace';
          ctx.fillText('$', envX, envY + 4);
        }
      }

      // Draw Social Contacts (Stardew-style Inner Circle Sit-Down NPCs)
      for (const c of st.contacts) {
        // Warm golden aura circle
        ctx.save();
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.55)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(c.worldX, c.worldY, 24 + Math.sin(now / 300) * 2, 0, Math.PI * 2);
        ctx.stroke();

        // Character body
        ctx.fillStyle = '#292524';
        ctx.beginPath();
        ctx.arc(c.worldX, c.worldY, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Fedora hat
        ctx.fillStyle = '#D97706';
        ctx.beginPath();
        ctx.arc(c.worldX, c.worldY, 9, 0, Math.PI * 2);
        ctx.fill();

        // Nameplate & Respect Hearts
        ctx.fillStyle = '#FDE68A';
        ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(c.name, c.worldX, c.worldY - 26);
        ctx.fillStyle = '#F59E0B';
        ctx.font = '600 10px "JetBrains Mono", monospace';
        ctx.fillText(`★ RESPECT ${c.respect}/100`, c.worldX, c.worldY - 14);
        ctx.restore();
      }

      // Sit-down spots: a family-coloured ring (the prompt range) with the meeting countdown, while waiting or open.
      if (!st.isTitleScreen) {
        for (const f of FAMILY_KEYS) {
          const d = fc.s.families[f]?.sitDown;
          if (!d) continue;
          const ws = windowState(fc.s, f, fc.now);
          if (ws !== 'waiting' && ws !== 'open') continue;
          const sx = d.spot.x;
          const sy = d.spot.y;
          if (sx < view.x - 200 || sx > view.x + view.w + 200 || sy < view.y - 120 || sy > view.y + view.h + 120) continue;
          const vis = FAMILY_COAT_COLORS[f];
          const open = ws === 'open';
          const pulseR = open ? Math.sin(now / 260) * 3 : 0;
          ctx.save();
          ctx.fillStyle = open ? 'rgba(250, 204, 21, 0.12)' : 'rgba(9, 9, 11, 0.35)';
          ctx.strokeStyle = vis.accent;
          ctx.lineWidth = open ? 3 : 2;
          ctx.setLineDash(open ? [] : [8, 6]);
          ctx.beginPath();
          ctx.ellipse(sx, sy, SITDOWN_RANGE + pulseR, (SITDOWN_RANGE + pulseR) * 0.42, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.setLineDash([]);
          // A small table with two chairs
          ctx.fillStyle = '#3F2A1D';
          ctx.fillRect(sx - 12, sy - 7, 24, 12);
          ctx.strokeStyle = '#F5F0E6';
          ctx.lineWidth = 1;
          ctx.strokeRect(sx - 12, sy - 7, 24, 12);
          ctx.fillStyle = vis.accent;
          ctx.fillRect(sx - 20, sy - 4, 6, 7);
          ctx.fillRect(sx + 14, sy - 4, 6, 7);
          ctx.restore();
        }
      }

      // People: full-body figures from the figure cache. Cull to the view, then sort by the feet so
      // lower bodies draw in front; the player is drawn in the same order.
      drawList.length = 0;
      for (let k = 0; k < npcs.length; k++) {
        const n = npcs[k];
        if (n.x < view.x - 80 || n.x > view.x + view.w + 80 || n.y < view.y - 40 || n.y > view.y + view.h + 80) continue;
        drawList.push(n);
      }
      for (let a = 1; a < drawList.length; a++) {
        const n = drawList[a];
        let b = a - 1;
        while (b >= 0 && drawList[b].y > n.y) {
          drawList[b + 1] = drawList[b];
          b--;
        }
        drawList[b + 1] = n;
      }
      const showPlayer = !st.isTitleScreen;

      // Ground layer: brawler windup arcs, Capo rings and the player's gold ring.
      for (let k = 0; k < drawList.length; k++) {
        const npc = drawList[k];
        if (npc.state === 'windup' && isMeleeRole(npc.role)) {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
          ctx.strokeStyle = '#EF4444';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(npc.x, npc.y, 68, npc.angle - 0.6, npc.angle + 0.6);
          ctx.lineTo(npc.x, npc.y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
        if (npc.role === 'capo') {
          ctx.strokeStyle = npc.tagColor;
          ctx.globalAlpha = 0.85;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(Math.round(npc.x), Math.round(npc.y) + 1, 15, 5.5, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
      if (showPlayer) drawPlayerRing();

      // Bodies, back to front.
      let playerDrawn = !showPlayer;
      for (let k = 0; k < drawList.length; k++) {
        const npc = drawList[k];
        if (!playerDrawn && npc.y > player.y) {
          drawPlayerFigure(st.playerFamily, st.equippedWeapon);
          playerDrawn = true;
        }
        drawNpcFigure(npc);
      }
      if (!playerDrawn) drawPlayerFigure(st.playerFamily, st.equippedWeapon);

      // Gunman laser-sight telegraph, from the gun hand along the aim (also for gunmen just off screen).
      for (let k = 0; k < npcs.length; k++) {
        const npc = npcs[k];
        if (npc.state !== 'windup' || isMeleeRole(npc.role) || npc.role === 'citizen') continue;
        const f = Math.cos(npc.angle) >= 0 ? 1 : -1;
        const lx = npc.x + f * GRIP_DX;
        const ly = npc.y + GRIP_DY;
        ctx.strokeStyle = 'rgba(248, 113, 113, 0.75)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(lx + Math.cos(npc.angle) * 260, ly + Math.sin(npc.angle) * 260);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw Bullets & Tracers (drawn at hand height; they fly at the bodies' feet)
      for (const b of bullets) {
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y - SHOT_LIFT);
        ctx.lineTo(b.x - b.vx * 0.022, b.y - SHOT_LIFT - b.vy * 0.022);
        ctx.stroke();
      }

      // Draw Particles & Shell Casings
      for (const p of particles) {
        const alpha = 1 - p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
      ctx.globalAlpha = 1;

      // Name tags: at most four, laid out so that none overlap (src/world/tagLayout.ts)
      buildTags(st.isTitleScreen);
      drawTags();

      // Sit-down labels above head height, over the people and tags, so a body on the spot never hides them.
      if (!st.isTitleScreen) {
        for (const f of FAMILY_KEYS) {
          const d = fc.s.families[f]?.sitDown;
          if (!d) continue;
          const ws = windowState(fc.s, f, fc.now);
          if (ws !== 'waiting' && ws !== 'open') continue;
          const sx = d.spot.x;
          const sy = d.spot.y;
          if (sx < view.x - 200 || sx > view.x + view.w + 200 || sy < view.y - 120 || sy > view.y + view.h + 120) continue;
          const vis = FAMILY_COAT_COLORS[f];
          const open = ws === 'open';
          const line1 = `${vis.symbol} SIT-DOWN · ${vis.shortFamily}`;
          const line2 = open ? `OPEN · ${clockText(d.windowEnd - fc.now)} LEFT` : `MEET IN ${clockText(d.meetAt - fc.now)}`;
          // The price and the risk, under the countdown (PATCH-001).
          const risk = betrayalRisk(fc.s, f, { respectXp: st.contracts?.respectXp ?? 0, ceasefire: st.contracts?.ceasefire ?? false });
          const line3 = `$${(fc.s.families[f]?.price ?? 0).toLocaleString('en-US')} · ${Math.round(risk * 100)}% RISK`;
          const top = sy - FIG_TOP - 48;
          ctx.save();
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
          const w1 = ctx.measureText(line1).width;
          ctx.font = '600 10px "JetBrains Mono", monospace';
          const bw = Math.ceil(Math.max(w1, ctx.measureText(line2).width, ctx.measureText(line3).width)) + 14;
          ctx.fillStyle = 'rgba(9, 9, 11, 0.85)';
          ctx.fillRect(Math.round(sx - bw / 2), top, bw, 42);
          ctx.fillStyle = vis.accent;
          ctx.fillRect(Math.round(sx - bw / 2), top, bw, 2);
          ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
          ctx.fillStyle = '#F5F0E6';
          ctx.fillText(line1, sx, top + 4);
          ctx.font = '600 10px "JetBrains Mono", monospace';
          ctx.fillStyle = open ? '#FACC15' : vis.accent;
          ctx.fillText(line2, sx, top + 17);
          ctx.fillStyle = '#F5F0E6';
          ctx.fillText(line3, sx, top + 29);
          ctx.restore();
        }
      }

      // Draw Floating Damage & Tribute Numbers
      for (const ft of floatingTexts) {
        const alpha = 1 - ft.life / ft.maxLife;
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.fillStyle = ft.color;
        ctx.font = '700 13px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
      }
      ctx.globalAlpha = 1;

      ctx.restore();

      // Ferry fade
      if (ferry.active) {
        const fa = ferry.t < 0.25 ? ferry.t / 0.25 : Math.max(0, (0.5 - ferry.t) / 0.25);
        ctx.fillStyle = `rgba(0,0,0,${Math.min(1, fa).toFixed(3)})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Screen-space 1984 NYC Rain & Noir Vignette
      ctx.strokeStyle = 'rgba(212, 212, 216, 0.13)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const r of raindrops) {
        r.y += r.speed * dt;
        r.x -= r.speed * 0.18 * dt;
        if (r.y > canvas.height) {
          r.y = -20;
          r.x = Math.random() * canvas.width;
        }
        if (r.x < 0) r.x = canvas.width;
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x - 3, r.y + r.len);
      }
      ctx.stroke();

      // Subtle perimeter vignette
      const grad = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        canvas.height * 0.32,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width * 0.65
      );
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(9,8,7,0.55)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Screen-space twin sticks: translucent base and knob, only while held
      for (const stick of [sticks.move, sticks.aim]) {
        if (!stick) continue;
        ctx.fillStyle = 'rgba(250, 250, 250, 0.08)';
        ctx.strokeStyle = 'rgba(250, 250, 250, 0.28)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(stick.baseX, stick.baseY, STICK_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = stick === sticks.aim ? 'rgba(220, 38, 38, 0.45)' : 'rgba(245, 158, 11, 0.45)';
        ctx.beginPath();
        ctx.arc(stick.knobX, stick.knobY, 24, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      // Release every cached city piece.
      for (const p of livePieces) {
        p.cv.width = 0;
        p.cv.height = 0;
      }
      livePieces.clear();
      baked.clear();
      failedUntil.clear();
      req.list = [];
      req.visible = [];
      // Release every baked figure.
      for (const f of figures.values()) {
        freeCanvas(f.img);
        freeCanvas(f.white);
        freeCanvas(f.red);
      }
      figures.clear();
      if (tourHook && tourWin.__cityTour === tourHook) delete tourWin.__cityTour;
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('touchstart', handleTouchStart, touchOpts);
      canvas.removeEventListener('touchmove', handleTouchMove, touchOpts);
      canvas.removeEventListener('touchend', handleTouchEnd, touchOpts);
      canvas.removeEventListener('touchcancel', handleTouchCancel, touchOpts);
    };
  }, [bridgeRef]);

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-[#09090B]">
      <canvas
        ref={canvasRef}
        className="block w-full h-full cursor-crosshair select-none"
        style={{ touchAction: 'none', WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
      />
    </div>
  );
};
