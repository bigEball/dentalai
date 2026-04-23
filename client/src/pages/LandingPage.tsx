import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bot,
  CalendarCheck,
  Check,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Headphones,
  Menu,
  MessageSquare,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Values', href: '#values' },
  { label: 'Packages', href: '#packages' },
  { label: 'Use Cases', href: '#use-cases' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'AI Assistant', href: '#assistant' },
];

const CORE_VALUES = [
  {
    icon: ShieldCheck,
    title: 'Clarity first',
    desc: 'Straightforward packages, plain language, and tools your team can understand without a long sales process.',
  },
  {
    icon: PhoneCall,
    title: 'Less administrative strain',
    desc: 'Summit is built to reduce repetitive front desk work so your team has more room for patients.',
  },
  {
    icon: TrendingUp,
    title: 'Measurable practice impact',
    desc: 'Focus on the work that affects recall, treatment follow-up, claims, collections, and daily production.',
  },
  {
    icon: CalendarCheck,
    title: 'Operational calm',
    desc: 'Bring scheduling, follow-up, forms, reporting, and team visibility into a cleaner daily rhythm.',
  },
];

const OUTCOMES = [
  {
    icon: PhoneCall,
    title: 'Less front desk pressure',
    desc: 'Reduce the calls, checks, lists, and handoffs that slow the day down.',
  },
  {
    icon: TrendingUp,
    title: 'More revenue captured',
    desc: 'Bring overdue recall, unscheduled treatment, missed claims, and billing gaps back into view.',
  },
  {
    icon: CalendarCheck,
    title: 'A cleaner daily rhythm',
    desc: 'Keep schedule prep, patient follow-up, and morning huddles moving without another spreadsheet.',
  },
  {
    icon: ShieldCheck,
    title: 'Clear package structure',
    desc: 'Choose Bronze, Silver, or Gold and know exactly which capabilities your office receives.',
  },
];

const PACKAGE_STEPS = [
  {
    label: 'Choose',
    title: 'Pick the right tier',
    desc: 'Start with Bronze, Silver, or Gold based on the operational areas your office wants covered.',
  },
  {
    label: 'Enable',
    title: 'Turn on included tools',
    desc: 'Your package gives your team access to a defined set of modules with a predictable onboarding path.',
  },
  {
    label: 'Use',
    title: 'Run daily operations',
    desc: 'Use the included tools for scheduling, follow-up, forms, reporting, billing, and clinical support.',
  },
  {
    label: 'Upgrade',
    title: 'Move up when ready',
    desc: 'Add more capabilities by moving from Bronze to Silver or Gold as your office needs more coverage.',
  },
];

const USE_CASES = [
  {
    icon: MessageSquare,
    title: 'Patient follow-up',
    desc: 'Recall, treatment follow-up, post-visit check-ins, and reminders that stay consistent.',
  },
  {
    icon: FileText,
    title: 'Insurance and claims',
    desc: 'Claim review, pre-auth support, eligibility tasks, and billing work that is easier to track.',
  },
  {
    icon: ClipboardCheck,
    title: 'Daily operations',
    desc: 'Morning huddles, forms, inventory, patient scores, reports, and team task routing.',
  },
  {
    icon: Headphones,
    title: 'Staff support',
    desc: 'Practical tools for teams that need fewer interruptions and clearer next steps.',
  },
];

const FIT_ITEMS = [
  {
    label: 'Private practices',
    desc: 'For offices that need more capacity without immediately adding another administrative hire.',
  },
  {
    label: 'Growing groups',
    desc: 'For multi-provider teams that need cleaner visibility and more consistent follow-through.',
  },
  {
    label: 'Multi-location offices',
    desc: 'For groups managing repeatable operations, reporting, and accountability across sites.',
  },
];

const PRICING_TIERS = [
  {
    name: 'Bronze',
    note: 'Operational foundation',
    highlight: false,
    includes: [
      'Dashboard',
      'Morning Huddle',
      'Patients',
      'Smart Scheduling',
      'Patient Interaction',
      'Follow-Ups',
      'Patient Forms',
      'Inventory',
      'Compliance Autopilot',
    ],
  },
  {
    name: 'Silver',
    note: 'Growth and revenue tools',
    highlight: true,
    includes: [
      'Everything in Bronze',
      'Patient Retention',
      'Treatment Follow-Up',
      'Treatment Plans',
      'Billing',
      'Payment Plans',
      'Recall',
      'Referrals',
      'Inventory Management',
      'Reports',
      'Patient Scores',
    ],
  },
  {
    name: 'Gold',
    note: 'Complete package access',
    highlight: false,
    includes: [
      'Everything in Silver',
      'AI Notes',
      'Claim Review',
      'Insurance',
      'Pre-Auth',
      'Clinical Decision Support',
      'Fee Optimizer',
      'Perio Chart',
      'Settings',
    ],
  },
];

interface FormData {
  name: string;
  office: string;
  email: string;
  phone: string;
  locations: string;
  message: string;
}

const EMPTY: FormData = {
  name: '',
  office: '',
  email: '',
  phone: '',
  locations: '',
  message: '',
};

function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <img src="/logo-mark.png" alt="Summit AI Services" className="h-10 w-auto object-contain drop-shadow-sm" />
      <span className={`text-base font-semibold ${light ? 'text-white' : 'text-slate-950'}`}>
        Summit AI Services
      </span>
    </div>
  );
}

function SectionIntro({
  eyebrow,
  title,
  desc,
  light = false,
}: {
  eyebrow: string;
  title: string;
  desc?: string;
  light?: boolean;
}) {
  return (
    <div className="max-w-2xl">
      <p className={`mb-3 text-xs font-semibold uppercase tracking-[0.14em] ${light ? 'text-cyan-200' : 'text-cyan-700'}`}>
        {eyebrow}
      </p>
      <h2 className={`text-3xl font-semibold leading-tight tracking-tight sm:text-4xl ${light ? 'text-white' : 'text-slate-950'}`}>
        {title}
      </h2>
      {desc && (
        <p className={`mt-4 text-base leading-7 ${light ? 'text-slate-300' : 'text-slate-600'}`}>
          {desc}
        </p>
      )}
    </div>
  );
}

export default function LandingPage() {
  const [form, setForm] = useState<FormData>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    let frame: number | null = null;
    let targetProgress = 0;
    let currentProgress = 0;

    function readProgress() {
      const heroRange = Math.max(window.innerHeight * 0.9, 640);
      return Math.max(0, Math.min(window.scrollY / heroRange, 1));
    }

    function applyHeroMotion(progress: number) {
      const offset = progress * 18;
      const drift = progress * 78;
      const rotation = progress * 34;
      const spread = progress * 28;
      document.documentElement.style.setProperty('--summit-scroll-offset', `${offset}px`);
      document.documentElement.style.setProperty('--summit-constellation-drift', `${drift}px`);
      document.documentElement.style.setProperty('--summit-hud-rotation', `${rotation}deg`);
      document.documentElement.style.setProperty('--summit-hud-spread', `${spread}px`);
    }

    function renderHeroMotion() {
      currentProgress += (targetProgress - currentProgress) * 0.16;

      if (Math.abs(targetProgress - currentProgress) < 0.001) {
        currentProgress = targetProgress;
        applyHeroMotion(currentProgress);
        frame = null;
        return;
      }

      applyHeroMotion(currentProgress);
      frame = requestAnimationFrame(renderHeroMotion);
    }

    function updateHeroMotion() {
      targetProgress = readProgress();
      if (frame === null) {
        frame = requestAnimationFrame(renderHeroMotion);
      }
    }

    targetProgress = readProgress();
    currentProgress = targetProgress;
    applyHeroMotion(currentProgress);
    updateHeroMotion();
    window.addEventListener('scroll', updateHeroMotion, { passive: true });
    window.addEventListener('resize', updateHeroMotion);

    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', updateHeroMotion);
      window.removeEventListener('resize', updateHeroMotion);
      document.documentElement.style.removeProperty('--summit-scroll-offset');
      document.documentElement.style.removeProperty('--summit-constellation-drift');
      document.documentElement.style.removeProperty('--summit-hud-rotation');
      document.documentElement.style.removeProperty('--summit-hud-spread');
    };
  }, []);

  function set(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');

    if (!form.name.trim() || !form.email.trim() || !form.office.trim()) {
      setErr('Please fill in your name, email, and office name.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setErr('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      await fetch('/api/v1/demo-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, practice: form.office }),
      });
    } catch {
      // Keep the marketing form forgiving in local/demo environments.
    }
    setDone(true);
    setForm(EMPTY);
    setSubmitting(false);
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f6f3ed] font-sans text-slate-950 antialiased">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#07131f]/95 backdrop-blur">
        <nav className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Logo light />

          <div className="hidden items-center gap-7 md:flex">
            {NAV_ITEMS.map(item => (
              <a key={item.href} href={item.href} className="text-sm font-medium text-slate-300 transition-colors hover:text-white">
                {item.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Link to="/login" className="text-sm font-medium text-slate-300 transition-colors hover:text-white">
              Demo access
            </Link>
            <a
              href="#demo"
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-300"
            >
              Book a demo
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <button
            type="button"
            className="rounded-lg p-2 text-white md:hidden"
            onClick={() => setMobileNav(prev => !prev)}
            aria-label="Toggle navigation"
          >
            {mobileNav ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </nav>

        {mobileNav && (
          <div className="border-t border-white/10 bg-[#07131f] px-5 py-4 md:hidden">
            <div className="space-y-1">
              {NAV_ITEMS.map(item => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileNav(false)}
                  className="block rounded-lg px-3 py-3 text-sm font-medium text-slate-200 hover:bg-white/5"
                >
                  {item.label}
                </a>
              ))}
              <Link
                to="/login"
                onClick={() => setMobileNav(false)}
                className="block rounded-lg px-3 py-3 text-sm font-medium text-slate-200 hover:bg-white/5"
              >
                Demo access
              </Link>
              <a
                href="#demo"
                onClick={() => setMobileNav(false)}
                className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950"
              >
                Book a demo
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        )}
      </header>

      <main>
        <section className="relative overflow-hidden bg-[#07131f] px-5 pb-16 pt-32 text-white sm:px-8 sm:pb-20 sm:pt-36">
          <div className="absolute inset-0 opacity-40" aria-hidden="true">
            <div
              className="h-full w-full"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
                backgroundSize: '44px 44px',
              }}
            />
          </div>

          <HeroBackdrop />

          <div className="relative mx-auto max-w-7xl">
            <div className="max-w-3xl pb-20 pt-8 sm:pb-24 lg:pb-28">
              <div className="mb-6 inline-flex max-w-full items-center gap-2 rounded-lg border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-sm font-medium text-cyan-100">
                <Sparkles className="h-4 w-4 shrink-0" />
                Practical software for smoother dental operations
              </div>
              <h1 className="max-w-3xl break-words text-[2.35rem] font-semibold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
                Less busywork. Better follow-through. A smoother dental office.
              </h1>
              <p className="mt-6 max-w-2xl break-words text-lg leading-8 text-slate-300 sm:text-xl">
                Summit helps dental teams stay ahead of scheduling, follow-up, forms, billing, reporting, insurance support, and clinical workflows with packages that are clear from the start.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#demo"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-400 px-6 py-3.5 text-[15px] font-semibold text-slate-950 transition-colors hover:bg-cyan-300"
                >
                  Book a demo
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="#values"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 px-6 py-3.5 text-[15px] font-semibold text-white transition-colors hover:border-white/35 hover:bg-white/5"
                >
                  See our values
                  <ChevronRight className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div className="grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-3">
              {[
                ['Clear tools', 'easy to understand and adopt'],
                ['Daily focus', 'built for recurring office work'],
                ['3 tiers', 'Bronze, Silver, and Gold'],
              ].map(([value, label]) => (
                <div key={label} className="flex items-baseline gap-3">
                  <span className="text-2xl font-semibold text-white">{value}</span>
                  <span className="text-sm text-slate-400">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="values" className="bg-[#f6f3ed] px-5 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
              <SectionIntro
                eyebrow="Core values"
                title="Software should make the office feel more organized, not more complicated."
                desc="Summit is built around practical dental operations: clear tools, consistent follow-through, and fewer loose ends at the front desk."
              />
              <p className="text-sm leading-6 text-slate-600 lg:justify-self-end lg:text-right">
                Packages matter, but the goal is bigger: help the team protect time, improve visibility, and keep patient care moving.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {CORE_VALUES.map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-950">{item.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="packages" className="bg-white px-5 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <SectionIntro
                eyebrow="Packages"
                title="A simple package ladder with clear included tools."
                desc="Bronze starts with the operational essentials. Silver adds growth and revenue tools. Gold gives the office the broadest set of administrative, insurance, and clinical capabilities."
              />

              <div className="grid gap-4 sm:grid-cols-2">
                {PACKAGE_STEPS.map((item, index) => (
                  <div key={item.label} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-6 flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{item.label}</span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f1efe7] text-sm font-semibold text-slate-800">
                        {index + 1}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-950">{item.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="use-cases" className="bg-[#f6f3ed] px-5 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <SectionIntro
                eyebrow="Use cases"
                title="The work that is easy to miss on a busy day."
                desc="Summit focuses on the operational gaps that affect patient experience, production, collections, and staff time."
              />
              <a href="#demo" className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-800 hover:text-cyan-950">
                Find the right package
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {USE_CASES.map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-950">{item.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-[#07131f] px-5 py-20 text-white sm:px-8 sm:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <SectionIntro
              eyebrow="What changes"
              title="Your team feels the difference in the day, not just on a dashboard."
              desc="Each package is built for practical outcomes: cleaner prep, better follow-up, fewer missed tasks, and less manual chasing."
              light
            />

            <div className="grid gap-4 sm:grid-cols-2">
              {OUTCOMES.map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
                    <Icon className="h-6 w-6 text-cyan-300" />
                    <h3 className="mt-5 text-lg font-semibold text-white">{item.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="pricing" className="bg-white px-5 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <SectionIntro
                eyebrow="Pricing packages"
                title="Simple tiers for the level of support your office needs."
                desc="Bronze covers the operational foundation. Silver adds growth and revenue tools. Gold includes full package access."
              />
              <p className="max-w-sm text-sm leading-6 text-slate-500">
                Review the included tools, choose the right starting point, and upgrade when your office needs more coverage.
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              {PRICING_TIERS.map(tier => (
                <div
                  key={tier.name}
                  className={`rounded-lg border p-6 shadow-sm ${
                    tier.highlight
                      ? 'border-cyan-300 bg-cyan-50/60 ring-1 ring-cyan-200'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-semibold text-slate-950">{tier.name}</h3>
                      <p className="mt-1 text-sm text-slate-600">{tier.note}</p>
                    </div>
                    {tier.highlight && (
                      <span className="rounded-lg bg-cyan-700 px-2.5 py-1 text-xs font-semibold text-white">
                        Popular
                      </span>
                    )}
                  </div>

                  <ul className="space-y-3">
                    {tier.includes.map(item => (
                      <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
                        <Check className="mt-1 h-4 w-4 shrink-0 text-cyan-700" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="assistant" className="bg-[#07131f] px-5 py-20 text-white sm:px-8 sm:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <SectionIntro
                eyebrow="AI Assistant"
                title="A staff chatbot for everyday workflow questions."
                desc="The AI Assistant is a beta paid add-on designed to help employees find answers faster. It can guide staff through Open Dental tasks, Summit tools, and common office workflows without interrupting a manager."
                light
              />
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/ai-assistant-preview"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-300"
                >
                  Preview AI Assistant
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#demo"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-white/35 hover:bg-white/5"
                >
                  Ask about the add-on
                </a>
              </div>
              <p className="mt-5 text-sm leading-6 text-slate-400">
                The Assistant is separate from Bronze, Silver, and Gold. It is available as an add-on for offices that want more staff support.
              </p>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4 shadow-2xl">
              <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-400 text-slate-950">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Employee workflow assistant</h3>
                    <p className="text-xs text-slate-400">Beta preview</p>
                  </div>
                </div>
                <span className="rounded-lg border border-amber-300/25 bg-amber-300/10 px-2.5 py-1 text-xs font-semibold text-amber-100">
                  Paid add-on
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-400/15 text-cyan-200">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="max-w-[calc(100%-44px)] rounded-lg rounded-tl-sm bg-white/10 px-4 py-3">
                    <p className="text-sm leading-6 text-slate-200">
                      Ask me how to complete an Open Dental task, where to find a Summit tool, or what step comes next in a workflow.
                    </p>
                  </div>
                </div>

                <div className="flex items-start justify-end gap-3">
                  <div className="max-w-[calc(100%-44px)] rounded-lg rounded-tr-sm bg-cyan-400 px-4 py-3">
                    <p className="text-sm leading-6 font-medium text-slate-950">
                      Where do I review patients who have not accepted treatment?
                    </p>
                  </div>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-950">
                    FD
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-400/15 text-cyan-200">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="max-w-[calc(100%-44px)] rounded-lg rounded-tl-sm bg-white/10 px-4 py-3">
                    <p className="text-sm leading-6 text-slate-200">
                      Open Treatment Follow-Up to review pending plans. Start with the highest-priority patients, review the suggested reason for hesitation, then send or edit the recommended message before logging outreach.
                    </p>
                    <div className="mt-3 grid gap-2 text-xs text-slate-300 sm:grid-cols-3">
                      <span className="rounded-md bg-white/10 px-2.5 py-2">Find patient</span>
                      <span className="rounded-md bg-white/10 px-2.5 py-2">Review plan</span>
                      <span className="rounded-md bg-white/10 px-2.5 py-2">Send follow-up</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="fit" className="border-y border-slate-200 bg-[#f6f3ed] px-5 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <SectionIntro
                eyebrow="Fit"
                title="For teams that want more capacity without more chaos."
                desc="Summit is a fit when the practice needs a clear set of operational tools, predictable packages, and room to upgrade as needs grow."
              />

              <div className="divide-y divide-slate-300/70 border-y border-slate-300/70">
                {FIT_ITEMS.map(item => (
                  <div key={item.label} className="grid gap-3 py-6 sm:grid-cols-[220px_1fr]">
                    <h3 className="text-base font-semibold text-slate-950">{item.label}</h3>
                    <p className="text-sm leading-6 text-slate-600">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="demo" className="bg-white px-5 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div className="lg:sticky lg:top-28">
              <SectionIntro
                eyebrow="Book a demo"
                title="Choose the right Summit package for your office."
                desc="Tell us a little about your office. We will walk through Bronze, Silver, and Gold so you can see which package covers the tools you need."
              />
              <div className="mt-8 rounded-lg border border-slate-200 bg-[#f6f3ed] p-5">
                <p className="text-sm font-semibold text-slate-950">What to expect</p>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                  <li className="flex gap-3"><Check className="mt-1 h-4 w-4 shrink-0 text-cyan-700" /> A 30-minute walkthrough.</li>
                  <li className="flex gap-3"><Check className="mt-1 h-4 w-4 shrink-0 text-cyan-700" /> A clear comparison of Bronze, Silver, and Gold.</li>
                  <li className="flex gap-3"><Check className="mt-1 h-4 w-4 shrink-0 text-cyan-700" /> A recommendation for the package that matches your needs.</li>
                </ul>
              </div>
            </div>

            {done ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-8 text-center">
                <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-600 text-white">
                  <Check className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-slate-950">Thanks. We will be in touch.</h3>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
                  Our team will reach out within one business day to schedule your demo.
                </p>
              </div>
            ) : (
              <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8" noValidate>
                {err && (
                  <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {err}
                  </p>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Full name" name="name" required value={form.name} onChange={set} />
                  <Field label="Office name" name="office" required value={form.office} onChange={set} />
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field label="Email" name="email" type="email" required value={form.email} onChange={set} />
                  <Field label="Phone" name="phone" type="tel" value={form.phone} onChange={set} />
                </div>
                <div className="mt-4">
                  <label htmlFor="locations" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Number of locations
                  </label>
                  <select
                    id="locations"
                    name="locations"
                    value={form.locations}
                    onChange={set}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  >
                    <option value="">Select</option>
                    <option value="1">1 location</option>
                    <option value="2-3">2-3 locations</option>
                    <option value="4-10">4-10 locations</option>
                    <option value="10+">10+ locations</option>
                  </select>
                </div>
                <div className="mt-4">
                  <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Which package are you interested in?
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    value={form.message}
                    onChange={set}
                    placeholder="For example: Bronze, Silver, Gold, or the tools you care about most."
                    className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? 'Sending...' : 'Book a demo'}
                  {!submitting && <ArrowRight className="h-4 w-4" />}
                </button>
              </form>
            )}
          </div>
        </section>
      </main>

      <footer className="bg-[#07131f] px-5 py-10 text-white sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-8 border-b border-white/10 pb-8 md:flex-row md:items-start md:justify-between">
            <div className="max-w-sm">
              <Logo light />
              <p className="mt-4 text-sm leading-6 text-slate-400">
                Practical software packages for dental offices that want a smoother day and a healthier schedule.
              </p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Contact</p>
                <div className="mt-3 space-y-2 text-sm text-slate-300">
                  <a href="mailto:contact@summitaisoftware.com" className="block transition-colors hover:text-white">
                    contact@summitaisoftware.com
                  </a>
                  <a href="tel:4256154567" className="block transition-colors hover:text-white">425-615-4567</a>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Product</p>
                <div className="mt-3 space-y-2 text-sm text-slate-300">
                  {NAV_ITEMS.map(item => (
                    <a key={item.href} href={item.href} className="block transition-colors hover:text-white">
                      {item.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>&copy; {new Date().getFullYear()} Summit AI Services. All rights reserved.</p>
            <Link to="/login" className="transition-colors hover:text-slate-300">Demo access</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function HeroBackdrop() {
  const hudTicks = Array.from({ length: 48 }, (_, index) => index);
  const circuitTicks = Array.from({ length: 16 }, (_, index) => index);
  const orbitalParticles = Array.from({ length: 36 }, (_, index) => ({
    angle: index * 10,
    delay: `${140 + index * 18}ms`,
    size: index % 9 === 0 ? 'h-1.5 w-1.5' : index % 4 === 0 ? 'h-1 w-1' : 'h-0.5 w-0.5',
    color: index % 7 === 0 ? 'bg-emerald-200/85' : index % 3 === 0 ? 'bg-white/80' : 'bg-cyan-100/80',
    radius: index % 5 === 0 ? '-15.2rem' : index % 2 === 0 ? '-13.9rem' : '-14.55rem',
  }));
  const ambientStars = Array.from({ length: 54 }, (_, index) => ({
    angle: index * 6.666,
    radius: index % 6 === 0 ? '-18.2rem' : index % 4 === 0 ? '-17.15rem' : index % 3 === 0 ? '-16.4rem' : '-18.85rem',
    size: index % 11 === 0 ? 'h-1 w-1' : 'h-0.5 w-0.5',
    color: index % 5 === 0 ? 'bg-cyan-100/65' : index % 7 === 0 ? 'bg-emerald-100/55' : 'bg-white/45',
    delay: `${index * -0.37}s`,
  }));
  const ambientStarsAlt = Array.from({ length: 38 }, (_, index) => ({
    angle: index * 9.473,
    radius: index % 4 === 0 ? '-11.8rem' : index % 3 === 0 ? '-12.7rem' : '-13.35rem',
    size: index % 8 === 0 ? 'h-1 w-1' : 'h-0.5 w-0.5',
    color: index % 6 === 0 ? 'bg-cyan-200/55' : 'bg-white/35',
    delay: `${index * -0.29}s`,
  }));
  const orbitNodes = [
    { x: '50%', y: '6%', size: 'h-1.5 w-1.5', color: 'bg-cyan-100/90', delay: '80ms' },
    { x: '78%', y: '16%', size: 'h-1 w-1', color: 'bg-white/75', delay: '170ms' },
    { x: '94%', y: '48%', size: 'h-1.5 w-1.5', color: 'bg-cyan-200/80', delay: '260ms' },
    { x: '74%', y: '83%', size: 'h-1 w-1', color: 'bg-emerald-200/80', delay: '350ms' },
    { x: '50%', y: '94%', size: 'h-1.5 w-1.5', color: 'bg-white/80', delay: '440ms' },
    { x: '21%', y: '82%', size: 'h-1 w-1', color: 'bg-cyan-100/75', delay: '530ms' },
    { x: '6%', y: '48%', size: 'h-1.5 w-1.5', color: 'bg-white/70', delay: '620ms' },
    { x: '22%', y: '17%', size: 'h-1 w-1', color: 'bg-cyan-200/75', delay: '710ms' },
  ];
  const trailSegments = [
    { angle: 18, length: 'w-14', radius: '-16.25rem', delay: '180ms' },
    { angle: 73, length: 'w-9', radius: '-15.8rem', delay: '310ms' },
    { angle: 134, length: 'w-12', radius: '-16.4rem', delay: '440ms' },
    { angle: 212, length: 'w-16', radius: '-15.9rem', delay: '570ms' },
    { angle: 286, length: 'w-10', radius: '-16.35rem', delay: '700ms' },
  ];
  const dataBars = [
    { x: '17%', y: '35%', width: 'w-12', delay: '250ms' },
    { x: '18%', y: '39%', width: 'w-7', delay: '330ms' },
    { x: '74%', y: '36%', width: 'w-10', delay: '410ms' },
    { x: '78%', y: '40%', width: 'w-6', delay: '490ms' },
    { x: '25%', y: '69%', width: 'w-9', delay: '570ms' },
    { x: '70%', y: '72%', width: 'w-12', delay: '650ms' },
  ];
  const backDots = [
    { x: '49%', y: '2%', size: 'h-1 w-1', color: 'bg-cyan-100/70', delay: '0ms' },
    { x: '70%', y: '14%', size: 'h-1 w-1', color: 'bg-white/60', delay: '80ms' },
    { x: '88%', y: '34%', size: 'h-0.5 w-0.5', color: 'bg-cyan-200/60', delay: '150ms' },
    { x: '78%', y: '70%', size: 'h-1 w-1', color: 'bg-emerald-200/65', delay: '230ms' },
    { x: '52%', y: '91%', size: 'h-1 w-1', color: 'bg-white/60', delay: '310ms' },
    { x: '24%', y: '78%', size: 'h-0.5 w-0.5', color: 'bg-cyan-100/55', delay: '390ms' },
    { x: '10%', y: '42%', size: 'h-1 w-1', color: 'bg-white/50', delay: '470ms' },
    { x: '24%', y: '17%', size: 'h-0.5 w-0.5', color: 'bg-cyan-200/65', delay: '540ms' },
    { x: '35%', y: '7%', size: 'h-0.5 w-0.5', color: 'bg-white/45', delay: '610ms' },
    { x: '93%', y: '55%', size: 'h-1 w-1', color: 'bg-cyan-100/45', delay: '690ms' },
    { x: '65%', y: '84%', size: 'h-0.5 w-0.5', color: 'bg-white/50', delay: '760ms' },
    { x: '15%', y: '65%', size: 'h-0.5 w-0.5', color: 'bg-emerald-100/45', delay: '840ms' },
  ];
  const midDots = [
    { x: '54%', y: '11%', size: 'h-1.5 w-1.5', color: 'bg-cyan-100/85', delay: '90ms' },
    { x: '74%', y: '29%', size: 'h-1 w-1', color: 'bg-white/70', delay: '180ms' },
    { x: '69%', y: '63%', size: 'h-1.5 w-1.5', color: 'bg-cyan-200/75', delay: '270ms' },
    { x: '40%', y: '76%', size: 'h-1 w-1', color: 'bg-emerald-200/70', delay: '360ms' },
    { x: '23%', y: '54%', size: 'h-1.5 w-1.5', color: 'bg-white/70', delay: '450ms' },
    { x: '31%', y: '25%', size: 'h-1 w-1', color: 'bg-cyan-100/65', delay: '540ms' },
    { x: '82%', y: '47%', size: 'h-0.5 w-0.5', color: 'bg-cyan-100/75', delay: '630ms' },
    { x: '15%', y: '31%', size: 'h-0.5 w-0.5', color: 'bg-white/60', delay: '720ms' },
    { x: '53%', y: '88%', size: 'h-0.5 w-0.5', color: 'bg-cyan-200/65', delay: '810ms' },
    { x: '60%', y: '39%', size: 'h-1 w-1', color: 'bg-white/75', delay: '900ms' },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden="true">
      <div className="summit-hero-mark absolute right-4 top-20 h-[38rem] w-[38rem]">
        <div className="summit-hud-shell absolute inset-10 z-[1] rounded-full">
          <div className="summit-holo-disc absolute inset-[-1.25rem] rounded-full" />
          <div className="summit-holo-disc summit-holo-disc-secondary absolute inset-10 rounded-full" />
          <div className="summit-ai-field absolute inset-0 rounded-full" />
          <div className="summit-ai-field summit-ai-field-inner absolute inset-16 rounded-full" />

          <div className="summit-ambient-stars absolute inset-0">
            {ambientStars.map(star => (
              <span
                key={`${star.angle}-${star.radius}`}
                className="absolute left-1/2 top-1/2"
                style={{ transform: `translate(-50%, -50%) rotate(${star.angle}deg) translateY(${star.radius})` }}
              >
                <span
                  className={`summit-ambient-star block rounded-full ${star.size} ${star.color} shadow-[0_0_10px_rgba(207,250,254,0.55)]`}
                  style={{ animationDelay: star.delay }}
                />
              </span>
            ))}
          </div>

          <div className="summit-ambient-stars-alt absolute inset-0">
            {ambientStarsAlt.map(star => (
              <span
                key={`${star.angle}-${star.radius}`}
                className="absolute left-1/2 top-1/2"
                style={{ transform: `translate(-50%, -50%) rotate(${star.angle}deg) translateY(${star.radius})` }}
              >
                <span
                  className={`summit-ambient-star block rounded-full ${star.size} ${star.color} shadow-[0_0_8px_rgba(207,250,254,0.45)]`}
                  style={{ animationDelay: star.delay }}
                />
              </span>
            ))}
          </div>

          <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100">
            <circle className="summit-hud-ring summit-hud-ring-soft" cx="50" cy="50" r="47" pathLength="100" />
            <circle className="summit-hud-ring summit-hud-ring-main" cx="50" cy="50" r="40" pathLength="100" />
            <circle className="summit-hud-ring summit-hud-ring-inner" cx="50" cy="50" r="28" pathLength="100" />
            <circle className="summit-hud-ring summit-hud-ring-micro" cx="50" cy="50" r="18" pathLength="100" />
            <circle className="summit-hud-ring summit-hud-ring-core" cx="50" cy="50" r="33" pathLength="100" />
            <path className="summit-hud-bracket summit-hud-bracket-a" d="M22 28 A36 36 0 0 1 43 15" pathLength="100" />
            <path className="summit-hud-bracket summit-hud-bracket-b" d="M75 25 A36 36 0 0 1 85 48" pathLength="100" />
            <path className="summit-hud-bracket summit-hud-bracket-c" d="M78 74 A36 36 0 0 1 55 86" pathLength="100" />
            <path className="summit-hud-bracket summit-hud-bracket-d" d="M23 73 A36 36 0 0 1 14 50" pathLength="100" />
            <path className="summit-hud-circuit" d="M50 4 L50 15 M50 85 L50 96 M4 50 L15 50 M85 50 L96 50 M18 18 L26 26 M82 18 L74 26 M82 82 L74 74 M18 82 L26 74" />
            <line className="summit-hud-scanline" x1="18" y1="50" x2="82" y2="50" />
            <line className="summit-hud-scanline summit-hud-scanline-vertical" x1="50" y1="18" x2="50" y2="82" />
          </svg>

          <div className="summit-circuit-tick-layer absolute inset-0">
            {circuitTicks.map(index => (
              <span
                key={index}
                className="summit-circuit-tick absolute left-1/2 top-1/2 block h-4 w-2 border-r border-t border-cyan-100/30"
                style={{
                  transform: `translate(-50%, -50%) rotate(${index * 22.5}deg) translateY(-12.7rem)`,
                  animationDelay: `${240 + index * 22}ms`,
                }}
              />
            ))}
          </div>

          <div className="summit-orbital-particles absolute inset-0">
            {orbitalParticles.map(particle => (
              <span
                key={`${particle.angle}-${particle.radius}`}
                className="absolute left-1/2 top-1/2"
                style={{ transform: `translate(-50%, -50%) rotate(${particle.angle}deg) translateY(${particle.radius})` }}
              >
                <span
                  className={`summit-orbital-dot block rounded-full ${particle.size} ${particle.color} shadow-[0_0_14px_rgba(207,250,254,0.75)]`}
                  style={{ animationDelay: particle.delay }}
                />
              </span>
            ))}
          </div>

          <div className="summit-trail-segments absolute inset-0">
            {trailSegments.map(segment => (
              <span
                key={segment.angle}
                className="absolute left-1/2 top-1/2"
                style={{ transform: `translate(-50%, -50%) rotate(${segment.angle}deg) translateY(${segment.radius})` }}
              >
                <span
                  className={`summit-trail-segment block h-px ${segment.length} rounded-full bg-gradient-to-r from-transparent via-cyan-100/70 to-transparent shadow-[0_0_16px_rgba(103,232,249,0.55)]`}
                  style={{ animationDelay: segment.delay }}
                />
              </span>
            ))}
          </div>

          <div className="summit-logo-clear-zone absolute left-1/2 top-1/2 z-10 h-60 w-60 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#07131f]" />

          <div className="absolute inset-0">
            {hudTicks.map(index => (
              <span
                key={index}
                className={`summit-hud-tick absolute left-1/2 top-1/2 block origin-[50%_11rem] ${
                  index % 6 === 0 ? 'h-3 w-px bg-cyan-100/45' : index % 3 === 0 ? 'h-2 w-px bg-white/25' : 'h-1.5 w-px bg-cyan-100/18'
                }`}
                style={{
                  transform: `translate(-50%, -50%) rotate(${index * 7.5}deg) translateY(-11rem)`,
                  animationDelay: `${index * 12}ms`,
                }}
              />
            ))}
          </div>

          <div className="summit-hud-node-layer absolute inset-0">
            {orbitNodes.map(node => (
              <span
                key={`${node.x}-${node.y}`}
                className={`summit-hud-node absolute rounded-full ${node.size} ${node.color} shadow-[0_0_16px_rgba(207,250,254,0.75)]`}
                style={{ left: node.x, top: node.y, animationDelay: node.delay }}
              />
            ))}
          </div>

          <div className="absolute inset-0">
            {dataBars.map(bar => (
              <span
                key={`${bar.x}-${bar.y}`}
                className={`summit-hud-data absolute block h-px ${bar.width} bg-cyan-100/35 shadow-[0_0_12px_rgba(207,250,254,0.4)]`}
                style={{ left: bar.x, top: bar.y, animationDelay: bar.delay }}
              />
            ))}
          </div>
        </div>

        <div className="summit-constellation-back absolute inset-4 rounded-full">
          <svg className="summit-constellation-lines absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M24 17 L49 2 L70 14 L88 34 L78 70 L52 91 L24 78 L10 42 L24 17" />
            <path d="M24 78 L65 84 L93 55" />
          </svg>
          {backDots.map(dot => (
            <span
              key={`${dot.x}-${dot.y}`}
              className={`summit-constellation-dot absolute rounded-full ${dot.size} ${dot.color} shadow-[0_0_12px_rgba(207,250,254,0.55)]`}
              style={{ left: dot.x, top: dot.y, animationDelay: dot.delay }}
            />
          ))}
        </div>
        <div className="summit-constellation-mid absolute inset-14 rounded-full">
          <svg className="summit-constellation-lines summit-constellation-lines-bright absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M31 25 L54 11 L74 29 L82 47 L69 63 L40 76 L23 54 L31 25" />
            <path d="M23 54 L60 39 L69 63 L53 88" />
          </svg>
          {midDots.map(dot => (
            <span
              key={`${dot.x}-${dot.y}`}
              className={`summit-constellation-dot absolute rounded-full ${dot.size} ${dot.color} shadow-[0_0_14px_rgba(207,250,254,0.6)]`}
              style={{ left: dot.x, top: dot.y, animationDelay: dot.delay }}
            />
          ))}
        </div>

        <div className="summit-logo-float absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
          <div className="absolute left-1/2 top-[58%] h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-3xl" />
          <img src="/logo-mark.png" alt="" className="summit-logo-mark relative h-72 w-auto object-contain" />
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type = 'text',
  required,
  value,
  onChange,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
      />
    </div>
  );
}
