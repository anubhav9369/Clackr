import { useStore } from "../store/useStore";
import { Mode, TimeOption, WordsOption } from "../lib/types";

const modes: Mode[] = ["time", "words", "quote", "zen"];
const timeOpts: TimeOption[] = [15, 30, 60, 120];
const wordOpts: WordsOption[] = [10, 25, 50, 100];

function Item({
  active,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`px-2 py-0.5 rounded text-sm transition-colors ${
        active ? "text-main" : "text-sub hover:text-text"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="mx-2 h-5 w-px bg-bg/60" />;
}

export default function ConfigBar() {
  const s = useStore();

  return (
    <div className="mx-auto flex w-fit max-w-full flex-wrap items-center justify-center gap-y-1 rounded-lg bg-sub-alt px-3 py-2 text-text shadow-sm">
      <Item active={s.punctuation} onClick={s.togglePunctuation} title="include punctuation">
        @ punctuation
      </Item>
      <Item active={s.numbers} onClick={s.toggleNumbers} title="include numbers">
        # numbers
      </Item>
      {s.numbers && (
        <Item active={s.numbersHard} onClick={s.toggleNumbersHard} title="longer numbers">
          {s.numbersHard ? "hard" : "easy"}
        </Item>
      )}

      <Divider />

      {modes.map((m) => (
        <Item key={m} active={s.mode === m} onClick={() => s.setMode(m)}>
          {m}
        </Item>
      ))}

      {(s.mode === "time" || s.mode === "words") && <Divider />}

      {s.mode === "time" &&
        timeOpts.map((t) => (
          <Item key={t} active={s.time === t} onClick={() => s.setTime(t)}>
            {t}
          </Item>
        ))}

      {s.mode === "words" &&
        wordOpts.map((w) => (
          <Item key={w} active={s.wordCount === w} onClick={() => s.setWordCount(w)}>
            {w}
          </Item>
        ))}
    </div>
  );
}
