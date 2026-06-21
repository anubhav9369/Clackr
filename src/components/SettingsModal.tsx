import { useEffect } from "react";
import { useStore } from "../store/useStore";
import { themes } from "../lib/themes";
import { soundProfiles } from "../audio/soundEngine";
import { KeyboardStyle } from "../store/useStore";

interface Props {
  open: boolean;
  onClose: () => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-sub">{title}</h3>
      {children}
    </div>
  );
}

function Row({
  label,
  desc,
  children,
}: {
  label: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div className="flex flex-col">
        <span className="text-sm text-text">{label}</span>
        {desc && <span className="text-xs text-sub">{desc}</span>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative h-6 w-11 rounded-full transition-colors ${
        value ? "bg-main" : "bg-sub/40"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-bg shadow transition-transform ${
          value ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

const kbStyles: { id: KeyboardStyle; label: string }[] = [
  { id: "classic", label: "Mac" },
  { id: "iso", label: "Compact" },
  { id: "minimal", label: "Minimal" },
];

export default function SettingsModal({ open, onClose }: Props) {
  const s = useStore();

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <>
      {/* backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      {/* drawer */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-sub-alt shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-bg/40 px-6 py-4">
          <h2 className="text-lg font-bold text-main">Settings</h2>
          <button onClick={onClose} className="text-sub hover:text-text" title="close (esc)">
            ✕
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-7 overflow-y-auto px-6 py-5">
          <Section title="Appearance">
            <div className="grid grid-cols-2 gap-2">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => s.setTheme(t.id)}
                  className={`flex items-center gap-2 rounded-lg p-2 transition-all ${
                    s.themeId === t.id ? "ring-2 ring-main" : "opacity-80 hover:opacity-100"
                  }`}
                  style={{ background: t.colors.bg }}
                >
                  <span className="flex gap-1">
                    <span className="h-3 w-3 rounded-full" style={{ background: t.colors.main }} />
                    <span className="h-3 w-3 rounded-full" style={{ background: t.colors.text }} />
                  </span>
                  <span className="text-xs" style={{ color: t.colors.text }}>
                    {t.name}
                  </span>
                </button>
              ))}
            </div>
          </Section>

          <Section title="Keyboard">
            <Row label="Show keyboard" desc="virtual keyboard below the text">
              <Toggle value={s.showKeyboard} onChange={s.toggleShowKeyboard} />
            </Row>
            <Row label="Keyboard design">
              <div className="flex gap-1 rounded-lg bg-bg/50 p-1">
                {kbStyles.map((k) => (
                  <button
                    key={k.id}
                    onClick={() => s.setKeyboardStyle(k.id)}
                    className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                      s.keyboardStyle === k.id ? "bg-main text-bg" : "text-sub hover:text-text"
                    }`}
                  >
                    {k.label}
                  </button>
                ))}
              </div>
            </Row>
          </Section>

          <Section title="Sound">
            <div className="grid grid-cols-2 gap-2">
              {soundProfiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => s.setSoundProfile(p.id)}
                  className={`flex flex-col items-start rounded-lg p-2 text-left transition-colors ${
                    s.soundProfile === p.id ? "bg-main text-bg" : "bg-bg/50 text-text hover:bg-bg"
                  }`}
                >
                  <span className="text-sm font-medium">{p.name}</span>
                  <span className={`text-xs ${s.soundProfile === p.id ? "text-bg/70" : "text-sub"}`}>
                    {p.description}
                  </span>
                </button>
              ))}
            </div>
            <Row label="Volume">
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={s.volume}
                  onChange={(e) => s.setVolume(parseFloat(e.target.value))}
                  className="w-32"
                />
                <span className="w-9 text-right text-xs text-text tabular-nums">
                  {Math.round(s.volume * 100)}%
                </span>
              </div>
            </Row>
          </Section>

          <Section title="Gameplay">
            <Row label="Live wpm" desc="show wpm & accuracy while typing">
              <Toggle value={s.showLiveWpm} onChange={s.toggleLiveWpm} />
            </Row>
            <Row label="Smooth caret" desc="animate the cursor between letters">
              <Toggle value={s.smoothCaret} onChange={s.toggleSmoothCaret} />
            </Row>
            <Row label="Fash mode" desc="play a sound on wrong keystrokes">
              <Toggle value={s.errorSound} onChange={s.toggleErrorSound} />
            </Row>
            {s.errorSound && (
              <Row label="Mistake sound" desc='"faah" uses your custom audio file'>
                <div className="flex gap-1 rounded-lg bg-bg/50 p-1">
                  {([
                    { id: "buzzer", label: "Buzzer" },
                    { id: "faah", label: "Faah" },
                  ] as const).map((o) => (
                    <button
                      key={o.id}
                      onClick={() => s.setErrorSoundType(o.id)}
                      className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                        s.errorSoundType === o.id ? "bg-main text-bg" : "text-sub hover:text-text"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </Row>
            )}
          </Section>
        </div>

        <div className="border-t border-bg/40 px-6 py-3 text-center text-xs text-sub">
          press <kbd className="rounded bg-bg/60 px-1.5 py-0.5 text-text">esc</kbd> to close
        </div>
      </aside>
    </>
  );
}
