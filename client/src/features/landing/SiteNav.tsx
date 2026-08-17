import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent,
} from 'react';
import { ArrowRight, ArrowUpRight, ChevronDown, Menu, X } from 'lucide-react';
import type { NavigateHandler } from './SiteFooter';
import { useIsomorphicLayoutEffect, useScrollProgress, useSpotlight } from './motion';

/**
 * SiteNav — the header and its drop-down panels.
 *
 * The panels share one surface. Opening a menu grows that surface to the height
 * of the panel it holds; moving to a neighbouring menu keeps the surface open
 * and morphs it, while the panels cross-fade past each other in the direction
 * you travelled. Closing collapses it back to nothing. It reads as one piece of
 * hardware rather than five separate boxes.
 *
 * Every item in every panel goes to the same place: the demo. That is the whole
 * pitch of the page, so the menu is a map of the product, not a site map.
 */

export interface NavItem {
  name: string;
  note: string;
  /** Shipped recently. Carries a mark in the menu and in the index on the page. */
  isNew?: boolean;
}

export interface NavGroup {
  id: string;
  label: string;
  eyebrow: string;
  headline: string;
  blurb: string;
  columns: NavItem[][];
}

/**
 * Every module in the build — all twenty-six — grouped the way an office thinks
 * about them rather than the way the app's own sidebar files them. The app sorts
 * by Main / AI Modules / Operations / System, which is an engineering split; a
 * practice thinks in terms of the chair, the desk, the money, and the month.
 *
 * This list is the page's single source of truth: the header panels, the module
 * index and the ticker all read from it, and the counts in the copy are derived
 * from it rather than typed.
 *
 * The rule for editing it: the list of tools we offer is what goes here, and if
 * a module is not on that list it does not appear anywhere on this page — not in
 * the menu, not in the moments, not in the drawn demo in `DemoFrame`. The app
 * carries a couple of modules that are not sold as part of it (Pre-Auth, the AI
 * Assistant add-on); they are deliberately absent here.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'clinical',
    label: 'Clinical',
    eyebrow: 'Chairside',
    headline: 'The clinical side, written down for you.',
    blurb: 'Everything that happens in the operatory, captured while it happens.',
    columns: [
      [
        { name: 'AI Notes', note: 'Record the appointment, get the SOAP note written up.' },
        { name: 'Perio Chart', note: 'Pockets, bleeding and recession, against the last exam.' },
        { name: 'Treatment Plans', note: 'Codes, phasing and estimates, tracked to acceptance.' },
      ],
      [
        {
          name: 'Clinical Decision Support',
          note: 'Evidence-based suggestions and contraindication alerts, chairside.',
          isNew: true,
        },
        { name: 'Patients', note: 'One patient, one page, everything on it.' },
        { name: 'Patient Scores', note: 'Attendance, financial and engagement, scored.' },
      ],
    ],
  },
  {
    id: 'front-desk',
    label: 'Front desk',
    eyebrow: 'The desk',
    headline: 'The work the front desk does by hand.',
    blurb: 'Scheduling, recall, forms, and every message that goes out.',
    columns: [
      [
        {
          name: 'Smart Scheduling',
          note: 'Chair utilization and no-show risk before you book.',
          isNew: true,
        },
        { name: 'Recall', note: "Who's overdue, and who's already handled." },
        { name: 'Patient Forms', note: 'Sent, filled in, and filed without the clipboard.' },
        { name: 'Communications', note: 'Text, email, phone and portal in one inbox.' },
      ],
      [
        { name: 'Follow-Ups', note: 'Post-appointment check-ins that go out on their own.' },
        { name: 'Referrals', note: 'Send it out, book it, watch it come back.' },
        {
          name: 'Treatment Follow-Up',
          note: 'Thirty days of nudges on the plans nobody has accepted.',
          isNew: true,
        },
      ],
    ],
  },
  {
    id: 'billing',
    label: 'Billing',
    eyebrow: 'Revenue',
    headline: 'Money in, without the chasing.',
    blurb: 'Coverage, claims, and balances handled before they become a problem.',
    columns: [
      [
        { name: 'Insurance', note: 'Eligibility and coverage before the chair is filled.' },
        {
          name: 'Claim Reviewer',
          note: 'Coding, attachments and payer rules checked before it goes.',
          isNew: true,
        },
        { name: 'Billing', note: 'Balances sorted by what to do about them.' },
      ],
      [
        { name: 'Payment Plans', note: 'Installments patients can actually keep to.' },
        {
          name: 'Fee Optimizer',
          note: 'Your fees against market rates and what payers pay.',
          isNew: true,
        },
        {
          name: 'Patient Retention',
          note: "Who's drifting away, and what they're worth.",
          isNew: true,
        },
      ],
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    eyebrow: 'Running the place',
    headline: 'What the owner asks about on Monday.',
    blurb: 'The day, the numbers, the supply closet, and the paperwork behind them.',
    columns: [
      [
        { name: 'Dashboard', note: 'The day, the money and the activity on one screen.' },
        {
          name: 'Morning Huddle',
          note: 'The whole day briefed before the first patient.',
          isNew: true,
        },
        { name: 'Reports', note: 'Production, collections and provider numbers.' },
        { name: 'Inventory', note: 'Stock levels and reorder alerts before you run out.' },
      ],
      [
        {
          name: 'Procurement Intelligence',
          note: 'What to buy, from which vendor, at what price.',
          isNew: true,
        },
        {
          name: 'Compliance Autopilot',
          note: 'HIPAA, OSHA and state law, tracked, dated and filed.',
          isNew: true,
        },
        { name: 'Settings', note: 'Practice setup and your Open Dental connection.' },
      ],
    ],
  },
];

/** Flat list of every module name, in menu order. */
export const MODULE_NAMES = NAV_GROUPS.flatMap((group) =>
  group.columns.flat().map((item) => item.name),
);

/** How many modules there are, and how many arrived recently. Counted, not typed. */
export const MODULE_COUNT = MODULE_NAMES.length;
export const NEW_MODULE_COUNT = NAV_GROUPS.flatMap((group) => group.columns.flat()).filter(
  (item) => item.isNew,
).length;

/** The DSO panel sells a service, not screens, so it gets its own shape. */
const DSO_GROUP: NavGroup = {
  id: 'dsos',
  label: 'For DSOs',
  eyebrow: 'Groups',
  headline: 'Built around how your organization already runs.',
  blurb: 'Custom builds, the system you already run on, and a rollout across every location.',
  columns: [
    [
      { name: 'Custom builds', note: 'The parts you need that nothing off the shelf does.' },
      { name: 'Your practice management system', note: 'We work with what you already run on.' },
    ],
    [
      { name: 'Rollout across locations', note: 'One team, first conversation to last office.' },
      { name: 'Reporting for the group', note: 'Roll-ups the way your organization reads them.' },
    ],
  ],
};

const ALL_GROUPS = [...NAV_GROUPS, DSO_GROUP];

/** Width of the lit glint on the panel's top edge, in px. */
const GLINT = 200;

export interface SiteNavProps {
  demoHref: string;
  onDemoClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  contactEmail: string;
  logoSrc: string;
  /**
   * Hands the wordmark's click to a router, the same way the footer's links go.
   * Without it the anchor navigates on its own, which is what the standalone
   * landing project wants — but inside the app that means a full page reload
   * for a route the router already has.
   */
  onNavigate?: NavigateHandler;
}

export default function SiteNav({
  demoHref,
  onDemoClick,
  contactEmail,
  logoSrc,
  onNavigate,
}: SiteNavProps) {
  const { ref: progressRef, scrolled } = useScrollProgress<HTMLDivElement>();

  const [openId, setOpenId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetGroup, setSheetGroup] = useState<string | null>(null);
  const [heights, setHeights] = useState<Record<string, number>>({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0, cardLeft: 0 });

  const openTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const panelRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const listRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const sheetButtonRef = useRef<HTMLButtonElement>(null);

  const openIndex = openId ? ALL_GROUPS.findIndex((g) => g.id === openId) : -1;

  const clearTimers = () => {
    if (openTimer.current !== null) window.clearTimeout(openTimer.current);
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    openTimer.current = null;
    closeTimer.current = null;
  };

  const close = useCallback(() => {
    clearTimers();
    setOpenId(null);
    setHoverId(null);
  }, []);

  /* Hover intent: a short delay before the first panel opens so that crossing
     the nav on the way somewhere else does not fire it, then instant switching
     once the surface is already up. */
  const intendOpen = (id: string) => {
    clearTimers();
    setHoverId(id);
    if (openId) {
      setOpenId(id);
      return;
    }
    openTimer.current = window.setTimeout(() => setOpenId(id), 90);
  };

  const intendClose = () => {
    clearTimers();
    setHoverId(null);
    closeTimer.current = window.setTimeout(() => setOpenId(null), 180);
  };

  /**
   * The panels sit after the tab strip in the DOM, so Tab cannot walk into
   * them: it lands on the next tab, which switches the panel out from under
   * you. Four of the five panels were unreachable by keyboard because of it.
   * Down-arrow steps into the open panel instead, and Escape (below) steps
   * back out — the disclosure-navigation pattern.
   */
  const enterPanel = (id: string) => {
    clearTimers();
    setOpenId(id);
    // The links inside are only tabbable once their panel is the open one,
    // so the focus move has to wait for that render to land.
    window.requestAnimationFrame(() => {
      panelRefs.current[id]?.querySelector<HTMLElement>('a[href], button')?.focus();
    });
  };

  const onTabKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, id: string) => {
    if (event.key !== 'ArrowDown') return;
    event.preventDefault();
    enterPanel(id);
  };

  /* Panels stay mounted so they can be measured and cross-faded. One observer
     keeps the surface honest when the viewport reflows them. */
  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      setHeights((prev) => {
        let next = prev;
        for (const entry of entries) {
          const node = entry.target as HTMLElement;
          const id = node.dataset.panel;
          const height = node.offsetHeight;
          if (!id || prev[id] === height) continue;
          if (next === prev) next = { ...prev };
          next[id] = height;
        }
        return next;
      });
    });
    Object.values(panelRefs.current).forEach((node) => node && observer.observe(node));
    return () => observer.disconnect();
  }, []);

  /* The lit underline tracks whichever tab the cursor is on, and the hairline
     on the panel's top edge tracks the same tab — measured against the card,
     which is a different box from the tab list. */
  useIsomorphicLayoutEffect(() => {
    const id = hoverId ?? openId;
    const tab = id ? tabRefs.current[id] : null;
    const list = listRef.current;
    if (!tab || !list) return;
    const tabBox = tab.getBoundingClientRect();
    const listBox = list.getBoundingClientRect();
    const cardBox = cardRef.current?.getBoundingClientRect();
    const centre = tabBox.left + tabBox.width / 2;
    setIndicator({
      left: tabBox.left - listBox.left,
      width: tabBox.width,
      cardLeft: cardBox ? centre - cardBox.left - GLINT / 2 : 0,
    });
  }, [hoverId, openId]);

  useEffect(() => {
    if (!openId && !sheetOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      // Escape has to hand focus back to whatever opened the thing, or the
      // next Tab restarts from the top of the document.
      if (openId) tabRefs.current[openId]?.focus();
      if (sheetOpen) sheetButtonRef.current?.focus();
      close();
      setSheetOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openId, sheetOpen, close]);

  // Scrolling means you have moved on. Let the menu get out of the way.
  useEffect(() => {
    if (!openId) return;
    window.addEventListener('scroll', close, { passive: true, once: true });
    return () => window.removeEventListener('scroll', close);
  }, [openId, close]);

  useEffect(() => () => clearTimers(), []);

  // Behind a full-screen sheet the page should not scroll underneath.
  useEffect(() => {
    if (!sheetOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [sheetOpen]);

  const handleDemoClick = (event: MouseEvent<HTMLAnchorElement>) => {
    close();
    setSheetOpen(false);
    onDemoClick?.(event);
  };

  return (
    <>
    {/* The bar is the one dark surface at the top of the page. It reads as a
        separate object from the sheet of paper below it, and it bookends the
        page against the dark closing band. */}
    <header
      className={`summit-header fixed inset-x-0 top-0 z-50 text-white ${
        openId
          ? 'bg-[#0a1628]'
          : scrolled
            ? 'bg-[#0a1628]/95 shadow-[0_6px_28px_-12px_rgba(10,22,40,0.55)] backdrop-blur-xl'
            : 'bg-[#0a1628]'
      }`}
      onMouseLeave={intendClose}
      onBlurCapture={(event: ReactFocusEvent<HTMLElement>) => {
        // Tabbing out of the header should put the menu away, the same as the
        // cursor leaving it does.
        if (!event.currentTarget.contains(event.relatedTarget)) close();
      }}
    >
      {/* Reading progress. */}
      <div ref={progressRef} className="absolute inset-x-0 top-0 h-px">
        <div
          className="summit-progress h-full bg-gradient-to-r from-[#8ec5f5]/0 via-[#8ec5f5] to-[#8ec5f5]/50"
          style={{ opacity: scrolled ? 1 : 0 }}
        />
      </div>

      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a
          href="/"
          className="group flex items-center gap-2.5"
          onMouseEnter={intendClose}
          onClick={(event) => {
            close();
            setSheetOpen(false);
            onNavigate?.('/', event);
          }}
        >
          <img
            src={logoSrc}
            alt=""
            className="h-10 w-auto object-contain transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
          />
          <span className="text-[16px] font-medium tracking-tight">Summit Tech</span>
        </a>

        {/* Desktop tabs. */}
        <div ref={listRef} className="relative hidden items-center gap-1 lg:flex">
          {ALL_GROUPS.map((group) => {
            const isOpen = openId === group.id;
            return (
              <button
                key={group.id}
                ref={(node) => {
                  tabRefs.current[group.id] = node;
                }}
                type="button"
                aria-expanded={isOpen}
                aria-controls={`summit-panel-${group.id}`}
                className={`summit-navlink flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[15px] font-medium tracking-tight ${
                  isOpen ? 'text-white' : 'text-white/65 hover:text-white'
                }`}
                onMouseEnter={() => intendOpen(group.id)}
                onFocus={() => intendOpen(group.id)}
                onKeyDown={(event) => onTabKeyDown(event, group.id)}
                onClick={() => (isOpen ? close() : intendOpen(group.id))}
              >
                {group.label}
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    isOpen ? 'rotate-180 text-[#8ec5f5]' : 'text-white/40'
                  }`}
                />
              </button>
            );
          })}

          <span
            aria-hidden="true"
            className="summit-indicator pointer-events-none absolute -bottom-0.5 h-0.5 rounded-full bg-gradient-to-r from-transparent via-[#8ec5f5] to-transparent"
            style={{
              transform: `translateX(${indicator.left}px)`,
              width: indicator.width,
              opacity: hoverId || openId ? 1 : 0,
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <a
            href={demoHref}
            onClick={handleDemoClick}
            onMouseEnter={intendClose}
            className="summit-cta summit-cta-primary hidden items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[14px] font-medium tracking-tight text-[#0a1628] sm:inline-flex"
          >
            Open the demo
            <ArrowRight className="summit-cta-arrow h-3.5 w-3.5" />
          </a>
          <button
            ref={sheetButtonRef}
            type="button"
            className="-mr-2 inline-flex h-10 w-10 items-center justify-center rounded-full text-white/70 transition-colors hover:text-white lg:hidden"
            aria-label={sheetOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={sheetOpen}
            aria-controls="summit-sheet"
            onClick={() => setSheetOpen((was) => !was)}
          >
            {sheetOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* The shared surface. Height follows whichever panel is open. */}
      <div className="pointer-events-none absolute inset-x-0 top-full hidden justify-center px-6 lg:flex">
        <div
          ref={cardRef}
          data-open={openId ? 'true' : 'false'}
          aria-hidden={openId ? undefined : true}
          className="summit-menu-card pointer-events-auto relative w-full max-w-6xl rounded-b-2xl border-x border-b border-[#d8e1ed] bg-white shadow-[0_32px_80px_-32px_rgba(10,22,40,0.28)]"
          style={{ height: openId ? heights[openId] ?? 0 : 0 }}
          onMouseEnter={clearTimers}
          onMouseLeave={intendClose}
        >
          {/* A lit hairline along the top edge, centred under the open tab. */}
          <div
            aria-hidden="true"
            className="summit-indicator absolute top-0 h-px bg-gradient-to-r from-transparent via-[#8ec5f5] to-transparent"
            style={{
              width: GLINT,
              transform: `translateX(${indicator.cardLeft}px)`,
              opacity: openId ? 1 : 0,
            }}
          />

          {ALL_GROUPS.map((group, index) => {
            const isActive = openId === group.id;
            const direction = openIndex < 0 ? 1 : Math.sign(index - openIndex) || 1;
            return (
              <div
                key={group.id}
                id={`summit-panel-${group.id}`}
                data-panel={group.id}
                ref={(node) => {
                  panelRefs.current[group.id] = node;
                }}
                className={`summit-menu-page absolute inset-x-0 top-0 ${isActive ? 'is-active' : ''}`}
                style={{ ['--dir' as string]: direction }}
              >
                <MenuPanel
                  group={group}
                  active={isActive}
                  demoHref={demoHref}
                  contactEmail={contactEmail}
                  onDemoClick={handleDemoClick}
                />
              </div>
            );
          })}
        </div>
      </div>
      </header>

      {/* The scrim and the sheet live outside the header on purpose: the
          header carries a backdrop-filter, which makes it the containing block
          for any fixed-position descendant — they would be trapped inside its
          64px box rather than covering the viewport. */}
      <div
        aria-hidden="true"
        onClick={close}
        className="summit-scrim fixed inset-0 top-16 z-40 hidden bg-[#0a1628]/25 backdrop-blur-[2px] lg:block"
        style={{ opacity: openId ? 1 : 0, pointerEvents: openId ? 'auto' : 'none' }}
      />

      {/* Mobile sheet. */}
      <div
        id="summit-sheet"
        data-open={sheetOpen ? 'true' : 'false'}
        aria-hidden={sheetOpen ? undefined : true}
        className="summit-sheet fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto border-t border-[#d8e1ed] bg-white lg:hidden"
      >
        <div className="px-6 py-4">
          {ALL_GROUPS.map((group, index) => {
            const isOpen = sheetGroup === group.id;
            return (
              <div
                key={group.id}
                data-open={isOpen ? 'true' : 'false'}
                className="summit-acc summit-reveal is-in border-b border-[#d8e1ed]"
                style={{ ['--summit-d' as string]: `${index * 50}ms` }}
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between py-4 text-left text-[18px] font-medium tracking-tight text-[#0a1628]"
                  aria-expanded={isOpen}
                  aria-controls={`summit-sheet-${group.id}`}
                  onClick={() => setSheetGroup(isOpen ? null : group.id)}
                >
                  {group.label}
                  <ChevronDown className="summit-acc-mark h-4 w-4 text-[#7b8aa0]" />
                </button>
                <div id={`summit-sheet-${group.id}`} className="summit-acc-body">
                  <div>
                    <ul className="space-y-4 pb-5">
                      {group.columns.flat().map((item) => (
                        <li key={item.name}>
                          <a
                            href={demoHref}
                            onClick={handleDemoClick}
                            tabIndex={isOpen && sheetOpen ? 0 : -1}
                            className="block"
                          >
                            <span className="flex items-center gap-1.5 text-[16px] font-medium text-[#0a1628]">
                              {item.name}
                              {item.isNew && <NewMark />}
                            </span>
                            <span className="mt-0.5 block text-[14px] leading-6 text-[#5d6b80]">
                              {item.note}
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="mt-8 flex flex-col gap-3 pb-8">
            <a
              href={demoHref}
              onClick={handleDemoClick}
              tabIndex={sheetOpen ? 0 : -1}
              className="summit-cta summit-cta-primary inline-flex items-center justify-center gap-2 rounded-full bg-[#0a1628] px-6 py-3.5 text-[16px] font-medium text-white"
            >
              Open the live demo
              <ArrowRight className="summit-cta-arrow h-4 w-4" />
            </a>
            <a
              href={`mailto:${contactEmail}`}
              tabIndex={sheetOpen ? 0 : -1}
              className="summit-cta summit-cta-quiet inline-flex items-center justify-center gap-2 rounded-full border border-[#8695ab] px-6 py-3.5 text-[16px] font-medium text-[#0a1628]"
            >
              Talk to us
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

function MenuPanel({
  group,
  active,
  demoHref,
  contactEmail,
  onDemoClick,
}: {
  group: NavGroup;
  active: boolean;
  demoHref: string;
  contactEmail: string;
  onDemoClick: (event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  const tab = active ? 0 : -1;
  const isDso = group.id === 'dsos';

  return (
    <div className="grid gap-10 p-9 lg:grid-cols-12">
      <div className="lg:col-span-3">
        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#0b6bcb]">
          {group.eyebrow}
        </p>
        <h2 className="mt-3 text-[21px] font-semibold leading-tight tracking-[-0.02em] text-[#0a1628]">
          {group.headline}
        </h2>
        <p className="mt-3 text-[15px] leading-6 text-[#5d6b80]">{group.blurb}</p>
      </div>

      <div className="grid gap-x-10 gap-y-1 sm:grid-cols-2 lg:col-span-6">
        {group.columns.map((column, i) => (
          <ul key={i} className="space-y-1">
            {column.map((item) => (
              <li key={item.name}>
                <a
                  href={demoHref}
                  onClick={onDemoClick}
                  tabIndex={tab}
                  className="summit-row block rounded-lg py-2.5"
                >
                  <span className="flex items-center gap-1.5 text-[16px] font-medium tracking-tight text-[#0a1628]">
                    {item.name}
                    {item.isNew && <NewMark />}
                    <ArrowUpRight className="summit-row-arrow h-3.5 w-3.5 text-[#0b6bcb]" />
                  </span>
                  <span className="mt-0.5 block text-[14px] leading-6 text-[#5d6b80]">
                    {item.note}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        ))}
      </div>

      <div className="lg:col-span-3">
        <FeatureCard
          isDso={isDso}
          demoHref={demoHref}
          contactEmail={contactEmail}
          onDemoClick={onDemoClick}
          tab={tab}
        />
      </div>
    </div>
  );
}

/**
 * The mark on a recently shipped module. Small, quiet, and the same object
 * wherever it appears — the menu, the mobile sheet, and the index on the page.
 * The word is spelled out for screen readers because a two-letter pill beside a
 * module name reads as noise otherwise.
 */
export function NewMark() {
  return (
    <span className="rounded-full border border-[#0b6bcb]/25 bg-[#eef5fd] px-1.5 py-px text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0b6bcb]">
      <span className="sr-only">Recently added: </span>New
    </span>
  );
}

/** The lit card on the right of every panel. One destination, stated plainly. */
function FeatureCard({
  isDso,
  demoHref,
  contactEmail,
  onDemoClick,
  tab,
}: {
  isDso: boolean;
  demoHref: string;
  contactEmail: string;
  onDemoClick: (event: MouseEvent<HTMLAnchorElement>) => void;
  tab: number;
}) {
  const spot = useSpotlight<HTMLDivElement>();

  return (
    <div
      ref={spot.ref}
      onPointerMove={spot.onPointerMove}
      className="summit-spot h-full overflow-hidden rounded-xl border border-[#d8e1ed] bg-[#f6f9fd] p-6"
    >
      <div className="relative">
        <span className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#0b6bcb]">
          <span className="relative flex h-1.5 w-1.5">
            <span className="summit-halo absolute inset-0 rounded-full bg-[#0b6bcb]" />
            <span className="summit-dot relative h-1.5 w-1.5 rounded-full bg-[#0b6bcb]" />
          </span>
          {isDso ? 'Custom work' : 'Live now'}
        </span>

        <p className="mt-4 text-[16px] leading-7 text-[#4a5b73]">
          {isDso
            ? 'Tell us how your group actually runs. We will show you what maps directly and what we would build.'
            : 'Every screen in this menu is in the demo, loaded with a working practice. No signup, nothing to install.'}
        </p>

        {isDso ? (
          <a
            href={`mailto:${contactEmail}`}
            tabIndex={tab}
            className="summit-cta summit-cta-quiet mt-6 inline-flex items-center gap-2 rounded-full border border-[#8695ab] bg-white px-5 py-2.5 text-[14px] font-medium text-[#0a1628] hover:border-[#0b6bcb]/45"
          >
            Talk to us
            <ArrowRight className="summit-cta-arrow h-3.5 w-3.5" />
          </a>
        ) : (
          <a
            href={demoHref}
            onClick={onDemoClick}
            tabIndex={tab}
            className="summit-cta summit-cta-primary mt-6 inline-flex items-center gap-2 rounded-full bg-[#0a1628] px-5 py-2.5 text-[14px] font-medium text-white"
          >
            Open the demo
            <ArrowRight className="summit-cta-arrow h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
