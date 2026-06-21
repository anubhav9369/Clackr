import { useLayoutEffect, useRef, useState } from "react";
import { useStore } from "../store/useStore";
import { soundEngine } from "../audio/soundEngine";

interface CaretPos {
  left: number;
  top: number;
  height: number;
}

const LINE_EM = 2.1; // line height in em
const VISIBLE_LINES = 3;

export default function TypingArea() {
  const words = useStore((s) => s.words);
  const typed = useStore((s) => s.typed);
  const wordIndex = useStore((s) => s.wordIndex);
  const phase = useStore((s) => s.phase);
  const smoothCaret = useStore((s) => s.smoothCaret);
  const mode = useStore((s) => s.mode);

  const wordsRef = useRef<HTMLDivElement>(null);
  const activeCharRef = useRef<HTMLSpanElement>(null);
  const activeWordRef = useRef<HTMLDivElement>(null);
  const [caret, setCaret] = useState<CaretPos>({ left: 0, top: 0, height: 0 });
  const [scrollOffset, setScrollOffset] = useState(0);
  const prevWordTopRef = useRef(0);

  const currentInput = typed[wordIndex] ?? "";
  const caretCharIndex = currentInput.length;

  // position the caret using layout offsets (relative to the words container)
  useLayoutEffect(() => {
    const word = activeWordRef.current;
    if (!word) return;

    const charEl = activeCharRef.current;
    if (charEl) {
      setCaret({
        left: charEl.offsetLeft,
        top: charEl.offsetTop,
        height: charEl.offsetHeight,
      });
    } else {
      // caret sits at the end of the active word (word fully typed, no space yet)
      setCaret({
        left: word.offsetLeft + word.offsetWidth,
        top: word.offsetTop,
        height: word.offsetHeight,
      });
    }
  }, [wordIndex, caretCharIndex, words, typed, mode]);

  // line scrolling + carriage-return sound on line wrap
  useLayoutEffect(() => {
    const word = activeWordRef.current;
    if (!word) return;
    const wordTop = word.offsetTop;
    const lineHeight = word.offsetHeight || 1;

    if (wordIndex === 0) {
      prevWordTopRef.current = wordTop;
    } else if (wordTop > prevWordTopRef.current + lineHeight * 0.5) {
      soundEngine.carriageReturn();
      prevWordTopRef.current = wordTop;
    } else if (wordTop < prevWordTopRef.current - lineHeight * 0.5) {
      prevWordTopRef.current = wordTop;
    }

    // keep the active line as the middle visible row once past the first line
    const line = Math.round(wordTop / lineHeight);
    const target = Math.max(0, (line - 1) * lineHeight);
    setScrollOffset(target);
  }, [wordIndex, words, typed]);

  if (mode === "zen") {
    return <ZenArea />;
  }

  return (
    <div
      className="relative w-full overflow-hidden select-none"
      style={{
        fontSize: "1.75rem",
        lineHeight: `${LINE_EM}em`,
        height: `${LINE_EM * VISIBLE_LINES}em`,
      }}
    >
      <div
        ref={wordsRef}
        className="relative flex flex-wrap content-start tracking-wide"
        style={{
          transform: `translateY(-${scrollOffset}px)`,
          transition: "transform 0.18s ease",
        }}
      >
        {/* caret (inside the scrolling layer so it moves with the text) */}
        <div
          className={`absolute z-10 w-[3px] rounded bg-main ${
            phase === "running" ? "" : "animate-caret"
          }`}
          style={{
            left: caret.left - 1,
            top: caret.top + caret.height * 0.14,
            height: caret.height * 0.72,
            transition: smoothCaret ? "left 0.08s ease, top 0.12s ease" : "none",
          }}
        />

        {words.map((word, wi) => {
          const isActive = wi === wordIndex;
          const typedWord = typed[wi] ?? "";
          const wordHasError = wi < wordIndex && typedWord !== word;
          return (
            <div
              key={wi}
              ref={isActive ? activeWordRef : undefined}
              className={`mr-[0.6ch] inline-flex ${
                wordHasError
                  ? "underline decoration-error/70 decoration-2 underline-offset-[6px]"
                  : ""
              }`}
            >
              {renderWordChars(word, typedWord, isActive, caretCharIndex, activeCharRef)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function renderWordChars(
  word: string,
  typedWord: string,
  isActive: boolean,
  caretCharIndex: number,
  activeCharRef: React.RefObject<HTMLSpanElement>
) {
  const maxLen = Math.max(word.length, typedWord.length);
  const chars = [];
  for (let i = 0; i < maxLen; i++) {
    const expected = word[i];
    const got = typedWord[i];
    let cls = "text-sub";
    if (got !== undefined) {
      if (expected === undefined) cls = "text-error-extra";
      else if (got === expected) cls = "text-text";
      else cls = "text-error";
    }
    const isCaretHere = isActive && i === caretCharIndex;
    chars.push(
      <span key={i} ref={isCaretHere ? activeCharRef : undefined} className={cls}>
        {expected ?? got}
      </span>
    );
  }
  return chars;
}

function ZenArea() {
  const typed = useStore((s) => s.typed);
  const text = typed.join(" ");
  return (
    <div className="relative w-full text-[1.75rem] leading-[2.1em] tracking-wide min-h-[6rem]">
      <span className="text-text">{text}</span>
      <span className="ml-[1px] inline-block w-[3px] h-[1.2em] -mb-[0.2em] animate-caret bg-main align-middle" />
      {text === "" && (
        <span className="text-sub absolute left-0 top-0">
          start typing — zen mode has no limits. press tab then enter to finish.
        </span>
      )}
    </div>
  );
}
