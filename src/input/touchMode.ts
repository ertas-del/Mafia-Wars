// Touch mode: on at any touchstart, off at any keydown; mouse never changes it.
// Pinned interface: <html data-input="touch" | "keyboard">.

type Listener = (touch: boolean) => void;

let touchMode = false;
let installed = false;
const listeners = new Set<Listener>();

function setTouchMode(on: boolean): void {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.input = on ? 'touch' : 'keyboard';
  }
  if (on === touchMode) return;
  touchMode = on;
  listeners.forEach((fn) => fn(on));
}

export function isTouchMode(): boolean {
  return touchMode;
}

export function subscribeTouchMode(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Installs the window listeners once. Safe to call repeatedly. */
export function installTouchMode(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  setTouchMode(false);
  window.addEventListener('touchstart', () => setTouchMode(true), { capture: true, passive: true });
  window.addEventListener('keydown', () => setTouchMode(false), { capture: true });
}

installTouchMode();
