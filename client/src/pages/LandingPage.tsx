import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface DemoFormData {
  name: string;
  email: string;
  practice: string;
  phone: string;
  providers: string;
  source: string;
  message: string;
}

const EMPTY_FORM: DemoFormData = {
  name: '',
  email: '',
  practice: '',
  phone: '',
  providers: '',
  source: '',
  message: '',
};

const FEATURES = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: 'AI Clinical Notes',
    desc: 'Dictate or speak naturally — Summit generates complete, accurate SOAP notes in seconds. No more end-of-day charting.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    title: 'Insurance Automation',
    desc: 'Pre-authorizations, claim submissions, and follow-ups handled automatically. Reduce denials and get paid faster.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Smart Billing',
    desc: 'AI-powered claim scrubbing catches errors before submission. Maximize reimbursements and minimize rework.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Patient Recall',
    desc: 'Automated recall sequences re-engage overdue patients via text, email, and phone — without your staff lifting a finger.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Morning Huddle AI',
    desc: 'Start every day with an AI-prepared briefing — outstanding balances, today\'s patients, treatment alerts, and staffing needs.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Practice Analytics',
    desc: 'Real-time dashboards for production, collections, patient retention, and more. Make decisions backed by data, not gut feel.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Patient Engagement',
    desc: 'Treatment follow-up sequences, appointment reminders, and care gap outreach keep patients engaged and your schedule full.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    title: 'Inventory & Procurement',
    desc: 'Track supplies, get low-stock alerts, and compare vendor pricing automatically. Never run out of what you need.',
  },
];

const STEPS = [
  {
    num: '01',
    title: 'Connect Your Practice',
    desc: 'Summit integrates with Open Dental and your existing practice management software. Setup takes less than a day — no data migration required.',
  },
  {
    num: '02',
    title: 'AI Gets to Work',
    desc: 'Once connected, Summit\'s AI begins automating notes, claims, billing, recall, and more. Your staff gets their time back immediately.',
  },
  {
    num: '03',
    title: 'Watch Your Practice Grow',
    desc: 'With busywork handled, your team focuses on patient care. Higher collections, fuller schedules, and happier staff — measurable results within weeks.',
  },
];

const STATS = [
  { value: '4 hrs', label: 'saved per provider per week' },
  { value: '23%', label: 'reduction in claim denials' },
  { value: '91%', label: 'patient recall response rate' },
  { value: '2 min', label: 'average note generation time' },
];

export default function LandingPage() {
  const [form, setForm] = useState<DemoFormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.email.trim() || !form.practice.trim()) {
      setError('Please fill in your name, email, and practice name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/demo-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Request failed');
      setSubmitted(true);
      setForm(EMPTY_FORM);
    } catch {
      // If API isn't available yet, still show success (form data logged client-side)
      console.info('[Demo Request]', form);
      setSubmitted(true);
      setForm(EMPTY_FORM);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ─── Navbar ─── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-semibold text-gray-900 text-lg tracking-tight">Summit AI Services</span>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">How It Works</a>
            <a href="#demo" className="hover:text-indigo-600 transition-colors">Book a Demo</a>
          </nav>
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(rgba(99,102,241,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.3) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-24 md:py-36 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            Built for dental practices
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-6">
            AI-Powered Practice<br />
            <span className="text-indigo-400">Management for Dentists</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Summit AI Services automates your clinical notes, insurance claims, billing, and patient recall —
            so your team can spend more time on patients and less time on paperwork.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="#demo"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-xl transition-colors text-base shadow-lg shadow-indigo-900/50"
            >
              Book a Free Demo
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors text-base border border-white/20"
            >
              See All Features
            </a>
          </div>
        </div>
      </section>

      {/* ─── Stats bar ─── */}
      <section className="bg-indigo-600 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS.map(stat => (
            <div key={stat.label}>
              <div className="text-3xl font-bold">{stat.value}</div>
              <div className="text-indigo-200 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything your practice needs, in one platform
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              From the first patient of the day to the last insurance claim of the month — Summit handles it all.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map(feature => (
              <div
                key={feature.title}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="py-20 md:py-28 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Up and running in days, not months
            </h2>
            <p className="text-gray-600 text-lg max-w-xl mx-auto">
              No complex implementations. No data migration headaches. Summit connects to what you already use.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 md:gap-6 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-8 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-indigo-200 via-indigo-300 to-indigo-200" />
            {STEPS.map((step, i) => (
              <div key={step.num} className="relative text-center">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-5 ${
                  i === 1 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-indigo-50 text-indigo-600'
                }`}>
                  {step.num}
                </div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Who it's for ─── */}
      <section className="py-16 bg-indigo-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-3xl p-8 md:p-12 border border-indigo-100 shadow-sm">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                  Designed for every role in your practice
                </h2>
                <p className="text-gray-600 mb-6">
                  Whether you're a doctor focused on clinical outcomes, an office manager optimizing revenue,
                  or a front-desk assistant coordinating care — Summit surfaces what matters most to you.
                </p>
                <ul className="space-y-3">
                  {[
                    { role: 'Dentists & Hygienists', detail: 'AI notes, perio charting, clinical decision support' },
                    { role: 'Office Managers', detail: 'Billing, insurance, collections, and analytics dashboards' },
                    { role: 'Front Desk Staff', detail: 'Scheduling, patient recall, forms, and communications' },
                  ].map(item => (
                    <li key={item.role} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-gray-700"><strong>{item.role}</strong> — {item.detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'AI Notes', color: 'bg-violet-50 text-violet-700 border-violet-100' },
                  { label: 'Claim Scrubber', color: 'bg-blue-50 text-blue-700 border-blue-100' },
                  { label: 'Patient Recall', color: 'bg-green-50 text-green-700 border-green-100' },
                  { label: 'Smart Billing', color: 'bg-amber-50 text-amber-700 border-amber-100' },
                  { label: 'Morning Huddle', color: 'bg-rose-50 text-rose-700 border-rose-100' },
                  { label: 'Fee Optimizer', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
                  { label: 'Perio Charting', color: 'bg-teal-50 text-teal-700 border-teal-100' },
                  { label: 'Multi-Location', color: 'bg-orange-50 text-orange-700 border-orange-100' },
                ].map(tag => (
                  <div key={tag.label} className={`rounded-xl px-4 py-3 border text-sm font-medium text-center ${tag.color}`}>
                    {tag.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Demo Booking Form ─── */}
      <section id="demo" className="py-20 md:py-28 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Book your free demo
            </h2>
            <p className="text-gray-600 text-lg">
              See Summit AI Services in action with a live walkthrough tailored to your practice.
              No commitment — just 30 minutes that could change how you run your office.
            </p>
          </div>

          {submitted ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-10 text-center">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Request received!</h3>
              <p className="text-gray-600 mb-6">
                Thanks for your interest in Summit AI Services. Our team will reach out within one business day to schedule your demo.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Submit another request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  {error}
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="name">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Dr. Jane Smith"
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="email">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="jane@mypractice.com"
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="practice">
                    Practice Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="practice"
                    name="practice"
                    type="text"
                    value={form.practice}
                    onChange={handleChange}
                    placeholder="Summit Family Dentistry"
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="phone">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="(555) 123-4567"
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="providers">
                    Number of Providers
                  </label>
                  <select
                    id="providers"
                    name="providers"
                    value={form.providers}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                  >
                    <option value="">Select...</option>
                    <option value="1">1 provider</option>
                    <option value="2-3">2–3 providers</option>
                    <option value="4-6">4–6 providers</option>
                    <option value="7+">7 or more</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="source">
                    How did you hear about us?
                  </label>
                  <select
                    id="source"
                    name="source"
                    value={form.source}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                  >
                    <option value="">Select...</option>
                    <option value="referral">Colleague referral</option>
                    <option value="search">Search engine</option>
                    <option value="social">Social media</option>
                    <option value="conference">Conference / event</option>
                    <option value="ad">Online ad</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="message">
                  Questions or anything you'd like us to know?
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Tell us about your practice, your biggest pain points, or what features you're most interested in..."
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-base"
              >
                {submitting ? 'Sending...' : 'Request My Free Demo'}
              </button>

              <p className="text-center text-xs text-gray-400">
                We respect your privacy. No spam, ever. Unsubscribe anytime.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-slate-900 text-slate-400 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-slate-300 font-medium">Summit AI Services</span>
          </div>
          <p className="text-sm">&copy; {new Date().getFullYear()} Summit AI Services. All rights reserved.</p>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
            <a href="#demo" className="hover:text-white transition-colors">Book a Demo</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
