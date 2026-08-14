import { useEffect, useRef } from 'react';

/**
 * JarvisCore — the crowned-tooth mark inside a quiet heads-up display.
 *
 * Inline SVG plus the keyframes in landing.css: no images beyond the logo, no
 * canvas, no libraries. Layers run outside-in, each at its own slow rate, and
 * scroll position feeds a `--summit-s` variable (0 → 1) that the display opens
 * up against.
 */

const ICE = '#7dd3fc';

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
}: {
  radius: number;
  pct: number;
  start?: number;
  width?: number;
  opacity?: number;
  color?: string;
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
      strokeLinecap="round"
      pathLength={100}
      strokeDasharray={`${pct} ${100 - pct}`}
      strokeDashoffset={-start}
    />
  );
}

const TICKS = Array.from({ length: 60 }, (_, i) => i * 6);
const CARDINALS = [0, 90, 180, 270];

export default function JarvisCore({ logoSrc = '/logo-mark.png' }: { logoSrc?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  // Scroll drives `--summit-s`, smoothed so the display eases rather than snaps.
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    let frame: number | null = null;
    let target = 0;
    let current = 0;

    const read = () => {
      const rect = node.getBoundingClientRect();
      const range = Math.max(window.innerHeight, 640);
      // 0 while the mark sits centred, approaching 1 as it leaves upward.
      return Math.min(Math.max((range * 0.6 - rect.top) / range, 0), 1);
    };

    const render = () => {
      current += (target - current) * 0.12;
      if (Math.abs(target - current) < 0.0005) {
        current = target;
        frame = null;
      } else {
        frame = requestAnimationFrame(render);
      }
      node.style.setProperty('--summit-s', current.toFixed(4));
    };

    const onScroll = () => {
      target = read();
      if (frame === null) frame = requestAnimationFrame(render);
    };

    target = read();
    current = target;
    node.style.setProperty('--summit-s', current.toFixed(4));
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="summit-core summit-drift relative aspect-square w-full max-w-[min(92vw,600px)]"
    >
      {/* Cold light behind the assembly. */}
      <div
        className="summit-breathe absolute inset-0 rounded-full"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(56,189,248,0.24) 0%, rgba(56,189,248,0.08) 40%, transparent 66%)',
        }}
      />

      {/* A single slow sweep. */}
      <div
        className="summit-sweep absolute inset-[8%] rounded-full"
        aria-hidden="true"
        style={{
          background:
            'conic-gradient(from 0deg, rgba(125,211,252,0.24) 0deg, rgba(125,211,252,0.06) 30deg, transparent 66deg, transparent 360deg)',
          WebkitMaskImage: 'radial-gradient(circle, transparent 42%, #000 56%, #000 96%, transparent 100%)',
          maskImage: 'radial-gradient(circle, transparent 42%, #000 56%, #000 96%, transparent 100%)',
        }}
      />

      <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <radialGradient id="summit-well">
            <stop offset="0%" stopColor="#bae6fd" stopOpacity={0.16} />
            <stop offset="70%" stopColor="#38bdf8" stopOpacity={0.07} />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
          </radialGradient>
        </defs>

        {/* Frame corners. They pull apart as the page scrolls. */}
        <g className="summit-frame" stroke={ICE} strokeOpacity={0.38} strokeWidth={1.1} fill="none">
          {[
            'M6 34 L6 6 L34 6',
            'M366 6 L394 6 L394 34',
            'M394 366 L394 394 L366 394',
            'M34 394 L6 394 L6 366',
          ].map((d) => (
            <path key={d} d={d} />
          ))}
        </g>

        {/* Outer rim. */}
        <g className="summit-scroll-out">
          <circle cx={200} cy={200} r={188} fill="none" stroke={ICE} strokeWidth={0.6} strokeOpacity={0.26} />
          <g className="summit-spin-120">
            <circle
              cx={200}
              cy={200}
              r={181}
              fill="none"
              stroke={ICE}
              strokeWidth={0.7}
              strokeOpacity={0.34}
              pathLength={100}
              strokeDasharray="0.4 2.6"
            />
          </g>
        </g>

        {/* Bearing dial. */}
        <g className="summit-scroll-a">
          <g className="summit-spin-90">
            {TICKS.map((angle) => {
              const major = angle % 30 === 0;
              const outer = polar(166, angle);
              const inner = polar(major ? 156 : 161, angle);
              return (
                <line
                  key={angle}
                  x1={outer.x}
                  y1={outer.y}
                  x2={inner.x}
                  y2={inner.y}
                  stroke={ICE}
                  strokeWidth={major ? 1.1 : 0.6}
                  strokeOpacity={major ? 0.6 : 0.26}
                />
              );
            })}
            {CARDINALS.map((angle) => {
              const p = polar(146, angle);
              return (
                <text
                  key={angle}
                  x={p.x}
                  y={p.y}
                  fill={ICE}
                  fillOpacity={0.45}
                  fontSize={7}
                  letterSpacing={1.2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                >
                  {String(angle).padStart(3, '0')}
                </text>
              );
            })}
          </g>
        </g>

        {/* Segmented ring with a lit end cap. */}
        <g className="summit-scroll-b">
          <g className="summit-rev-70">
            <Arc radius={136} pct={20} start={4} width={1.8} opacity={0.6} />
            <Arc radius={136} pct={28} start={52} width={1.8} opacity={0.42} />
            {(() => {
              const head = polar(136, 90 + 24 * 3.6);
              return <circle cx={head.x} cy={head.y} r={2.2} fill="#e0f2fe" fillOpacity={0.8} />;
            })()}
          </g>
        </g>

        {/* One quiet traveller. */}
        <g className="summit-scroll-c">
          <g className="summit-spin-24">
            <Arc radius={124} pct={4} start={0} width={1.8} opacity={0.55} color="#e0f2fe" />
            <Arc radius={124} pct={9} start={-11} width={1.3} opacity={0.16} />
            {(() => {
              const head = polar(124, 90 + 4 * 3.6);
              return <circle cx={head.x} cy={head.y} r={2.4} fill="#fff" fillOpacity={0.75} />;
            })()}
          </g>
        </g>

        {/* Hex frame. */}
        <g className="summit-scroll-a">
          <g className="summit-rev-110">
            <polygon
              points={[0, 60, 120, 180, 240, 300]
                .map((a) => {
                  const p = polar(114, a);
                  return `${p.x},${p.y}`;
                })
                .join(' ')}
              fill="none"
              stroke={ICE}
              strokeWidth={0.9}
              strokeOpacity={0.28}
              strokeDasharray="16 9"
            />
          </g>
        </g>

        {/* Containment rings, and a lit well the mark sits in. Nothing crosses it. */}
        <circle cx={200} cy={200} r={95} fill="url(#summit-well)" />
        <circle cx={200} cy={200} r={95} fill="none" stroke={ICE} strokeWidth={1} strokeOpacity={0.4} />
        <circle cx={200} cy={200} r={88} fill="none" stroke="#ffffff" strokeWidth={0.4} strokeOpacity={0.16} />

        {/* Crosshair spurs. */}
        {[0, 90, 180, 270].map((angle) => {
          const a = polar(101, angle);
          const b = polar(90, angle);
          return (
            <line key={angle} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={ICE} strokeWidth={1} strokeOpacity={0.6} />
          );
        })}
      </svg>

      {/* The mark. */}
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src={logoSrc}
          alt="Summit AI Services"
          className="summit-tooth h-[38%] w-auto select-none object-contain"
          draggable={false}
        />
      </div>
    </div>
  );
}
