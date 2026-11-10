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
import type { InteractPrompt } from '../world/bridgeTypes';
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
  coatColor: string;
  hatColor: string;
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

export interface WorldCallbacks {
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

export interface LiveSimulationBridge {
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
}

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

    const makeCivilian = (area: AreaId): WorldNpc => {
      const spot = randomWalkableIn(city, area, Math.random);
      const palette = FAMILY_COAT_COLORS.civilian;
      return {
        id: `civ_${area}_${Math.random().toString(36).slice(2, 8)}`,
        name: area === 'uptown' ? '1984 Uptown Resident' : '1984 Ferry Commuter',
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
        coatColor: palette.coat,
        hatColor: palette.hat,
        hitFlashTimer: 0,
        squash: 1,
        cashDrop: 300,
        contrabandDrop: 1,
        homeArea: area,
      };
    };

    // Populate living 1984 NYC NPCs across all 5 boroughs
    const initWorldNpcs = () => {
      npcs.length = 0;
      const npcNames = [
        'Frankie "Two-Times" Russo',
        'Paulie "Walnuts" Gualtieri',
        'Sonny "Red" Indelicato',
        'Nicky "Glasses" Santoro',
        'Tommy "Karate" Pitera',
        'Vinnie "The Chin" Gigante',
        'Joey "Doves" Aiuppa',
        'Mickey "Feather" Featherstone',
        'Dominick "Sonny Black" Napolitano',
        'Jimmy "The Gent" Burke',
        'Angelo "Quack Quack" Ruggiero',
        'Gaspipe Casso',
      ];

      NYC_BOROUGHS.forEach((b, bIdx) => {
        const count = 8;
        for (let i = 0; i < count; i++) {
          const isCourier = i === 0;
          const isCitizen = i === 1;
          const isBrawler = i % 2 === 0 && !isCourier;
          const spot = randomWalkableIn(city, b.id as GameBoroughId, Math.random);
          const px = spot.x;
          const py = spot.y;
          const fam = isCitizen ? 'civilian' : b.controllingFamilyDefault;
          const palette = FAMILY_COAT_COLORS[fam] || FAMILY_COAT_COLORS.civilian;
          const tierScale = 1 + (b.riskTier - 1) * 0.35;

          npcs.push({
            id: `npc_${b.id}_${i}_${Math.random().toString(36).slice(2, 6)}`,
            name: isCourier
              ? `${b.name.split(' ')[0]} Contraband Runner`
              : isCitizen
              ? `1984 Garment Merchant`
              : npcNames[(bIdx * 5 + i) % npcNames.length],
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
            coatColor: palette.coat,
            hatColor: palette.hat,
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
        const palette = FAMILY_COAT_COLORS[racket.ownerFamily] || FAMILY_COAT_COLORS.corvini;
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
          if (npcs[i].racketGuardId === racket.id) npcs.splice(i, 1);
        }
        // Spawn 1 Turf Capo + 2 Enforcers
        npcs.push({
          id: `capo_${racket.id}_${Date.now()}`,
          name: `Capo defending ${racket.name.split(' ')[0]}`,
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
          coatColor: palette.coat,
          hatColor: '#F59E0B',
          hitFlashTimer: 0,
          squash: 1,
          cashDrop: Math.round(3500 * b.rewardMultiplier),
          contrabandDrop: Math.round(8 * b.contrabandMultiplier),
          racketGuardId: racket.id,
        });
        for (let g = 0; g < 2; g++) {
          npcs.push({
            id: `guard_${racket.id}_${g}_${Date.now()}`,
            name: `${racket.ownerFamily.toUpperCase()} Button Man`,
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
            coatColor: palette.coat,
            hatColor: palette.hat,
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
            name: `Corvini Cadillac Enforcer`,
            role: 'ally',
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
            coatColor: '#1C1917',
            hatColor: '#F59E0B',
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
    };

    // Tour hook for the CI city tour: present only when the URL has ?tour.
    const tourWin = window as unknown as { __cityTour?: TourHook };
    const frameSamples: number[] = [];
    let tourHook: TourHook | null = null;
    try {
      if (new URLSearchParams(window.location.search).has('tour')) {
        tourHook = {
          teleport: (x: number, y: number) => teleportPlayer(x, y),
          frameTimeMs: () => (frameSamples.length ? frameSamples.reduce((a, b) => a + b, 0) / frameSamples.length : 0),
          slowestChunkMs: 0,
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

        // Hit any NPC within melee arc
        for (let i = npcs.length - 1; i >= 0; i--) {
          const npc = npcs[i];
          if (npc.role === 'ally') continue;
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
            if (npc.state === 'patrol') {
              npc.state = 'windup';
              npc.stateTimer = 0.35;
            }
          }
        }
      } else {
        // Firearm attack
        soundEngine.playGunshot(weapon.id);
        camera.shake = Math.max(camera.shake, weapon.id === 'shotgun' ? 9 : 4.5);

        const muzzleX = player.x + Math.cos(player.angle) * 22;
        const muzzleY = player.y + Math.sin(player.angle) * 22;
        spawnParticles(muzzleX, muzzleY, '#FBBF24', 5, 90, true);

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
          });
        }
        st.callbacks.onEarnResources(0, 0, 0, weapon.heatPerShot);
      }
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

          const promptKey = nearestPrompt ? `${nearestPrompt.type}:${nearestPrompt.id}:${nearestPrompt.label}` : '';
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
              name: 'Made Bodyguard',
              role: 'ally',
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
              coatColor: '#1C1917',
              hatColor: '#F59E0B',
              hitFlashTimer: 0,
              squash: 1,
              cashDrop: 0,
              contrabandDrop: 0,
            });
          }
        }

        // Spawn NYPD Squad if Police Heat is high (> 55)
        if (st.policeHeat > 55 && npcs.filter((n) => n.role === 'nypd').length < 3 && Math.random() < dt * 0.35) {
          const spawnAngle = Math.random() * Math.PI * 2;
          const nypdSpot = snap(player.x + Math.cos(spawnAngle) * 420, player.y + Math.sin(spawnAngle) * 420);
          npcs.push({
            id: `nypd_${Date.now()}`,
            name: 'NYPD Organized Crime Task Force',
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
            coatColor: '#172554',
            hatColor: '#38BDF8',
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
              if (npc.role === 'ally') continue;
              if (Math.hypot(b.x - npc.x, b.y - npc.y) < 18) {
                npc.hp -= b.damage;
                npc.hitFlashTimer = 0.12;
                npc.squash = 1.25;
                npc.vx += (b.vx / 800) * 95;
                npc.vy += (b.vy / 800) * 95;
                spawnParticles(npc.x, npc.y, '#DC2626', 7, 130);
                addFloatingText(npc.x, npc.y, `-${b.damage}`, '#FCA5A5');
                if (npc.state === 'patrol') {
                  npc.state = 'windup';
                  npc.stateTimer = 0.4;
                }
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
            // NPC eliminated!
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
            } else if (!guardId && npc.role !== 'ally' && npc.role !== 'nypd') {
              const b = NYC_BOROUGHS[Math.floor(Math.random() * NYC_BOROUGHS.length)];
              const palette = FAMILY_COAT_COLORS[npc.role === 'citizen' ? 'civilian' : b.controllingFamilyDefault];
              const respawnSpot = randomWalkableIn(city, b.id as GameBoroughId, Math.random);
              npcs.push({
                id: `npc_respawn_${Date.now()}_${Math.random()}`,
                name: npc.name,
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
                coatColor: palette.coat,
                hatColor: palette.hat,
                hitFlashTimer: 0,
                squash: 1,
                cashDrop: npc.cashDrop,
                contrabandDrop: npc.contrabandDrop,
              });
            }
            continue;
          }

          // Allied Bodyguard AI
          if (npc.role === 'ally') {
            const targetFollowX = player.x + (i % 2 === 0 ? -42 : 42);
            const targetFollowY = player.y + 36;
            const distToPlayer = Math.hypot(targetFollowX - npc.x, targetFollowY - npc.y);
            let allyMoved = false;
            if (distToPlayer > 24) {
              // Follow along the shared flow field; fall back to a straight line, or an unstuck detour.
              if (!followDetour(npc, dt, 200)) walkToward(npc, targetFollowX, targetFollowY, 200, dt, true);
              trackStuck(npc, dt, true);
              allyMoved = true;
            } else {
              npc.vx *= 0.8;
              npc.vy *= 0.8;
              trackStuck(npc, dt, false);
            }
            if (Math.hypot(player.x - npc.x, player.y - npc.y) > 900) {
              const back = snap(player.x + (i % 2 === 0 ? -42 : 42), player.y + 36);
              npc.x = back.x;
              npc.y = back.y;
            }
            if (!allyMoved) stepBody(npc, npc.vx * dt, npc.vy * dt);

            // Shoot nearest hostile NPC
            npc.stateTimer -= dt;
            if (npc.stateTimer <= 0) {
              const hostile = npcs.find(
                (other) =>
                  other.role !== 'ally' &&
                  other.role !== 'citizen' &&
                  (other.state === 'windup' || other.state === 'attack' || other.racketGuardId) &&
                  Math.hypot(other.x - npc.x, other.y - npc.y) < 320
              );
              if (hostile) {
                npc.stateTimer = 0.55;
                const aim = Math.atan2(hostile.y - npc.y, hostile.x - npc.x);
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
                });
              } else {
                npc.stateTimer = 0.25;
              }
            }
            continue;
          }

          // Hostile / Neutral NPC AI
          const distToPlayer = Math.hypot(player.x - npc.x, player.y - npc.y);
          const isHostileByDefault =
            npc.racketGuardId !== undefined ||
            npc.role === 'nypd' ||
            (!st.hasStreetCeasefire &&
              npc.familyId !== st.playerFamily &&
              npc.familyId !== 'civilian' &&
              npc.role !== 'courier' &&
              distToPlayer < 175);

          npc.stateTimer -= dt;

          if (npc.state === 'patrol') {
            const chaseRange = npc.role === 'nypd' ? 640 : 240;
            if (isHostileByDefault && !st.isTitleScreen && distToPlayer < chaseRange) {
              if (distToPlayer < 240 && clearShot(npc.x, npc.y, player.x, player.y)) {
                npc.state = 'windup';
                npc.stateTimer = npc.role === 'brawler' ? 0.48 : 0.6;
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
            if (npc.role === 'brawler') {
              // Slowly step in during windup, along the flow field
              chase(npc, dt, 65);
              npc.angle = Math.atan2(player.y - npc.y, player.x - npc.x);
            }
            if (npc.stateTimer <= 0 && npc.role !== 'brawler' && npc.role !== 'citizen' && !clearShot(npc.x, npc.y, player.x, player.y)) {
              // A building is in the way: do not shoot the wall, go around it.
              npc.state = 'patrol';
              npc.stateTimer = 0;
            } else if (npc.stateTimer <= 0) {
              npc.state = 'attack';
              npc.stateTimer = 0.25;
              if (npc.role === 'brawler') {
                // Heavy brass-knuckle dash lunge
                npc.vx = Math.cos(npc.angle) * 380;
                npc.vy = Math.sin(npc.angle) * 380;
                if (distToPlayer < 85 && !st.isTitleScreen && clearShot(npc.x, npc.y, player.x, player.y)) {
                  player.hitFlash = 0.2;
                  camera.shake = Math.max(camera.shake, 7);
                  st.callbacks.onPlayerDamaged(18, npc.name);
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
                npc.stateTimer = npc.role === 'brawler' ? 0.45 : 0.58;
              } else {
                npc.stateTimer = 0.4; // still no line to the player: keep walking round
              }
            }
          }
        }

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

      // Draw all Active World NPCs with Unique Five Families 'Family Trait' Visual Indicators
      for (const npc of npcs) {
        const famVis = FAMILY_COAT_COLORS[npc.familyId] || FAMILY_COAT_COLORS.civilian;
        const bodyRadius = npc.role === 'capo' ? 16 : 13;

        ctx.save();

        // 1. Ground-Level Family Territory Alignment Ring beneath NPC
        if (npc.familyId !== 'civilian') {
          ctx.strokeStyle = famVis.accent;
          ctx.globalAlpha = npc.role === 'capo' ? 0.75 : 0.42;
          ctx.lineWidth = npc.role === 'capo' ? 2.2 : 1.5;
          ctx.beginPath();
          ctx.arc(npc.x, npc.y, bodyRadius + 6, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        // Draw visible Windup Telegraph BEFORE attack!
        if (npc.state === 'windup') {
          if (npc.role === 'brawler') {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
            ctx.strokeStyle = '#EF4444';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(npc.x, npc.y, 68, npc.angle - 0.6, npc.angle + 0.6);
            ctx.lineTo(npc.x, npc.y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          } else {
            // Gunman laser sight telegraph cone
            ctx.strokeStyle = 'rgba(248, 113, 113, 0.75)';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 6]);
            ctx.beginPath();
            ctx.moveTo(npc.x, npc.y);
            ctx.lineTo(npc.x + Math.cos(npc.angle) * 260, npc.y + Math.sin(npc.angle) * 260);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }

        ctx.translate(npc.x, npc.y);
        ctx.scale(npc.squash, 2 - npc.squash);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.beginPath();
        ctx.arc(2, 4, 14, 0, Math.PI * 2);
        ctx.fill();

        // Shoulders / Coat
        ctx.fillStyle = npc.hitFlashTimer > 0 ? '#FFFFFF' : npc.coatColor;
        ctx.beginPath();
        ctx.arc(0, 0, bodyRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = npc.role === 'capo' ? '#F59E0B' : famVis.accent;
        ctx.lineWidth = npc.role === 'capo' ? 2.5 : 1.5;
        ctx.stroke();

        // 2. Render Unique Five Families On-Body Sartorial 'Family Trait' Visuals
        ctx.save();
        ctx.rotate(npc.angle);

        if (npc.familyId === 'corvini') {
          // Corvini Family Trait: Chalk-white pinstripes + Blood-Red Lapel Carnation
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-6, -8);
          ctx.lineTo(6, -8);
          ctx.moveTo(-6, 8);
          ctx.lineTo(6, 8);
          ctx.stroke();
          // Green carnation leaf & crimson flower on left lapel
          ctx.fillStyle = '#22C55E';
          ctx.beginPath();
          ctx.arc(5, -7, 3.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#EF4444';
          ctx.beginPath();
          ctx.arc(6, -6.5, 2.6, 0, Math.PI * 2);
          ctx.fill();
        } else if (npc.familyId === 'bellini') {
          // Bellini Syndicate Trait: Gold Collar Chevron + Brass-Latched Concrete Ledger Briefcase
          ctx.strokeStyle = '#FBBF24';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(2, -9);
          ctx.lineTo(7, -5);
          ctx.lineTo(2, -1);
          ctx.stroke();
          // Carried leather & brass briefcase in off-hand
          ctx.fillStyle = '#451A03';
          ctx.fillRect(-4, -17, 10, 6);
          ctx.strokeStyle = '#F59E0B';
          ctx.lineWidth = 1.2;
          ctx.strokeRect(-4, -17, 10, 6);
        } else if (npc.familyId === 'valenti') {
          // Valenti Crew Trait: Twin Emerald Racing Stripes on sleeves + Green Aviator Shades
          ctx.strokeStyle = '#34D399';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-5, -11);
          ctx.lineTo(7, -11);
          ctx.moveTo(-5, 11);
          ctx.lineTo(7, 11);
          ctx.stroke();
          // Emerald aviator lenses at front of head
          ctx.fillStyle = '#10B981';
          ctx.fillRect(6, -5.5, 3.5, 4.5);
          ctx.fillRect(6, 1, 3.5, 4.5);
          ctx.strokeStyle = '#FDE047';
          ctx.lineWidth = 0.8;
          ctx.strokeRect(6, -5.5, 3.5, 4.5);
          ctx.strokeRect(6, 1, 3.5, 4.5);
        } else if (npc.familyId === 'moretti') {
          // Moretti Waterfront Trait: Steel-Riveted Stevedore Epaulets + Silver Cargo Hook Sash
          ctx.fillStyle = '#60A5FA';
          ctx.fillRect(-4, -13, 8, 4);
          ctx.fillRect(-4, 9, 8, 4);
          // Diagonal silver dock chain sash
          ctx.strokeStyle = '#E2E8F0';
          ctx.lineWidth = 1.8;
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.moveTo(-7, -8);
          ctx.lineTo(7, 8);
          ctx.stroke();
          ctx.setLineDash([]);
        } else if (npc.familyId === 'rastelli') {
          // Rastelli Faction Trait: Purple Velour Shawl Collar + Lit Cuban Cigar with glowing ember
          ctx.strokeStyle = '#C084FC';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, 9.5, -Math.PI * 0.65, Math.PI * 0.65);
          ctx.stroke();
          // Cuban cigar & glowing orange ember
          ctx.fillStyle = '#78350F';
          ctx.fillRect(7, 2, 7, 2.5);
          ctx.fillStyle = Math.floor(now / 160) % 2 === 0 ? '#F97316' : '#EF4444';
          ctx.fillRect(13, 2, 2.2, 2.5);
        } else if (npc.familyId === 'nypd') {
          // Gold NYPD breast shield
          ctx.fillStyle = '#FACC15';
          ctx.beginPath();
          ctx.arc(5, -6, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (npc.familyId === 'player') {
          // Allied Made Man gold lapel pin
          ctx.fillStyle = '#F59E0B';
          ctx.beginPath();
          ctx.arc(5, -6, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Gun barrel / Brass Knuckles indicator
        ctx.fillStyle = '#A1A1AA';
        ctx.fillRect(10, -2, npc.role === 'brawler' ? 7 : 13, 4);
        ctx.restore();

        // Fedora crown
        ctx.fillStyle = npc.hitFlashTimer > 0 ? '#FCA5A5' : npc.hatColor;
        ctx.beginPath();
        ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
        ctx.fill();

        // Hatband ribbon in family accent color
        ctx.strokeStyle = famVis.accent;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();

        // 3. Overhead Family Alignment Emblem & Trait Indicator Tag
        if (npc.familyId !== 'civilian') {
          ctx.fillStyle = famVis.accent;
          ctx.font = '700 9px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(
            `${famVis.symbol} ${famVis.shortFamily} · ${famVis.traitTag}`,
            npc.x,
            npc.y - (npc.hp < npc.maxHp || npc.role === 'capo' || npc.state !== 'patrol' ? 41 : 22)
          );
        }

        // Health bar & Nameplate when engaged, damaged, or special role
        if (npc.hp < npc.maxHp || npc.role === 'capo' || npc.role === 'courier' || npc.state !== 'patrol') {
          const barW = 38;
          const pct = Math.max(0, npc.hp / npc.maxHp);
          ctx.fillStyle = 'rgba(9, 9, 11, 0.85)';
          ctx.fillRect(npc.x - barW / 2, npc.y - 25, barW, 5);
          ctx.fillStyle = npc.role === 'ally' ? '#10B981' : npc.role === 'courier' ? '#F59E0B' : famVis.accent;
          ctx.fillRect(npc.x - barW / 2, npc.y - 25, barW * pct, 5);

          ctx.fillStyle = '#E4E4E7';
          ctx.font = '600 10px "Plus Jakarta Sans", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(npc.name, npc.x, npc.y - 30);
        }
      }

      // Draw Player Character (The Rising Don)
      if (!st.isTitleScreen) {
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.scale(player.squash, 2 - player.squash);

        // Player subtle selection ring
        ctx.strokeStyle = 'rgba(220, 38, 38, 0.55)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 21, 0, Math.PI * 2);
        ctx.stroke();

        // Rotate toward aim angle
        ctx.save();
        ctx.rotate(player.angle);
        // Weapon silhouette
        ctx.fillStyle = '#D4D4D8';
        ctx.fillRect(12, -2.5, st.equippedWeapon === 'knuckles' ? 8 : 16, 5);
        ctx.restore();

        // Pinstripe Overcoat shoulders
        ctx.fillStyle = player.hitFlash > 0 ? '#EF4444' : '#1C1917';
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 2.2;
        ctx.stroke();

        // Don's Fedora
        ctx.fillStyle = '#B91C1C';
        ctx.beginPath();
        ctx.arc(0, 0, 8.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // Draw Bullets & Tracers
      for (const b of bullets) {
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x - b.vx * 0.022, b.y - b.vy * 0.022);
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
