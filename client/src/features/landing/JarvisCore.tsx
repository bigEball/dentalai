/**
 * JarvisCore — the crowned-tooth mark inside a rotating heads-up display.
 *
 * Everything is inline SVG plus the keyframes in landing.css, so the component
 * has no dependencies beyond React and the logo image.
 */

const ICE = '#7dd3fc';

/** 90 ticks around the dial; every fifth one is longer and brighter. */
const TICKS = Array.from({ length: 90 }, (_, i) => i * 4);

const CARDINALS = [
  { angle: 0, label: '000' },
  { angle: 90, label: '090' },
  { angle: 180, label: '180' },
  { angle: 270, label: '270' },
];

function polar(radius: number, degrees: number) {
  const rad = ((degrees - 90) * Math.PI) / 180;
  return { x: 200 + radius * Math.cos(rad), y: 200 + radius * Math.sin(rad) };
}

/** A partial ring, drawn as a dashed circle with pathLength normalised to 100. */
function Arc({
  radius,
  dash,
  width = 1,
  opacity = 0.5,
  className,
}: {
  radius: number;
  dash: string;
  width?: number;
  opacity?: number;
  className?: string;
}) {
  return (
    <circle
      className={className}
      cx={200}
      cy={200}
      r={radius}
      fill="none"
      stroke={ICE}
      strokeWidth={width}
      strokeOpacity={opacity}
      strokeLinecap="round"
      pathLength={100}
      strokeDasharray={dash}
    />
  );
}

export default function JarvisCore({ logoSrc = '/logo-mark.png' }: { logoSrc?: string }) {
  return (
    <div className="summit-core relative aspect-square w-full max-w-[min(88vw,560px)]">
      {/* Depth: a soft cold light behind the mark. */}
      <div
        className="summit-breathe absolute inset-0 rounded-full"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(56,189,248,0.20) 0%, rgba(56,189,248,0.07) 38%, transparent 66%)',
        }}
      />

      {/* Scanning sweep. */}
      <div
        className="summit-sweep absolute inset-[8%] rounded-full"
        aria-hidden="true"
        style={{
          background:
            'conic-gradient(from 0deg, rgba(125,211,252,0.26) 0deg, rgba(125,211,252,0.06) 26deg, transparent 62deg, transparent 360deg)',
          WebkitMaskImage:
            'radial-gradient(circle, transparent 42%, #000 54%, #000 96%, transparent 100%)',
          maskImage:
            'radial-gradient(circle, transparent 42%, #000 54%, #000 96%, transparent 100%)',
        }}
      />

      <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full" aria-hidden="true">
        {/* Outer boundary. */}
        <circle cx={200} cy={200} r={196} fill="none" stroke={ICE} strokeWidth={0.6} strokeOpacity={0.22} />

        {/* Tick dial. */}
        <g className="summit-ring">
          {TICKS.map((angle) => {
            const major = angle % 20 === 0;
            const outer = polar(188, angle);
            const inner = polar(major ? 176 : 182, angle);
            return (
              <line
                key={angle}
                x1={outer.x}
                y1={outer.y}
                x2={inner.x}
                y2={inner.y}
                stroke={ICE}
                strokeWidth={major ? 1.2 : 0.7}
                strokeOpacity={major ? 0.7 : 0.3}
              />
            );
          })}
          {CARDINALS.map(({ angle, label }) => {
            const p = polar(166, angle);
            return (
              <text
                key={label}
                x={p.x}
                y={p.y}
                fill={ICE}
                fillOpacity={0.55}
                fontSize={7}
                letterSpacing={1.2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              >
                {label}
              </text>
            );
          })}
        </g>

        {/* Segmented rings, each turning at its own rate. */}
        <g className="summit-ring-reverse">
          <Arc radius={158} dash="22 4 9 4 34 4 9 4" width={1.6} opacity={0.65} />
        </g>
        <g className="summit-ring-fast">
          <Arc radius={146} dash="1 3" width={1} opacity={0.38} />
          {/* Nodes riding the dial. */}
          {[24, 132, 268].map((angle) => {
            const p = polar(146, angle);
            return <circle key={angle} cx={p.x} cy={p.y} r={2.2} fill={ICE} fillOpacity={0.85} />;
          })}
        </g>
        <g className="summit-ring-reverse-slow">
          <Arc radius={134} dash="40 12 26 12" width={1} opacity={0.42} />
        </g>

        {/* Targeting brackets. */}
        <g className="summit-ring-fast summit-flicker">
          <Arc radius={120} dash="5 20" width={2.2} opacity={0.8} />
        </g>

        {/* Innermost containment ring around the mark. */}
        <circle cx={200} cy={200} r={108} fill="none" stroke={ICE} strokeWidth={0.8} strokeOpacity={0.35} />
        <circle cx={200} cy={200} r={101} fill="none" stroke="#ffffff" strokeWidth={0.4} strokeOpacity={0.14} />

        {/* Crosshair spurs. */}
        {[0, 90, 180, 270].map((angle) => {
          const a = polar(112, angle);
          const b = polar(102, angle);
          return (
            <line
              key={angle}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={ICE}
              strokeWidth={1}
              strokeOpacity={0.6}
            />
          );
        })}
      </svg>

      {/* The mark itself. */}
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src={logoSrc}
          alt="Summit AI Services"
          className="summit-tooth h-[42%] w-auto select-none object-contain"
          draggable={false}
        />
      </div>
    </div>
  );
}
