import { useEffect, useId, useState, type MouseEvent, type ReactNode } from 'react';
import { ArrowRight, ArrowUpRight, Plus } from 'lucide-react';
import DemoFrame from './DemoFrame';
import JarvisCore from './JarvisCore';
import SiteNav, {
  MODULE_COUNT,
  MODULE_NAMES,
  NAV_GROUPS,
  NEW_MODULE_COUNT,
  NewMark,
} from './SiteNav';
import SiteFooter, { type NavigateHandler } from './SiteFooter';
import { COMPANY } from './company';
import {
  Reveal,
  Words,
  prefersReducedMotion,
  useOnScreen,
  usePointerDrift,
  useSpotlight,
} from './motion';
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
  /** Hand footer link clicks to a router. Plain navigation without it. */
  onNavigate?: NavigateHandler;
}

/** The four moments in a day the software is meant to take off someone's hands. */
const MOMENTS = [
  {
    id: 'chair',
    label: 'In the operatory',
    title: 'Charting is finished with the appointment.',
    body: 'Start the recording at the beginning of the visit. The note comes back in your format, with the perio numbers and the treatment plan attached, ready to review and sign before the next patient sits down. No charting left to catch up on at the end of the day.',
    modules: ['AI Notes', 'Perio Chart', 'Clinical Decision Support'],
    view: 'notes' as const,
  },
  {
    id: 'desk',
    label: 'At the front desk',
    title: 'Fewer empty chairs, fewer no-shows.',
    body: 'Before an appointment is booked, your team can see how full the day is and how likely that patient is to miss it. Recall tracks who is overdue and who has already been reached, and reminders go out on their own.',
    modules: ['Smart Scheduling', 'Recall', 'Follow-Ups'],
    view: 'schedule' as const,
  },
  {
    id: 'claim',
    label: 'After the visit',
    title: 'Claims are checked before they are sent.',
    body: 'Insurance coverage is verified ahead of the visit, and every claim is reviewed for the errors that lead to denials. Your billing coordinator only works the claims that need a person, instead of all of them.',
    modules: ['Insurance', 'Claim Reviewer', 'Billing'],
    view: 'claims' as const,
  },
  {
    id: 'owner',
    label: 'At the end of the month',
    title: 'Reporting is ready when you are.',
    body: 'Production by provider, patient retention, and the patients you are losing. The numbers an owner asks for at the end of the month are on a screen you open, not a report someone builds in a spreadsheet.',
    modules: ['Reports', 'Patient Retention', 'Fee Optimizer'],
    view: 'dashboard' as const,
  },
];

const ANSWERS = [
  {
    q: "What if it doesn't do something we need?",
    a: 'Then we build that part. Writing custom software for groups is a large part of what we do — the software should fit how the office already runs, not the other way around.',
  },
  {
    q: 'What does it cost?',
    a: 'It depends on providers, locations, and how much you roll out. We go through numbers on a call, once we know what you actually need. No pricing table that turns out to be wrong.',
  },
  {
    q: 'How does it start?',
    a: 'Look at the demo first. Then tell us how your office really works, and we will show you what maps directly and what we would build.',
  },
];

const DSO_POINTS = [
  ['Custom builds', 'The parts you need that nothing off the shelf does.'],
  ['Your practice management system', 'We work with what you already run on.'],
  ['Rollout across locations', 'One team, first conversation to last office.'],
  ['Reporting for the group', 'Roll-ups the way your organization reads them.'],
];

const DEMO_TONES = {
  dark: 'summit-cta-primary bg-[#0a1628] text-white',
  light: 'summit-cta-primary bg-white text-[#0a1628]',
  quiet: 'summit-cta-quiet border border-[#8695ab] bg-white text-[#0a1628] hover:border-[#0b6bcb]/45',
};

const DEMO_SIZES = {
  sm: 'px-5 py-2.5 text-[14px]',
  lg: 'px-7 py-3.5 text-[17px]',
};

/**
 * The one button this page is built around. Declared at module scope rather
 * than inside `LandingPage`: a component defined in a render body is a new
 * type on every render, so React unmounts and rebuilds the anchor each time
 * instead of updating it — which throws away its hover state mid-interaction.
 */
function DemoButton({
  href,
  onClick,
  children = 'Open the live demo',
  tone = 'dark',
  size = 'lg',
}: {
  href: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  children?: ReactNode;
  tone?: keyof typeof DEMO_TONES;
  size?: keyof typeof DEMO_SIZES;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={`summit-cta inline-flex items-center gap-2 rounded-full font-medium tracking-tight ${DEMO_TONES[tone]} ${DEMO_SIZES[size]}`}
    >
      {children}
      <ArrowRight
        className={`summit-cta-arrow ${size === 'lg' ? 'h-[17px] w-[17px]' : 'h-3.5 w-3.5'}`}
      />
    </a>
  );
}

export default function LandingPage({
  demoHref = '/login',
  onDemoClick,
  contactEmail = COMPANY.email,
  logoSrc = '/logo-mark.png',
  onNavigate,
}: LandingPageProps) {
  const coreRef = usePointerDrift<HTMLDivElement>(14);

  return (
    <div className="summit-root min-h-screen overflow-x-hidden bg-[#eef2f8] font-sans text-[#0a1628] antialiased">
      <a href="#main" className="summit-skip">
        Skip to main content
      </a>

      <SiteNav
        demoHref={demoHref}
        onDemoClick={onDemoClick}
        contactEmail={contactEmail}
        logoSrc={logoSrc}
        onNavigate={onNavigate}
      />

      <main id="main" tabIndex={-1}>
        {/* ── Hero. Text on the left; the instrument sits off the right edge,
               masked so it dissolves into the page rather than sitting on it. ── */}
        <section className="relative overflow-hidden">
          <div className="summit-grid pointer-events-none absolute inset-0" aria-hidden="true" />
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
            style={{
              background:
                'radial-gradient(ellipse 60% 60% at 78% 45%, rgba(11,107,203,0.08) 0%, transparent 70%)',
            }}
          />

          <div
            className="summit-hud-mask pointer-events-none absolute right-[-16%] top-1/2 hidden -translate-y-1/2 lg:block xl:right-[-9%]"
            aria-hidden="true"
          >
            <div ref={coreRef} className="summit-parallax">
              <JarvisCore logoSrc={logoSrc} className="w-[min(54vw,640px)]" />
            </div>
          </div>

          <div className="relative mx-auto max-w-6xl px-6 pb-16 pt-32 lg:flex lg:min-h-[41rem] lg:flex-col lg:justify-center lg:pb-20 lg:pt-28">
            <div className="max-w-[36rem]">
              <p className="summit-rise flex items-center gap-2.5 text-[13px] font-semibold uppercase tracking-[0.2em] text-[#0b6bcb]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="summit-halo absolute inset-0 rounded-full bg-[#0b6bcb]" />
                  <span className="summit-dot relative h-1.5 w-1.5 rounded-full bg-[#0b6bcb]" />
                </span>
                Summit Tech
              </p>
              <h1 className="mt-5 text-[2.9rem] font-semibold leading-[1.03] tracking-[-0.04em] sm:text-[4.2rem]">
                <Words text="The practice, handled." delay={140} step={110} />
              </h1>
              <p
                className="summit-rise mt-6 max-w-xl text-[18px] leading-8 text-[#4a5b73] sm:text-[19px]"
                style={{ animationDelay: '560ms' }}
              >
                Software that does the notes, the claims, and the front desk work your team
                does by hand. Built for dental practices and the groups that run them.
              </p>
              <div
                className="summit-rise mt-9 flex flex-wrap items-center gap-4"
                style={{ animationDelay: '700ms' }}
              >
                <DemoButton href={demoHref} onClick={onDemoClick} />
                <span className="text-[14px] text-[#5d6b80]">
                  No signup. Nothing to install.
                </span>
              </div>
            </div>

            {/* On narrow screens the instrument comes back under the copy. */}
            <div className="mt-12 flex justify-center lg:hidden">
              <JarvisCore logoSrc={logoSrc} className="w-[min(82vw,380px)]" />
            </div>
          </div>
        </section>

        {/* ── Module ticker ── */}
        {/* Stays on the hero's ground so the white section below it reads as
            the first real block of content rather than more of the same. */}
        <section className="border-y border-[#d8e1ed] py-5" aria-hidden="true">
          <div className="summit-marquee-mask overflow-hidden">
            <Ticker items={MODULE_NAMES} duration={90} />
          </div>
        </section>

        {/* ── The index of what's in there ──
               Every module in the build, counted rather than claimed: the number
               in the heading is `MODULE_NAMES.length`, so it cannot drift from
               the list underneath it. ── */}
        <section className="bg-white px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <SectionHead
              title={`${MODULE_COUNT} tools. All of them in the demo.`}
              body={`Not a preview build. The whole thing, with a practice already in it — every screen below, loaded and clickable. ${NEW_MODULE_COUNT} of them are new.`}
            />

            <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {NAV_GROUPS.map((group, i) => {
                const items = group.columns.flat();
                return (
                  <Reveal key={group.id} delay={i * 80}>
                    <h3 className="flex items-baseline gap-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#0b6bcb]">
                      {group.label}
                      <span className="text-[12px] font-medium tracking-normal text-[#8695ab]">
                        {items.length}
                      </span>
                    </h3>
                    <ul className="mt-4 space-y-0.5 border-t border-[#d0dbe9] pt-3">
                      {items.map((item) => (
                        <li key={item.name}>
                          <a
                            href={demoHref}
                            onClick={onDemoClick}
                            className="summit-row flex items-center gap-1.5 py-1.5 text-[16px] leading-6 text-[#4a5b73] hover:text-[#0a1628]"
                          >
                            {item.name}
                            {item.isNew && <NewMark />}
                            <ArrowUpRight className="summit-row-arrow h-3.5 w-3.5 shrink-0 text-[#0b6bcb]" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── A day, in four moments ── */}
        <Moments demoHref={demoHref} onDemoClick={onDemoClick} logoSrc={logoSrc} />

        {/* ── Straight answers ── */}
        <section className="bg-white px-6 py-16 sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <Reveal>
                <h2 className="text-[2rem] font-semibold tracking-[-0.035em] sm:text-[2.4rem]">
                  Straight answers.
                </h2>
                <p className="mt-4 max-w-sm text-[17px] leading-7 text-[#4a5b73]">
                  The three questions every office asks, answered the way we would answer
                  them on a call.
                </p>
              </Reveal>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              {ANSWERS.map((item, i) => (
                <Reveal key={item.q} delay={i * 70}>
                  <Answer question={item.q} answer={item.a} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── DSOs ── */}
        <section className="relative overflow-hidden px-6 py-16 sm:py-20">
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <Reveal>
                <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#0b6bcb]">
                  For DSOs
                </p>
                <h2 className="mt-4 text-[2rem] font-semibold tracking-[-0.035em] sm:text-[2.6rem]">
                  Built around how your organization already runs.
                </h2>
                <p className="mt-5 text-[18px] leading-8 text-[#4a5b73]">
                  Groups don't run on templates. We write software that fits your practice
                  management system, your reporting, and your rollout schedule — one team,
                  from the first conversation to the last office.
                </p>
                <div className="mt-8">
                  <a
                    href={`mailto:${contactEmail}`}
                    className="summit-cta summit-cta-primary inline-flex items-center gap-2 rounded-full bg-[#0a1628] px-7 py-3.5 text-[17px] font-medium tracking-tight text-white"
                  >
                    Talk to us
                    <ArrowRight className="summit-cta-arrow h-[17px] w-[17px]" />
                  </a>
                </div>
              </Reveal>
            </div>

            <div className="lg:col-span-6 lg:col-start-7">
              <Reveal delay={120}>
                <DsoPanel />
              </Reveal>
            </div>
          </div>
        </section>
      </main>

      {/* ── Close and footer, on one dark band. Merging them saves a screen of
             scrolling and gives the page a floor to land on. ── */}
      <SiteFooter
        logoSrc={logoSrc}
        onNavigate={onNavigate}
        top={
          <Reveal className="text-center">
            <h2 className="text-[2.25rem] font-semibold tracking-[-0.04em] sm:text-[3.4rem]">
              See it for yourself.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[18px] leading-8 text-white/60">
              All {MODULE_COUNT} tools, loaded with a working practice. Look around as long as
              you like.
            </p>
            <div className="mt-8">
              <DemoButton href={demoHref} onClick={onDemoClick} tone="light" />
            </div>
          </Reveal>
        }
      />
    </div>
  );
}

/**
 * Heading and standfirst side by side rather than stacked. It reads as one
 * editorial line and costs about half the vertical space.
 */
function SectionHead({ title, body }: { title: string; body: string }) {
  return (
    <Reveal>
      <div className="grid items-end gap-4 lg:grid-cols-12">
        <h2 className="text-[2rem] font-semibold tracking-[-0.035em] sm:text-[2.6rem] lg:col-span-6">
          {title}
        </h2>
        <p className="text-[17px] leading-7 text-[#4a5b73] lg:col-span-5 lg:col-start-8">{body}</p>
      </div>
    </Reveal>
  );
}

/** One scrolling row of module names. Duplicated once so the loop is seamless. */
function Ticker({ items, duration }: { items: string[]; duration: number }) {
  const run = [...items, ...items];
  return (
    <div className="summit-marquee" style={{ ['--summit-dur' as string]: `${duration}s` }}>
      {run.map((name, i) => (
        <span key={`${name}-${i}`} className="flex items-center whitespace-nowrap">
          <span className="px-5 text-[15px] tracking-tight text-[#5d6b80]">{name}</span>
          <span className="h-1 w-1 rounded-full bg-[#0b6bcb]/25" />
        </span>
      ))}
    </div>
  );
}

/**
 * The four moments. It advances on its own while it is on screen, pauses when
 * the cursor is over it, and stops entirely once you pick a moment yourself —
 * a carousel that keeps moving under your hand is an annoyance, not a feature.
 */
function Moments({
  demoHref,
  onDemoClick,
  logoSrc,
}: {
  demoHref: string;
  onDemoClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  logoSrc: string;
}) {
  const [ref, onScreen] = useOnScreen<HTMLDivElement>();
  const [active, setActive] = useState(0);
  // Which row has its paragraph expanded. Null until somebody clicks: the
  // rotation moves the screen on the right, it does not open text under
  // anyone. Only a click does that, and clicking the open row closes it.
  const [open, setOpen] = useState<number | null>(null);
  // `held` covers the cursor resting on the block and the keyboard being inside
  // it. Advancing under someone who has tabbed in swaps the readout they are
  // reading — the same interruption a hover pause exists to prevent.
  const [held, setHeld] = useState(false);
  const [taken, setTaken] = useState(false);
  const hold = 8000;

  useEffect(() => {
    if (!onScreen || held || taken || prefersReducedMotion()) return;
    const timer = window.setTimeout(() => setActive((i) => (i + 1) % MOMENTS.length), hold);
    return () => window.clearTimeout(timer);
  }, [onScreen, held, taken, active]);

  const moment = MOMENTS[active];

  return (
    <section className="px-6 py-16 sm:py-20">
      <div ref={ref} className="mx-auto max-w-6xl">
        <SectionHead
          title="Charting, scheduling, claims, and reporting."
          body="Four parts of the practice where the work piles up. Pick one to see the screen your team would use."
        />

        <Reveal delay={100}>
          <div
            className="mt-12 grid items-start gap-12 lg:grid-cols-12"
            onMouseEnter={() => setHeld(true)}
            onMouseLeave={() => setHeld(false)}
            onFocusCapture={() => setHeld(true)}
            onBlurCapture={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setHeld(false);
            }}
          >
            {/* The list. Each row carries its own progress line. */}
            <div className="lg:col-span-5">
              {MOMENTS.map((item, i) => {
                const isActive = i === active;
                const isOpen = i === open;
                return (
                  <div
                    key={item.id}
                    data-active={isActive ? 'true' : 'false'}
                    data-open={isOpen ? 'true' : 'false'}
                    className="summit-acc summit-step border-t border-[#d8e1ed]"
                    style={{ ['--summit-hold' as string]: `${hold}ms` }}
                  >
                    <button
                      type="button"
                      className="flex w-full items-start justify-between gap-6 py-4 text-left"
                      aria-expanded={isOpen}
                      aria-controls={`summit-moment-${item.id}`}
                      onClick={() => {
                        setActive(i);
                        setTaken(true);
                        setOpen((current) => (current === i ? null : i));
                      }}
                    >
                      <span>
                        <span
                          className={`text-[12px] font-semibold uppercase tracking-[0.18em] ${
                            isActive ? 'text-[#0b6bcb]' : 'text-[#5d6b80]'
                          }`}
                        >
                          {item.label}
                        </span>
                        <span
                          className={`mt-1.5 block text-[18px] font-medium leading-snug tracking-[-0.02em] transition-colors duration-500 ${
                            isActive ? 'text-[#0a1628]' : 'text-[#5d6b80]'
                          }`}
                        >
                          {item.title}
                        </span>
                      </span>
                      {/* Nothing starts open now, so the row needs to say it can be
                          opened. Same mark as the questions further down. */}
                      <Plus className="summit-acc-mark summit-acc-mark-plus mt-4 h-4 w-4 shrink-0 text-[#8695ab]" />
                    </button>

                    <div id={`summit-moment-${item.id}`} className="summit-acc-body">
                      <div>
                        <p className="pb-4 text-[16px] leading-7 text-[#4a5b73]">{item.body}</p>
                      </div>
                    </div>

                    <div className="h-0.5 w-full overflow-hidden">
                      {/* The bar has to be held until the block is on screen. The
                          CSS animation starts on mount, so without this it runs
                          out while the section is still below the fold and leaves
                          a filled blue line sitting under the first row. */}
                      <div
                        className="summit-step-bar h-0.5 rounded-full bg-[#0b6bcb]"
                        style={{
                          animationPlayState: onScreen && !held && !taken ? 'running' : 'paused',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="border-t border-[#d8e1ed]" />
            </div>

            {/* The product itself. Redraws whenever the moment changes. */}
            <div className="lg:col-span-7">
              <DemoFrame view={moment.view} logoSrc={logoSrc} />
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {moment.modules.map((name, i) => (
                  <span
                    key={name}
                    className="summit-rise rounded-full border border-[#0b6bcb]/20 bg-[#eef5fd] px-3 py-1 text-[13px] font-medium tracking-tight text-[#0b6bcb]"
                    style={{ animationDelay: `${120 + i * 80}ms` }}
                  >
                    {name}
                  </span>
                ))}
              </div>
              <div className="mt-5">
                <a
                  href={demoHref}
                  onClick={onDemoClick}
                  className="summit-cta summit-cta-quiet inline-flex items-center gap-2 rounded-full border border-[#8695ab] bg-white px-5 py-2.5 text-[14px] font-medium text-[#0a1628] hover:border-[#0b6bcb]/45"
                >
                  See this in the demo
                  <ArrowRight className="summit-cta-arrow h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/** The four things a group actually buys, as a lit card beside the pitch. */
function DsoPanel() {
  const spot = useSpotlight<HTMLDivElement>();

  return (
    <div
      ref={spot.ref}
      onPointerMove={spot.onPointerMove}
      className="summit-spot overflow-hidden rounded-2xl border border-[#d8e1ed] bg-white p-8"
    >
      <ul className="relative divide-y divide-[#e6edf5]">
        {DSO_POINTS.map(([name, note], i) => (
          <li
            key={name}
            className="summit-rise flex gap-4 py-4 first:pt-0 last:pb-0"
            style={{ animationDelay: `${120 + i * 90}ms` }}
          >
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0b6bcb]" />
            <span>
              <span className="block text-[16px] font-medium tracking-tight text-[#0a1628]">
                {name}
              </span>
              <span className="mt-0.5 block text-[15px] leading-6 text-[#5d6b80]">{note}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A question that opens. The mark rotates rather than swapping icons. */
function Answer({
  question,
  answer,
  defaultOpen = false,
}: {
  question: string;
  answer: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  const answerId = `${id}-answer`;

  return (
    <div
      data-open={open ? 'true' : 'false'}
      className="summit-acc border-t border-[#d0dbe9] last:border-b"
    >
      {/* The question is a heading as well as a control, so it shows up when
          someone navigates this section by headings rather than by tabbing. */}
      <h3>
        <button
          type="button"
          className="flex w-full items-start justify-between gap-8 py-5 text-left"
          aria-expanded={open}
          aria-controls={answerId}
          onClick={() => setOpen((was) => !was)}
        >
          <span className="text-[18px] font-medium tracking-[-0.02em] text-[#0a1628] sm:text-[20px]">
            {question}
          </span>
          <Plus className="summit-acc-mark summit-acc-mark-plus mt-1 h-5 w-5 shrink-0 text-[#7b8aa0]" />
        </button>
      </h3>
      <div id={answerId} className="summit-acc-body">
        <div>
          <p className="max-w-2xl pb-6 text-[17px] leading-8 text-[#4a5b73]">{answer}</p>
        </div>
      </div>
    </div>
  );
}
