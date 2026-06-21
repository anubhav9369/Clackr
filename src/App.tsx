import { useCallback, useEffect, useRef, useState } from "react";
import { useStore } from "./store/useStore";
import { soundEngine } from "./audio/soundEngine";
import Header from "./components/Header";
import ConfigBar from "./components/ConfigBar";
import TypingArea from "./components/TypingArea";
import LiveStats from "./components/LiveStats";
import Results from "./components/Results";
import Keyboard from "./components/Keyboard";
import SettingsModal from "./components/SettingsModal";

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tabArmed, setTabArmed] = useState(false);

  const init = useStore((s) => s.init);
  const phase = useStore((s) => s.phase);
  const mode = useStore((s) => s.mode);
  const showKeyboard = useStore((s) => s.showKeyboard);

  const settingsRef = useRef(settingsOpen);
  settingsRef.current = settingsOpen;
  const tabArmedRef = useRef(tabArmed);
  tabArmedRef.current = tabArmed;

  // init theme/sound/words once
  useEffect(() => {
    init();
  }, [init]);

  // timer loop
  useEffect(() => {
    const id = window.setInterval(() => {
      const st = useStore.getState();
      if (st.phase === "running") st.tick();
    }, 100);
    return () => window.clearInterval(id);
  }, []);

  // realistic sprite: play down/up slices on physical key events (keythm-style)
  useEffect(() => {
    const pressed = new Set<string>();
    const down = (e: KeyboardEvent) => {
      if (!soundEngine.isSprite) return;
      if (pressed.has(e.code)) return; // ignore auto-repeat while held
      pressed.add(e.code);
      soundEngine.unlock();
      soundEngine.playSprite("down", e.code);
    };
    const up = (e: KeyboardEvent) => {
      if (!pressed.has(e.code)) return;
      pressed.delete(e.code);
      if (soundEngine.isSprite) soundEngine.playSprite("up", e.code);
    };
    const blur = () => pressed.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const st = useStore.getState();

      // global restart: tab then enter
      if (e.key === "Tab") {
        e.preventDefault();
        setTabArmed(true);
        return;
      }
      if (tabArmedRef.current) {
        if (e.key === "Enter") {
          e.preventDefault();
          setTabArmed(false);
          soundEngine.unlock();
          st.restart();
          return;
        }
        setTabArmed(false);
      }

      if (settingsRef.current) return;

      // ignore shortcuts with modifiers (except ctrl+backspace)
      if ((e.metaKey || e.altKey) && e.key !== "Backspace") return;
      if (e.ctrlKey && e.key !== "Backspace") return;

      if (e.key === "Backspace") {
        e.preventDefault();
        // ⌥/⌘ + delete removes a whole word (macOS behavior)
        st.handleBackspace(e.ctrlKey || e.altKey || e.metaKey);
        return;
      }

      if (e.key === " ") {
        e.preventDefault();
        if (st.mode === "zen") {
          soundEngine.unlock();
          st.handleChar(" ");
        } else {
          st.handleSpace();
        }
        return;
      }

      if (e.key === "Enter") {
        if (st.mode === "zen" && st.phase === "running") {
          e.preventDefault();
          st.finish();
        }
        return;
      }

      // printable single char
      if (e.key.length === 1) {
        soundEngine.unlock();
        st.handleChar(e.key);
      }
    },
    []
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // hide cursor while typing
  const typing = phase === "running";

  return (
    <div
      className={`mx-auto flex min-h-full max-w-5xl flex-col gap-8 px-6 py-6 ${
        typing ? "cursor-none" : ""
      }`}
    >
      <Header onOpenSettings={() => setSettingsOpen(true)} />

      <main className="flex flex-1 flex-col items-center justify-center gap-8">
        {phase !== "finished" && (
          <>
            {mode !== "zen" || phase === "idle" ? <ConfigBar /> : null}
            <div className="w-full">
              <div className="mb-3 h-8">
                <LiveStats />
              </div>
              <TypingArea />
            </div>

            <div className="flex items-center gap-3 text-sm text-sub">
              <button
                onClick={() => useStore.getState().restart()}
                className={`rounded px-3 py-1 transition-colors hover:bg-sub-alt ${
                  tabArmed ? "bg-sub-alt text-text" : ""
                }`}
                title="restart test"
              >
                ↻ restart
              </button>
              <span>
                <kbd className="rounded bg-sub-alt px-1.5 py-0.5 text-text">tab</kbd>
                {" + "}
                <kbd className="rounded bg-sub-alt px-1.5 py-0.5 text-text">enter</kbd>
                {tabArmed ? "  — now press enter" : "  to restart"}
              </span>
            </div>
          </>
        )}

        {phase === "finished" && <Results />}
      </main>

      {showKeyboard && phase !== "finished" && (
        <div className="flex justify-center">
          <Keyboard />
        </div>
      )}

      <footer className="flex items-center justify-center gap-4 text-xs text-sub">
        <span>realistic + synthesized key sounds</span>
        <span>·</span>
        <span>⌥/⌘ + delete removes a word</span>
        <span>·</span>
        <span>all stats stored locally</span>
      </footer>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
