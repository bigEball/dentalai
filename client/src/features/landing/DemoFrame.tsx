import type { ReactNode } from 'react';
import {
  Activity,
  Bell,
  CalendarClock,
  ChevronDown,
  ClipboardList,
  DollarSign,
  FileText,
  HeartHandshake,
  LayoutDashboard,
  RefreshCw,
  Shield,
  ShieldAlert,
  Stethoscope,
  Sunrise,
  TrendingDown,
  Users,
} from 'lucide-react';
import { useFitScale } from './motion';

/**
 * DemoFrame — the actual product, drawn rather than photographed.
 *
 * This is a rebuild of the demo's own UI: the same navy sidebar and module
 * list, the same top bar, the same stat tiles, and the same figures the demo
 * ships with (a $2,786.25 balance, 7 overdue recalls, claim #1042 to BlueCross
 * for $480). A screenshot would have been quicker, but it would go stale the
 * first time somebody moves a button, it would be a 300kB image, and the type
 * would be soft on a retina display. This stays sharp, weighs nothing, and
 * animates.
 *
 * It is built at the app's real dimensions and scaled to fit its column, so the
 * proportions are the product's and not something invented for a marketing page.
 */

const DESIGN_W = 1120;
const DESIGN_H = 660;

export type DemoView = 'notes' | 'schedule' | 'claims' | 'dashboard';

const NAV: { section: string; items: { label: string; icon: typeof FileText }[] }[] = [
  {
    section: 'Main',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard },
      { label: 'Morning Huddle', icon: Sunrise },
      { label: 'Patients', icon: Users },
    ],
  },
  {
    section: 'AI Modules',
    items: [
      { label: 'AI Notes', icon: FileText },
      { label: 'Claim Reviewer', icon: ShieldAlert },
      { label: 'Patient Retention', icon: TrendingDown },
      { label: 'Treatment Follow-Up', icon: HeartHandshake },
      { label: 'Clinical Decision Support', icon: Stethoscope },
      { label: 'Treatment Plans', icon: ClipboardList },
      { label: 'Insurance', icon: Shield },
      { label: 'Billing', icon: DollarSign },
      { label: 'Recall', icon: RefreshCw },
      { label: 'Perio Chart', icon: Activity },
    ],
  },
  {
    section: 'Operations',
    items: [{ label: 'Smart Scheduling', icon: CalendarClock }],
  },
];

const ACTIVE_ITEM: Record<DemoView, string> = {
  notes: 'AI Notes',
  schedule: 'Smart Scheduling',
  claims: 'Claim Reviewer',
  dashboard: 'Dashboard',
};

const TITLE: Record<DemoView, string> = {
  notes: 'AI Notes',
  schedule: 'Smart Scheduling',
  claims: 'Claim Reviewer',
  dashboard: 'Dashboard',
};

export default function DemoFrame({ view, logoSrc }: { view: DemoView; logoSrc: string }) {
  const { ref, scale } = useFitScale<HTMLDivElement>(DESIGN_W);

  return (
    <div
      ref={ref}
      className="relative w-full overflow-hidden rounded-2xl border border-[#d8e1ed] bg-white shadow-[0_2px_6px_rgba(10,22,40,0.05),0_30px_70px_-30px_rgba(10,22,40,0.35)]"
      style={{ height: DESIGN_H * scale }}
      aria-hidden="true"
    >
      <div
        className="absolute left-0 top-0 flex origin-top-left bg-[#f8fafc]"
        style={{ width: DESIGN_W, height: DESIGN_H, transform: `scale(${scale})` }}
      >
        <Sidebar view={view} logoSrc={logoSrc} />

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar title={TITLE[view]} />
          {/* Keyed so the body redraws itself whenever the moment changes. */}
          <div key={view} className="min-h-0 flex-1 overflow-hidden p-7">
            {view === 'notes' && <NotesView />}
            {view === 'schedule' && <ScheduleView />}
            {view === 'claims' && <ClaimsView />}
            {view === 'dashboard' && <DashboardView />}
          </div>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ view, logoSrc }: { view: DemoView; logoSrc: string }) {
  const active = ACTIVE_ITEM[view];
  return (
    <aside className="flex w-[248px] shrink-0 flex-col bg-[#0a1628] py-4 text-[13px]">
      <div className="mb-5 flex items-center gap-2.5 px-5">
        <img src={logoSrc} alt="" className="h-7 w-auto object-contain" />
        <div className="leading-tight">
          <div className="font-semibold text-white">Summit Tech</div>
          <div className="text-[11px] text-white/40">AI Operations Layer</div>
        </div>
      </div>

      {NAV.map((group) => (
        <div key={group.section} className="mb-3">
          <div className="px-5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">
            {group.section}
          </div>
          {group.items.map(({ label, icon: Icon }) => {
            const isActive = label === active;
            return (
              <div
                key={label}
                className={`mx-3 flex items-center gap-3 rounded-lg px-3 py-[7px] transition-colors duration-500 ${
                  isActive ? 'bg-[#4f46e5] font-medium text-white' : 'text-white/55'
                }`}
              >
                <Icon className="h-[15px] w-[15px]" strokeWidth={1.8} />
                {label}
              </div>
            );
          })}
        </div>
      ))}

      <div className="mt-auto mx-3 flex items-center gap-2.5 rounded-lg bg-white/[0.04] px-3 py-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#4f46e5] text-[10px] font-semibold text-white">
          CP
        </div>
        <div className="min-w-0 leading-tight">
          <div className="truncate text-[12px] font-medium text-white/85">Complete Package D…</div>
          <div className="text-[10px] text-white/35">Summit Demo Practice</div>
        </div>
      </div>
    </aside>
  );
}

function TopBar({ title }: { title: string }) {
  return (
    <div className="flex h-14 shrink-0 items-center gap-3 border-b border-[#eef2f7] bg-white px-6">
      <div className="text-[13px] font-semibold text-[#0f172a]">{title}</div>
      <div className="flex-1" />
      {/* The real top bar also carries an AI Assistant pill. It is a paid
          add-on rather than one of the modules the page lists, so it is left
          out here: nothing is drawn on this page that is not on the list. */}
      <div className="flex items-center gap-1.5 rounded-lg border border-[#fde68a] bg-[#fffbeb] px-2.5 py-1.5 text-[12px] font-medium text-[#b45309]">
        <span className="summit-dot h-1.5 w-1.5 rounded-full bg-[#f59e0b]" />
        Demo
      </div>
      <Bell className="h-4 w-4 text-[#94a3b8]" strokeWidth={1.8} />
      <div className="flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1.5 text-[12px] text-[#334155]">
        Summit Demo Practice
        <ChevronDown className="h-3 w-3 text-[#94a3b8]" />
      </div>
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#4f46e5] text-[10px] font-semibold text-white">
        CP
      </div>
    </div>
  );
}

/* ── shared pieces ─────────────────────────────────────────────────────── */

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border border-[#eef2f7] bg-white shadow-[0_1px_2px_rgba(10,22,40,0.04)] ${className}`}
    >
      {children}
    </div>
  );
}

/** Placeholder copy in the note body. Real sentences would be inventing records. */
function Line({ w, tone = 'muted' }: { w: string; tone?: 'muted' | 'faint' }) {
  return (
    <div
      className={`h-[7px] rounded-full ${tone === 'muted' ? 'bg-[#e2e8f0]' : 'bg-[#eef2f7]'}`}
      style={{ width: w }}
    />
  );
}

function Rise({
  delay,
  children,
  className = '',
}: {
  delay: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`summit-rise ${className}`} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ── in the operatory ──────────────────────────────────────────────────── */

const WAVE = Array.from({ length: 72 }, (_, i) =>
  Math.round((6 + Math.abs(Math.sin(i * 0.55) * Math.cos(i * 0.21)) * 34) * 10) / 10,
);

function NotesView() {
  return (
    <div className="grid h-full grid-cols-3 gap-5">
      <div className="col-span-2 flex flex-col gap-5">
        <Rise delay={60}>
          <Card className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eef2ff] text-[12px] font-semibold text-[#4f46e5]">
              NP
            </div>
            <div className="leading-tight">
              <div className="text-[14px] font-semibold text-[#0f172a]">Nicholas Pardon</div>
              <div className="text-[12px] text-[#94a3b8]">D1110 · Prophylaxis · Op 3</div>
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-2 rounded-full border border-[#fecaca] bg-[#fef2f2] px-3 py-1.5 text-[12px] font-medium text-[#dc2626]">
              <span className="summit-dot h-1.5 w-1.5 rounded-full bg-[#dc2626]" />
              Recording 04:12
            </div>
          </Card>
        </Rise>

        <Rise delay={140}>
          <Card className="p-4">
            <div className="flex h-[52px] items-center gap-[3px]">
              {WAVE.map((h, i) => (
                <div
                  key={i}
                  className="summit-rise w-[3px] rounded-full bg-[#4f46e5]"
                  style={{ height: h, animationDelay: `${220 + i * 12}ms`, opacity: 0.75 }}
                />
              ))}
            </div>
          </Card>
        </Rise>

        <Rise delay={380} className="flex min-h-0 flex-1">
        <Card className="flex w-full flex-col p-5">
          {[
            { h: 'Subjective', lines: ['92%', '78%'], d: 420 },
            { h: 'Objective', lines: ['88%', '95%', '64%'], d: 560 },
            { h: 'Assessment', lines: ['71%'], d: 700 },
            { h: 'Plan', lines: ['84%', '46%'], d: 840 },
          ].map((block) => (
            <Rise key={block.h} delay={block.d}>
              <div className="mb-4">
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4f46e5]">
                  {block.h}
                </div>
                <div className="space-y-2">
                  {block.lines.map((w, i) => (
                    <Line key={i} w={w} tone={i % 2 ? 'faint' : 'muted'} />
                  ))}
                </div>
              </div>
            </Rise>
          ))}

          <div
            className="summit-rise mt-auto flex items-center justify-end gap-2 border-t border-[#f1f5f9] pt-4"
            style={{ animationDelay: '980ms' }}
          >
            <span className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-[#64748b]">
              Regenerate
            </span>
            <span className="rounded-lg bg-[#4f46e5] px-3 py-1.5 text-[12px] font-medium text-white">
              Sign &amp; file
            </span>
          </div>
        </Card>
        </Rise>
      </div>

      <div className="flex flex-col gap-5">
        <Rise delay={220}>
          <Card className="p-4">
            <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">
              Pulled in
            </div>
            {['Perio chart · 06/12', 'Last visit · 02/28', 'Treatment plan · 3 items'].map(
              (row, i) => (
                <div
                  key={row}
                  className="summit-rise flex items-center gap-2 py-1.5 text-[12px] text-[#475569]"
                  style={{ animationDelay: `${320 + i * 90}ms` }}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#4f46e5]" />
                  {row}
                </div>
              ),
            )}
          </Card>
        </Rise>

        <Rise delay={520}>
          <Card className="p-4">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">
              Codes suggested
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['D1110', 'D0120', 'D0274'].map((code) => (
                <span
                  key={code}
                  className="rounded-md border border-[#d1fae5] bg-[#ecfdf5] px-2 py-1 text-[11px] font-medium text-[#059669]"
                >
                  {code}
                </span>
              ))}
            </div>
          </Card>
        </Rise>
      </div>
    </div>
  );
}

/* ── at the front desk ─────────────────────────────────────────────────── */

const SLOTS: { op: number; row: number; span: number; name: string; risk?: boolean }[] = [
  { op: 0, row: 0, span: 2, name: 'J. Cooper' },
  { op: 0, row: 3, span: 1, name: 'A. Reyes' },
  { op: 1, row: 1, span: 2, name: 'M. Garcia', risk: true },
  { op: 1, row: 4, span: 1, name: 'D. Okafor' },
  { op: 2, row: 0, span: 1, name: 'T. Wilson' },
  { op: 2, row: 2, span: 2, name: 'R. Chen' },
  { op: 3, row: 1, span: 1, name: 'S. Patel' },
  { op: 3, row: 3, span: 2, name: 'L. Nguyen' },
];

function ScheduleView() {
  const times = ['8:00', '9:00', '10:00', '11:00', '12:00', '1:00'];
  return (
    <div className="flex h-full flex-col gap-5">
      <div className="grid grid-cols-3 gap-5">
        {[
          { label: 'Chair utilization', value: '87%', note: 'Up 6 pts this week', good: true },
          { label: 'Avg no-show risk', value: '12%', note: '1 flagged today' },
          { label: 'Open slots', value: '4', note: 'Fillable from recall' },
        ].map((tile, i) => (
          <Rise key={tile.label} delay={60 + i * 90}>
            <Card className="p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">
                {tile.label}
              </div>
              <div className="mt-1.5 text-[26px] font-semibold leading-none text-[#0f172a]">
                {tile.value}
              </div>
              <div
                className={`mt-1.5 text-[11px] ${tile.good ? 'text-[#059669]' : 'text-[#94a3b8]'}`}
              >
                {tile.note}
              </div>
            </Card>
          </Rise>
        ))}
      </div>

      <Rise delay={340} className="flex min-h-0 flex-1">
        <Card className="w-full p-5">
          <div className="mb-3 grid grid-cols-[52px_repeat(4,1fr)] gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">
            <div />
            {['Op 1', 'Op 2', 'Op 3', 'Op 4'].map((op) => (
              <div key={op}>{op}</div>
            ))}
          </div>
          <div className="relative grid grid-cols-[52px_repeat(4,1fr)] gap-2">
            <div className="space-y-2">
              {times.map((t) => (
                <div key={t} className="h-[46px] text-[11px] leading-[46px] text-[#94a3b8]">
                  {t}
                </div>
              ))}
            </div>
            {[0, 1, 2, 3].map((op) => (
              <div key={op} className="relative space-y-2">
                {times.map((t) => (
                  <div key={t} className="h-[46px] rounded-md bg-[#f1f5f9]" />
                ))}
                {SLOTS.filter((s) => s.op === op).map((s, i) => (
                  <div
                    key={s.name}
                    className={`summit-rise absolute inset-x-0 flex flex-col justify-center rounded-md px-2.5 text-[11px] font-medium ${
                      s.risk
                        ? 'border border-[#fcd34d] bg-[#fffbeb] text-[#b45309]'
                        : 'border border-[#c7d2fe] bg-[#eef2ff] text-[#4338ca]'
                    }`}
                    style={{
                      top: s.row * 54,
                      height: s.span * 46 + (s.span - 1) * 8,
                      animationDelay: `${420 + (op * 2 + i) * 70}ms`,
                    }}
                  >
                    {s.name}
                    {s.risk && (
                      <span className="text-[10px] font-normal text-[#b45309]/80">
                        No-show risk 62%
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Card>
      </Rise>
    </div>
  );
}

/* ── after the visit ───────────────────────────────────────────────────── */

const CLAIMS = [
  { id: '#1042', patient: 'Jane Cooper', payer: 'BlueCross', amount: '$480.00', state: 'clean' },
  { id: '#1043', patient: 'Robert Chen', payer: 'Aetna PPO', amount: '$215.00', state: 'clean' },
  {
    id: '#1044',
    patient: 'Maria Garcia',
    payer: 'Delta Dental',
    amount: '$1,240.00',
    state: 'flag',
    reason: 'Missing narrative for D2740',
  },
  { id: '#1045', patient: 'Nicholas Pardon', payer: 'MetLife', amount: '$96.00', state: 'clean' },
  { id: '#1046', patient: 'Sara Patel', payer: 'Cigna', amount: '$308.00', state: 'clean' },
  { id: '#1047', patient: 'Ana Reyes', payer: 'Guardian', amount: '$162.00', state: 'clean' },
] as const;

function ClaimsView() {
  return (
    <div className="flex h-full flex-col gap-5">
      <div className="grid grid-cols-3 gap-5">
        {[
          { label: 'Claims scrubbed', value: '128', note: 'This month', good: false },
          { label: 'Clean rate', value: '96%', note: 'Up 4 pts', good: true },
          { label: 'Needs a person', value: '5', note: 'Down from 31', good: true },
        ].map((tile, i) => (
          <Rise key={tile.label} delay={60 + i * 90}>
            <Card className="p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">
                {tile.label}
              </div>
              <div className="mt-1.5 text-[26px] font-semibold leading-none text-[#0f172a]">
                {tile.value}
              </div>
              <div
                className={`mt-1.5 text-[11px] ${tile.good ? 'text-[#059669]' : 'text-[#94a3b8]'}`}
              >
                {tile.note}
              </div>
            </Card>
          </Rise>
        ))}
      </div>

      <Rise delay={340} className="flex min-h-0 flex-1">
        <Card className="w-full overflow-hidden">
          <div className="grid grid-cols-[70px_1.3fr_1fr_90px_1.4fr] gap-3 border-b border-[#eef2f7] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">
            <div>Claim</div>
            <div>Patient</div>
            <div>Payer</div>
            <div>Amount</div>
            <div>Status</div>
          </div>
          {CLAIMS.map((c, i) => (
            <div
              key={c.id}
              className="summit-rise grid grid-cols-[70px_1.3fr_1fr_90px_1.4fr] items-center gap-3 border-b border-[#f5f8fb] px-5 py-3 text-[12px] text-[#475569] last:border-0"
              style={{ animationDelay: `${420 + i * 90}ms` }}
            >
              <div className="font-medium text-[#0f172a]">{c.id}</div>
              <div>{c.patient}</div>
              <div>{c.payer}</div>
              <div className="tabular-nums">{c.amount}</div>
              {c.state === 'clean' ? (
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#059669]">
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor">
                    <path
                      d="M3.5 8.5 L6.5 11.5 L12.5 4.5"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="summit-trace"
                      style={{ animationDelay: `${560 + i * 90}ms` }}
                    />
                  </svg>
                  Clean — submitted
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#b45309]">
                  <span className="h-2.5 w-2.5 rounded-full border-2 border-[#d97706]" />
                  {c.reason}
                </div>
              )}
            </div>
          ))}
        </Card>
      </Rise>
    </div>
  );
}

/* ── end of the month ──────────────────────────────────────────────────── */

const REVENUE = [
  ['Sep', 38200],
  ['Oct', 42100],
  ['Nov', 39800],
  ['Dec', 35500],
  ['Jan', 44200],
  ['Feb', 47600],
  ['Mar', 51300],
] as const;

const TILES = [
  { label: 'Outstanding balance', value: '$2,786.25', note: 'Across all patients', tone: 'emerald' },
  { label: 'Overdue recalls', value: '7', note: '5 scheduled this week', tone: 'amber' },
  { label: "Today's schedule", value: '12', note: 'Appointments today', tone: 'emerald' },
  { label: 'Plans proposed', value: '2', note: 'Awaiting acceptance', tone: 'indigo' },
] as const;

/** Straight from the demo's dashboard feed. */
const ACTIVITY = [
  ['Clinical note approved for Jane Cooper', '5 min ago'],
  ['Claim #1042 submitted to BlueCross for $480', '22 min ago'],
  ['Insurance verified for Robert Chen — Aetna PPO', '1 hr ago'],
  ['Recall text sent to Maria Garcia', '2 hrs ago'],
  ['AI note generated for Nicholas Pardon — D1110', '4 hrs ago'],
] as const;

const TONES = {
  emerald: 'from-[#ecfdf5]',
  amber: 'from-[#fffbeb]',
  indigo: 'from-[#eef2ff]',
};

function DashboardView() {
  const max = 56000;
  const base = 520;
  const points = REVENUE.map(([, v], i) => {
    const x = 24 + (i * (1000 - 48)) / (REVENUE.length - 1);
    const y = base - (v / max) * 440;
    return [x, y] as const;
  });
  const line = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');

  return (
    <div className="flex h-full flex-col gap-5">
      <Rise delay={40}>
        <div>
          <div className="text-[20px] font-bold text-[#0f172a]">
            Good morning, Complete Package Demo
          </div>
          <div className="mt-0.5 text-[12px] text-[#94a3b8]">Friday, March 28</div>
        </div>
      </Rise>

      <div className="grid grid-cols-4 gap-4">
        {TILES.map((tile, i) => (
          <Rise key={tile.label} delay={140 + i * 80}>
            <Card
              className={`relative overflow-hidden bg-gradient-to-br ${TONES[tile.tone]} to-white p-4`}
            >
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">
                {tile.label}
              </div>
              <div className="mt-2 text-[24px] font-bold leading-none tabular-nums text-[#0f172a]">
                {tile.value}
              </div>
              <div className="mt-1.5 text-[11px] text-[#94a3b8]">{tile.note}</div>
            </Card>
          </Rise>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-3 gap-4">
      <Rise delay={480} className="col-span-2 flex min-h-0">
        <Card className="flex w-full flex-col p-5">
          <div className="flex items-baseline justify-between">
            <div className="text-[13px] font-semibold text-[#0f172a]">Recovered revenue</div>
            <div className="text-[11px] text-[#94a3b8]">Last 7 months</div>
          </div>
          <svg viewBox="0 0 1000 572" className="mt-3 w-full" fill="none">
            {[0, 1, 2, 3, 4].map((i) => (
              <line
                key={i}
                x1={24}
                y1={100 + i * 105}
                x2={976}
                y2={100 + i * 105}
                stroke="#eef2f7"
                strokeWidth={1}
              />
            ))}
            <path
              d={`${line} L${points[points.length - 1][0]} ${base} L${points[0][0]} ${base} Z`}
              fill="#4f46e5"
              fillOpacity={0.07}
              className="summit-rise"
              style={{ animationDelay: '900ms' }}
            />
            <path
              d={line}
              stroke="#4f46e5"
              strokeWidth={3.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={240}
              className="summit-trace"
              style={{ animationDelay: '560ms' }}
            />
            {points.map(([x, y], i) => (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={5}
                fill="#4f46e5"
                className="summit-rise"
                style={{ animationDelay: `${900 + i * 70}ms` }}
              />
            ))}
            {REVENUE.map(([m], i) => (
              <text
                key={m}
                x={points[i][0]}
                y={552}
                fill="#94a3b8"
                fontSize={17}
                textAnchor="middle"
                fontFamily="Inter, system-ui, sans-serif"
              >
                {m}
              </text>
            ))}
          </svg>
        </Card>
      </Rise>

      <Rise delay={620} className="flex min-h-0">
        <Card className="flex w-full flex-col p-5">
          <div className="text-[13px] font-semibold text-[#0f172a]">Recent activity</div>
          <div className="mt-3 space-y-3">
            {ACTIVITY.map(([text, when], i) => (
              <div
                key={text}
                className="summit-rise flex gap-2.5"
                style={{ animationDelay: `${760 + i * 90}ms` }}
              >
                <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#4f46e5]" />
                <div className="min-w-0 leading-snug">
                  <div className="text-[11.5px] text-[#475569]">{text}</div>
                  <div className="mt-0.5 text-[10.5px] text-[#94a3b8]">{when}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </Rise>
      </div>
    </div>
  );
}
