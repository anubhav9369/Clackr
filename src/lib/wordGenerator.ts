import { englishWords } from "../data/words";

const PUNCT_END = [".", ",", ";", ":", "!", "?"];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function maybeCapitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function addNumber(hard: boolean): string {
  const len = hard ? 1 + Math.floor(Math.random() * 5) : 1 + Math.floor(Math.random() * 2);
  let n = "";
  for (let i = 0; i < len; i++) n += Math.floor(Math.random() * 10).toString();
  return n;
}

export interface GenOptions {
  count: number;
  punctuation: boolean;
  numbers: boolean;
  numbersHard?: boolean;
}

/** Generate a list of words applying punctuation / number modifiers. */
export function generateWords(opts: GenOptions): string[] {
  const { count, punctuation, numbers, numbersHard = false } = opts;
  const out: string[] = [];
  let capitalizeNext = punctuation; // start a "sentence" capitalized

  for (let i = 0; i < count; i++) {
    if (numbers && Math.random() < 0.18) {
      out.push(addNumber(numbersHard));
      continue;
    }

    let word = randomItem(englishWords);

    if (punctuation) {
      if (capitalizeNext) {
        word = maybeCapitalize(word);
        capitalizeNext = false;
      }
      // wrap in quotes / parens occasionally
      const r = Math.random();
      if (r < 0.03) word = `"${word}"`;
      else if (r < 0.05) word = `(${word})`;

      // sentence-ending punctuation
      if (Math.random() < 0.15 && i !== count - 1) {
        const p = randomItem(PUNCT_END);
        word += p;
        if (p === "." || p === "!" || p === "?") capitalizeNext = true;
      }
    }

    out.push(word);
  }

  // ensure a sentence terminator at the end when using punctuation
  if (punctuation && out.length > 0) {
    const last = out[out.length - 1];
    if (!PUNCT_END.includes(last.slice(-1))) out[out.length - 1] = last + ".";
  }

  return out;
}
