// Procedural Web Audio API synthesizer for 1984 Noir / Mafia game feel

class SoundEngine {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;

  private getContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public playUiClick() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.035);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  public playMeleeHit(heavy: boolean = false) {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Punch sub-thud
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(heavy ? 140 : 180, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + (heavy ? 0.16 : 0.1));
    gain.gain.setValueAtTime(heavy ? 0.32 : 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (heavy ? 0.17 : 0.11));
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + (heavy ? 0.18 : 0.12));
  }

  public playGunshot(weapon: 'revolver' | 'shotgun' | 'tommy') {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const duration = weapon === 'shotgun' ? 0.26 : weapon === 'revolver' ? 0.16 : 0.1;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * (weapon === 'shotgun' ? 0.07 : 0.035)));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(weapon === 'shotgun' ? 650 : weapon === 'revolver' ? 950 : 1200, now);
    filter.Q.setValueAtTime(0.9, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(weapon === 'shotgun' ? 0.34 : 0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);

    // Low-end barrel thump
    const kick = ctx.createOscillator();
    const kickGain = ctx.createGain();
    kick.type = 'triangle';
    kick.frequency.setValueAtTime(weapon === 'shotgun' ? 110 : 150, now);
    kick.frequency.exponentialRampToValueAtTime(32, now + 0.12);
    kickGain.gain.setValueAtTime(weapon === 'shotgun' ? 0.3 : 0.18, now);
    kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    kick.connect(kickGain);
    kickGain.connect(ctx.destination);
    kick.start(now);
    kick.stop(now + 0.14);
  }

  public playCashCollect() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [659.25, 880, 1318.5]; // E5, A5, E6 register chime
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.045);
      gain.gain.setValueAtTime(0.11, now + idx * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.045 + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.045);
      osc.stop(now + idx * 0.045 + 0.24);
    });
  }

  public playTurfCaptured() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Gritty Godfather-inspired minor 6th brass swell (A2 - C3 - E3 - F3 - A3)
    const freqs = [110, 130.81, 164.81, 220, 261.63];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, now);

      gain.gain.setValueAtTime(0.001, now + i * 0.06);
      gain.gain.linearRampToValueAtTime(0.075, now + i * 0.06 + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.06);
      osc.stop(now + 0.9);
    });
  }

  public playFavorComplete() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const freqs = [293.66, 349.23, 440, 587.33]; // D minor warm chord
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.055);
      gain.gain.setValueAtTime(0.1, now + idx * 0.055);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.055 + 0.38);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.055);
      osc.stop(now + idx * 0.055 + 0.4);
    });
  }

  public playPoliceSiren() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(580, now);
    osc.frequency.linearRampToValueAtTime(860, now + 0.25);
    osc.frequency.linearRampToValueAtTime(560, now + 0.5);
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.52);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.55);
  }
}

export const soundEngine = new SoundEngine();
