import React, { useEffect, useRef } from 'react';
import {
  BoroughId,
  BoroughZone,
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

interface StreetCar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  isPolice: boolean;
}

export interface WorldCallbacks {
  onEarnResources: (cash: number, contraband: number, respectXp: number, heatDelta: number, reason?: string) => void;
  onCollectRacketEnvelope: (racketId: string) => void;
  onOpenRacketModal: (racketId: string) => void;
  onOpenContactSitDown: (contactId: string) => void;
  onPlayerDamaged: (damage: number, attackerName: string) => void;
  onBoroughChanged: (boroughId: BoroughId) => void;
  onSelectWeapon: (weaponId: WeaponId) => void;
  onNearInteractableChange: (prompt: { type: 'racket' | 'contact' | 'npc'; label: string; sublabel: string; id: string } | null) => void;
  onTurfCapoDefeated: (racketId: string) => void;
}

export interface LiveSimulationBridge {
  teleportToBorough: (boroughId: BoroughId) => void;
  teleportToCoords: (x: number, y: number) => void;
  spawnTurfDefenseWave: (racket: RacketBuilding) => void;
  spawnAlliedHitSquad: () => void;
  triggerHealEffect: (text: string) => void;
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

const WORLD_WIDTH = 3200;
const WORLD_HEIGHT = 2120;

const FAMILY_COAT_COLORS: Record<string, { coat: string; hat: string }> = {
  corvini: { coat: '#7F1D1D', hat: '#991B1B' },
  bellini: { coat: '#78350F', hat: '#B45309' },
  valenti: { coat: '#064E3B', hat: '#047857' },
  moretti: { coat: '#1E3A8A', hat: '#1D4ED8' },
  rastelli: { coat: '#4C1D95', hat: '#6D28D9' },
  nypd: { coat: '#172554', hat: '#38BDF8' },
  civilian: { coat: '#3F3F46', hat: '#71717A' },
  player: { coat: '#1C1917', hat: '#D97706' },
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

    // Player physical state
    const player = {
      x: 420,
      y: 380,
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
      x: 420,
      y: 380,
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
      worldX: 420,
      worldY: 380,
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
    const streetCars: StreetCar[] = [];

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
          const px = b.bounds.x + 110 + Math.random() * (b.bounds.width - 220);
          const py = b.bounds.y + 110 + Math.random() * (b.bounds.height - 220);
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

      // Spawn 1980s sedans and yellow cabs on the main avenues
      streetCars.length = 0;
      const carColors = ['#EAB308', '#EAB308', '#1E293B', '#450A0A', '#27272A', '#172554'];
      for (let i = 0; i < 10; i++) {
        const horizontal = i % 2 === 0;
        streetCars.push({
          x: Math.random() * WORLD_WIDTH,
          y: horizontal ? 1040 + (i % 4 === 0 ? -22 : 22) : Math.random() * WORLD_HEIGHT,
          vx: horizontal ? (i % 4 === 0 ? 150 : -150) : 0,
          vy: horizontal ? 0 : i % 3 === 0 ? 140 : -140,
          color: carColors[i % carColors.length],
          isPolice: i === 9,
        });
      }
    };

    initWorldNpcs();

    // Expose imperative bridge for React UI actions
    bridgeRef.current = {
      teleportToBorough: (boroughId: BoroughId) => {
        const b = NYC_BOROUGHS.find((zone) => zone.id === boroughId);
        if (b) {
          player.x = b.spawnPoint.x;
          player.y = b.spawnPoint.y;
          camera.x = b.spawnPoint.x;
          camera.y = b.spawnPoint.y;
          addFloatingText(player.x, player.y - 20, `ARRIVED: ${b.name.toUpperCase()}`, '#F59E0B');
        }
      },
      teleportToCoords: (x: number, y: number) => {
        player.x = x;
        player.y = y;
        camera.x = x;
        camera.y = y;
      },
      spawnTurfDefenseWave: (racket: RacketBuilding) => {
        const b = NYC_BOROUGHS.find((z) => z.id === racket.boroughId) || NYC_BOROUGHS[0];
        const palette = FAMILY_COAT_COLORS[racket.ownerFamily] || FAMILY_COAT_COLORS.corvini;
        const tierMult = 1 + (racket.defenseDifficulty - 1) * 0.4;
        // Teleport player just outside the racket entrance if far away
        const dist = Math.hypot(player.x - (racket.x + racket.width / 2), player.y - (racket.y + racket.height + 55));
        if (dist > 360) {
          player.x = racket.x + racket.width / 2;
          player.y = racket.y + racket.height + 65;
          camera.x = player.x;
          camera.y = player.y;
        }
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
          x: racket.x + racket.width / 2,
          y: racket.y + racket.height + 28,
          vx: 0,
          vy: 0,
          hp: Math.round(240 * tierMult),
          maxHp: Math.round(240 * tierMult),
          angle: Math.PI / 2,
          state: 'windup',
          stateTimer: 0.5,
          patrolOriginX: racket.x + racket.width / 2,
          patrolOriginY: racket.y + racket.height + 28,
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
            x: racket.x + (g === 0 ? -24 : racket.width + 24),
            y: racket.y + racket.height + 20,
            vx: 0,
            vy: 0,
            hp: Math.round(130 * tierMult),
            maxHp: Math.round(130 * tierMult),
            angle: Math.PI / 2,
            state: 'patrol',
            stateTimer: 0.3,
            patrolOriginX: racket.x + racket.width / 2,
            patrolOriginY: racket.y + racket.height + 25,
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
          npcs.push({
            id: `ally_${Date.now()}_${i}`,
            name: `Corvini Cadillac Enforcer`,
            role: 'ally',
            familyId: 'player',
            x: player.x + (i === 0 ? -40 : 40),
            y: player.y + 30,
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

      const st = stateRef.current;
      const touchActive = isTouchMode();
      if (st.isPaused || st.isTitleScreen) clearSticks(sticks);

      // Hitstop simulation pause for weighty impacts
      if (hitstopTimer > 0) {
        hitstopTimer -= dt;
      } else if (!st.isPaused) {
        if (st.isTitleScreen) {
          // Live atmospheric camera pan across 1984 NYC on the Title Screen
          camera.panAngle += dt * 0.18;
          camera.x = 1550 + Math.cos(camera.panAngle) * 950;
          camera.y = 1020 + Math.sin(camera.panAngle * 0.7) * 520;
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

          player.x = Math.max(60, Math.min(WORLD_WIDTH - 60, player.x + player.vx * dt));
          player.y = Math.max(60, Math.min(WORLD_HEIGHT - 60, player.y + player.vy * dt));

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

          // Detect current Borough
          for (const b of NYC_BOROUGHS) {
            if (
              player.x >= b.bounds.x &&
              player.x <= b.bounds.x + b.bounds.width &&
              player.y >= b.bounds.y &&
              player.y <= b.bounds.y + b.bounds.height
            ) {
              if (player.currentBorough !== b.id) {
                player.currentBorough = b.id;
                st.callbacks.onBoroughChanged(b.id);
              }
              break;
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
          let nearestPrompt: { type: 'racket' | 'contact' | 'npc'; label: string; sublabel: string; id: string } | null = null;
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
            const doorX = r.x + r.width / 2;
            const doorY = r.y + r.height + 15;
            const d = Math.hypot(player.x - doorX, player.y - doorY);
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
            }
          }

          // Smooth camera follow with decaying directional shake
          camera.x += (player.x - camera.x) * Math.min(1, dt * 8.5);
          camera.y += (player.y - camera.y) * Math.min(1, dt * 8.5);
          if (camera.shake > 0) {
            camera.shake = Math.max(0, camera.shake - dt * 28);
          }
        }

        // Ensure Allied Bodyguards exist if unlocked
        if (st.hasAlliedBodyguards) {
          const allyCount = npcs.filter((n) => n.role === 'ally').length;
          if (allyCount < 2) {
            npcs.push({
              id: `ally_skill_${Date.now()}_${allyCount}`,
              name: 'Made Bodyguard',
              role: 'ally',
              familyId: 'player',
              x: player.x + (allyCount === 0 ? -38 : 38),
              y: player.y + 32,
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
          npcs.push({
            id: `nypd_${Date.now()}`,
            name: 'NYPD Organized Crime Task Force',
            role: 'nypd',
            familyId: 'nypd',
            x: player.x + Math.cos(spawnAngle) * 420,
            y: player.y + Math.sin(spawnAngle) * 420,
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
          if (b.life <= 0) {
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
        for (let i = npcs.length - 1; i >= 0; i--) {
          const npc = npcs[i];
          if (npc.hitFlashTimer > 0) npc.hitFlashTimer -= dt;
          npc.squash += (1 - npc.squash) * Math.min(1, dt * 12);

          if (npc.hp <= 0) {
            // NPC eliminated!
            hitstopTimer = npc.role === 'capo' ? 0.075 : 0.035;
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
            if (!guardId && npc.role !== 'ally' && npc.role !== 'nypd') {
              const b = NYC_BOROUGHS[Math.floor(Math.random() * NYC_BOROUGHS.length)];
              const palette = FAMILY_COAT_COLORS[b.controllingFamilyDefault];
              npcs.push({
                id: `npc_respawn_${Date.now()}_${Math.random()}`,
                name: npc.name,
                role: npc.role,
                familyId: b.controllingFamilyDefault,
                x: b.bounds.x + 120 + Math.random() * (b.bounds.width - 240),
                y: b.bounds.y + 120 + Math.random() * (b.bounds.height - 240),
                vx: 0,
                vy: 0,
                hp: npc.maxHp,
                maxHp: npc.maxHp,
                angle: 0,
                state: 'patrol',
                stateTimer: 2,
                patrolOriginX: b.spawnPoint.x,
                patrolOriginY: b.spawnPoint.y,
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
            if (distToPlayer > 24) {
              const a = Math.atan2(targetFollowY - npc.y, targetFollowX - npc.x);
              npc.vx = Math.cos(a) * 200;
              npc.vy = Math.sin(a) * 200;
              npc.angle = a;
            } else {
              npc.vx *= 0.8;
              npc.vy *= 0.8;
            }
            npc.x += npc.vx * dt;
            npc.y += npc.vy * dt;

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
            if (isHostileByDefault && !st.isTitleScreen && distToPlayer < 240) {
              npc.state = 'windup';
              npc.stateTimer = npc.role === 'brawler' ? 0.48 : 0.6;
            } else {
              if (npc.stateTimer <= 0) {
                npc.stateTimer = 1.8 + Math.random() * 2.5;
                const wanderAngle = Math.atan2(npc.patrolOriginY - npc.y, npc.patrolOriginX - npc.x) + (Math.random() - 0.5) * 2.2;
                npc.vx = Math.cos(wanderAngle) * 55;
                npc.vy = Math.sin(wanderAngle) * 55;
                npc.angle = wanderAngle;
              }
              npc.x += npc.vx * dt;
              npc.y += npc.vy * dt;
            }
          } else if (npc.state === 'windup') {
            // Visible windup telegraph before attack!
            npc.angle = Math.atan2(player.y - npc.y, player.x - npc.x);
            if (npc.role === 'brawler') {
              // Slowly step in during windup
              npc.x += Math.cos(npc.angle) * 65 * dt;
              npc.y += Math.sin(npc.angle) * 65 * dt;
            }
            if (npc.stateTimer <= 0) {
              npc.state = 'attack';
              npc.stateTimer = 0.25;
              if (npc.role === 'brawler') {
                // Heavy brass-knuckle dash lunge
                npc.vx = Math.cos(npc.angle) * 380;
                npc.vy = Math.sin(npc.angle) * 380;
                if (distToPlayer < 85 && !st.isTitleScreen) {
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
            npc.x += npc.vx * dt;
            npc.y += npc.vy * dt;
            npc.vx *= 0.88;
            npc.vy *= 0.88;
            if (npc.stateTimer <= 0) {
              npc.state = 'cooldown';
              npc.stateTimer = npc.role === 'capo' ? 0.65 : 0.95;
            }
          } else if (npc.state === 'cooldown') {
            // Reposition slightly
            const strafeAngle = Math.atan2(player.y - npc.y, player.x - npc.x) + Math.PI / 2;
            npc.x += Math.cos(strafeAngle) * 70 * dt;
            npc.y += Math.sin(strafeAngle) * 70 * dt;
            npc.angle = Math.atan2(player.y - npc.y, player.x - npc.x);
            if (npc.stateTimer <= 0) {
              npc.state = distToPlayer < 360 ? 'windup' : 'patrol';
              npc.stateTimer = npc.role === 'brawler' ? 0.45 : 0.58;
            }
          }
        }

        // Update ambient 1984 NYC traffic
        for (const car of streetCars) {
          car.x += car.vx * dt;
          car.y += car.vy * dt;
          if (car.x > WORLD_WIDTH + 80) car.x = -80;
          if (car.x < -80) car.x = WORLD_WIDTH + 80;
          if (car.y > WORLD_HEIGHT + 80) car.y = -80;
          if (car.y < -80) car.y = WORLD_HEIGHT + 80;
        }

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

      ctx.save();
      const shakeX = (Math.random() - 0.5) * camera.shake * 2;
      const shakeY = (Math.random() - 0.5) * camera.shake * 2;
      ctx.translate(canvas.width / 2 - camera.x + shakeX, canvas.height / 2 - camera.y + shakeY);

      // East River / Hudson River dark water channels between boroughs
      ctx.fillStyle = '#070B12';
      ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

      // Draw Borough Zones & Street Grid
      for (const b of NYC_BOROUGHS) {
        ctx.fillStyle = b.floorColor;
        ctx.fillRect(b.bounds.x, b.bounds.y, b.bounds.width, b.bounds.height);

        // Subtle city block cobblestone/asphalt grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.035)';
        ctx.lineWidth = 1;
        for (let gx = b.bounds.x + 80; gx < b.bounds.x + b.bounds.width; gx += 90) {
          ctx.beginPath();
          ctx.moveTo(gx, b.bounds.y);
          ctx.lineTo(gx, b.bounds.y + b.bounds.height);
          ctx.stroke();
        }
        for (let gy = b.bounds.y + 80; gy < b.bounds.y + b.bounds.height; gy += 90) {
          ctx.beginPath();
          ctx.moveTo(b.bounds.x, gy);
          ctx.lineTo(b.bounds.x + b.bounds.width, gy);
          ctx.stroke();
        }

        // Borough territory perimeter border
        ctx.strokeStyle = b.borderColor;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(b.bounds.x, b.bounds.y, b.bounds.width, b.bounds.height);

        // Borough Ground Stencil Label
        ctx.fillStyle = 'rgba(245, 240, 230, 0.14)';
        ctx.font = '700 22px "Cinzel", serif';
        ctx.fillText(b.name.toUpperCase(), b.bounds.x + 24, b.bounds.y + 42);
        ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
        ctx.font = '600 12px "JetBrains Mono", monospace';
        ctx.fillText(
          `${b.riskLabel.toUpperCase()} · ${b.rewardMultiplier.toFixed(2)}X TRIBUTE`,
          b.bounds.x + 24,
          b.bounds.y + 62
        );
      }

      // Draw NYC Bridges & Grand Avenues connecting the 5 Boroughs
      ctx.fillStyle = '#18181B';
      // Horizontal Grand Expressway
      ctx.fillRect(80, 1005, WORLD_WIDTH - 160, 74);
      // Vertical Bridges connecting North & South boroughs
      ctx.fillRect(1020, 80, 95, WORLD_HEIGHT - 160);
      ctx.fillRect(2095, 80, 85, WORLD_HEIGHT - 160);

      // Yellow double-dashed centerlines on avenues
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.35)';
      ctx.lineWidth = 2;
      ctx.setLineDash([18, 14]);
      ctx.beginPath();
      ctx.moveTo(80, 1042);
      ctx.lineTo(WORLD_WIDTH - 80, 1042);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw 1984 Street Cars
      for (const car of streetCars) {
        ctx.save();
        ctx.translate(car.x, car.y);
        const angle = Math.atan2(car.vy, car.vx);
        ctx.rotate(angle);
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(-24, -10, 48, 24);
        ctx.fillStyle = car.color;
        ctx.fillRect(-22, -11, 44, 22);
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
          ctx.fillStyle = Math.floor(now / 180) % 2 === 0 ? '#EF4444' : '#3B82F6';
          ctx.fillRect(-3, -6, 6, 12);
        }
        ctx.restore();
      }

      // Draw all 15 Historical Racket Buildings
      for (const r of st.rackets) {
        const isPlayerOwned = r.ownerFamily === 'player';
        // Drop shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(r.x + 8, r.y + 10, r.width, r.height);

        // Building roof
        ctx.fillStyle = isPlayerOwned ? '#14532D' : r.roofColor;
        ctx.fillRect(r.x, r.y, r.width, r.height);

        // Building architectural trim
        ctx.strokeStyle = isPlayerOwned ? '#10B981' : '#78716C';
        ctx.lineWidth = isPlayerOwned ? 2.5 : 1.5;
        ctx.strokeRect(r.x, r.y, r.width, r.height);

        // Inner rooftop skylight / HVAC detail
        ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
        ctx.fillRect(r.x + 12, r.y + 12, r.width - 24, r.height - 32);

        // Warm storefront awning at bottom edge
        ctx.fillStyle = isPlayerOwned ? '#059669' : '#991B1B';
        ctx.fillRect(r.x + r.width / 2 - 28, r.y + r.height - 6, 56, 10);

        // Neon Sign & Racket Name
        ctx.fillStyle = '#F5F0E6';
        ctx.font = '700 12px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(r.name, r.x + r.width / 2, r.y + 28);

        ctx.fillStyle = isPlayerOwned ? '#6EE7B7' : '#FBBF24';
        ctx.font = '600 10px "JetBrains Mono", monospace';
        ctx.fillText(
          isPlayerOwned ? `YOUR TURF · LV.${r.level} ($${(r.baseIncomePerHour * r.level).toLocaleString()}/HR)` : `${r.ownerFamily.toUpperCase()} TURF · LV.${r.level}`,
          r.x + r.width / 2,
          r.y + 46
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

      // Draw all Active World NPCs (Soldati, Brawlers, Capos, Couriers, NYPD, Allies)
      for (const npc of npcs) {
        ctx.save();

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
        ctx.arc(0, 0, npc.role === 'capo' ? 16 : 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = npc.role === 'capo' ? '#F59E0B' : 'rgba(255,255,255,0.22)';
        ctx.lineWidth = npc.role === 'capo' ? 2.5 : 1.2;
        ctx.stroke();

        // Gun barrel / Brass Knuckles indicator
        ctx.save();
        ctx.rotate(npc.angle);
        ctx.fillStyle = '#A1A1AA';
        ctx.fillRect(10, -2, npc.role === 'brawler' ? 7 : 13, 4);
        ctx.restore();

        // Fedora crown
        ctx.fillStyle = npc.hitFlashTimer > 0 ? '#FCA5A5' : npc.hatColor;
        ctx.beginPath();
        ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Health bar & label above NPC
        if (npc.hp < npc.maxHp || npc.role === 'capo' || npc.role === 'courier' || npc.state !== 'patrol') {
          const barW = 36;
          const pct = Math.max(0, npc.hp / npc.maxHp);
          ctx.fillStyle = 'rgba(9, 9, 11, 0.85)';
          ctx.fillRect(npc.x - barW / 2, npc.y - 25, barW, 5);
          ctx.fillStyle = npc.role === 'ally' ? '#10B981' : npc.role === 'courier' ? '#F59E0B' : '#EF4444';
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
