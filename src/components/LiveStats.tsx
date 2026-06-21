import { useStore } from "../store/useStore";

export default function LiveStats() {
  const mode = useStore((s) => s.mode);
  const phase = useStore((s) => s.phase);
  const time = useStore((s) => s.time);
  const elapsed = useStore((s) => s.elapsed);
  const wordIndex = useStore((s) => s.wordIndex);
  const words = useStore((s) => s.words);
  const wordCount = useStore((s) => s.wordCount);
  const samples = useStore((s) => s.samples);
  const showLiveWpm = useStore((s) => s.showLiveWpm);

  const liveWpm = samples.length ? samples[samples.length - 1].wpm : 0;

  let label = "";
  if (mode === "time") {
    label = `${Math.max(0, Math.ceil(time - elapsed))}`;
  } else if (mode === "words") {
    label = `${Math.min(wordIndex, wordCount)}/${wordCount}`;
  } else if (mode === "quote") {
    label = `${Math.min(wordIndex, words.length)}/${words.length}`;
  } else {
    label = `${Math.floor(elapsed)}s`;
  }

  const visible = phase !== "idle" || mode === "time" || mode === "words";

  return (
    <div className="flex h-8 items-end gap-4 text-2xl text-main">
      {visible && <span className="tabular-nums">{label}</span>}
      {showLiveWpm && phase === "running" && (
        <span className="tabular-nums text-main/80">{liveWpm} wpm</span>
      )}
    </div>
  );
}
