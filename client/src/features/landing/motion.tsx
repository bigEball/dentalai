import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';

/**
 * The page's motion primitives. Everything here is IntersectionObserver,
 * requestAnimationFrame, and CSS custom properties — no animation library, and
 * no component re-renders while something is moving.
 */

/**
 * `useLayoutEffect` in the browser, `useEffect` during the prerender.
 *
 * The public pages are rendered to HTML at build time, and React warns that a
 * layout effect "does nothing on the server" for every component that holds
 * one — three warnings per route through the build log. The effects below
 * measure the DOM, so there is nothing for them to do in Node anyway; this
 * picks the hook that fits the environment rather than silencing the warning.
 * Behaviour in the browser is unchanged: it is still a layout effect there,
 * which is what keeps a measured scale from being applied a frame late.
 */
export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  );
}

/** True once the element has been on screen. Fires once and disconnects. */
export function useInView<T extends HTMLElement = HTMLDivElement>(threshold = 0.15) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: '0px 0px -8% 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, inView] as const;
}

/** Whether the element is on screen right now. Used to idle the stepper. */
export function useOnScreen<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [onScreen, setOnScreen] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setOnScreen(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), {
      threshold: 0.25,
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, onScreen] as const;
}

/**
 * Fades and lifts its children the first time they reach the viewport.
 * `delay` staggers siblings — 60–90ms apart reads as one gesture; more than
 * that and the row starts to look like it is loading.
 */
export function Reveal({
  children,
  className = '',
  delay = 0,
  style,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  style?: CSSProperties;
}) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={`summit-reveal ${inView ? 'is-in' : ''} ${className}`}
      style={{ ['--summit-d' as string]: `${delay}ms`, ...style }}
    >
      {children}
    </div>
  );
}

/**
 * Splits a line into words that resolve out of a blur, one after another.
 *
 * The gap between words is a real space character, not a margin on the span.
 * A margin looks identical and reads as nothing: the DOM would hold
 * `The`,`practice,`,`handled.` with no separator, so a screen reader announces
 * one run-on word and copying the headline yields "Thepractice,handled.".
 * Collapsed whitespace between inline-blocks measures about the 0.26em the
 * margin was set to anyway.
 */
export function Words({
  text,
  className = '',
  delay = 0,
  step = 85,
}: {
  text: string;
  className?: string;
  delay?: number;
  step?: number;
}) {
  const words = text.split(' ');
  return (
    <span className={`summit-lines ${className}`}>
      {words.map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          <span className="summit-word" style={{ ['--summit-d' as string]: `${delay + i * step}ms` }}>
            {word}
          </span>
          {i < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </span>
  );
}

/**
 * Writes the cursor position into `--mx` / `--my` on the element, for the
 * radial highlights on cards and buttons. rAF-gated: pointermove fires far
 * faster than the screen refreshes.
 */
export function useSpotlight<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const frame = useRef<number | null>(null);
  const point = useRef({ x: 0, y: 0 });

  const onPointerMove = useCallback((event: ReactPointerEvent<T>) => {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    point.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      node.style.setProperty('--mx', `${point.current.x}px`);
      node.style.setProperty('--my', `${point.current.y}px`);
    });
  }, []);

  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    },
    [],
  );

  return { ref, onPointerMove };
}

/**
 * Document scroll position as 0 → 1, written to `--summit-p` on the returned
 * ref, plus a `scrolled` flag for the header's condensed state. The flag has
 * 24px of hysteresis so a trackpad resting near the threshold cannot flicker it.
 */
export function useScrollProgress<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let frame: number | null = null;

    const measure = () => {
      frame = null;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      const y = window.scrollY;
      ref.current?.style.setProperty('--summit-p', height > 0 ? (y / height).toFixed(4) : '0');
      setScrolled((was) => (was ? y > 16 : y > 40));
    };

    const onScroll = () => {
      if (frame === null) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return { ref, scrolled };
}

/**
 * Scales a fixed-size design down to fit its container.
 *
 * The demo frame is built at the app's real dimensions — a 248px sidebar, a
 * 56px top bar, 13px body text — and then shrunk to fit the column. Laying it
 * out at display size instead would mean inventing proportions, and it would
 * stop looking like the product.
 */
export function useFitScale<T extends HTMLElement = HTMLDivElement>(designWidth: number) {
  const ref = useRef<T>(null);
  // 0 rather than 1: the first render happens before the column has been
  // measured, and a scale of 1 would lay the frame out at its full 1120×660
  // design size for that frame — a visible lurch as it snapped down to fit.
  const [scale, setScale] = useState(0);

  // Layout effect, not effect: this runs before the browser paints, so the
  // measured scale is applied in the same frame the element first appears.
  useIsomorphicLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const measure = () => setScale(node.clientWidth / designWidth);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [designWidth]);

  return { ref, scale };
}

/**
 * Drifts an element a few pixels toward the cursor. `strength` is the maximum
 * offset in pixels — past about 14 it stops reading as depth and starts
 * reading as a bug.
 */
export function usePointerDrift<T extends HTMLElement = HTMLDivElement>(strength = 10) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || prefersReducedMotion()) return;
    if (window.matchMedia?.('(hover: none)').matches) return;

    let frame: number | null = null;
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };

    const render = () => {
      current.x += (target.x - current.x) * 0.06;
      current.y += (target.y - current.y) * 0.06;
      node.style.setProperty('--summit-px', `${current.x.toFixed(2)}px`);
      node.style.setProperty('--summit-py', `${current.y.toFixed(2)}px`);
      if (Math.abs(target.x - current.x) < 0.05 && Math.abs(target.y - current.y) < 0.05) {
        frame = null;
        return;
      }
      frame = requestAnimationFrame(render);
    };

    const onMove = (event: globalThis.PointerEvent) => {
      target.x = ((event.clientX / window.innerWidth) * 2 - 1) * strength;
      target.y = ((event.clientY / window.innerHeight) * 2 - 1) * strength;
      if (frame === null) frame = requestAnimationFrame(render);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
    };
  }, [strength]);

  return ref;
}
