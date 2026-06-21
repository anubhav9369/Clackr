import { WpmSample } from "../lib/types";

interface Props {
  samples: WpmSample[];
}

const W = 760;
const H = 220;
const PAD = { top: 16, right: 16, bottom: 28, left: 36 };

export default function WpmChart({ samples }: Props) {
  if (samples.length < 2) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sub">
        not enough data for a graph
      </div>
    );
  }

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const maxT = Math.max(...samples.map((s) => s.t), 1);
  const maxWpm = Math.max(...samples.map((s) => Math.max(s.wpm, s.raw)), 10);
  const yMax = Math.ceil(maxWpm / 20) * 20;

  const x = (t: number) => PAD.left + (t / maxT) * innerW;
  const y = (v: number) => PAD.top + innerH - (v / yMax) * innerH;

  const line = (key: "wpm" | "raw") =>
    samples.map((s, i) => `${i === 0 ? "M" : "L"} ${x(s.t).toFixed(1)} ${y(s[key]).toFixed(1)}`).join(" ");

  const yTicks = [0, yMax / 2, yMax];
  const xTicks = [0, Math.round(maxT / 2), maxT];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {/* grid + y axis */}
      {yTicks.map((v) => (
        <g key={v}>
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={y(v)}
            y2={y(v)}
            stroke="var(--sub-alt)"
            strokeWidth={1}
          />
          <text x={PAD.left - 8} y={y(v) + 4} textAnchor="end" fontSize={11} fill="var(--sub)">
            {Math.round(v)}
          </text>
        </g>
      ))}

      {/* x ticks */}
      {xTicks.map((t) => (
        <text key={t} x={x(t)} y={H - 8} textAnchor="middle" fontSize={11} fill="var(--sub)">
          {t}s
        </text>
      ))}

      {/* raw line */}
      <path d={line("raw")} fill="none" stroke="var(--sub)" strokeWidth={2} opacity={0.7} />
      {/* wpm line */}
      <path
        d={line("wpm")}
        fill="none"
        stroke="var(--main)"
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* error markers */}
      {samples.map((s, i) =>
        i > 0 && s.errors > samples[i - 1].errors ? (
          <text key={i} x={x(s.t)} y={PAD.top + 8} textAnchor="middle" fontSize={11} fill="var(--error)">
            ×
          </text>
        ) : null
      )}

      {/* legend */}
      <g>
        <rect x={W - 150} y={PAD.top} width={10} height={10} fill="var(--main)" />
        <text x={W - 135} y={PAD.top + 9} fontSize={11} fill="var(--sub)">
          wpm
        </text>
        <rect x={W - 90} y={PAD.top} width={10} height={10} fill="var(--sub)" />
        <text x={W - 75} y={PAD.top + 9} fontSize={11} fill="var(--sub)">
          raw
        </text>
      </g>
    </svg>
  );
}
