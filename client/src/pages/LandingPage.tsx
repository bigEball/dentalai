import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const SERVICES = [
  { label: 'AI Clinical Notes', desc: 'Voice-to-chart documentation in under two minutes.' },
  { label: 'Insurance Automation', desc: 'Pre-auth, submissions, and follow-ups without staff effort.' },
  { label: 'Smart Billing', desc: 'Claim scrubbing and error detection before submission.' },
  { label: 'Patient Recall', desc: 'Automated multi-channel outreach that fills the schedule.' },
  { label: 'Morning Huddle', desc: 'AI-prepared daily briefing for your entire team.' },
  { label: 'Treatment Planning', desc: 'Present, track, and share plans with patients digitally.' },
  { label: 'Patient Engagement', desc: 'Follow-up sequences that keep patients coming back.' },
  { label: 'Perio Charting', desc: 'Hands-free periodontal data entry during exams.' },
  { label: 'Fee Optimizer', desc: 'Benchmark your fees against real market data.' },
  { label: 'Procurement', desc: 'Price comparison and automated reorder alerts.' },
  { label: 'Compliance Autopilot', desc: 'Ongoing HIPAA and regulatory task management.' },
  { label: 'Practice Analytics', desc: 'Production, collections, and retention dashboards.' },
];

interface FormData {
  name: string;
  email: string;
  practice: string;
  phone: string;
  message: string;
}

const EMPTY: FormData = { name: '', email: '', practice: '', phone: '', message: '' };

export default function LandingPage() {
  const [form, setForm] = useState<FormData>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  function set(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (!form.name.trim() || !form.email.trim() || !form.practice.trim()) {
      setErr('Name, email, and practice name are required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setErr('Enter a valid email address.');
      return;
    }
    setSubmitting(true);
    try {
      await fetch('/api/v1/demo-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setDone(true);
      setForm(EMPTY);
    } catch {
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white font-sans antialiased">

      {/* ── Nav ── */}
      <header className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 md:px-10 h-16 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="flex items-center gap-2">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="text-indigo-600" aria-hidden="true">
            <path d="M11 2L3 12h7l-2 8 11-12h-7l2-8z" fill="currentColor"/>
          </svg>
          <span className="text-[15px] font-semibold tracking-tight text-gray-900">Summit AI</span>
        </div>
        <a
          href="#demo"
          className="text-[13px] font-medium text-white bg-gray-900 hover:bg-gray-800 transition-colors px-4 py-2 rounded-lg cursor-pointer"
        >
          Schedule Demo
        </a>
      </header>

      {/* ── Hero ── */}
      <section className="relative min-h-screen bg-gray-950 flex flex-col justify-center px-6 md:px-16 lg:px-24 pt-16 overflow-hidden">
        {/* Subtle grid */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
            backgroundSize: '72px 72px',
          }}
        />
        {/* Glow */}
        <div aria-hidden="true" className="absolute top-1/3 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl">
          <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-indigo-400 mb-6">
            Dental Practice Intelligence
          </p>
          <h1 className="text-5xl md:text-6xl lg:text-[72px] font-bold text-white leading-[1.05] tracking-tight mb-8">
            Run a smarter<br />
            <span className="text-indigo-400">dental practice.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-xl leading-relaxed mb-12">
            Summit AI handles the work between patients — notes, billing, insurance,
            recall — so your team can focus on care.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="#demo"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-indigo-500 hover:bg-indigo-400 transition-colors text-white font-semibold text-[15px] rounded-xl cursor-pointer"
            >
              Schedule a Demo
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
            <a href="#services" className="text-[14px] text-gray-500 hover:text-gray-300 transition-colors cursor-pointer">
              See what's included
            </a>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
          <span className="text-[11px] tracking-widest uppercase text-white">Scroll</span>
          <div className="w-px h-8 bg-white/40" />
        </div>
      </section>

      {/* ── Services ── */}
      <section id="services" className="py-24 md:py-32 px-6 md:px-16 lg:px-24 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-indigo-500 mb-3">Platform</p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                One platform.<br />Every workflow.
              </h2>
            </div>
            <p className="text-gray-500 text-[15px] leading-relaxed max-w-xs md:text-right">
              Built for the full scope of how a dental office actually runs — clinical, administrative, and financial.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
            {SERVICES.map((s) => (
              <div
                key={s.label}
                className="bg-white px-6 py-7 hover:bg-gray-50 transition-colors group cursor-default"
              >
                <div className="text-[13px] font-semibold text-gray-900 mb-1.5 group-hover:text-indigo-600 transition-colors">
                  {s.label}
                </div>
                <div className="text-[13px] text-gray-400 leading-relaxed">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Summit ── */}
      <section className="py-20 md:py-28 px-6 md:px-16 lg:px-24 bg-gray-950">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-indigo-400 mb-4">Why Summit</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-6">
              Built for the way practices actually work.
            </h2>
            <p className="text-gray-400 text-[15px] leading-relaxed">
              Most dental software was designed before AI existed. Summit was built from scratch around it —
              with every module connected, every workflow automated, and every insight surfaced automatically.
            </p>
          </div>
          <div className="space-y-6">
            {[
              { stat: '4 hrs', note: 'saved per provider, per week' },
              { stat: '23%', note: 'average reduction in claim denials' },
              { stat: '91%', note: 'patient recall response rate' },
            ].map(item => (
              <div key={item.stat} className="flex items-baseline gap-5 border-b border-white/10 pb-6 last:border-0 last:pb-0">
                <span className="text-4xl font-bold text-indigo-400 tabular-nums shrink-0">{item.stat}</span>
                <span className="text-[14px] text-gray-400">{item.note}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Demo Form ── */}
      <section id="demo" className="py-24 md:py-32 px-6 md:px-16 lg:px-24 bg-white">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-start">
          {/* Left */}
          <div className="md:sticky md:top-24">
            <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-indigo-500 mb-4">Schedule a Demo</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-5">
              See Summit in your practice.
            </h2>
            <p className="text-gray-500 text-[15px] leading-relaxed mb-10">
              30 minutes. No slides, no pitch deck — just a live walkthrough
              of the tools your team will actually use.
            </p>
            <ul className="space-y-3">
              {[
                'Personalized to your practice size and specialty',
                'Live AI note demo with real voice input',
                'Q&A with a dental workflow specialist',
                'No commitment required',
              ].map(item => (
                <li key={item} className="flex items-start gap-3 text-[14px] text-gray-500">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-indigo-500 mt-0.5 shrink-0" aria-hidden="true">
                    <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Right — Form */}
          <div>
            {done ? (
              <div className="border border-gray-100 rounded-2xl p-10 text-center shadow-sm">
                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-5">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                    <path d="M4 11l5 5L18 6" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-[17px] font-semibold text-gray-900 mb-2">You're on the list.</p>
                <p className="text-[14px] text-gray-500">We'll reach out within one business day to confirm your demo time.</p>
              </div>
            ) : (
              <form onSubmit={submit} className="border border-gray-100 rounded-2xl p-8 shadow-sm space-y-5" noValidate>
                {err && (
                  <p className="text-[13px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
                    {err}
                  </p>
                )}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-[12px] font-medium text-gray-600 mb-1.5">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="name" name="name" type="text" autoComplete="name"
                      value={form.name} onChange={set}
                      placeholder="Dr. Sarah Mitchell"
                      className="w-full px-3.5 py-2.5 text-[14px] border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-[12px] font-medium text-gray-600 mb-1.5">
                      Work Email <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="email" name="email" type="email" autoComplete="email"
                      value={form.email} onChange={set}
                      placeholder="you@mypractice.com"
                      className="w-full px-3.5 py-2.5 text-[14px] border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="practice" className="block text-[12px] font-medium text-gray-600 mb-1.5">
                      Practice Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="practice" name="practice" type="text"
                      value={form.practice} onChange={set}
                      placeholder="Summit Family Dentistry"
                      className="w-full px-3.5 py-2.5 text-[14px] border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-[12px] font-medium text-gray-600 mb-1.5">
                      Phone
                    </label>
                    <input
                      id="phone" name="phone" type="tel" autoComplete="tel"
                      value={form.phone} onChange={set}
                      placeholder="(555) 000-0000"
                      className="w-full px-3.5 py-2.5 text-[14px] border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="message" className="block text-[12px] font-medium text-gray-600 mb-1.5">
                    Anything you'd like us to know?
                  </label>
                  <textarea
                    id="message" name="message" rows={3}
                    value={form.message} onChange={set}
                    placeholder="Practice size, current software, biggest pain points..."
                    className="w-full px-3.5 py-2.5 text-[14px] border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-[14px] rounded-xl transition-colors cursor-pointer"
                >
                  {submitting ? 'Sending…' : 'Request Demo'}
                </button>
                <p className="text-center text-[11px] text-gray-400">
                  We'll respond within one business day.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 px-6 md:px-16 lg:px-24 py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 22 22" fill="none" className="text-indigo-600" aria-hidden="true">
              <path d="M11 2L3 12h7l-2 8 11-12h-7l2-8z" fill="currentColor"/>
            </svg>
            <span className="text-[13px] font-semibold text-gray-700">Summit AI Services</span>
          </div>
          <p className="text-[12px] text-gray-400">
            &copy; {new Date().getFullYear()} Summit AI Services
          </p>
          {/* Demo login — subtle, for testers only */}
          <Link
            to="/login"
            className="text-[12px] text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            Demo login
          </Link>
        </div>
      </footer>

    </div>
  );
}
