import { useStore } from "../store/useStore";

interface Props {
  onOpenSettings: () => void;
}

export default function Header({ onOpenSettings }: Props) {
  const soundProfile = useStore((s) => s.soundProfile);
  const setSoundProfile = useStore((s) => s.setSoundProfile);
  const restart = useStore((s) => s.restart);

  const muted = soundProfile === "off";

  return (
    <header className="flex items-center justify-between">
      <button
        onClick={restart}
        className="group flex items-center gap-2 text-left"
        title="restart"
      >
        <span className="text-2xl">⌨️</span>
        <div className="leading-none">
          <span className="text-2xl font-bold text-main">Clackr</span>
          <span className="ml-1 text-xs text-sub">feel every keystroke</span>
        </div>
      </button>

      <nav className="flex items-center gap-2 text-sub">
        <button
          title={muted ? "sound off" : "sound on"}
          onClick={() => setSoundProfile(muted ? "keythm" : "off")}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors hover:bg-sub-alt hover:text-text"
        >
          <span className="text-base">{muted ? "🔇" : "🔊"}</span>
          <span className="hidden sm:inline">Audio</span>
        </button>
        <button
          title="settings"
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors hover:bg-sub-alt hover:text-text"
        >
          <span className="text-base">⚙️</span>
          <span className="hidden sm:inline">Settings</span>
        </button>
        <a
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
          title="source"
          className="rounded-lg px-3 py-1.5 text-sm transition-colors hover:bg-sub-alt hover:text-text"
        >
          GitHub
        </a>
      </nav>
    </header>
  );
}
