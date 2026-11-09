// Pure twin-stick touch logic. No DOM, React or Vite imports so it runs under node --test.

export const STICK_RADIUS = 60;
export const DEAD_ZONE = 0.15;
export const SPRINT_THRESHOLD = 0.85;

export interface Stick {
  id: number;
  baseX: number;
  baseY: number;
  /** Knob position, clamped to STICK_RADIUS from the base. */
  knobX: number;
  knobY: number;
  /** Raw deflection as a fraction of the radius, 0..1. */
  deflection: number;
  /** Drag direction in radians. */
  angle: number;
}

export interface TwinSticks {
  move: Stick | null;
  aim: Stick | null;
  /** Last aim direction beyond the dead zone; kept after release. */
  facing: number | null;
}

export interface MoveOutput {
  x: number;
  y: number;
  sprint: boolean;
}

export interface AimOutput {
  active: boolean;
  angle: number | null;
  attack: boolean;
}

export function createTwinSticks(): TwinSticks {
  return { move: null, aim: null, facing: null };
}

function updateStick(s: TwinSticks, stick: Stick, x: number, y: number): void {
  const dx = x - stick.baseX;
  const dy = y - stick.baseY;
  const dist = Math.hypot(dx, dy);
  const clamped = Math.min(dist, STICK_RADIUS);
  stick.angle = dist > 0 ? Math.atan2(dy, dx) : stick.angle;
  stick.knobX = stick.baseX + (dist > 0 ? (dx / dist) * clamped : 0);
  stick.knobY = stick.baseY + (dist > 0 ? (dy / dist) * clamped : 0);
  stick.deflection = clamped / STICK_RADIUS;
  if (stick === s.aim && stick.deflection > DEAD_ZONE) s.facing = stick.angle;
}

/** Starts a stick for a new touch; left half moves, right half aims. Returns which stick, or null if ignored. */
export function touchStart(s: TwinSticks, id: number, x: number, y: number, screenWidth: number): 'move' | 'aim' | null {
  if (s.move?.id === id || s.aim?.id === id) return null;
  const side = x < screenWidth / 2 ? 'move' : 'aim';
  if (s[side] !== null) return null;
  s[side] = { id, baseX: x, baseY: y, knobX: x, knobY: y, deflection: 0, angle: 0 };
  return side;
}

/** Updates the stick bound to this touch id. Returns false if the id owns no stick. */
export function touchMove(s: TwinSticks, id: number, x: number, y: number): boolean {
  const stick = s.move?.id === id ? s.move : s.aim?.id === id ? s.aim : null;
  if (!stick) return false;
  updateStick(s, stick, x, y);
  return true;
}

/** Releases the stick bound to this touch id. */
export function touchEnd(s: TwinSticks, id: number): boolean {
  if (s.move?.id === id) {
    s.move = null;
    return true;
  }
  if (s.aim?.id === id) {
    s.aim = null;
    return true;
  }
  return false;
}

/** Clears both sticks (touchcancel, blur, pause). Facing is kept. */
export function clearSticks(s: TwinSticks): void {
  s.move = null;
  s.aim = null;
}

/** Movement vector scaled by deflection beyond the dead zone: 0 inside it, 1 at full radius. */
export function getMove(s: TwinSticks): MoveOutput {
  const m = s.move;
  if (!m || m.deflection <= DEAD_ZONE) return { x: 0, y: 0, sprint: false };
  const mag = Math.min(1, (m.deflection - DEAD_ZONE) / (1 - DEAD_ZONE));
  return { x: Math.cos(m.angle) * mag, y: Math.sin(m.angle) * mag, sprint: m.deflection >= SPRINT_THRESHOLD };
}

/** Aim state: attack only while the aim stick is beyond the dead zone; angle is the retained facing. */
export function getAim(s: TwinSticks): AimOutput {
  const active = s.aim !== null && s.aim.deflection > DEAD_ZONE;
  return { active, angle: s.facing, attack: active };
}
