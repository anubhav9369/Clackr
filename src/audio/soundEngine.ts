/**
 * Procedural mechanical-keyboard sound engine.
 *
 * Each "switch profile" is synthesized in real time with the Web Audio API:
 * a short burst of filtered noise (the click/clack) plus a low resonant
 * "thock" body. No audio assets required, so latency is ~0 and every profile
 * is fully tweakable.
 */

import { SOUND_DEFINES_DOWN, SOUND_DEFINES_UP } from "./keySprite";

export type SoundProfileId =
  | "keythm"
  | "mxblue"
  | "mxbrown"
  | "mxred"
  | "thock"
  | "cream"
  | "typewriter"
  | "classictw"
  | "holypanda"
  | "alpaca"
  | "off";

/** Which sound plays on a wrong keystroke. */
export type ErrorSoundType = "buzzer" | "faah";

/** The kind of key pressed, used to vary the typewriter sound. */
export type KeyKind = "key" | "space" | "backspace" | "enter";

/**
 * PLACEHOLDER — put your "faah" audio file here.
 *
 * Drop your file in the `public/` folder (e.g. public/sounds/faah.mp3) and
 * update this path. Anything under public/ is served from the site root, so
 * "public/sounds/faah.mp3" is referenced as "/sounds/faah.mp3".
 */
export const FAAH_SOUND_PATH = "/sounds/faah.mp3";

/** Realistic recorded keyboard sound sprite (from the original keythm). */
export const SPRITE_SOUND_PATH = "/sounds/sound.ogg";

export interface SoundProfile {
  id: SoundProfileId;
  name: string;
  description: string;
}

export const soundProfiles: SoundProfile[] = [
  { id: "keythm", name: "Realistic", description: "recorded mechanical (keythm)" },
  { id: "mxblue", name: "MX Blue", description: "sharp clicky" },
  { id: "mxbrown", name: "MX Brown", description: "soft tactile" },
  { id: "mxred", name: "MX Red", description: "light linear" },
  { id: "thock", name: "Thock", description: "deep & creamy" },
  { id: "cream", name: "Cream", description: "rounded poppy" },
  { id: "typewriter", name: "Typewriter", description: "vintage clack" },
  { id: "classictw", name: "Classic Typewriter", description: "metallic strike + bell" },
  { id: "holypanda", name: "Holy Panda", description: "premium tactile" },
  { id: "alpaca", name: "Alpaca", description: "smooth marble" },
  { id: "off", name: "Off", description: "silent" },
];

interface ToneParams {
  // noise burst
  noiseDuration: number;
  noiseGain: number;
  noiseFilterType: BiquadFilterType;
  noiseFilterFreq: number;
  noiseFilterQ: number;
  // resonant body
  bodyFreq: number;
  bodyGain: number;
  bodyDuration: number;
  bodyType: OscillatorType;
  // optional click transient (high pop)
  clickFreq?: number;
  clickGain?: number;
}

const PROFILE_PARAMS: Partial<Record<SoundProfileId, ToneParams>> = {
  mxblue: {
    noiseDuration: 0.03,
    noiseGain: 0.5,
    noiseFilterType: "bandpass",
    noiseFilterFreq: 3800,
    noiseFilterQ: 1.2,
    bodyFreq: 320,
    bodyGain: 0.18,
    bodyDuration: 0.04,
    bodyType: "triangle",
    clickFreq: 5200,
    clickGain: 0.32,
  },
  mxbrown: {
    noiseDuration: 0.025,
    noiseGain: 0.32,
    noiseFilterType: "bandpass",
    noiseFilterFreq: 2400,
    noiseFilterQ: 0.9,
    bodyFreq: 260,
    bodyGain: 0.22,
    bodyDuration: 0.05,
    bodyType: "triangle",
  },
  mxred: {
    noiseDuration: 0.02,
    noiseGain: 0.26,
    noiseFilterType: "bandpass",
    noiseFilterFreq: 2000,
    noiseFilterQ: 0.8,
    bodyFreq: 230,
    bodyGain: 0.2,
    bodyDuration: 0.045,
    bodyType: "sine",
  },
  thock: {
    noiseDuration: 0.022,
    noiseGain: 0.22,
    noiseFilterType: "lowpass",
    noiseFilterFreq: 1400,
    noiseFilterQ: 0.7,
    bodyFreq: 165,
    bodyGain: 0.4,
    bodyDuration: 0.08,
    bodyType: "sine",
  },
  cream: {
    noiseDuration: 0.02,
    noiseGain: 0.24,
    noiseFilterType: "lowpass",
    noiseFilterFreq: 1900,
    noiseFilterQ: 0.6,
    bodyFreq: 200,
    bodyGain: 0.34,
    bodyDuration: 0.07,
    bodyType: "triangle",
  },
  typewriter: {
    noiseDuration: 0.045,
    noiseGain: 0.6,
    noiseFilterType: "bandpass",
    noiseFilterFreq: 3000,
    noiseFilterQ: 0.6,
    bodyFreq: 140,
    bodyGain: 0.3,
    bodyDuration: 0.06,
    bodyType: "square",
    clickFreq: 6000,
    clickGain: 0.4,
  },
  holypanda: {
    noiseDuration: 0.028,
    noiseGain: 0.34,
    noiseFilterType: "bandpass",
    noiseFilterFreq: 2600,
    noiseFilterQ: 1.0,
    bodyFreq: 210,
    bodyGain: 0.34,
    bodyDuration: 0.07,
    bodyType: "triangle",
    clickFreq: 4200,
    clickGain: 0.12,
  },
  alpaca: {
    noiseDuration: 0.018,
    noiseGain: 0.2,
    noiseFilterType: "lowpass",
    noiseFilterFreq: 1700,
    noiseFilterQ: 0.5,
    bodyFreq: 185,
    bodyGain: 0.38,
    bodyDuration: 0.075,
    bodyType: "sine",
  },
};

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private profile: SoundProfileId = "thock";
  private _volume = 0.6;
  private _errorSound = true;
  private _errorType: ErrorSoundType = "buzzer";
  private faahAudio: HTMLAudioElement | null = null;
  private faahReady = false;
  private spriteBuffer: AudioBuffer | null = null;
  private spriteLoading = false;
  private spriteFailed = false;

  private ensureContext() {
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this._volume;
      this.masterGain.connect(this.ctx.destination);
      this.noiseBuffer = this.createNoiseBuffer(this.ctx);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  private createNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const length = Math.floor(ctx.sampleRate * 0.1);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  setProfile(id: SoundProfileId) {
    this.profile = id;
    if (id === "keythm") this.loadSprite();
  }

  /** Fetch + decode the realistic keyboard sound sprite. Fails silently. */
  private async loadSprite() {
    if (this.spriteBuffer || this.spriteLoading || this.spriteFailed) return;
    this.spriteLoading = true;
    try {
      const ctx = this.ensureContext();
      const res = await fetch(SPRITE_SOUND_PATH);
      if (!res.ok) throw new Error(`sound sprite not found at ${SPRITE_SOUND_PATH}`);
      const arr = await res.arrayBuffer();
      this.spriteBuffer = await ctx.decodeAudioData(arr);
    } catch (err) {
      this.spriteFailed = true;
      console.warn(
        `[soundEngine] Could not load the realistic sound sprite at "${SPRITE_SOUND_PATH}". ` +
          `Falling back to the synth Thock sound.`,
        err
      );
    } finally {
      this.spriteLoading = false;
    }
  }

  /** Whether the realistic profile is active (App drives down/up events). */
  get isSprite() {
    return this.profile === "keythm";
  }

  /**
   * Play one slice of the sound sprite for a physical key.
   * phase "down" on keydown, "up" on keyup — exactly like the original.
   */
  playSprite(phase: "down" | "up", code: string) {
    if (this.profile !== "keythm") return;
    const ctx = this.ensureContext();
    if (!this.masterGain) return;
    if (!this.spriteBuffer) {
      this.loadSprite();
      // fall back so there's still feedback on keydown while loading
      if (phase === "down" && this.spriteFailed) {
        const p = PROFILE_PARAMS.thock!;
        this.synthSwitch(ctx, p, code === "Space" || code === "Enter");
      }
      return;
    }
    const def = phase === "down" ? SOUND_DEFINES_DOWN[code] : SOUND_DEFINES_UP[code];
    if (!def) return;
    const [startMs, durationMs] = def;
    const src = ctx.createBufferSource();
    src.buffer = this.spriteBuffer;
    src.connect(this.masterGain);
    src.start(0, startMs / 1000, durationMs / 1000);
  }

  setVolume(v: number) {
    this._volume = Math.max(0, Math.min(1, v));
    if (this.masterGain) this.masterGain.gain.value = this._volume;
    if (this.faahAudio) this.faahAudio.volume = this._volume;
  }

  setErrorSound(on: boolean) {
    this._errorSound = on;
  }

  setErrorType(t: ErrorSoundType) {
    this._errorType = t;
    if (t === "faah") this.loadFaah();
  }

  get errorType() {
    return this._errorType;
  }

  /** Preload the faah sample as an HTMLAudioElement (reliable across formats). */
  private loadFaah() {
    if (this.faahAudio) return;
    const audio = new Audio(FAAH_SOUND_PATH);
    audio.preload = "auto";
    audio.volume = this._volume;
    audio.addEventListener("canplaythrough", () => {
      this.faahReady = true;
    });
    audio.addEventListener("error", () => {
      console.warn(
        `[soundEngine] Could not load faah sound at "${FAAH_SOUND_PATH}". ` +
          `Check the file exists in public/ and the path is correct. ` +
          `Falling back to the buzzer.`
      );
    });
    audio.load();
    this.faahAudio = audio;
  }

  get volume() {
    return this._volume;
  }

  /** Call from a user gesture so the AudioContext is allowed to start. */
  unlock() {
    this.ensureContext();
  }

  /** A heavier/lower variant used for spacebar & enter. */
  playKey(kind: KeyKind | boolean = "key") {
    // backward compat: boolean meant "big" (space/enter)
    const k: KeyKind = typeof kind === "boolean" ? (kind ? "space" : "key") : kind;
    if (this.profile === "off") return;
    // realistic sprite is driven by App's physical keydown/keyup listeners
    if (this.profile === "keythm") return;
    const ctx = this.ensureContext();
    if (!this.masterGain || !this.noiseBuffer) return;

    if (this.profile === "classictw") {
      this.synthTypewriter(ctx, k);
      return;
    }

    const big = k === "space" || k === "enter";
    const p = PROFILE_PARAMS[this.profile];
    if (!p) return;
    this.synthSwitch(ctx, p, big);
  }

  /** Synthesize a single mechanical-switch keypress from tone params. */
  private synthSwitch(ctx: AudioContext, p: ToneParams, big: boolean) {
    if (!this.masterGain || !this.noiseBuffer) return;
    const now = ctx.currentTime;
    // tiny random pitch variation so repeated keys don't feel robotic
    const detune = 0.94 + Math.random() * 0.12;
    const pitch = big ? 0.78 : detune;
    const gainScale = big ? 1.25 : 1;

    // --- filtered noise burst (the "click/clack") ---
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    noise.playbackRate.value = pitch;

    const filter = ctx.createBiquadFilter();
    filter.type = p.noiseFilterType;
    filter.frequency.value = p.noiseFilterFreq * pitch;
    filter.Q.value = p.noiseFilterQ;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(p.noiseGain * gainScale, now + 0.001);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + p.noiseDuration);

    noise.connect(filter).connect(noiseGain).connect(this.masterGain);
    noise.start(now);
    noise.stop(now + p.noiseDuration + 0.02);

    // --- resonant body (the "thock") ---
    const osc = ctx.createOscillator();
    osc.type = p.bodyType;
    osc.frequency.value = p.bodyFreq * pitch;

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0, now);
    oscGain.gain.linearRampToValueAtTime(p.bodyGain * gainScale, now + 0.002);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + p.bodyDuration);

    osc.connect(oscGain).connect(this.masterGain);
    osc.start(now);
    osc.stop(now + p.bodyDuration + 0.02);

    // --- optional high click transient ---
    if (p.clickFreq && p.clickGain) {
      const click = ctx.createOscillator();
      click.type = "square";
      click.frequency.value = p.clickFreq * pitch;
      const clickGain = ctx.createGain();
      clickGain.gain.setValueAtTime(p.clickGain * gainScale, now);
      clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.012);
      click.connect(clickGain).connect(this.masterGain);
      click.start(now);
      click.stop(now + 0.02);
    }
  }

  /** Authentic vintage type-bar strike, differentiated per key kind. */
  private synthTypewriter(ctx: AudioContext, kind: KeyKind) {
    if (!this.masterGain || !this.noiseBuffer) return;

    if (kind === "enter") {
      this.playCarriageReturn(ctx, ctx.currentTime);
      return;
    }

    const now = ctx.currentTime;
    // per-kind voicing + random variation so repeats don't feel robotic
    const rndGain = 0.88 + Math.random() * 0.24;
    const rndPitch = 0.95 + Math.random() * 0.1;

    let strikeGain = 0.55;
    let clackFreq = 230;
    let clackGainV = 0.28;
    let withTick = true;
    let withRing = true;
    let clackLp = 2200;

    if (kind === "space") {
      strikeGain = 0.4;
      clackFreq = 150;
      clackGainV = 0.26;
      withRing = true;
    } else if (kind === "backspace") {
      // muted mechanical tap — no bright tick, no ring
      strikeGain = 0.22;
      clackFreq = 180;
      clackGainV = 0.2;
      withTick = false;
      withRing = false;
      clackLp = 1200;
    }

    strikeGain *= rndGain;
    clackGainV *= rndGain;

    // 1. sharp hammer transient — short high-passed noise "tk"
    if (withTick) {
      const tick = ctx.createBufferSource();
      tick.buffer = this.noiseBuffer;
      tick.playbackRate.value = 1.4 * rndPitch;
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 2600;
      const tickGain = ctx.createGain();
      tickGain.gain.setValueAtTime(strikeGain, now);
      tickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.012);
      tick.connect(hp).connect(tickGain).connect(this.masterGain);
      tick.start(now);
      tick.stop(now + 0.03);
    }

    // 2. wooden/platen clack body
    const clack = ctx.createOscillator();
    clack.type = "square";
    clack.frequency.value = clackFreq * rndPitch;
    const clackGain = ctx.createGain();
    clackGain.gain.setValueAtTime(clackGainV, now);
    clackGain.gain.exponentialRampToValueAtTime(0.0001, now + (kind === "backspace" ? 0.035 : 0.045));
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = clackLp;
    clack.connect(lp).connect(clackGain).connect(this.masterGain);
    clack.start(now);
    clack.stop(now + 0.06);

    // 3. metallic ring — two high decaying partials
    if (withRing) {
      [1850, 3300].forEach((f, i) => {
        const ring = ctx.createOscillator();
        ring.type = "sine";
        ring.frequency.value = f * (0.98 + Math.random() * 0.04);
        const rg = ctx.createGain();
        const peak = (0.06 - i * 0.022) * rndGain;
        rg.gain.setValueAtTime(peak, now + 0.002);
        rg.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);
        ring.connect(rg).connect(this.masterGain!);
        ring.start(now);
        ring.stop(now + 0.08);
      });
    }
  }

  /** Carriage return: bell "ding" + the ratcheting carriage slide. */
  carriageReturn() {
    if (this.profile !== "classictw") return;
    const ctx = this.ensureContext();
    this.playCarriageReturn(ctx, ctx.currentTime);
  }

  private playCarriageReturn(ctx: AudioContext, now: number) {
    if (!this.masterGain || !this.noiseBuffer) return;

    // bell ding
    this.playBell(ctx, now);

    // carriage slide — looped noise through a sweeping bandpass
    const slide = ctx.createBufferSource();
    slide.buffer = this.noiseBuffer;
    slide.loop = true;
    slide.playbackRate.value = 1.1;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 1.4;
    const start = now + 0.06;
    bp.frequency.setValueAtTime(1400, start);
    bp.frequency.linearRampToValueAtTime(500, start + 0.22);
    const sg = ctx.createGain();
    sg.gain.setValueAtTime(0.0001, start);
    sg.gain.linearRampToValueAtTime(0.16, start + 0.02);
    sg.gain.exponentialRampToValueAtTime(0.0001, start + 0.26);
    slide.connect(bp).connect(sg).connect(this.masterGain);
    slide.start(start);
    slide.stop(start + 0.3);

    // ratchet ticks during the slide
    for (let i = 0; i < 5; i++) {
      const t = start + 0.03 + i * 0.045;
      const tick = ctx.createOscillator();
      tick.type = "square";
      tick.frequency.value = 2600 + Math.random() * 600;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.05, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.01);
      tick.connect(g).connect(this.masterGain);
      tick.start(t);
      tick.stop(t + 0.02);
    }
  }

  /** Struck-bell "ding" with inharmonic partials (carriage return). */
  private playBell(ctx: AudioContext, when: number) {
    if (!this.masterGain) return;
    const fundamental = 1050;
    const partials = [1, 2.01, 3.02, 4.18];
    partials.forEach((ratio, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = fundamental * ratio;
      const g = ctx.createGain();
      const peak = 0.12 / (i + 1);
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(peak, when + 0.003);
      g.gain.exponentialRampToValueAtTime(0.0001, when + 0.6);
      osc.connect(g).connect(this.masterGain!);
      osc.start(when);
      osc.stop(when + 0.65);
    });
  }

  /** Sound played on an incorrect keystroke ("fash mode"). */
  playError() {
    if (!this._errorSound || this.profile === "off") return;
    const ctx = this.ensureContext();
    if (!this.masterGain) return;

    // faah sample: play the loaded audio if available, else fall back
    if (this._errorType === "faah") {
      if (!this.faahAudio) this.loadFaah();
      const base = this.faahAudio;
      if (base && this.faahReady) {
        // clone so rapid mistakes can overlap
        const node = base.cloneNode(true) as HTMLAudioElement;
        node.volume = this._volume;
        node.currentTime = 0;
        const p = node.play();
        if (p && typeof p.catch === "function") p.catch(() => this.playBuzzer(ctx));
        return;
      }
      // not ready yet — use buzzer this time
    }

    this.playBuzzer(ctx);
  }

  private playBuzzer(ctx: AudioContext) {
    if (!this.masterGain) return;
    const now = ctx.currentTime;

    // low dissonant two-tone buzz
    const freqs = [150, 190];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = f;
      const g = ctx.createGain();
      const peak = 0.18 - i * 0.04;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(peak, now + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 900;

      osc.connect(filter).connect(g).connect(this.masterGain!);
      osc.start(now);
      osc.stop(now + 0.15);
    });
  }
}

export const soundEngine = new SoundEngine();
