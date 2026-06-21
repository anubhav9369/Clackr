import { useStore } from "../store/useStore";

interface Key {
  label: string;
  sub?: string; // small secondary label (mac modifier name)
  /** lowercase character(s) that activate this key */
  match: string[];
  /** flex-basis width unit (1 = standard key) */
  w?: number;
  align?: "left" | "right" | "center";
}

// macOS-style layout
const MAC_ROWS: Key[][] = [
  [
    { label: "`", match: ["`", "~"] },
    { label: "1", match: ["1", "!"] },
    { label: "2", match: ["2", "@"] },
    { label: "3", match: ["3", "#"] },
    { label: "4", match: ["4", "$"] },
    { label: "5", match: ["5", "%"] },
    { label: "6", match: ["6", "^"] },
    { label: "7", match: ["7", "&"] },
    { label: "8", match: ["8", "*"] },
    { label: "9", match: ["9", "("] },
    { label: "0", match: ["0", ")"] },
    { label: "-", match: ["-", "_"] },
    { label: "=", match: ["=", "+"] },
    { label: "delete", match: ["backspace"], w: 1.75, align: "right" },
  ],
  [
    { label: "tab", match: ["\t"], w: 1.5, align: "left" },
    { label: "Q", match: ["q"] },
    { label: "W", match: ["w"] },
    { label: "E", match: ["e"] },
    { label: "R", match: ["r"] },
    { label: "T", match: ["t"] },
    { label: "Y", match: ["y"] },
    { label: "U", match: ["u"] },
    { label: "I", match: ["i"] },
    { label: "O", match: ["o"] },
    { label: "P", match: ["p"] },
    { label: "[", match: ["[", "{"] },
    { label: "]", match: ["]", "}"] },
    { label: "\\", match: ["\\", "|"], w: 1.5, align: "right" },
  ],
  [
    { label: "caps", match: [], w: 1.75, align: "left" },
    { label: "A", match: ["a"] },
    { label: "S", match: ["s"] },
    { label: "D", match: ["d"] },
    { label: "F", match: ["f"] },
    { label: "G", match: ["g"] },
    { label: "H", match: ["h"] },
    { label: "J", match: ["j"] },
    { label: "K", match: ["k"] },
    { label: "L", match: ["l"] },
    { label: ";", match: [";", ":"] },
    { label: "'", match: ["'", '"'] },
    { label: "return", match: ["enter"], w: 2, align: "right" },
  ],
  [
    { label: "shift", match: [], w: 2.4, align: "left" },
    { label: "Z", match: ["z"] },
    { label: "X", match: ["x"] },
    { label: "C", match: ["c"] },
    { label: "V", match: ["v"] },
    { label: "B", match: ["b"] },
    { label: "N", match: ["n"] },
    { label: "M", match: ["m"] },
    { label: ",", match: [",", "<"] },
    { label: ".", match: [".", ">"] },
    { label: "/", match: ["/", "?"] },
    { label: "shift", match: [], w: 2.4, align: "right" },
  ],
  [
    { label: "fn", match: [], w: 1 },
    { label: "⌃", sub: "control", match: [], w: 1 },
    { label: "⌥", sub: "option", match: [], w: 1 },
    { label: "⌘", sub: "command", match: [], w: 1.4 },
    { label: "", match: [" "], w: 6.4 },
    { label: "⌘", sub: "command", match: [], w: 1.4 },
    { label: "⌥", sub: "option", match: [], w: 1 },
  ],
];

const MINIMAL_ROWS: Key[][] = [
  "qwertyuiop".split("").map((c) => ({ label: c.toUpperCase(), match: [c] })),
  "asdfghjkl".split("").map((c) => ({ label: c.toUpperCase(), match: [c] })),
  "zxcvbnm".split("").map((c) => ({ label: c.toUpperCase(), match: [c] })),
  [{ label: "", match: [" "], w: 7 }],
];

export default function Keyboard() {
  const lastKey = useStore((s) => s.lastKey);
  const style = useStore((s) => s.keyboardStyle);
  const active = (lastKey ?? "").toLowerCase();

  const rows = style === "minimal" ? MINIMAL_ROWS : MAC_ROWS;
  const compact = style === "iso"; // "compact" preset

  return (
    <div
      className="mx-auto w-full max-w-3xl select-none rounded-2xl p-3 shadow-2xl"
      style={{
        background: "linear-gradient(145deg, var(--sub-alt), var(--bg))",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div className="flex flex-col gap-1.5">
        {rows.map((row, ri) => (
          <div key={ri} className="flex justify-center gap-1.5">
            {row.map((key, ki) => {
              const isActive = key.match.includes(active);
              const w = key.w ?? 1;
              const isSpace = key.match.includes(" ");
              return (
                <div
                  key={ki}
                  className={`relative flex ${
                    compact ? "h-8" : "h-10"
                  } flex-col items-start justify-end rounded-md px-2 pb-1 text-[11px] font-medium transition-all duration-75`}
                  style={{
                    flex: `${w} 1 0`,
                    minWidth: 0,
                    color: isActive ? "var(--bg)" : "var(--sub)",
                    background: isActive
                      ? "var(--main)"
                      : "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(0,0,0,0.18))",
                    boxShadow: isActive
                      ? "0 0 12px var(--main), inset 0 -2px 0 rgba(0,0,0,0.25)"
                      : "inset 0 -3px 0 rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
                    transform: isActive ? "translateY(2px)" : "none",
                    alignItems:
                      key.align === "right"
                        ? "flex-end"
                        : isSpace
                        ? "center"
                        : "flex-start",
                  }}
                  title={key.sub}
                >
                  {key.sub ? (
                    <span className="leading-none">{key.label}</span>
                  ) : (
                    key.label
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
