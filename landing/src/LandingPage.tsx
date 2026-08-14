import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import JarvisCore from './JarvisCore';
import './landing.css';

export interface LandingPageProps {
  /** Where the demo button points. Defaults to the app's demo sign-in. */
  demoHref?: string;
  /**
   * Called before navigation. Use it to hand the click to a router:
   * `onDemoClick={(e) => { e.preventDefault(); navigate('/login'); }}`
   */
  onDemoClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  contactEmail?: string;
  logoSrc?: string;
}

/** Fades a section in the first time it reaches the viewport. */
function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${className} transition-all duration-[900ms] ease-out ${
        shown ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
      }`}
    >
      {children}
    </div>
  );
}

export default function LandingPage({
  demoHref = '/login',
  onDemoClick,
  contactEmail = 'omid@summitaisoftware.com',
  logoSrc = '/logo-mark.png',
}: LandingPageProps) {
  function DemoButton({
    children = 'Open the live demo',
    tone = 'light',
    size = 'lg',
  }: {
    children?: ReactNode;
    tone?: 'light' | 'dark' | 'quiet';
    size?: 'sm' | 'lg';
  }) {
    const tones = {
      light: 'bg-white text-black hover:bg-white/85',
      dark: 'bg-black text-white hover:bg-black/85',
      quiet: 'border border-white/25 text-white hover:border-white/60 hover:bg-white/5',
    };
    const sizes = {
      sm: 'px-5 py-2 text-[13px]',
      lg: 'px-8 py-4 text-[17px]',
    };
    return (
      <a
        href={demoHref}
        onClick={onDemoClick}
        className={`inline-flex items-center gap-2 rounded-full font-medium tracking-tight transition-colors duration-200 ${tones[tone]} ${sizes[size]}`}
      >
        {children}
        <ArrowRight className={size === 'lg' ? 'h-[18px] w-[18px]' : 'h-3.5 w-3.5'} />
      </a>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-black font-sans text-white antialiased">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-xl">
        <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <a href="/" className="flex items-center gap-2.5">
            <img src={logoSrc} alt="" className="h-7 w-auto object-contain" />
            <span className="text-[15px] font-medium tracking-tight">Summit</span>
          </a>
          <DemoButton tone="light" size="sm">
            Demo
          </DemoButton>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden px-6 pb-10 pt-32 sm:pb-16 sm:pt-40">
          <div
            className="summit-scanlines pointer-events-none absolute inset-0 opacity-40"
            aria-hidden="true"
          />
          <div className="relative mx-auto max-w-4xl text-center">
            <p className="summit-rise text-[13px] font-medium uppercase tracking-[0.2em] text-sky-300/70">
              Summit AI Services
            </p>
            <h1
              className="summit-rise mt-6 text-[2.75rem] font-semibold leading-[1.05] tracking-[-0.035em] sm:text-7xl"
              style={{ animationDelay: '90ms' }}
            >
              The practice, handled.
            </h1>
            <p
              className="summit-rise mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/60 sm:text-xl"
              style={{ animationDelay: '180ms' }}
            >
              Software that does the notes, the claims, and the front desk work your team
              does by hand. Built for dental practices and the groups that run them.
            </p>
            <div className="summit-rise mt-10" style={{ animationDelay: '270ms' }}>
              <DemoButton />
              <p className="mt-4 text-[13px] text-white/40">
                No signup. Nothing to install. It opens in your browser.
              </p>
            </div>
          </div>

          <div className="relative mt-12 flex justify-center sm:mt-14">
            <JarvisCore logoSrc={logoSrc} />
          </div>

          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-black"
            aria-hidden="true"
          />
        </section>

        {/* DSOs */}
        <section className="relative overflow-hidden px-6 py-28 sm:py-40">
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
            style={{
              background:
                'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(56,189,248,0.14) 0%, transparent 70%)',
            }}
          />
          <div className="relative mx-auto max-w-3xl text-center">
            <Reveal>
              <p className="text-[13px] font-medium uppercase tracking-[0.2em] text-sky-300/70">
                For DSOs
              </p>
              <h2 className="mt-6 text-[2rem] font-semibold tracking-[-0.03em] sm:text-5xl">
                We also build it your way.
              </h2>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/60">
                Groups don't run on templates. We write custom software around how your
                organization actually works — your practice management system, your
                reporting, your rollout across locations. One team, from the first
                conversation to the last office.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <DemoButton tone="light">See the demo first</DemoButton>
                <a
                  href={`mailto:${contactEmail}`}
                  className="inline-flex items-center gap-2 rounded-full border border-white/25 px-8 py-4 text-[17px] font-medium tracking-tight text-white transition-colors duration-200 hover:border-white/60 hover:bg-white/5"
                >
                  Talk to us
                </a>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Close */}
        <section className="border-t border-white/10 px-6 py-28 text-center sm:py-40">
          <Reveal>
            <h2 className="text-[2.25rem] font-semibold tracking-[-0.035em] sm:text-6xl">
              See it for yourself.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-white/55">
              The full product, loaded with a working practice. Look around as long as you like.
            </p>
            <div className="mt-10">
              <DemoButton />
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-white/10 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-[13px] text-white/40 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <img src={logoSrc} alt="" className="h-5 w-auto object-contain opacity-70" />
            <span>Summit AI Services</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <a href={`mailto:${contactEmail}`} className="transition-colors hover:text-white">
              {contactEmail}
            </a>
            <a href={demoHref} onClick={onDemoClick} className="transition-colors hover:text-white">
              Demo
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
