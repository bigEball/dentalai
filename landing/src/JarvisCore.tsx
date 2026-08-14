/**
 * JarvisCore — the crowned-tooth mark suspended inside a live heads-up display.
 *
 * Everything is inline SVG plus the keyframes in landing.css: no images beyond
 * the logo, no canvas, no libraries. Layers are ordered outside-in and each
 * rotating group runs at its own rate so the dial never reads as one object.
 */

const ICE = '#7dd3fc';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/** Polar → cartesian on a 400×400 canvas, 0° at twelve o'clock. */
function polar(radius: number, degrees: number) {
  const rad = ((degrees - 90) * Math.PI) / 180;
  return { x: 200 + radius * Math.cos(rad), y: 200 + radius * Math.sin(rad) };
}

/**
 * A partial ring. `pct` is how much of the circumference it covers and `start`
 * is where it begins, both in percent, matching SVG's dash offsets.
 */
function Arc({
  radius,
  pct,
  start = 0,
  width = 1,
  opacity = 0.5,
  color = ICE,
  cap = 'round',
}: {
  radius: number;
  pct: number;
  start?: number;
  width?: number;
  opacity?: number;
  color?: string;
  cap?: 'round' | 'butt';
}) {
  return (
    <circle
      cx={200}
      cy={200}
      r={radius}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeOpacity={opacity}
      strokeLinecap={cap}
      pathLength={100}
      strokeDasharray={`${pct} ${100 - pct}`}
      strokeDashoffset={-start}
    />
  );
}

/** Where a dashed arc's leading edge lands, for putting a hot dot on it. */
function arcHead(radius: number, start: number, pct: number) {
  return polar(radius, 90 + (start + pct) * 3.6);
}

/** Deterministic pseudo-random in [0, 1) — no Math.random, so SSR stays stable. */
function noise(i: number) {
  return (Math.sin(i * 12.9898) * 43758.5453) % 1;
}

const TICKS = Array.from({ length: 120 }, (_, i) => i * 3);
const BARS = Array.from({ length: 72 }, (_, i) => i * 5);
const CARDINALS = [0, 90, 180, 270];

/** Small telemetry blocks. Abstract on purpose — texture, not copy. */
const READOUTS = [
  { x: 18, y: 150, label: 'SYS', value: '0.98', anchor: 'start' as const },
  { x: 382, y: 150, label: 'LNK', value: 'OK', anchor: 'end' as const },
  { x: 18, y: 262, label: 'CH', value: '32', anchor: 'start' as const },
  { x: 382, y: 262, label: 'SCN', value: '00', anchor: 'end' as const },
];

export default function JarvisCore({ logoSrc = '/logo-mark.png' }: { logoSrc?: string }) {
  return (
    <div className="summit-core relative aspect-square w-full max-w-[min(92vw,620px)]">
      {/* Cold light behind the assembly. */}
      <div
        className="summit-breathe absolute inset-0 rounded-full"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(56,189,248,0.22) 0%, rgba(56,189,248,0.07) 38%, transparent 66%)',
        }}
      />

      {/* Two sweeps turning against each other. */}
      <div
        className="summit-sweep absolute inset-[6%] rounded-full"
        aria-hidden="true"
        style={{
          background:
            'conic-gradient(from 0deg, rgba(125,211,252,0.3) 0deg, rgba(125,211,252,0.07) 24deg, transparent 60deg, transparent 360deg)',
          WebkitMaskImage: 'radial-gradient(circle, transparent 40%, #000 52%, #000 96%, transparent 100%)',
          maskImage: 'radial-gradient(circle, transparent 40%, #000 52%, #000 96%, transparent 100%)',
        }}
      />
      <div
        className="summit-sweep-slow absolute inset-[16%] rounded-full"
        aria-hidden="true"
        style={{
          background:
            'conic-gradient(from 180deg, rgba(255,255,255,0.14) 0deg, transparent 34deg, transparent 360deg)',
          WebkitMaskImage: 'radial-gradient(circle, transparent 46%, #000 60%, #000 96%, transparent 100%)',
          maskImage: 'radial-gradient(circle, transparent 46%, #000 60%, #000 96%, transparent 100%)',
        }}
      />

      <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <pattern id="summit-hex" width="16" height="27.7" patternUnits="userSpaceOnUse">
            <path
              d="M8 0 L16 4.6 L16 13.85 L8 18.45 L0 13.85 L0 4.6 Z"
              fill="none"
              stroke={ICE}
              strokeWidth={0.55}
              strokeOpacity={0.75}
            />
          </pattern>
          <radialGradient id="summit-hex-fade">
            <stop offset="40%" stopColor="#fff" stopOpacity={0.7} />
            <stop offset="100%" stopColor="#fff" stopOpacity={0} />
          </radialGradient>
          <mask id="summit-hex-mask">
            <circle cx={200} cy={200} r={96} fill="url(#summit-hex-fade)" />
          </mask>
        </defs>

        {/* Frame corners — the display's outer bracket. */}
        <g stroke={ICE} strokeOpacity={0.45} strokeWidth={1.2} fill="none">
          {[
            'M6 34 L6 6 L34 6',
            'M366 6 L394 6 L394 34',
            'M394 366 L394 394 L366 394',
            'M34 394 L6 394 L6 366',
          ].map((d) => (
            <path key={d} d={d} />
          ))}
        </g>

        {/* Outer boundary + fine dashed rim. */}
        <circle cx={200} cy={200} r={196} fill="none" stroke={ICE} strokeWidth={0.6} strokeOpacity={0.18} />
        <g className="summit-spin-120">
          <circle
            cx={200}
            cy={200}
            r={191}
            fill="none"
            stroke={ICE}
            strokeWidth={0.7}
            strokeOpacity={0.3}
            pathLength={100}
            strokeDasharray="0.4 1.1"
          />
        </g>

        {/* Radial bar graph — the loudest techy layer. */}
        <g className="summit-rev-90">
          {BARS.map((angle, i) => {
            const height = 4 + Math.abs(noise(i)) * 13;
            const a = polar(174, angle);
            const b = polar(174 + height, angle);
            const hot = i % 9 === 0;
            return (
              <line
                key={angle}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={hot ? '#e0f2fe' : ICE}
                strokeWidth={hot ? 2 : 1.4}
                strokeOpacity={hot ? 0.85 : 0.32}
                strokeLinecap="round"
              />
            );
          })}
        </g>

        {/* Tick dial with bearing labels. */}
        <g className="summit-spin-72">
          {TICKS.map((angle) => {
            const major = angle % 15 === 0;
            const outer = polar(168, angle);
            const inner = polar(major ? 156 : 162, angle);
            return (
              <line
                key={angle}
                x1={outer.x}
                y1={outer.y}
                x2={inner.x}
                y2={inner.y}
                stroke={ICE}
                strokeWidth={major ? 1.2 : 0.6}
                strokeOpacity={major ? 0.7 : 0.26}
              />
            );
          })}
          {CARDINALS.map((angle) => {
            const p = polar(147, angle);
            return (
              <text
                key={angle}
                x={p.x}
                y={p.y}
                fill={ICE}
                fillOpacity={0.55}
                fontSize={7}
                letterSpacing={1.2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily={MONO}
              >
                {String(angle).padStart(3, '0')}
              </text>
            );
          })}
        </g>

        {/* Heavy segmented ring with hot end caps. */}
        <g className="summit-rev-52">
          <Arc radius={140} pct={19} start={2} width={2.4} opacity={0.75} />
          <Arc radius={140} pct={11} start={34} width={2.4} opacity={0.45} />
          <Arc radius={140} pct={26} start={54} width={2.4} opacity={0.6} />
          <Arc radius={140} pct={6} start={87} width={2.4} opacity={0.35} />
          {[
            [2, 19],
            [54, 26],
          ].map(([start, pct]) => {
            const head = arcHead(140, start, pct);
            return <circle key={start} cx={head.x} cy={head.y} r={2.6} fill="#e0f2fe" fillOpacity={0.95} />;
          })}
        </g>

        {/* Comet: a bright head dragging a fading tail. */}
        <g className="summit-spin-8">
          <Arc radius={130} pct={3} start={0} width={2.6} opacity={0.9} color="#e0f2fe" />
          <Arc radius={130} pct={7} start={-8} width={2} opacity={0.35} />
          <Arc radius={130} pct={10} start={-19} width={1.4} opacity={0.14} />
          {(() => {
            const head = arcHead(130, 0, 3);
            return <circle cx={head.x} cy={head.y} r={3.2} fill="#fff" fillOpacity={0.95} />;
          })()}
        </g>

        {/* Hex frame — rotating polygon, reads as machined hardware. */}
        <g className="summit-spin-40">
          <polygon
            points={[0, 60, 120, 180, 240, 300]
              .map((a) => {
                const p = polar(122, a);
                return `${p.x},${p.y}`;
              })
              .join(' ')}
            fill="none"
            stroke={ICE}
            strokeWidth={1}
            strokeOpacity={0.34}
            strokeDasharray="14 7"
          />
        </g>

        {/* Counter-rotating micro dashes + nodes. */}
        <g className="summit-rev-28">
          <circle
            cx={200}
            cy={200}
            r={113}
            fill="none"
            stroke={ICE}
            strokeWidth={1}
            strokeOpacity={0.3}
            pathLength={100}
            strokeDasharray="1 3"
          />
          {[18, 96, 210, 302].map((angle, i) => {
            const p = polar(113, angle);
            return (
              <g key={angle} className={i % 2 ? 'summit-blink' : 'summit-blink-slow'}>
                <circle cx={p.x} cy={p.y} r={3.4} fill={ICE} fillOpacity={0.18} />
                <circle cx={p.x} cy={p.y} r={1.7} fill="#e0f2fe" fillOpacity={0.95} />
              </g>
            );
          })}
        </g>

        {/* Targeting brackets around the mark. */}
        <g className="summit-spin-16 summit-flicker">
          {[0, 90, 180, 270].map((angle) => (
            <g key={angle}>
              <Arc radius={102} pct={5} start={angle / 3.6 - 2.5} width={2.4} opacity={0.85} cap="butt" />
            </g>
          ))}
        </g>

        {/* Containment rings. */}
        <circle cx={200} cy={200} r={95} fill="none" stroke={ICE} strokeWidth={0.9} strokeOpacity={0.4} />
        <circle cx={200} cy={200} r={88} fill="none" stroke="#ffffff" strokeWidth={0.4} strokeOpacity={0.16} />
        <circle cx={200} cy={200} r={95} fill="#0b1a26" fillOpacity={0.35} />

        {/* Honeycomb field behind the tooth. */}
        <g mask="url(#summit-hex-mask)">
          <rect x={100} y={100} width={200} height={200} fill="url(#summit-hex)" />
        </g>

        {/* Crosshair spurs breaking the containment ring. */}
        {[0, 90, 180, 270].map((angle) => {
          const a = polar(101, angle);
          const b = polar(89, angle);
          return (
            <line key={angle} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={ICE} strokeWidth={1.2} strokeOpacity={0.7} />
          );
        })}

        {/* Telemetry blocks — deliberately abstract, read as texture. */}
        <g fontFamily={MONO} fontSize={7.5} letterSpacing={1}>
          {READOUTS.map((r, i) => (
            <g key={r.label} className={i % 2 ? 'summit-flicker' : undefined}>
              <text x={r.x} y={r.y} fill={ICE} fillOpacity={0.5} textAnchor={r.anchor}>
                {r.label}
              </text>
              <text x={r.x} y={r.y + 11} fill="#e0f2fe" fillOpacity={0.75} textAnchor={r.anchor}>
                {r.value}
              </text>
              <rect
                x={r.anchor === 'start' ? r.x : r.x - 34}
                y={r.y + 17}
                width={34}
                height={2}
                fill={ICE}
                fillOpacity={0.16}
              />
              <rect
                className="summit-meter"
                x={r.anchor === 'start' ? r.x : r.x - 34}
                y={r.y + 17}
                width={34}
                height={2}
                fill={ICE}
                fillOpacity={0.7}
                style={{ animationDelay: `${i * 420}ms` }}
              />
            </g>
          ))}
        </g>
      </svg>

      {/* The mark, with a scan line passing over it. */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative flex h-[45%] w-[45%] items-center justify-center overflow-hidden rounded-full">
          <img
            src={logoSrc}
            alt="Summit AI Services"
            className="summit-tooth h-[84%] w-auto select-none object-contain"
            draggable={false}
          />
          <div
            className="summit-scanline pointer-events-none absolute inset-x-0 top-1/2 h-[2px]"
            aria-hidden="true"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(224,242,254,0.9) 35%, rgba(224,242,254,0.9) 65%, transparent)',
              boxShadow: '0 0 12px rgba(125,211,252,0.8)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
