// Phone fullscreen + landscape lock helpers. Every request is best-effort:
// browsers may refuse fullscreen (no user gesture, iOS Safari) or the
// orientation lock (not fullscreen, desktop), and the game must still start.

type OrientationLockFn = (orientation: string) => Promise<void>;

/** True when the document currently has an element in fullscreen. */
export function isFullscreen(): boolean {
  return typeof document !== 'undefined' && document.fullscreenElement != null;
}

/** True when touch mode is on (attribute set by src/input/touchMode.ts). */
export function isTouchModeAttr(): boolean {
  return typeof document !== 'undefined' && document.documentElement.dataset.input === 'touch';
}

/**
 * Requests fullscreen on <html>, then a landscape orientation lock.
 * Never rejects; each step's failure is swallowed independently.
 */
export async function enterPhoneFullscreen(): Promise<void> {
  if (typeof document === 'undefined') return;

  try {
    const root = document.documentElement;
    if (!isFullscreen() && typeof root.requestFullscreen === 'function') {
      await root.requestFullscreen({ navigationUI: 'hide' });
    }
  } catch {
    // Fullscreen refused or unsupported; the rotate card remains the guard.
  }

  try {
    const orientation: ScreenOrientation | undefined =
      typeof screen !== 'undefined' ? screen.orientation : undefined;
    const lock = (orientation as unknown as { lock?: OrientationLockFn } | undefined)?.lock;
    if (orientation && typeof lock === 'function') {
      await lock.call(orientation, 'landscape');
    }
  } catch {
    // Orientation lock refused or unsupported.
  }
}
