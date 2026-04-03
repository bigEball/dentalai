import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Small delay to simulate network
    await new Promise((r) => setTimeout(r, 600));

    const result = login(email, password);
    setLoading(false);

    if (result.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setError(result.error ?? 'Login failed.');
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: '#0f1117' }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 70%)',
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="/logo.jpg"
            alt="DentalAI"
            className="h-20 w-20 rounded-2xl object-cover mb-4 shadow-lg shadow-indigo-500/30"
          />
          <h1 className="text-2xl font-bold text-white tracking-tight">DentalAI</h1>
          <p className="mt-1.5 text-sm text-gray-400 text-center">
            AI-powered operations for modern dental practices
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border p-8"
          style={{ backgroundColor: '#181b23', borderColor: 'rgba(255,255,255,0.07)' }}
        >
          <h2 className="text-lg font-semibold text-white mb-1">Sign in</h2>
          <p className="text-sm text-gray-500 mb-6">Welcome back. Enter your credentials to continue.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@practice.com"
                className="w-full px-3 py-2.5 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors placeholder:text-gray-600 text-white"
                style={{
                  backgroundColor: '#0f1117',
                  borderColor: 'rgba(255,255,255,0.1)',
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 pr-10 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors placeholder:text-gray-600 text-white"
                  style={{
                    backgroundColor: '#0f1117',
                    borderColor: 'rgba(255,255,255,0.1)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Demo hint */}
          <div
            className="mt-5 px-4 py-3 rounded-lg border"
            style={{ backgroundColor: 'rgba(99,102,241,0.08)', borderColor: 'rgba(99,102,241,0.2)' }}
          >
            <p className="text-xs text-indigo-400 font-medium mb-0.5">Demo credentials</p>
            <p className="text-xs text-gray-500 font-mono">demo@dentalai.com / demo</p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-600">
          &copy; {new Date().getFullYear()} DentalAI. For demonstration purposes only.
        </p>
      </div>
    </div>
  );
}
