import { create } from "zustand";
import { Mode, TestPhase, TimeOption, WordsOption, WpmSample, TestResult } from "../lib/types";
import { generateWords } from "../lib/wordGenerator";
import { quotes } from "../data/quotes";
import { themes, applyTheme, Theme } from "../lib/themes";
import { soundEngine, SoundProfileId, ErrorSoundType } from "../audio/soundEngine";

const STORAGE_KEY = "typewriter:config";
const HISTORY_KEY = "typewriter:history";

interface PersistedConfig {
  mode: Mode;
  time: TimeOption;
  wordCount: WordsOption;
  punctuation: boolean;
  numbers: boolean;
  numbersHard: boolean;
  themeId: string;
  soundProfile: SoundProfileId;
  volume: number;
  errorSound: boolean;
  errorSoundType: ErrorSoundType;
  smoothCaret: boolean;
  showKeyboard: boolean;
  keyboardStyle: KeyboardStyle;
  showLiveWpm: boolean;
}

export type KeyboardStyle = "classic" | "minimal" | "iso";

const defaultConfig: PersistedConfig = {
  mode: "time",
  time: 30,
  wordCount: 25,
  punctuation: false,
  numbers: false,
  numbersHard: false,
  themeId: "obsidian",
  soundProfile: "keythm",
  volume: 0.6,
  errorSound: true,
  errorSoundType: "buzzer",
  smoothCaret: true,
  showKeyboard: true,
  keyboardStyle: "classic",
  showLiveWpm: true,
};

function loadConfig(): PersistedConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultConfig, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return defaultConfig;
}

function loadHistory(): TestResult[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return [];
}

interface Keystroke {
  correct: boolean;
}

interface State extends PersistedConfig {
  // live test state
  words: string[];
  typed: string[]; // typed text per word index
  wordIndex: number;
  charIndex: number; // index within current word's input
  phase: TestPhase;
  startTime: number | null;
  elapsed: number; // seconds
  samples: WpmSample[];
  keystrokes: Keystroke[];
  errorCount: number;
  lastKey: string | null;
  result: TestResult | null;
  history: TestResult[];

  // derived helpers
  rawText: () => string;

  // actions
  init: () => void;
  setMode: (m: Mode) => void;
  setTime: (t: TimeOption) => void;
  setWordCount: (w: WordsOption) => void;
  togglePunctuation: () => void;
  toggleNumbers: () => void;
  toggleNumbersHard: () => void;
  setTheme: (id: string) => void;
  setSoundProfile: (id: SoundProfileId) => void;
  setVolume: (v: number) => void;
  toggleErrorSound: () => void;
  setErrorSoundType: (t: ErrorSoundType) => void;
  toggleSmoothCaret: () => void;
  toggleShowKeyboard: () => void;
  setKeyboardStyle: (s: KeyboardStyle) => void;
  toggleLiveWpm: () => void;

  generate: () => void;
  restart: () => void;
  handleChar: (ch: string) => void;
  handleSpace: () => void;
  handleBackspace: (ctrl: boolean) => void;
  tick: () => void;
  finish: () => void;
}

const WORDS_BATCH = 50;

function persist(state: State) {
  const cfg: PersistedConfig = {
    mode: state.mode,
    time: state.time,
    wordCount: state.wordCount,
    punctuation: state.punctuation,
    numbers: state.numbers,
    numbersHard: state.numbersHard,
    themeId: state.themeId,
    soundProfile: state.soundProfile,
    volume: state.volume,
    errorSound: state.errorSound,
    errorSoundType: state.errorSoundType,
    smoothCaret: state.smoothCaret,
    showKeyboard: state.showKeyboard,
    keyboardStyle: state.keyboardStyle,
    showLiveWpm: state.showLiveWpm,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}

function buildWords(state: PersistedConfig & { count?: number }): string[] {
  if (state.mode === "quote") {
    const q = quotes[Math.floor(Math.random() * quotes.length)];
    return q.text.split(" ");
  }
  if (state.mode === "zen") {
    return [];
  }
  const count = state.mode === "words" ? state.wordCount : WORDS_BATCH;
  return generateWords({
    count,
    punctuation: state.punctuation,
    numbers: state.numbers,
    numbersHard: state.numbersHard,
  });
}

export const useStore = create<State>((set, get) => ({
  ...loadConfig(),

  words: [],
  typed: [""],
  wordIndex: 0,
  charIndex: 0,
  phase: "idle",
  startTime: null,
  elapsed: 0,
  samples: [],
  keystrokes: [],
  errorCount: 0,
  lastKey: null,
  result: null,
  history: loadHistory(),

  rawText: () => get().words.join(" "),

  init: () => {
    const cfg = get();
    const theme = themes.find((t) => t.id === cfg.themeId) ?? themes[0];
    applyTheme(theme);
    soundEngine.setProfile(cfg.soundProfile);
    soundEngine.setVolume(cfg.volume);
    soundEngine.setErrorSound(cfg.errorSound);
    soundEngine.setErrorType(cfg.errorSoundType);
    get().generate();
  },

  setMode: (m) => {
    set({ mode: m });
    persist(get());
    get().restart();
  },
  setTime: (t) => {
    set({ time: t });
    persist(get());
    get().restart();
  },
  setWordCount: (w) => {
    set({ wordCount: w });
    persist(get());
    get().restart();
  },
  togglePunctuation: () => {
    set({ punctuation: !get().punctuation });
    persist(get());
    get().restart();
  },
  toggleNumbers: () => {
    set({ numbers: !get().numbers });
    persist(get());
    get().restart();
  },
  toggleNumbersHard: () => {
    set({ numbersHard: !get().numbersHard });
    persist(get());
    get().restart();
  },
  setTheme: (id) => {
    const theme: Theme = themes.find((t) => t.id === id) ?? themes[0];
    applyTheme(theme);
    set({ themeId: id });
    persist(get());
  },
  setSoundProfile: (id) => {
    soundEngine.setProfile(id);
    soundEngine.unlock();
    if (id === "keythm") {
      soundEngine.playSprite("down", "KeyF");
      window.setTimeout(() => soundEngine.playSprite("up", "KeyF"), 90);
    } else {
      soundEngine.playKey();
    }
    set({ soundProfile: id });
    persist(get());
  },
  setVolume: (v) => {
    soundEngine.setVolume(v);
    set({ volume: v });
    persist(get());
  },
  toggleErrorSound: () => {
    const next = !get().errorSound;
    soundEngine.setErrorSound(next);
    set({ errorSound: next });
    persist(get());
  },
  setErrorSoundType: (t) => {
    soundEngine.setErrorType(t);
    soundEngine.unlock();
    soundEngine.playError();
    set({ errorSoundType: t });
    persist(get());
  },
  toggleSmoothCaret: () => {
    set({ smoothCaret: !get().smoothCaret });
    persist(get());
  },
  toggleShowKeyboard: () => {
    set({ showKeyboard: !get().showKeyboard });
    persist(get());
  },
  setKeyboardStyle: (style) => {
    set({ keyboardStyle: style });
    persist(get());
  },
  toggleLiveWpm: () => {
    set({ showLiveWpm: !get().showLiveWpm });
    persist(get());
  },

  generate: () => {
    const cfg = get();
    const words = buildWords(cfg);
    set({
      words,
      typed: [""],
      wordIndex: 0,
      charIndex: 0,
      phase: "idle",
      startTime: null,
      elapsed: 0,
      samples: [],
      keystrokes: [],
      errorCount: 0,
      result: null,
      lastKey: null,
    });
  },

  restart: () => {
    get().generate();
  },

  handleChar: (ch) => {
    const s = get();
    if (s.phase === "finished") return;

    // start timer on first input
    let startTime = s.startTime;
    let phase = s.phase;
    if (phase === "idle") {
      startTime = performance.now();
      phase = "running";
    }

    const typed = [...s.typed];
    const current = typed[s.wordIndex] ?? "";
    typed[s.wordIndex] = current + ch;

    // determine correctness against expected word
    const expected = s.words[s.wordIndex] ?? "";
    const expectedChar = expected[current.length];
    const correct = expectedChar === ch;

    const keystrokes = [...s.keystrokes, { correct }];
    const errorCount = s.errorCount + (correct ? 0 : 1);

    soundEngine.playKey("key");
    if (!correct) soundEngine.playError();

    set({
      typed,
      charIndex: current.length + 1,
      startTime,
      phase,
      keystrokes,
      errorCount,
      lastKey: ch,
    });

    // finish when the final word of a words/quote test is fully typed
    const isLastWord = s.wordIndex >= s.words.length - 1;
    const newInput = typed[s.wordIndex];
    if (
      (s.mode === "words" || s.mode === "quote") &&
      isLastWord &&
      newInput.length >= expected.length
    ) {
      get().finish();
    }
  },

  handleSpace: () => {
    const s = get();
    if (s.phase === "finished") return;
    // ignore leading space with empty word
    if ((s.typed[s.wordIndex] ?? "") === "") return;

    let startTime = s.startTime;
    let phase = s.phase;
    if (phase === "idle") {
      startTime = performance.now();
      phase = "running";
    }

    const nextIndex = s.wordIndex + 1;
    const typed = [...s.typed];
    if (typed[nextIndex] === undefined) typed[nextIndex] = "";

    soundEngine.playKey("space");

    // words / quote completion check
    const isLastWord = nextIndex >= s.words.length;
    if ((s.mode === "words" || s.mode === "quote") && isLastWord) {
      set({ typed, wordIndex: nextIndex, charIndex: 0, startTime, phase });
      get().finish();
      return;
    }

    // time mode: append more words as the user approaches the end
    let words = s.words;
    if (s.mode === "time" && nextIndex > s.words.length - 15) {
      const extra = generateWords({
        count: WORDS_BATCH,
        punctuation: s.punctuation,
        numbers: s.numbers,
        numbersHard: s.numbersHard,
      });
      words = [...s.words, ...extra];
    }

    set({
      typed,
      words,
      wordIndex: nextIndex,
      charIndex: 0,
      startTime,
      phase,
      lastKey: " ",
    });
  },

  handleBackspace: (ctrl) => {
    const s = get();
    if (s.phase === "finished") return;
    const typed = [...s.typed];
    const current = typed[s.wordIndex] ?? "";

    if (current.length > 0) {
      typed[s.wordIndex] = ctrl ? "" : current.slice(0, -1);
      set({ typed, charIndex: typed[s.wordIndex].length, lastKey: "Backspace" });
      soundEngine.playKey("backspace");
      return;
    }

    // move back to previous word if it had errors (not fully correct)
    if (s.wordIndex > 0) {
      const prevIndex = s.wordIndex - 1;
      const prevTyped = typed[prevIndex] ?? "";
      const prevExpected = s.words[prevIndex] ?? "";
      const prevCorrect = prevTyped === prevExpected;
      if (!prevCorrect) {
        set({
          wordIndex: prevIndex,
          charIndex: prevTyped.length,
          lastKey: "Backspace",
        });
        soundEngine.playKey("backspace");
      }
    }
  },

  tick: () => {
    const s = get();
    if (s.phase !== "running" || s.startTime === null) return;
    const elapsed = (performance.now() - s.startTime) / 1000;

    // compute live raw/wpm sample
    const { correct } = countChars(s);
    const minutes = elapsed / 60 || 1 / 60;
    const wpm = Math.round(correct / 5 / minutes);
    const totalTyped = s.keystrokes.length;
    const raw = Math.round(totalTyped / 5 / minutes);

    const second = Math.floor(elapsed);
    const samples = [...s.samples];
    if (samples.length === 0 || samples[samples.length - 1].t < second) {
      samples.push({ t: second, wpm, raw, errors: s.errorCount });
    }

    set({ elapsed, samples });

    if (s.mode === "time" && elapsed >= s.time) {
      get().finish();
    }
  },

  finish: () => {
    const s = get();
    if (s.phase === "finished") return;
    const elapsed =
      s.startTime !== null ? (performance.now() - s.startTime) / 1000 : s.elapsed;
    const durationSec = s.mode === "time" ? s.time : Math.max(elapsed, 0.01);

    const chars = countChars(s);
    const minutes = durationSec / 60;
    const wpm = Math.round(chars.correct / 5 / minutes);
    const totalKeystrokes = s.keystrokes.length;
    const correctKeystrokes = s.keystrokes.filter((k) => k.correct).length;
    const rawWpm = Math.round(totalKeystrokes / 5 / minutes);
    const accuracy =
      totalKeystrokes === 0 ? 0 : Math.round((correctKeystrokes / totalKeystrokes) * 1000) / 10;

    // consistency from wpm samples (coefficient of variation)
    const consistency = computeConsistency(s.samples.map((x) => x.raw));

    const result: TestResult = {
      id: Math.random().toString(36).slice(2),
      date: Date.now(),
      mode: s.mode,
      modeValue: s.mode === "time" ? s.time : s.mode === "words" ? s.wordCount : s.mode,
      wpm: isFinite(wpm) ? wpm : 0,
      rawWpm: isFinite(rawWpm) ? rawWpm : 0,
      accuracy,
      consistency,
      characters: chars,
      durationSec: Math.round(durationSec * 10) / 10,
      samples: s.samples,
      language: "english",
    };

    const history = [result, ...s.history].slice(0, 50);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));

    set({ phase: "finished", result, history, elapsed });
  },
}));

function countChars(s: Pick<State, "words" | "typed" | "wordIndex" | "mode">) {
  let correct = 0;
  let incorrect = 0;
  let extra = 0;
  let missed = 0;
  // only count words up to and including current typed words
  const upto = Math.max(s.wordIndex, 0);
  for (let i = 0; i <= upto; i++) {
    const expected = s.words[i] ?? "";
    const typed = s.typed[i] ?? "";
    if (typed === "" && i > s.wordIndex) continue;
    for (let j = 0; j < Math.max(expected.length, typed.length); j++) {
      const e = expected[j];
      const t = typed[j];
      if (t === undefined) {
        // missed only counts for words already passed
        if (i < s.wordIndex) missed++;
      } else if (e === undefined) {
        extra++;
      } else if (e === t) {
        correct++;
      } else {
        incorrect++;
      }
    }
    // count the space between words as a correct char when word completed
    if (i < s.wordIndex) correct++;
  }
  return { correct, incorrect, extra, missed };
}

function computeConsistency(values: number[]): number {
  const v = values.filter((x) => isFinite(x) && x > 0);
  if (v.length < 2) return 100;
  const mean = v.reduce((a, b) => a + b, 0) / v.length;
  const variance = v.reduce((a, b) => a + (b - mean) ** 2, 0) / v.length;
  const std = Math.sqrt(variance);
  const cv = std / mean;
  return Math.max(0, Math.round((1 - cv) * 1000) / 10);
}
