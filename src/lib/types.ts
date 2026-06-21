export type Mode = "time" | "words" | "quote" | "zen";

export type TimeOption = 15 | 30 | 60 | 120;
export type WordsOption = 10 | 25 | 50 | 100;

export type TestPhase = "idle" | "running" | "finished";

export interface CharState {
  char: string;
  /** typed result for this expected char */
  status: "untyped" | "correct" | "incorrect" | "extra";
  typed?: string;
}

export interface WpmSample {
  /** seconds elapsed */
  t: number;
  wpm: number;
  raw: number;
  errors: number;
}

export interface TestResult {
  id: string;
  date: number;
  mode: Mode;
  modeValue: number | string;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  characters: { correct: number; incorrect: number; extra: number; missed: number };
  durationSec: number;
  samples: WpmSample[];
  language: string;
}
