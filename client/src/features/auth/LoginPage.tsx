import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { DEMO_CODE } from '@/lib/auth';
import './login.css';

/**
 * The stage behind the form: aurora, starfield, a horizon grid, and the
 * landing page's instrument reduced to line-work. All generated — gradients,
 * one inline SVG grain tile, and the rings below — so nothing here waits on a
 * network request. See login.css for the layer order.
 */
function Backdrop() {
  return (
    <div aria-hidden="true">
      <div className="login-layer login-aurora">
        <i />
      </div>
      <div className="login-layer login-stars-far" />
      <div className="login-layer login-stars" />
      <div className="login-floor" />
      <div className="login-horizon" />
      <div className="login-layer login-rings">
        <Rings />
      </div>
      <div className="login-layer login-grain" />
      <div className="login-layer login-vignette" />
    </div>
  );
}

const TICKS = Array.from({ length: 48 }, (_, i) => i * 7.5);

/**
 * Concentric arcs on a 400×400 canvas, each group turning at its own rate.
 * `pathLength={100}` lets the dash array be read as a percentage of the
 * circumference, which is how the landing page's core draws its arcs too.
 */
function Rings() {
  return (
    <svg viewBox="0 0 400 400" fill="none" aria-hidden="true">
      {/* Outermost: a near-complete hairline with two breaks. */}
      <g className="login-ring-slow">
        <circle
          cx={200}
          cy={200}
          r={186}
          stroke="#38bdf8"
          strokeOpacity={0.16}
          strokeWidth={0.6}
          pathLength={100}
          strokeDasharray="46 4 46 4"
          strokeLinecap="round"
        />
        {TICKS.map((deg) => (
          <line
            key={deg}
            x1={200}
            y1={22}
            x2={200}
            y2={deg % 30 === 0 ? 32 : 27}
            stroke="#38bdf8"
            strokeOpacity={deg % 30 === 0 ? 0.28 : 0.14}
            strokeWidth={0.7}
            transform={`rotate(${deg} 200 200)`}
          />
        ))}
      </g>

      {/* Middle pair, counter-rotating against the outer ring. */}
      <g className="login-ring-mid">
        <circle
          cx={200}
          cy={200}
          r={146}
          stroke="#6366f1"
          strokeOpacity={0.22}
          strokeWidth={1}
          pathLength={100}
          strokeDasharray="28 12 16 44"
          strokeLinecap="round"
        />
        <circle
          cx={200}
          cy={200}
          r={132}
          stroke="#38bdf8"
          strokeOpacity={0.12}
          strokeWidth={0.6}
          pathLength={100}
          strokeDasharray="8 4"
        />
      </g>

      {/* Inner arc, fastest, with a marker riding its leading edge. */}
      <g className="login-ring-fast">
        <circle
          cx={200}
          cy={200}
          r={102}
          stroke="#7dd3fc"
          strokeOpacity={0.3}
          strokeWidth={1.2}
          pathLength={100}
          strokeDasharray="18 82"
          strokeLinecap="round"
        />
        <circle cx={200} cy={98} r={2.4} fill="#7dd3fc" fillOpacity={0.65} />
      </g>

      {/* The still centre — a faint disc that breathes with the logo's halo. */}
      <circle
        className="login-ring-pulse"
        cx={200}
        cy={200}
        r={66}
        stroke="#38bdf8"
        strokeOpacity={0.14}
        strokeWidth={0.6}
        strokeDasharray="2 6"
      />
    </svg>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Pre-filled, and shown in the clear below. Everything that links here says
  // "No signup", so the demo has to open on one click rather than on guessing
  // a code the site never prints.
  const [code, setCode] = useState(DEMO_CODE);
  const [showCode, setShowCode] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Small delay to simulate network
    await new Promise((r) => setTimeout(r, 600));

    const result = login(code);
    setLoading(false);

    if (result.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setError(result.error ?? 'Login failed.');
    }
  }

  return (
    <div className="login-root flex items-center justify-center p-4">
      <Backdrop />

      <div className="relative z-10 w-full max-w-md">
        {/* Back to landing */}
        <a
          href="/"
          className="absolute -top-10 left-0 flex items-center gap-1.5 text-[13px] text-gray-400 hover:text-sky-300 transition-colors"
        >
          <ArrowLeft size={13} />
          Back to main site
        </a>

        {/* Logo */}
        <div className="login-head flex flex-col items-center mb-8">
          <div className="login-mark mb-4">
            {/* 256px square, which is 3x the 80px this renders at. The 533x800
                logo.png it used to pull is 494 kB — half a megabyte, on the
                page every visitor reaches by clicking the demo button. */}
            <img
              src="/logo-icon.jpg"
              alt="Summit Tech"
              width={80}
              height={80}
              className="h-20 w-20 rounded-2xl object-cover"
            />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Summit Tech</h1>
          <p className="mt-1.5 text-[15px] text-gray-400 text-center">
            AI-powered operations for modern dental practices
          </p>
        </div>

        {/* Card */}
        <div className="login-card p-8">
          {/* The card's own content sits above the sheen layer. */}
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-semibold text-white">Sign in</h2>
              <span className="flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-wider text-sky-300/70">
                <ShieldCheck size={13} />
                Secure
              </span>
            </div>
            <p className="text-[15px] text-gray-400 mb-6">
              The demo is already unlocked — press Sign in to look around. Nothing to
              install, and no account to create.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="access-code"
                  className="flex items-baseline justify-between gap-3 text-[13px] font-medium text-gray-400 mb-1.5"
                >
                  Access code
                  {/* Printed as well as pre-filled, so the code survives a
                      browser that restores an emptied field, or someone
                      arriving here with the box already cleared. */}
                  <span className="font-normal text-gray-500">
                    Demo code:{' '}
                    <code className="font-mono tracking-wider text-sky-300/80">{DEMO_CODE}</code>
                  </span>
                </label>
                <div className="relative">
                  <input
                    id="access-code"
                    type={showCode ? 'text' : 'password'}
                    autoComplete="off"
                    required
                    autoFocus
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter access code"
                    className="login-field w-full px-3 py-2.5 pr-10 text-[15px] rounded-lg tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCode((v) => !v)}
                    aria-label={showCode ? 'Hide access code' : 'Show access code'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-sky-300 transition-colors"
                  >
                    {showCode ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="login-error flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/25"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />
                  <p className="text-[15px] text-red-400">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="login-submit w-full py-2.5 text-[15px] font-semibold rounded-lg flex items-center justify-center gap-2 mt-2"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  {loading ? 'Signing in…' : 'Sign in'}
                </span>
              </button>
            </form>
            {/* The way back is the link above the card. A second, full-width
                copy of it sat directly under Sign in and competed with the one
                action this screen exists to get. */}
          </div>
        </div>

        <p className="mt-6 text-center text-[13px] text-gray-600">
          &copy; {new Date().getFullYear()} Summit Tech. For demonstration purposes only.
        </p>
      </div>
    </div>
  );
}
