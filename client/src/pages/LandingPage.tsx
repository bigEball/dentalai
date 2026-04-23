import { useState } from 'react';
import { Link } from 'react-router-dom';

/* ───────────────────────────────────────────────────────────────
   Summit AI Services — Landing Page
   Brand: dark navy (#0c1929), white text, subtle blue accents
   ─────────────────────────────────────────────────────────────── */

const BRAND = {
  bg: '#0c1929',
  bgLight: '#122035',
  accent: '#3b82f6',
  accentSoft: 'rgba(59,130,246,0.12)',
};

/* ── Section data ── */

const VALUES = [
  { title: 'Works with your current systems', desc: 'No rip-and-replace. Summit connects to the software your office already uses.' },
  { title: 'Reduces front desk workload', desc: 'Automate the repetitive tasks that consume your team\'s day so they can focus on patients.' },
  { title: 'Recovers missed revenue', desc: 'Surface unscheduled treatment, overdue recalls, and unbilled procedures that fall through the cracks.' },
  { title: 'Improves patient follow-up', desc: 'Consistent, timely outreach that keeps patients engaged and your schedule full.' },
  { title: 'Simplifies daily operations', desc: 'Morning huddles, task management, and workflows that make every day run smoother.' },
  { title: 'Custom to your office', desc: 'Every implementation is tailored to how your practice actually works — not a one-size-fits-all template.' },
  { title: 'Easy to implement', desc: 'Your team doesn\'t need to learn a new system. Summit works in the background from day one.' },
  { title: 'Straightforward monthly pricing', desc: 'No long-term contracts, no hidden fees. Transparent pricing that fits your budget.' },
];

const STEPS = [
  { num: '1', title: 'We connect to your workflow', desc: 'Summit integrates with your existing practice management software. No data migration, no disruption to your day.' },
  { num: '2', title: 'We tailor it to your office', desc: 'Every practice is different. We configure the system around your specific workflows, team structure, and priorities.' },
  { num: '3', title: 'We automate the busywork', desc: 'Claims follow-up, patient outreach, recall management, morning prep — the tasks that eat up your team\'s time start running on their own.' },
  { num: '4', title: 'Your team gets time back', desc: 'Less time on the phone and in spreadsheets. More time with patients and more revenue captured.' },
];

const USE_CASES = [
  { title: 'Patient follow-up', desc: 'Automated outreach for overdue patients, post-treatment check-ins, and appointment reminders — without your front desk making calls all day.' },
  { title: 'Missed revenue recovery', desc: 'Identify unscheduled treatment plans, lapsed recalls, and unbilled procedures that are costing your practice money.' },
  { title: 'Front desk efficiency', desc: 'Reduce the manual work that keeps your front desk buried — insurance verification, claim status checks, and patient communication.' },
  { title: 'Operational automation', desc: 'Daily huddle prep, task routing, compliance tracking, and reporting that runs without someone having to build it from scratch every morning.' },
  { title: 'Workflow support', desc: 'From intake to billing, Summit fills in the gaps between your systems so nothing gets missed along the way.' },
];

const WHY_ITEMS = [
  'We don\'t force you to replace your current software.',
  'We\'re designed to work alongside the systems you already have.',
  'Every implementation is custom to the way your office runs.',
  'We focus on practical, measurable improvements — not promises.',
  'Getting started is simple, and the results show up fast.',
];

const BUILT_FOR = [
  { label: 'Private Practices', desc: 'Solo and small group offices looking to run more efficiently without adding staff.' },
  { label: 'Growing Groups', desc: 'Multi-provider practices that need consistency and visibility across their operations.' },
  { label: 'Multi-Location Offices', desc: 'DSOs and group practices managing workflows across multiple sites.' },
];

const PRICING_TIERS = [
  {
    name: 'Bronze',
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

/* ── Form types ── */

interface FormData {
  name: string;
  office: string;
  email: string;
  phone: string;
  locations: string;
  message: string;
}

const EMPTY: FormData = { name: '', office: '', email: '', phone: '', locations: '', message: '' };

/* ── Reusable components ── */

function SectionLabel({ children, light }: { children: string; light?: boolean }) {
  return (
    <p className={`text-xs font-semibold tracking-[0.15em] uppercase mb-4 ${light ? 'text-blue-300' : 'text-blue-600'}`}>
      {children}
    </p>
  );
}

function LogoPlaceholder({ variant = 'dark' }: { variant?: 'dark' | 'light' }) {
  const textColor = variant === 'light' ? 'text-white' : 'text-gray-900';
  return (
    <div className="flex items-center gap-2.5">
      <img src="/logo.png" alt="Summit AI Services" className="h-8 w-8 rounded-lg object-cover" />
      <span className={`text-base font-semibold tracking-tight ${textColor}`}>
        Summit AI Services
      </span>
    </div>
  );
}

/* ── Main page ── */

export default function LandingPage() {
  const [form, setForm] = useState<FormData>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');
  const [mobileNav, setMobileNav] = useState(false);

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
    } catch { /* demo fallback */ }
    setDone(true);
    setForm(EMPTY);
    setSubmitting(false);
  }

  return (
    <div className="font-sans antialiased text-gray-900">

      {/* ═══════════ NAVIGATION ═══════════ */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-white/10" style={{ backgroundColor: BRAND.bg }}>
        <nav className="max-w-6xl mx-auto px-5 sm:px-8 h-[72px] flex items-center justify-between">
          <LogoPlaceholder variant="light" />

          <div className="hidden md:flex items-center gap-8">
            <a href="#values" className="text-sm text-gray-300 hover:text-white transition-colors cursor-pointer">What We Do</a>
            <a href="#how-it-works" className="text-sm text-gray-300 hover:text-white transition-colors cursor-pointer">How It Works</a>
            <a href="#use-cases" className="text-sm text-gray-300 hover:text-white transition-colors cursor-pointer">Use Cases</a>
            <a href="#pricing" className="text-sm text-gray-300 hover:text-white transition-colors cursor-pointer">Pricing</a>
            <a href="#why" className="text-sm text-gray-300 hover:text-white transition-colors cursor-pointer">Why Summit</a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/ai-assistant-preview"
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              AI Assistant
              <span className="rounded-full border border-blue-300/30 bg-blue-400/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-200">
                Beta
              </span>
              <span className="rounded-full border border-amber-300/30 bg-amber-400/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
                Add-on
              </span>
            </Link>
            <a
              href="#demo"
              className="text-sm font-medium text-white px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
              style={{ backgroundColor: BRAND.accent }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#2563eb')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = BRAND.accent)}
            >
              Book a Demo
            </a>
          </div>

          <button
            className="md:hidden p-2 -mr-2 text-white cursor-pointer"
            onClick={() => setMobileNav(!mobileNav)}
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {mobileNav ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </nav>

        {mobileNav && (
          <div className="md:hidden px-5 pb-5 space-y-2" style={{ backgroundColor: BRAND.bg }}>
            {['What We Do|#values', 'How It Works|#how-it-works', 'Use Cases|#use-cases', 'Pricing|#pricing', 'Why Summit|#why'].map(item => {
              const [label, href] = item.split('|');
              return <a key={href} href={href} onClick={() => setMobileNav(false)} className="block text-sm text-gray-300 py-2 cursor-pointer">{label}</a>;
            })}
            <Link to="/ai-assistant-preview" onClick={() => setMobileNav(false)} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white cursor-pointer">
              <span>AI Assistant</span>
              <span className="flex items-center gap-1.5">
                <span className="rounded-full border border-blue-300/30 bg-blue-400/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-200">Beta</span>
                <span className="rounded-full border border-amber-300/30 bg-amber-400/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200">Add-on</span>
              </span>
            </Link>
            <a href="#demo" onClick={() => setMobileNav(false)} className="block text-sm font-medium text-white py-2.5 px-4 rounded-lg text-center cursor-pointer mt-2" style={{ backgroundColor: BRAND.accent }}>Book a Demo</a>
          </div>
        )}
      </header>

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative pt-36 pb-24 sm:pt-44 sm:pb-32 px-5 sm:px-8 text-white" style={{ backgroundColor: BRAND.bg }}>
        {/* Subtle radial glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-[0.07]" style={{ background: `radial-gradient(ellipse, ${BRAND.accent}, transparent 70%)` }} />
        </div>

        <div className="relative max-w-6xl mx-auto">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-bold leading-[1.12] tracking-tight mb-6">
              Make your dental office more efficient — without changing the way you work.
            </h1>
            <p className="text-lg text-gray-300 leading-relaxed mb-10 max-w-xl">
              Summit AI Services works alongside your existing systems to reduce front desk workload, recover missed revenue, improve patient follow-up, and simplify daily operations.
            </p>
            <div className="flex flex-col sm:flex-row items-start gap-3">
              <a
                href="#demo"
                className="inline-flex items-center gap-2 px-7 py-3.5 text-white font-semibold text-[15px] rounded-lg transition-colors cursor-pointer"
                style={{ backgroundColor: BRAND.accent }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#2563eb')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = BRAND.accent)}
              >
                Book a Demo
              </a>
              <a
                href="#values"
                className="inline-flex items-center gap-2 px-7 py-3.5 text-gray-300 hover:text-white font-medium text-[15px] rounded-lg border border-white/15 hover:border-white/30 transition-all cursor-pointer"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ CORE VALUES ═══════════ */}
      <section id="values" className="py-20 sm:py-28 px-5 sm:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-xl mb-14">
            <SectionLabel>What we do</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-bold leading-tight mb-4">
              Built around the way dental offices actually run.
            </h2>
            <p className="text-gray-500 text-base leading-relaxed">
              Summit doesn't ask you to change how you work. It fits into your existing workflow and makes the day-to-day easier for everyone in the office.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
            {VALUES.map(v => (
              <div key={v.title}>
                <h3 className="text-[15px] font-semibold text-gray-900 mb-2 leading-snug">{v.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section id="how-it-works" className="py-20 sm:py-28 px-5 sm:px-8 border-y border-gray-100" style={{ backgroundColor: '#f8fafc' }}>
        <div className="max-w-6xl mx-auto">
          <div className="max-w-xl mb-14">
            <SectionLabel>How it works</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-bold leading-tight mb-4">
              Simple to start. Built to last.
            </h2>
            <p className="text-gray-500 text-base leading-relaxed">
              Whether you're a single-location practice or a growing group, implementation is straightforward and designed to show value fast.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {STEPS.map(s => (
              <div key={s.num} className="bg-white border border-gray-200 rounded-xl p-7 flex gap-5">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold"
                  style={{ backgroundColor: BRAND.accentSoft, color: BRAND.accent }}
                >
                  {s.num}
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-gray-900 mb-1.5">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ USE CASES ═══════════ */}
      <section id="use-cases" className="py-20 sm:py-28 px-5 sm:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-xl mb-14">
            <SectionLabel>Use cases</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-bold leading-tight mb-4">
              Where Summit makes a difference.
            </h2>
            <p className="text-gray-500 text-base leading-relaxed">
              These are the real problems we solve — grounded in what actually eats up time and costs money in a dental office.
            </p>
          </div>

          <div className="space-y-0 divide-y divide-gray-100">
            {USE_CASES.map((uc, i) => (
              <div key={uc.title} className="grid md:grid-cols-12 gap-4 md:gap-8 py-7 first:pt-0 last:pb-0">
                <div className="md:col-span-1">
                  <span className="text-sm font-semibold text-gray-300">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <div className="md:col-span-4">
                  <h3 className="text-base font-semibold text-gray-900">{uc.title}</h3>
                </div>
                <div className="md:col-span-7">
                  <p className="text-sm text-gray-500 leading-relaxed">{uc.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ WHY SUMMIT ═══════════ */}
      <section id="why" className="py-20 sm:py-28 px-5 sm:px-8 text-white" style={{ backgroundColor: BRAND.bg }}>
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-14 items-start">
          <div>
            <SectionLabel light>Why Summit</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-bold leading-tight mb-5">
              We're not here to replace what's working. We're here to make it work better.
            </h2>
            <p className="text-gray-400 text-base leading-relaxed">
              Most software asks you to start over. Summit was designed to fit into the systems
              and habits your office already relies on — then quietly make everything more efficient.
            </p>
          </div>
          <div className="space-y-5 pt-2">
            {WHY_ITEMS.map(item => (
              <div key={item} className="flex items-start gap-3.5">
                <div className="w-5 h-5 rounded-full border border-blue-400/40 flex items-center justify-center shrink-0 mt-0.5">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M2.5 6l2.5 2.5L9.5 4" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-[15px] text-gray-300 leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ BUILT FOR ═══════════ */}
      <section className="py-20 sm:py-28 px-5 sm:px-8 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <SectionLabel>Built for</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              From single offices to multi-location groups.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {BUILT_FOR.map(item => (
              <div key={item.label} className="border border-gray-200 rounded-xl p-7 text-center">
                <h3 className="text-base font-semibold text-gray-900 mb-2">{item.label}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ PRICING TIERS ═══════════ */}
      <section id="pricing" className="py-20 sm:py-28 px-5 sm:px-8" style={{ backgroundColor: '#f8fafc' }}>
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-14">
            <SectionLabel>Pricing packages</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-bold leading-tight mb-4">
              Bronze, Silver, and Gold tiers that are easy to sell.
            </h2>
            <p className="text-gray-500 text-base leading-relaxed">
              Bronze covers the operational basics. Silver adds growth and revenue tools.
              Gold includes insurance, clinical AI, and complete system access.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {PRICING_TIERS.map(tier => (
              <div
                key={tier.name}
                className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
              >
                <div className="flex items-end justify-between gap-4 border-b border-gray-100 pb-4 mb-4">
                  <h3 className="text-2xl font-bold text-gray-900">{tier.name}</h3>
                  <span className="text-xs font-semibold text-gray-500">{tier.includes.length} tools</span>
                </div>
                <ul className="grid gap-2">
                  {tier.includes.map(item => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-1 h-4 w-4 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                          <path d="M2.5 6l2.5 2.5L9.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                      <span className="text-sm text-gray-700 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div id="assistant" className="mt-6 rounded-xl border border-blue-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h3 className="text-xl font-bold text-gray-900">AI Assistant</h3>
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                    Beta
                  </span>
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                    Paid add-on
                  </span>
                </div>
                <p className="max-w-2xl text-sm text-gray-600 leading-relaxed">
                  A future employee support chatbot designed to help staff with Open Dental and Summit AI Services workflows. It is not included in Bronze, Silver, or Gold.
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                <Link
                  to="/ai-assistant-preview"
                  className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-colors cursor-pointer"
                  style={{ backgroundColor: BRAND.accent }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#2563eb')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = BRAND.accent)}
                >
                  Preview AI Assistant
                </Link>
                <a
                  href="#demo"
                  className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 cursor-pointer"
                >
                  Ask About Add-on
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ DEMO FORM ═══════════ */}
      <section id="demo" className="py-20 sm:py-28 px-5 sm:px-8" style={{ backgroundColor: '#f8fafc' }}>
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16 items-start">

          {/* Left copy */}
          <div className="md:sticky md:top-28">
            <SectionLabel>Book a demo</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-bold leading-tight mb-5">
              See how Summit fits your practice.
            </h2>
            <p className="text-gray-500 text-base leading-relaxed mb-3">
              Tell us a little about your office and we'll reach out to schedule a personalized demo.
              No pressure, no sales pitch — just a straightforward look at what we can do for you.
            </p>
            <p className="text-sm text-gray-400">
              Typically takes 30 minutes. We'll cover the areas most relevant to your office.
            </p>
          </div>

          {/* Right form */}
          <div>
            {done ? (
              <div className="bg-white border border-gray-200 rounded-xl p-10 text-center shadow-sm">
                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Thanks — we'll be in touch.</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Our team will reach out within one business day to schedule your demo.
                </p>
              </div>
            ) : (
              <form onSubmit={submit} className="bg-white border border-gray-200 rounded-xl p-7 sm:p-8 shadow-sm space-y-4" noValidate>
                {err && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
                    {err}
                  </p>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Full Name" name="name" required value={form.name} onChange={set} />
                  <Field label="Office Name" name="office" required value={form.office} onChange={set} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Email" name="email" type="email" required value={form.email} onChange={set} />
                  <Field label="Phone" name="phone" type="tel" value={form.phone} onChange={set} />
                </div>
                <div>
                  <label htmlFor="locations" className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Locations
                  </label>
                  <select
                    id="locations" name="locations" value={form.locations} onChange={set}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select</option>
                    <option value="1">1 location</option>
                    <option value="2-3">2–3 locations</option>
                    <option value="4-10">4–10 locations</option>
                    <option value="10+">10+ locations</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    id="message" name="message" rows={3}
                    value={form.message} onChange={set}
                    placeholder="Tell us about your practice, what software you use, or what you're looking to improve."
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 text-white font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: BRAND.accent }}
                  onMouseEnter={e => { if (!submitting) e.currentTarget.style.backgroundColor = '#2563eb'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = BRAND.accent; }}
                >
                  {submitting ? 'Sending...' : 'Book My Demo'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="py-12 px-5 sm:px-8 text-white" style={{ backgroundColor: BRAND.bg }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10 mb-10">
            <div className="max-w-xs">
              <LogoPlaceholder variant="light" />
              <p className="text-sm text-gray-400 mt-4 leading-relaxed">
                Helping dental offices run more efficiently — without disrupting the way they already work.
              </p>
              <p className="text-sm text-gray-500 mt-3">
                contact@summitaisoftware.com
              </p>
              <a
                href="tel:4256154567"
                className="block text-sm text-gray-500 mt-2 hover:text-gray-300 transition-colors cursor-pointer"
              >
                425-615-4567
              </a>
            </div>

            <div className="flex gap-16">
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Product</h4>
                <ul className="space-y-2.5">
                  <li><a href="#values" className="text-sm text-gray-400 hover:text-white transition-colors cursor-pointer">What We Do</a></li>
                  <li><a href="#how-it-works" className="text-sm text-gray-400 hover:text-white transition-colors cursor-pointer">How It Works</a></li>
                  <li><a href="#use-cases" className="text-sm text-gray-400 hover:text-white transition-colors cursor-pointer">Use Cases</a></li>
                  <li><a href="#demo" className="text-sm text-gray-400 hover:text-white transition-colors cursor-pointer">Book a Demo</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Company</h4>
                <ul className="space-y-2.5">
                  <li><span className="text-sm text-gray-500">About</span></li>
                  <li><span className="text-sm text-gray-500">Privacy</span></li>
                  <li><span className="text-sm text-gray-500">Terms</span></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-600">&copy; {new Date().getFullYear()} Summit AI Services. All rights reserved.</p>
            <Link to="/login" className="text-xs text-gray-600 hover:text-gray-400 transition-colors cursor-pointer">
              Demo access
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
}

/* ── Reusable form field ── */

function Field({
  label, name, type = 'text', required, value, onChange,
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
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        id={name} name={name} type={type}
        value={value} onChange={onChange}
        className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  );
}
