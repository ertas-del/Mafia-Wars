// Phone vibration feedback. Pure module: the vibrate function, storage and
// clock are injectable so the rate limiter and toggle can be tested in Node.

export type PulseKind = 'damage' | 'heavyHit' | 'capoTakedown';

export const PULSE_MS: Record<PulseKind, number> = {
  damage: 40,
  heavyHit: 25,
  capoTakedown: 80,
};

/** At most one pulse starts per window, unless a longer one replaces it. */
export const PULSE_WINDOW_MS = 100;

export const VIBRATION_STORAGE_KEY = 'commission_1984_vibration_v1';

export type VibrateFn = (ms: number) => unknown;

export interface HapticsStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface HapticsDeps {
  vibrate: VibrateFn | null;
  storage: HapticsStorage | null;
  now: () => number;
}

export interface Haptics {
  pulse(kind: PulseKind): void;
  isVibrationSupported(): boolean;
  getVibrationEnabled(): boolean;
  setVibrationEnabled(on: boolean): void;
}

export function createHaptics(deps: HapticsDeps): Haptics {
  let enabled: boolean | null = null;
  let windowStart = -Infinity;
  let windowMs = 0;

  const isVibrationSupported = (): boolean => typeof deps.vibrate === 'function';

  const getVibrationEnabled = (): boolean => {
    if (enabled !== null) return enabled;
    let stored: string | null = null;
    try {
      stored = deps.storage ? deps.storage.getItem(VIBRATION_STORAGE_KEY) : null;
    } catch {
      stored = null;
    }
    enabled = stored !== '0';
    return enabled;
  };

  const setVibrationEnabled = (on: boolean): void => {
    enabled = on;
    try {
      deps.storage?.setItem(VIBRATION_STORAGE_KEY, on ? '1' : '0');
    } catch {
      // Storage full or blocked; the in-memory choice still applies.
    }
  };

  const pulse = (kind: PulseKind): void => {
    const vibrate = deps.vibrate;
    if (typeof vibrate !== 'function' || !getVibrationEnabled()) return;
    const ms = PULSE_MS[kind];
    const t = deps.now();
    if (t - windowStart < PULSE_WINDOW_MS) {
      // Inside the window: only a longer pulse may replace the current one.
      if (ms <= windowMs) return;
    } else {
      windowStart = t;
    }
    windowMs = ms;
    try {
      vibrate(ms);
    } catch {
      // Some browsers throw when vibration is blocked; feedback is optional.
    }
  };

  return { pulse, isVibrationSupported, getVibrationEnabled, setVibrationEnabled };
}

function defaultDeps(): HapticsDeps {
  let vibrate: VibrateFn | null = null;
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      vibrate = (ms: number) => navigator.vibrate(ms);
    }
  } catch {
    vibrate = null;
  }
  let storage: HapticsStorage | null = null;
  try {
    storage = typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    storage = null;
  }
  return { vibrate, storage, now: () => Date.now() };
}

const shared = createHaptics(defaultDeps());

export const pulse = (kind: PulseKind): void => shared.pulse(kind);
export const isVibrationSupported = (): boolean => shared.isVibrationSupported();
export const getVibrationEnabled = (): boolean => shared.getVibrationEnabled();
export const setVibrationEnabled = (on: boolean): void => shared.setVibrationEnabled(on);
