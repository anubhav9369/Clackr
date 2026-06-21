import { useStore } from "../store/useStore";
import WpmChart from "./WpmChart";

function Stat({
  label,
  value,
  sub,
  small,
}: {
  label: string;
  value: string;
  sub?: string;
  small?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col">
      <span className="text-sm text-sub">{label}</span>
      <span
        className={`${small ? "text-2xl" : "text-4xl"} leading-tight text-main tabular-nums break-words`}
      >
        {value}
      </span>
      {sub && <span className="text-xs text-sub">{sub}</span>}
    </div>
  );
}

export default function Results() {
  const result = useStore((s) => s.result);
  const history = useStore((s) => s.history);
  const restart = useStore((s) => s.restart);
  if (!result) return null;

  const best = history.reduce(
    (m, r) =>
      r.mode === result.mode && r.modeValue === result.modeValue && r.wpm > m ? r.wpm : m,
    0
  );
  const isPB = result.wpm >= best && result.wpm > 0;

  const c = result.characters;
  const charSummary = `${c.correct}/${c.incorrect}/${c.extra}/${c.missed}`;

  return (
    <div className="w-full animate-fade-in">
      <div className="flex flex-col gap-6 md:flex-row md:items-center">
        <div className="flex flex-col gap-4">
          <Stat label="wpm" value={String(result.wpm)} />
          <Stat label="acc" value={`${result.accuracy}%`} />
          {isPB && (
            <span className="w-fit rounded bg-main px-2 py-0.5 text-xs font-bold text-bg">
              new best
            </span>
          )}
        </div>
        <div className="flex-1 rounded-lg bg-sub-alt/40 p-3">
          <WpmChart samples={result.samples} />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-3">
        <Stat label="raw" value={String(result.rawWpm)} />
        <Stat label="consistency" value={`${result.consistency}%`} />
        <Stat label="test type" value={result.mode} sub={String(result.modeValue)} />
        <Stat
          label="characters"
          value={charSummary}
          sub="correct/incorrect/extra/missed"
          small
        />
        <Stat label="time" value={`${result.durationSec}s`} />
        <Stat label="best" value={String(Math.max(best, result.wpm))} sub="this mode" />
      </div>

      <div className="mt-8 flex items-center gap-4 text-sub">
        <button
          onClick={restart}
          className="rounded px-4 py-2 text-text transition-colors hover:bg-sub-alt"
        >
          ↻ next test
        </button>
        <span className="text-sm">
          press <kbd className="rounded bg-sub-alt px-1.5 py-0.5 text-text">tab</kbd> +{" "}
          <kbd className="rounded bg-sub-alt px-1.5 py-0.5 text-text">enter</kbd> for a new test
        </span>
      </div>
    </div>
  );
}
